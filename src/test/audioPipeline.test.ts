import { describe, it, expect } from "vitest";
import {
  validateMediaFile,
  getExtractionTimeoutMs,
  splitWavIntoChunks,
  encodeWav,
  readBlobAsArrayBuffer,
  TranscriptionError,
  ERROR_MESSAGES,
} from "../lib/captions/audioPipeline";
import { wordsToCaptions } from "../lib/captions/segment";
import type { Word } from "../lib/captions/types";

describe("Audio Extraction Pipeline Hardening & Diagnostics", () => {
  describe("Media File Validation (validateMediaFile)", () => {
    it("identifies MP4 video container by magic bytes", async () => {
      // Create a dummy MP4 header: 4 bytes size, 'ftypisom'
      const buf = new Uint8Array(32);
      buf.set([0, 0, 0, 28, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]); // ....ftypisom
      const blob = new Blob([buf], { type: "video/mp4" });

      const res = await validateMediaFile(blob, "video.mp4");
      expect(res.valid).toBe(true);
      expect(res.isVideo).toBe(true);
      expect(res.container).toBe("mp4");
    });

    it("identifies MOV video container by qt ftyp", async () => {
      const buf = new Uint8Array(32);
      buf.set([0, 0, 0, 20, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74, 0x20, 0x20]); // ....ftypqt  
      const blob = new Blob([buf], { type: "video/quicktime" });

      const res = await validateMediaFile(blob, "clip.mov");
      expect(res.valid).toBe(true);
      expect(res.isVideo).toBe(true);
      expect(res.container).toBe("mov");
    });

    it("identifies WebM / MKV container by EBML header", async () => {
      const buf = new Uint8Array(32);
      buf.set([0x1a, 0x45, 0xdf, 0xa3]); // EBML signature
      // write 'webm' inside header
      const webmStr = new TextEncoder().encode("webm");
      buf.set(webmStr, 8);
      const blob = new Blob([buf], { type: "video/webm" });

      const res = await validateMediaFile(blob, "recording.webm");
      expect(res.valid).toBe(true);
      expect(res.isVideo).toBe(true);
      expect(res.container).toBe("webm");
    });

    it("identifies WAV audio container by RIFF WAVE", async () => {
      const buf = new Uint8Array(44);
      buf.set(new TextEncoder().encode("RIFF"), 0);
      buf.set(new TextEncoder().encode("WAVE"), 8);
      const blob = new Blob([buf], { type: "audio/wav" });

      const res = await validateMediaFile(blob, "audio.wav");
      expect(res.valid).toBe(true);
      expect(res.isAudio).toBe(true);
      expect(res.container).toBe("wav");
    });

    it("identifies MP3 audio container by ID3 tag", async () => {
      const buf = new Uint8Array(32);
      buf.set(new TextEncoder().encode("ID3"), 0);
      const blob = new Blob([buf], { type: "audio/mpeg" });

      const res = await validateMediaFile(blob, "speech.mp3");
      expect(res.valid).toBe(true);
      expect(res.isAudio).toBe(true);
      expect(res.container).toBe("mp3");
    });

    it("flags empty zero-byte file as CORRUPTED_VIDEO", async () => {
      const emptyBlob = new Blob([], { type: "video/mp4" });
      const res = await validateMediaFile(emptyBlob, "empty.mp4");
      expect(res.valid).toBe(false);
      expect(res.errorCode).toBe("CORRUPTED_VIDEO");
      expect(res.error).toContain("empty");
    });

    it("flags file over 2GB as FILE_TOO_LARGE", async () => {
      const hugeMock = {
        size: 3 * 1024 * 1024 * 1024, // 3GB
        type: "video/mp4",
        slice: () => new Blob([]),
      } as unknown as File;

      const res = await validateMediaFile(hugeMock, "huge.mp4");
      expect(res.valid).toBe(false);
      expect(res.errorCode).toBe("FILE_TOO_LARGE");
    });

    it("flags completely unrecognized binary as UNSUPPORTED_FORMAT", async () => {
      const randomBuf = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
      const blob = new Blob([randomBuf], { type: "application/octet-stream" });

      const res = await validateMediaFile(blob, "unknown.xyz");
      expect(res.valid).toBe(false);
      expect(res.errorCode).toBe("UNSUPPORTED_FORMAT");
    });
  });

  describe("Dynamic Adaptive Extraction Timeout (getExtractionTimeoutMs)", () => {
    it("gives baseline 45s timeout for small files", () => {
      const timeout = getExtractionTimeoutMs(1024 * 1024); // 1MB
      expect(timeout).toBe(46500); // 45000 + 1500
    });

    it("scales timeout proportionally for 50MB video", () => {
      const timeout = getExtractionTimeoutMs(50 * 1024 * 1024); // 50MB
      expect(timeout).toBe(45000 + 50 * 1500); // 120,000ms = 2 minutes
    });

    it("factors in video duration", () => {
      const timeout = getExtractionTimeoutMs(20 * 1024 * 1024, 60); // 20MB, 60s
      // 45000 + 30000 + 30000 = 105,000ms
      expect(timeout).toBe(105000);
    });

    it("caps timeout at 5 minutes (300,000ms) maximum", () => {
      const timeout = getExtractionTimeoutMs(500 * 1024 * 1024, 3600); // 500MB, 1 hour
      expect(timeout).toBe(300000);
    });
  });

  describe("Large Video WAV Chunking (splitWavIntoChunks)", () => {
    it("does not split short audio (<= 10 mins)", async () => {
      // 1 second of 16kHz mono audio
      const samples = new Float32Array(16000);
      const wav = encodeWav(samples, 16000);

      const chunks = await splitWavIntoChunks(wav, 600);
      expect(chunks.length).toBe(1);
      expect(chunks[0].index).toBe(0);
      expect(chunks[0].total).toBe(1);
      expect(chunks[0].startSec).toBe(0);
      expect(chunks[0].endSec).toBeCloseTo(1.0, 1);
    });

    it("splits long audio into valid sequential WAV chunks with correct timestamp boundaries", async () => {
      // Simulate 25 seconds of audio, chunked with maxChunkDurationSec = 10s
      const totalSec = 25;
      const samples = new Float32Array(totalSec * 16000);
      // Put a test tone in the samples
      for (let i = 0; i < samples.length; i++) {
        samples[i] = Math.sin((2 * Math.PI * 440 * i) / 16000);
      }
      const fullWav = encodeWav(samples, 16000);

      const chunks = await splitWavIntoChunks(fullWav, 10);
      // 25s with 10s max chunk -> 3 chunks: [0-10s, 10-20s, 20-25s]
      expect(chunks.length).toBe(3);

      expect(chunks[0].startSec).toBe(0);
      expect(chunks[0].endSec).toBe(10);
      expect(chunks[0].index).toBe(0);
      expect(chunks[0].total).toBe(3);

      expect(chunks[1].startSec).toBe(10);
      expect(chunks[1].endSec).toBe(20);
      expect(chunks[1].index).toBe(1);

      expect(chunks[2].startSec).toBe(20);
      expect(chunks[2].endSec).toBe(25);
      expect(chunks[2].index).toBe(2);

      // Verify each chunk has a valid 44-byte WAV header
      for (const chunk of chunks) {
        const headerBuf = await readBlobAsArrayBuffer(chunk.blob.slice(0, 44));
        const headerText = new TextDecoder().decode(headerBuf);
        expect(headerText.slice(0, 4)).toBe("RIFF");
        expect(headerText.slice(8, 12)).toBe("WAVE");
        expect(headerText.slice(12, 16)).toBe("fmt ");
        expect(headerText.slice(36, 40)).toBe("data");
      }
    });

    it("correctly offsets and stitches word timestamps across multiple chunks", () => {
      const chunk1Words: Word[] = [
        { text: "Welcome", start: 1.0, end: 1.5, type: "word" },
        { text: "to", start: 1.6, end: 1.8, type: "word" },
        { text: "Subbly.", start: 1.9, end: 2.5, type: "word" },
      ];

      const chunk2RawWords: Word[] = [
        { text: "This", start: 0.5, end: 1.0, type: "word" },
        { text: "is", start: 1.1, end: 1.3, type: "word" },
        { text: "chunk", start: 1.4, end: 1.8, type: "word" },
        { text: "two.", start: 1.9, end: 2.4, type: "word" },
      ];

      // Chunk 2 starts at 600.0s (10 minutes in)
      const chunk2OffsetSec = 600.0;
      const chunk2StitchedWords = chunk2RawWords.map((w) => ({
        ...w,
        start: Number((w.start + chunk2OffsetSec).toFixed(2)),
        end: Number((w.end + chunk2OffsetSec).toFixed(2)),
      }));

      const mergedWords = [...chunk1Words, ...chunk2StitchedWords];
      const captions = wordsToCaptions(mergedWords);

      expect(captions.length).toBeGreaterThanOrEqual(2);
      expect(captions[0].text).toBe("Welcome to Subbly.");
      expect(captions[0].start).toBe(1.0);

      // Verify chunk 2 captions have their continuous timestamp in the 600s range
      const secondHalf = captions.filter((c) => c.start >= 600);
      expect(secondHalf.length).toBeGreaterThan(0);
      expect(secondHalf[0].start).toBeGreaterThanOrEqual(600);
      expect(secondHalf[secondHalf.length - 1].end).toBeCloseTo(602.4, 1);
    });
  });

  describe("Error Classification & Diagnostic Messages", () => {
    it("returns specific exact user-facing message for NO_AUDIO_TRACK", () => {
      const err = new TranscriptionError("NO_AUDIO_TRACK", ERROR_MESSAGES.NO_AUDIO_TRACK);
      expect(err.code).toBe("NO_AUDIO_TRACK");
      expect(err.message).toBe(
        "No audio track was found in this video. Please upload a video containing audio or upload an audio file."
      );
    });

    it("returns specific message for CORRUPTED_VIDEO", () => {
      const err = new TranscriptionError("CORRUPTED_VIDEO", ERROR_MESSAGES.CORRUPTED_VIDEO);
      expect(err.code).toBe("CORRUPTED_VIDEO");
      expect(err.message).toContain("corrupted or unsupported");
    });

    it("returns specific message for AUDIO_EXTRACTION_TIMEOUT", () => {
      const err = new TranscriptionError("AUDIO_EXTRACTION_TIMEOUT", ERROR_MESSAGES.AUDIO_EXTRACTION_TIMEOUT);
      expect(err.code).toBe("AUDIO_EXTRACTION_TIMEOUT");
      expect(err.message).toContain("longer than expected");
    });

    it("all 7 error codes have registered user-friendly descriptions", () => {
      const codes = [
        "NO_AUDIO_TRACK",
        "AUDIO_EXTRACTION_TIMEOUT",
        "CORRUPTED_VIDEO",
        "UNSUPPORTED_FORMAT",
        "FILE_TOO_LARGE",
        "FFMPEG_FAILURE",
        "TRANSCRIPTION_FAILURE",
      ] as const;

      for (const code of codes) {
        expect(ERROR_MESSAGES[code]).toBeDefined();
        expect(ERROR_MESSAGES[code].length).toBeGreaterThan(15);
      }
    });
  });
});
