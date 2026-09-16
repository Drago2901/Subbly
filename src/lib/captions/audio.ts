/**
 * Extracts audio from a video/audio file using the browser's native Web Audio API.
 * - If the file is already an audio file (mp3, wav, m4a, ogg, etc.), returns it immediately without re-encoding.
 * - Otherwise decodes audio to a 16kHz mono 16-bit PCM WAV.
 * - If native decoding fails on a video container and file is <= 25MB, falls back to returning the original file.
 */
export async function extractAudioNative(file: File): Promise<Blob> {
  // 1. Instant passthrough if already an audio file
  const isAudioFile =
    file.type.startsWith("audio/") ||
    /\.(mp3|wav|m4a|aac|ogg|flac|wma)$/i.test(file.name);

  if (isAudioFile) {
    return file;
  }

  // 2. If video is very small (<= 3MB), pass through directly to avoid decode overhead
  // Speech-to-text engines (Groq, OpenAI, ElevenLabs) accept MP4/WebM directly under 25MB.
  if (file.size <= 3 * 1024 * 1024 && /\.(mp4|webm)$/i.test(file.name)) {
    return file;
  }

  // 3. Native Web Audio extraction for video files
  try {
    const arrayBuffer = await file.arrayBuffer();

    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtxClass) {
      throw new Error("Web Audio API not supported in this environment");
    }

    // Initialize with default hardware sample rate to avoid browser NotSupportedError
    const audioCtx = new AudioCtxClass();

    let audioBuffer: AudioBuffer;
    try {
      // Decode audio using browser's native container/codec support (5s safety timeout)
      audioBuffer = await Promise.race([
        audioCtx.decodeAudioData(arrayBuffer),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Audio decoding timed out")), 5000)
        ),
      ]);
    } finally {
      try {
        await audioCtx.close();
      } catch {
        // Ignore close errors
      }
    }

    // High-speed native resampling down to 16kHz mono using OfflineAudioContext
    const OfflineCtxClass =
      window.OfflineAudioContext ||
      (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;

    const targetSampleRate = 16000;
    const targetLength = Math.max(1, Math.ceil(audioBuffer.duration * targetSampleRate));

    if (OfflineCtxClass) {
      try {
        const offlineCtx = new OfflineCtxClass(1, targetLength, targetSampleRate);
        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineCtx.destination);
        source.start(0);

        const rendered = await offlineCtx.startRendering();
        const monoData = rendered.getChannelData(0);
        return encodeWav(monoData, targetSampleRate);
      } catch (offlineErr) {
        console.warn("OfflineAudioContext resampling failed, falling back to manual downsampling:", offlineErr);
      }
    }

    // Fallback: Mix channels and manual downsample
    const numChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    let mixedMono: Float32Array;

    if (numChannels === 1) {
      mixedMono = audioBuffer.getChannelData(0);
    } else {
      mixedMono = new Float32Array(length);
      const factor = 1 / numChannels;
      for (let ch = 0; ch < numChannels; ch++) {
        const channelData = audioBuffer.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          mixedMono[i] += channelData[i] * factor;
        }
      }
    }

    // Downsample to 16kHz if needed
    if (audioBuffer.sampleRate !== targetSampleRate) {
      const ratio = audioBuffer.sampleRate / targetSampleRate;
      const downsampled = new Float32Array(targetLength);
      for (let i = 0; i < targetLength; i++) {
        const origIndex = Math.floor(i * ratio);
        downsampled[i] = origIndex < length ? mixedMono[origIndex] : 0;
      }
      return encodeWav(downsampled, targetSampleRate);
    }

    return encodeWav(mixedMono, targetSampleRate);
  } catch (err) {
    console.warn("Native Web Audio extraction failed:", err);
    // If video file is reasonably sized (<= 25MB), fallback to returning original video
    const FALLBACK_MAX_BYTES = 25 * 1024 * 1024;
    if (file.size <= FALLBACK_MAX_BYTES) {
      console.info("Falling back to sending original media file directly for transcription.");
      return file;
    }
    throw new Error(
      `Could not extract audio track from video (${err instanceof Error ? err.message : "decode failure"}). Please upload a smaller video or an audio file.`
    );
  }
}

/** Encode a Float32Array of mono PCM samples into a 16-bit PCM WAV Blob. */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const dataBytes = samples.length * 2; // 16-bit = 2 bytes per sample
  const headerBuffer = new ArrayBuffer(44);
  const view = new DataView(headerBuffer);

  const str = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  // RIFF header
  str(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);   // file size - 8
  str(8, "WAVE");

  // fmt chunk
  str(12, "fmt ");
  view.setUint32(16, 16, true);              // chunk size
  view.setUint16(20, 1, true);               // PCM = 1
  view.setUint16(22, 1, true);               // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);  // byte rate (sr * channels * bps/8)
  view.setUint16(32, 2, true);               // block align (channels * bps/8)
  view.setUint16(34, 16, true);              // bits per sample

  // data chunk
  str(36, "data");
  view.setUint32(40, dataBytes, true);

  // Convert Float32 → Int16 using a fast Int16Array directly
  const int16Samples = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  return new Blob([headerBuffer, int16Samples.buffer], { type: "audio/wav" });
}

