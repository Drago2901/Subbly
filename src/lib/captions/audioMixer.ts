import type { TimelineAudioClip } from "@/lib/captions/types";
import { getFFmpeg } from "./transcode";
import { fetchFile } from "@ffmpeg/util";

export interface ProjectAudioMixOptions {
  duration: number;
  originalVideoFile?: File | Blob;
  originalVideoUrl?: string;
  vocalVolume?: number; // 0..1.5, default 1.0
  vocalMuted?: boolean;
  audioClips?: TimelineAudioClip[];
  audioSfxVolume?: number; // 0..1.5, default 0.7
  audioSfxMuted?: boolean;
  sampleRate?: number; // default 48000
  onProgress?: (progress: number, message: string) => void;
  onLog?: (msg: string) => void;
  signal?: AbortSignal;
}

export interface MixedAudioResult {
  audioBlob: Blob | null;
  hasAudio: boolean;
  duration: number;
  tracksMixed: number;
}

/**
 * Converts an AudioBuffer into a standard 16-bit PCM WAV Blob at the buffer's native sample rate.
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const numSamples = buffer.length;
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  /* RIFF chunk descriptor */
  writeString(0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(8, "WAVE");

  /* fmt sub-chunk */
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample

  /* data sub-chunk */
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Interleave channels & write 16-bit PCM
  let offset = 44;
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i];
      // Soft-knee clipping protection / transparent saturation for signals exceeding +/-0.95
      if (sample > 0.95) {
        sample = 0.95 + 0.05 * Math.tanh((sample - 0.95) / 0.05);
      } else if (sample < -0.95) {
        sample = -0.95 + 0.05 * Math.tanh((sample + 0.95) / 0.05);
      }
      // Clamp between -1 and 1
      sample = Math.max(-1, Math.min(1, sample));
      // Convert to 16-bit signed integer
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([new Uint8Array(arrayBuffer)], { type: "audio/wav" });
}

/**
 * Extracts and decodes audio from a video/audio source into an AudioBuffer using AudioContext
 * with fallback to FFmpeg WASM when browser native decode fails on video containers.
 */
async function decodeAudioSource(
  source: File | Blob | string,
  audioCtx: AudioContext | BaseAudioContext,
  onLog?: (msg: string) => void,
  signal?: AbortSignal
): Promise<AudioBuffer | null> {
  if (signal?.aborted) throw new Error("Audio mixing cancelled");

  try {
    let arrayBuffer: ArrayBuffer;
    if (typeof source === "string") {
      const resp = await fetch(source, { signal });
      arrayBuffer = await resp.arrayBuffer();
    } else {
      arrayBuffer = await source.arrayBuffer();
    }

    if (signal?.aborted) throw new Error("Audio mixing cancelled");
    if (arrayBuffer.byteLength === 0) return null;

    // First attempt: Browser native decodeAudioData
    try {
      const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      if (decoded && decoded.duration > 0) {
        return decoded;
      }
    } catch {
      // Browser native decodeAudioData may fail on certain video containers (e.g. MOV, MKV, or MP4 without audio)
      onLog?.("[AudioMixer] Native decodeAudioData failed, falling back to FFmpeg extraction...");
    }

    // Fallback attempt: Use FFmpeg WASM to extract audio stream to WAV
    if (typeof source !== "string" || source.startsWith("blob:") || source.startsWith("data:")) {
      const ffmpeg = await getFFmpeg(onLog);
      const ext = typeof source !== "string" && source instanceof File ? (source.name.split(".").pop() || "mp4") : "mp4";
      const inName = `input_temp_${Date.now()}.${ext}`;
      const outName = `extracted_${Date.now()}.wav`;

      try {
        await ffmpeg.writeFile(inName, await fetchFile(source));
        const exitCode = await ffmpeg.exec([
          "-i", inName,
          "-vn",
          "-acodec", "pcm_s16le",
          "-ar", "48000",
          "-ac", "2",
          outName,
        ]);

        if (exitCode === 0) {
          const rawWav = await ffmpeg.readFile(outName);
          const wavBytes = rawWav instanceof Uint8Array ? rawWav : new TextEncoder().encode(String(rawWav));
          const wavBuffer = wavBytes.buffer.slice(wavBytes.byteOffset, wavBytes.byteOffset + wavBytes.byteLength) as ArrayBuffer;
          const decodedFallback = await audioCtx.decodeAudioData(wavBuffer);
          return decodedFallback;
        }
      } catch (ffErr) {
        onLog?.(`[AudioMixer] FFmpeg audio extraction fallback info: ${String(ffErr)}`);
      } finally {
        await ffmpeg.deleteFile(inName).catch(() => undefined);
        await ffmpeg.deleteFile(outName).catch(() => undefined);
      }
    }
  } catch (err) {
    onLog?.(`[AudioMixer] Audio decoding skipped for source: ${String(err)}`);
  }

  return null;
}

/**
 * Mixes all active project audio tracks (original video audio + added audio/SFX clips)
 * into a single unified 48,000 Hz stereo WAV file.
 */
export async function mixProjectAudio(opts: ProjectAudioMixOptions): Promise<MixedAudioResult> {
  const {
    duration,
    originalVideoFile,
    originalVideoUrl,
    vocalVolume = 1.0,
    vocalMuted = false,
    audioClips = [],
    audioSfxVolume = 0.7,
    audioSfxMuted = false,
    sampleRate = 48000,
    onProgress,
    onLog,
    signal,
  } = opts;

  if (signal?.aborted) throw new Error("Audio mixing cancelled");

  const safeDuration = Math.max(0.1, duration);
  const totalLengthSamples = Math.ceil(safeDuration * sampleRate);

  onProgress?.(0.05, "Preparing audio mixing environment...");
  onLog?.(`[AudioMixer] Target duration: ${safeDuration.toFixed(2)}s @ ${sampleRate}Hz`);

  // Use a temporary standard AudioContext for decoding source files
  const AudioContextClass =
    window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Web Audio API is not supported in this browser.");
  }
  const decodeCtx = new AudioContextClass({ sampleRate });

  // Prepare offline audio context for deterministic rendering
  const offlineCtx = new OfflineAudioContext(2, totalLengthSamples, sampleRate);
  let tracksMixed = 0;

  try {
    // Prepare master limiter / compressor to prevent digital clipping when volume is boosted up to 200%
    const masterCompressor = offlineCtx.createDynamicsCompressor();
    masterCompressor.threshold.setValueAtTime(-1.0, 0);
    masterCompressor.knee.setValueAtTime(6.0, 0);
    masterCompressor.ratio.setValueAtTime(12.0, 0);
    masterCompressor.attack.setValueAtTime(0.003, 0);
    masterCompressor.release.setValueAtTime(0.25, 0);
    masterCompressor.connect(offlineCtx.destination);

    // 1. Process Original / Vocal Audio Track
    const shouldIncludeOriginal = !vocalMuted && vocalVolume > 0.001;
    const originalSource = originalVideoFile || originalVideoUrl;

    if (shouldIncludeOriginal && originalSource) {
      onProgress?.(0.2, "Decoding original video audio...");
      onLog?.(`[AudioMixer] Decoding vocal track (vol: ${vocalVolume.toFixed(2)})...`);

      const originalBuffer = await decodeAudioSource(originalSource, decodeCtx, onLog, signal);
      if (originalBuffer && originalBuffer.duration > 0) {
        const sourceNode = offlineCtx.createBufferSource();
        sourceNode.buffer = originalBuffer;

        const gainNode = offlineCtx.createGain();
        gainNode.gain.value = vocalVolume;

        sourceNode.connect(gainNode);
        gainNode.connect(masterCompressor);
        sourceNode.start(0);

        tracksMixed++;
        onLog?.(`[AudioMixer] Added original audio (${originalBuffer.duration.toFixed(2)}s) with gain ${vocalVolume.toFixed(2)}`);
      } else {
        onLog?.("[AudioMixer] Original video has no detectable audio track.");
      }
    } else if (vocalMuted) {
      onLog?.("[AudioMixer] Original vocal track is muted by user.");
    }

    // 2. Process Added Audio Clips (Music, SFX, Voiceover)
    const shouldIncludeClips = !audioSfxMuted && audioSfxVolume > 0.001 && audioClips.length > 0;
    if (shouldIncludeClips) {
      const activeClips = audioClips.filter((c) => !c.muted && (c.volume ?? 1) > 0.001);
      const totalClips = activeClips.length;

      for (let i = 0; i < totalClips; i++) {
        if (signal?.aborted) throw new Error("Audio mixing cancelled");
        const clip = activeClips[i];

        const progressVal = 0.35 + (i / totalClips) * 0.45;
        onProgress?.(progressVal, `Mixing audio clip ${i + 1}/${totalClips}: ${clip.title || "audio"}...`);

        if (!clip.url) continue;

        const clipBuffer = await decodeAudioSource(clip.url, decodeCtx, onLog, signal);
        if (!clipBuffer || clipBuffer.duration <= 0) continue;

        const clipStart = Math.max(0, clip.start);
        const clipEnd = clip.end > clipStart ? clip.end : clipStart + clipBuffer.duration;
        const playDuration = Math.min(clipEnd - clipStart, clipBuffer.duration);

        if (clipStart >= safeDuration || playDuration <= 0) continue;

        const sourceNode = offlineCtx.createBufferSource();
        sourceNode.buffer = clipBuffer;

        const gainNode = offlineCtx.createGain();
        const effectiveVolume = (clip.volume ?? 1) * audioSfxVolume;

        // Apply Fade In and Fade Out curves on gainNode
        const fadeIn = Math.min(clip.fadeIn ?? 0, playDuration);
        const fadeOut = Math.min(clip.fadeOut ?? 0, playDuration);

        if (fadeIn > 0) {
          gainNode.gain.setValueAtTime(0, clipStart);
          gainNode.gain.linearRampToValueAtTime(effectiveVolume, clipStart + fadeIn);
        } else {
          gainNode.gain.setValueAtTime(effectiveVolume, clipStart);
        }

        if (fadeOut > 0) {
          const fadeOutStart = Math.max(clipStart + fadeIn, clipStart + playDuration - fadeOut);
          gainNode.gain.setValueAtTime(effectiveVolume, fadeOutStart);
          gainNode.gain.linearRampToValueAtTime(0, clipStart + playDuration);
        }

        sourceNode.connect(gainNode);
        gainNode.connect(masterCompressor);

        // Schedule playback at exact timeline offset
        sourceNode.start(clipStart, 0, playDuration);
        tracksMixed++;
        onLog?.(
          `[AudioMixer] Placed clip "${clip.title}" at ${clipStart.toFixed(2)}s for ${playDuration.toFixed(
            2
          )}s (vol: ${effectiveVolume.toFixed(2)}, in: ${fadeIn.toFixed(1)}s, out: ${fadeOut.toFixed(1)}s)`
        );
      }
    } else if (audioSfxMuted) {
      onLog?.("[AudioMixer] Audio/SFX track is muted by user.");
    }

    // 3. Render the Mixed Audio Buffer
    if (tracksMixed === 0) {
      onLog?.("[AudioMixer] No audio tracks present or all tracks muted.");
      return {
        audioBlob: null,
        hasAudio: false,
        duration: safeDuration,
        tracksMixed: 0,
      };
    }

    onProgress?.(0.85, "Rendering mixed audio master...");
    onLog?.(`[AudioMixer] Rendering ${tracksMixed} mixed audio stream(s)...`);

    const renderedBuffer = await offlineCtx.startRendering();
    if (signal?.aborted) throw new Error("Audio mixing cancelled");

    onProgress?.(0.95, "Exporting 48kHz stereo WAV master...");
    const wavBlob = audioBufferToWav(renderedBuffer);

    onLog?.(`[AudioMixer] Master WAV rendered: ${(wavBlob.size / 1024).toFixed(1)} KB, duration ${renderedBuffer.duration.toFixed(2)}s`);
    return {
      audioBlob: wavBlob,
      hasAudio: true,
      duration: renderedBuffer.duration,
      tracksMixed,
    };
  } finally {
    if (decodeCtx.state !== "closed") {
      await decodeCtx.close().catch(() => undefined);
    }
  }
}
