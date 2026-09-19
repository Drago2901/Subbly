import { fetchFile } from "@ffmpeg/util";
import { getFFmpeg } from "./transcode";

export type TranscriptionErrorCode =
  | "NO_AUDIO_TRACK"
  | "AUDIO_EXTRACTION_TIMEOUT"
  | "CORRUPTED_VIDEO"
  | "UNSUPPORTED_FORMAT"
  | "FILE_TOO_LARGE"
  | "FFMPEG_FAILURE"
  | "TRANSCRIPTION_FAILURE";

export class TranscriptionError extends Error {
  readonly code: TranscriptionErrorCode;
  readonly details?: string;

  constructor(code: TranscriptionErrorCode, message: string, details?: string) {
    super(message);
    this.name = "TranscriptionError";
    this.code = code;
    this.details = details;
  }
}

export const ERROR_MESSAGES: Record<TranscriptionErrorCode, string> = {
  NO_AUDIO_TRACK:
    "No audio track was found in this video. Please upload a video containing audio or upload an audio file.",
  AUDIO_EXTRACTION_TIMEOUT:
    "Audio extraction took longer than expected. Please verify your file and connection, or upload an audio file.",
  CORRUPTED_VIDEO:
    "The uploaded video appears to be corrupted or unsupported. Please check the file and try again.",
  UNSUPPORTED_FORMAT:
    "The uploaded file format is not supported. Please upload an MP4, MOV, WebM, MKV, or audio file.",
  FILE_TOO_LARGE:
    "File exceeds the maximum upload size limit. Please upload a file under 2GB.",
  FFMPEG_FAILURE:
    "Audio processing engine encountered an unexpected error. Retrying or uploading an audio file may resolve this.",
  TRANSCRIPTION_FAILURE:
    "Speech-to-text service failed to transcribe the audio. Please check your connection or try again.",
};

export interface MediaValidationResult {
  valid: boolean;
  mimeType: string;
  isAudio: boolean;
  isVideo: boolean;
  container: string;
  error?: string;
  errorCode?: TranscriptionErrorCode;
}

export interface AudioChunk {
  blob: Blob;
  startSec: number;
  endSec: number;
  index: number;
  total: number;
}

export interface AudioExtractionProgress {
  stage: "validating" | "extracting" | "processing" | "chunking";
  progress: number; // 0.0 to 1.0
  message: string;
}

/**
 * Safe ArrayBuffer reader for Blobs across browsers and test environments (e.g. JSDOM).
 */
export async function readBlobAsArrayBuffer(blob: Blob | File): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") {
    try {
      return await blob.arrayBuffer();
    } catch {
      // Fallback to FileReader
    }
  }
  if (typeof FileReader !== "undefined") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error || new Error("Failed to read Blob as ArrayBuffer"));
      reader.readAsArrayBuffer(blob);
    });
  }
  throw new Error("No ArrayBuffer reader available in current environment");
}

/**
 * Validates media file format, magic bytes, size limits, and basic container structure.
 * Does not trust filename extensions blindly.
 */
export async function validateMediaFile(
  file: File | Blob,
  fileName = ""
): Promise<MediaValidationResult> {
  const name = fileName || (file instanceof File ? file.name : "");
  const mime = file.type || "";

  // 1. Check empty / corrupted file
  if (!file || file.size === 0) {
    return {
      valid: false,
      mimeType: mime,
      isAudio: false,
      isVideo: false,
      container: "unknown",
      error: "The uploaded file is empty (0 bytes).",
      errorCode: "CORRUPTED_VIDEO",
    };
  }

  // 2. Check 2GB upper bound
  const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      mimeType: mime,
      isAudio: false,
      isVideo: false,
      container: "unknown",
      error: "The file size exceeds the 2GB limit.",
      errorCode: "FILE_TOO_LARGE",
    };
  }

  // 3. Inspect magic bytes
  let headerBytes = new Uint8Array(0);
  try {
    const slice = file.slice(0, 64);
    headerBytes = new Uint8Array(await readBlobAsArrayBuffer(slice));
  } catch {
    return {
      valid: false,
      mimeType: mime,
      isAudio: false,
      isVideo: false,
      container: "unknown",
      error: "Could not read media file headers.",
      errorCode: "CORRUPTED_VIDEO",
    };
  }

  const hexHeader = Array.from(headerBytes.slice(0, 16))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");

  const asciiHeader = Array.from(headerBytes.slice(0, 32))
    .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : "."))
    .join("");

  let detectedContainer = "unknown";
  let isVideo = false;
  let isAudio = false;

  // MP4 / MOV / M4A: 'ftyp', 'moov', 'wide', 'mdat'
  if (asciiHeader.includes("ftyp") || asciiHeader.includes("moov") || asciiHeader.includes("wide")) {
    if (asciiHeader.includes("M4A ") || asciiHeader.includes("m4a ")) {
      detectedContainer = "m4a";
      isAudio = true;
    } else if (asciiHeader.includes("qt  ")) {
      detectedContainer = "mov";
      isVideo = true;
    } else {
      detectedContainer = "mp4";
      isVideo = true;
    }
  }
  // WebM / MKV: EBML header (1A 45 DF A3)
  else if (
    headerBytes.length >= 4 &&
    headerBytes[0] === 0x1a &&
    headerBytes[1] === 0x45 &&
    headerBytes[2] === 0xdf &&
    headerBytes[3] === 0xa3
  ) {
    detectedContainer = asciiHeader.includes("webm") ? "webm" : "mkv";
    isVideo = true;
  }
  // RIFF container: WAV or AVI
  else if (asciiHeader.startsWith("RIFF")) {
    if (asciiHeader.includes("WAVE")) {
      detectedContainer = "wav";
      isAudio = true;
    } else if (asciiHeader.includes("AVI ")) {
      detectedContainer = "avi";
      isVideo = true;
    } else {
      detectedContainer = "riff";
      isAudio = true;
    }
  }
  // MP3: ID3 tag or MPEG sync word (0xFF 0xFB/F3/F2/E3)
  else if (
    asciiHeader.startsWith("ID3") ||
    (headerBytes.length >= 2 &&
      headerBytes[0] === 0xff &&
      (headerBytes[1] & 0xe0) === 0xe0)
  ) {
    detectedContainer = "mp3";
    isAudio = true;
  }
  // OGG
  else if (asciiHeader.startsWith("OggS")) {
    detectedContainer = "ogg";
    isAudio = true;
  }
  // FLAC
  else if (asciiHeader.startsWith("fLaC")) {
    detectedContainer = "flac";
    isAudio = true;
  }
  // Fallback to mime or extension if container wasn't identified strictly
  else {
    const lowerName = name.toLowerCase();
    if (mime.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg|flac|wma)$/i.test(lowerName)) {
      detectedContainer = lowerName.split(".").pop() || "audio";
      isAudio = true;
    } else if (
      mime.startsWith("video/") ||
      /\.(mp4|mov|webm|mkv|avi|wmv|flv|m4v|3gp)$/i.test(lowerName)
    ) {
      detectedContainer = lowerName.split(".").pop() || "video";
      isVideo = true;
    }
  }

  if (!isAudio && !isVideo) {
    return {
      valid: false,
      mimeType: mime,
      isAudio: false,
      isVideo: false,
      container: detectedContainer,
      error: ERROR_MESSAGES.UNSUPPORTED_FORMAT,
      errorCode: "UNSUPPORTED_FORMAT",
    };
  }

  logAudioPipelineEvent("validateMediaFile", {
    fileName: name,
    fileSize: file.size,
    mimeType: mime,
    detectedContainer,
    isAudio,
    isVideo,
    hexHeader: hexHeader.slice(0, 30),
  });

  return {
    valid: true,
    mimeType: mime || (isAudio ? `audio/${detectedContainer}` : `video/${detectedContainer}`),
    isAudio,
    isVideo,
    container: detectedContainer,
  };
}

/**
 * Dynamically computes an extraction timeout based on file size and duration.
 * Ensures large files aren't killed by an arbitrary 15s timer.
 */
export function getExtractionTimeoutMs(fileSizeBytes: number, durationSec?: number): number {
  const sizeMB = fileSizeBytes / (1024 * 1024);
  const baseTimeout = 45000; // 45 seconds baseline
  const sizeAllowance = Math.ceil(sizeMB) * 1500; // 1.5 seconds per MB
  const durationAllowance = durationSec && isFinite(durationSec) && durationSec > 0
    ? Math.ceil(durationSec) * 500
    : 0; // 0.5s per video second
  const total = baseTimeout + sizeAllowance + durationAllowance;
  // Bound between 45s and 300s (5 minutes)
  return Math.min(300000, Math.max(45000, total));
}

/**
 * Extracts the primary audio stream from a video using FFmpeg WASM.
 * Direct stream selection `-map 0:a:0?` avoids decoding/re-encoding video.
 * Emits 16kHz mono 16-bit PCM WAV.
 */
export async function extractAudioWithFFmpeg(opts: {
  file: File | Blob;
  fileName?: string;
  durationSec?: number;
  onProgress?: (progress: AudioExtractionProgress) => void;
  onLog?: (msg: string) => void;
  signal?: AbortSignal;
}): Promise<Blob> {
  const { file, fileName = "input.mp4", durationSec, onProgress, onLog, signal } = opts;
  if (signal?.aborted) throw new TranscriptionError("TRANSCRIPTION_FAILURE", "Audio extraction cancelled");

  onProgress?.({
    stage: "validating",
    progress: 0.1,
    message: "Validating media stream…",
  });

  const ffmpeg = await getFFmpeg(onLog);
  if (signal?.aborted) throw new TranscriptionError("TRANSCRIPTION_FAILURE", "Audio extraction cancelled");

  const sanitizedExt = (fileName.split(".").pop() || "mp4").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const runId = Math.random().toString(36).substring(2, 8);
  const inputName = `input_${runId}.${sanitizedExt}`;
  const outputName = `output_${runId}.wav`;

  const logs: string[] = [];
  const logHandler = ({ message }: { message: string }) => {
    logs.push(message);
    onLog?.(message);
  };
  ffmpeg.on("log", logHandler);

  const progressHandler = ({ progress }: { progress: number }) => {
    const norm = Math.max(0, Math.min(1, progress));
    onProgress?.({
      stage: "extracting",
      progress: 0.2 + norm * 0.7,
      message: `Extracting speech track (${Math.round(norm * 100)}%)…`,
    });
  };
  ffmpeg.on("progress", progressHandler);

  const onAbort = () => {
    try {
      ffmpeg.terminate();
    } catch {
      // ignore
    }
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  const timeoutMs = getExtractionTimeoutMs(file.size, durationSec);
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  try {
    onProgress?.({
      stage: "extracting",
      progress: 0.2,
      message: "Mounting video file…",
    });

    await ffmpeg.writeFile(inputName, await fetchFile(file));
    if (signal?.aborted) throw new TranscriptionError("TRANSCRIPTION_FAILURE", "Audio extraction cancelled");

    // Primary FFmpeg command:
    // -map 0:a:0? -> select first audio stream without touching video
    // -vn -sn -dn -> discard video, subtitles, data
    // -c:a pcm_s16le -ar 16000 -ac 1 -> 16kHz mono WAV for Whisper
    const primaryArgs = [
      "-i", inputName,
      "-map", "0:a:0?",
      "-vn",
      "-sn",
      "-dn",
      "-c:a", "pcm_s16le",
      "-ar", "16000",
      "-ac", "1",
      outputName,
    ];

    const execPromise = ffmpeg.exec(primaryArgs);
    const timeoutPromise = new Promise<number>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        try {
          ffmpeg.terminate();
        } catch {
          // ignore
        }
        reject(
          new TranscriptionError(
            "AUDIO_EXTRACTION_TIMEOUT",
            ERROR_MESSAGES.AUDIO_EXTRACTION_TIMEOUT,
            `Timeout after ${Math.round(timeoutMs / 1000)}s`
          )
        );
      }, timeoutMs);
    });

    const exitCode = await Promise.race([execPromise, timeoutPromise]);
    if (signal?.aborted) throw new TranscriptionError("TRANSCRIPTION_FAILURE", "Audio extraction cancelled");

    const fullLogs = logs.join("\n");

    // Check if the video has no audio track
    const noAudioPatterns = [
      /matches no streams/i,
      /Output file.*does not contain any stream/i,
      /does not contain any audio stream/i,
      /Stream map '0:a:0' matches no streams/i,
      /Output file is empty/i,
    ];
    if (noAudioPatterns.some((pattern) => pattern.test(fullLogs))) {
      throw new TranscriptionError("NO_AUDIO_TRACK", ERROR_MESSAGES.NO_AUDIO_TRACK, fullLogs);
    }

    // Check if file is corrupted
    const corruptionPatterns = [
      /Invalid data found when processing input/i,
      /moov atom not found/i,
      /EBML header using unsupported/i,
      /error reading header/i,
      /corrupt input/i,
    ];
    if (corruptionPatterns.some((pattern) => pattern.test(fullLogs))) {
      throw new TranscriptionError("CORRUPTED_VIDEO", ERROR_MESSAGES.CORRUPTED_VIDEO, fullLogs);
    }

    if (exitCode !== 0) {
      throw new TranscriptionError(
        "FFMPEG_FAILURE",
        `FFmpeg extraction failed with exit code ${exitCode}`,
        fullLogs.slice(-500)
      );
    }

    onProgress?.({
      stage: "processing",
      progress: 0.95,
      message: "Finalizing speech waveform…",
    });

    const data = await ffmpeg.readFile(outputName);
    const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

    // A valid WAV file must be larger than the 44-byte header
    if (arrayBuffer.byteLength <= 44) {
      throw new TranscriptionError("NO_AUDIO_TRACK", ERROR_MESSAGES.NO_AUDIO_TRACK);
    }

    const wavBlob = new Blob([arrayBuffer], { type: "audio/wav" });
    logAudioPipelineEvent("extractAudioWithFFmpeg:success", {
      inputSize: file.size,
      wavSize: wavBlob.size,
      durationEstimatedSec: (wavBlob.size - 44) / 32000,
    });

    return wavBlob;
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
    await ffmpeg.deleteFile(inputName).catch(() => undefined);
    await ffmpeg.deleteFile(outputName).catch(() => undefined);
    try {
      ffmpeg.off("log", logHandler);
      ffmpeg.off("progress", progressHandler);
    } catch {
      // ignore
    }
    signal?.removeEventListener("abort", onAbort);
  }
}

/**
 * Fallback extraction: retries with permissive FFmpeg arguments,
 * Web Audio API (with adaptive timeout), or direct media passthrough.
 */
export async function extractAudioWithFallback(opts: {
  file: File | Blob;
  fileName?: string;
  durationSec?: number;
  onProgress?: (progress: AudioExtractionProgress) => void;
  onLog?: (msg: string) => void;
  signal?: AbortSignal;
}): Promise<Blob> {
  const { file, fileName = "", durationSec, onProgress, onLog, signal } = opts;

  // 1. Instant passthrough if already an audio file
  const validation = await validateMediaFile(file, fileName);
  if (!validation.valid && validation.errorCode) {
    throw new TranscriptionError(validation.errorCode, validation.error || ERROR_MESSAGES[validation.errorCode]);
  }

  if (validation.isAudio) {
    logAudioPipelineEvent("passthrough:audio", { fileName, size: file.size });
    return file;
  }

  // 2. Try primary FFmpeg extraction
  try {
    return await extractAudioWithFFmpeg(opts);
  } catch (primaryErr) {
    // If explicitly diagnosed as NO_AUDIO_TRACK or CORRUPTED_VIDEO, do NOT re-run blind extraction
    if (primaryErr instanceof TranscriptionError) {
      if (primaryErr.code === "NO_AUDIO_TRACK" || primaryErr.code === "CORRUPTED_VIDEO") {
        throw primaryErr;
      }
    }

    console.warn("Primary FFmpeg extraction encountered issue, executing fallback strategy:", primaryErr);

    // 3. Fallback Strategy A: Permissive FFmpeg flags without stream mapping
    try {
      const ffmpeg = await getFFmpeg(onLog);
      const sanitizedExt = (fileName.split(".").pop() || "mp4").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const runId = Math.random().toString(36).substring(2, 8);
      const inputName = `fallback_in_${runId}.${sanitizedExt}`;
      const outputName = `fallback_out_${runId}.wav`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));
      try {
        const exitCode = await ffmpeg.exec([
          "-i", inputName,
          "-vn",
          "-c:a", "pcm_s16le",
          "-ar", "16000",
          "-ac", "1",
          outputName,
        ]);

        if (exitCode === 0) {
          const data = await ffmpeg.readFile(outputName);
          const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
          const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
          if (arrayBuffer.byteLength > 44) {
            logAudioPipelineEvent("fallback:ffmpegPermissive:success", { size: arrayBuffer.byteLength });
            return new Blob([arrayBuffer], { type: "audio/wav" });
          }
        }
      } finally {
        await ffmpeg.deleteFile(inputName).catch(() => undefined);
        await ffmpeg.deleteFile(outputName).catch(() => undefined);
      }
    } catch (ffmpegFallbackErr) {
      console.warn("Permissive FFmpeg fallback failed:", ffmpegFallbackErr);
    }

    // 4. Fallback Strategy B: Web Audio API with adaptive timeout (not hardcoded 15s)
    try {
      const arrayBuffer = await readBlobAsArrayBuffer(file);
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioCtxClass) {
        const audioCtx = new AudioCtxClass();
        try {
          const adaptiveTimeout = getExtractionTimeoutMs(file.size, durationSec);
          const audioBuffer = await Promise.race([
            audioCtx.decodeAudioData(arrayBuffer),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error(`Web Audio decoding timed out (${Math.round(adaptiveTimeout / 1000)}s)`)),
                adaptiveTimeout
              )
            ),
          ]);

          // Downsample to 16kHz mono WAV
          const targetSampleRate = 16000;
          const targetLength = Math.max(1, Math.ceil(audioBuffer.duration * targetSampleRate));
          const monoData = new Float32Array(targetLength);
          const numChannels = audioBuffer.numberOfChannels;
          const ratio = audioBuffer.sampleRate / targetSampleRate;

          // Mix down channels
          for (let i = 0; i < targetLength; i++) {
            const origIndex = Math.floor(i * ratio);
            let sum = 0;
            for (let ch = 0; ch < numChannels; ch++) {
              const data = audioBuffer.getChannelData(ch);
              sum += origIndex < data.length ? data[origIndex] : 0;
            }
            monoData[i] = sum / numChannels;
          }

          logAudioPipelineEvent("fallback:webAudio:success", {
            duration: audioBuffer.duration,
            channels: numChannels,
          });
          return encodeWav(monoData, targetSampleRate);
        } finally {
          try {
            await audioCtx.close();
          } catch {
            // ignore
          }
        }
      }
    } catch (webAudioErr) {
      console.warn("Web Audio fallback failed:", webAudioErr);
    }

    // 5. Fallback Strategy C: Direct media passthrough if file <= 25MB
    // Speech-to-text engines (Groq, OpenAI, ElevenLabs) accept MP4/WebM under 25MB directly
    const PASSTHROUGH_MAX_BYTES = 25 * 1024 * 1024;
    if (file.size <= PASSTHROUGH_MAX_BYTES && /\.(mp4|webm|mov|m4a|mp3|wav)$/i.test(fileName)) {
      logAudioPipelineEvent("fallback:directPassthrough", { fileName, size: file.size });
      return file;
    }

    // Re-throw structured failure
    if (primaryErr instanceof TranscriptionError) {
      throw primaryErr;
    }
    throw new TranscriptionError(
      "FFMPEG_FAILURE",
      ERROR_MESSAGES.FFMPEG_FAILURE,
      primaryErr instanceof Error ? primaryErr.message : String(primaryErr)
    );
  }
}

/**
 * Splits a 16kHz mono 16-bit PCM WAV Blob into multiple chunks
 * if it exceeds maxChunkDurationSec (default: 600s = 10 minutes, ~19.2MB).
 * Guarantees each chunk is within API limits (Groq & OpenAI 25MB limit).
 */
export async function splitWavIntoChunks(
  wavBlob: Blob,
  maxChunkDurationSec = 600
): Promise<AudioChunk[]> {
  const bytesPerSecond = 16000 * 2; // 16kHz mono 16-bit = 32,000 bytes/sec
  const maxChunkBytes = maxChunkDurationSec * bytesPerSecond; // 19,200,000 bytes

  // If size is <= 20MB, no chunking needed
  if (wavBlob.size <= maxChunkBytes + 44) {
    const totalSec = Math.max(0, (wavBlob.size - 44) / bytesPerSecond);
    return [
      {
        blob: wavBlob,
        startSec: 0,
        endSec: totalSec,
        index: 0,
        total: 1,
      },
    ];
  }

  const arrayBuffer = await readBlobAsArrayBuffer(wavBlob);
  // PCM data starts after the 44-byte header
  const dataOffset = 44;
  const totalPcmBytes = Math.max(0, arrayBuffer.byteLength - dataOffset);
  const totalSamples = Math.floor(totalPcmBytes / 2);
  const samplesPerChunk = maxChunkDurationSec * 16000;

  const chunks: AudioChunk[] = [];
  const chunkCount = Math.ceil(totalSamples / samplesPerChunk);

  const fullInt16 = new Int16Array(arrayBuffer, dataOffset, totalSamples);

  for (let i = 0; i < chunkCount; i++) {
    const startSample = i * samplesPerChunk;
    const endSample = Math.min(totalSamples, (i + 1) * samplesPerChunk);
    const chunkSamples = fullInt16.slice(startSample, endSample);

    const startSec = startSample / 16000;
    const endSec = endSample / 16000;

    // Convert Int16Array to Float32Array for encodeWav
    const float32 = new Float32Array(chunkSamples.length);
    for (let s = 0; s < chunkSamples.length; s++) {
      float32[s] = chunkSamples[s] / 32768.0;
    }

    const chunkBlob = encodeWav(float32, 16000);
    chunks.push({
      blob: chunkBlob,
      startSec: Number(startSec.toFixed(2)),
      endSec: Number(endSec.toFixed(2)),
      index: i,
      total: chunkCount,
    });
  }

  logAudioPipelineEvent("splitWavIntoChunks", {
    originalSize: wavBlob.size,
    chunkCount: chunks.length,
    chunkDurations: chunks.map((c) => `${c.startSec}s-${c.endSec}s`),
  });

  return chunks;
}

/**
 * Encode Float32Array mono PCM samples into a 16-bit PCM WAV Blob.
 */
export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const dataBytes = samples.length * 2;
  const headerBuffer = new ArrayBuffer(44);
  const view = new DataView(headerBuffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, "WAVE");

  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);

  writeStr(36, "data");
  view.setUint32(40, dataBytes, true);

  const int16Samples = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  return new Blob([headerBuffer, int16Samples.buffer], { type: "audio/wav" });
}

/**
 * Structured pipeline event logger. Avoids logging private user information.
 */
export function logAudioPipelineEvent(
  event: string,
  meta: Record<string, unknown>
): void {
  try {
    console.info(`[AudioPipeline:${event}]`, {
      ...meta,
      clientTime: new Date().toISOString(),
    });
  } catch {
    // ignore
  }
}
