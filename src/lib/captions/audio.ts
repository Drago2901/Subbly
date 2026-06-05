/**
 * Extracts audio from a video/audio file using the browser's native Web Audio API.
 * Produces a 16kHz mono 16-bit PCM WAV blob — no WebAssembly or CDN downloads required.
 * This is dramatically faster than FFmpeg-based extraction.
 */
export async function extractAudioNative(videoFile: File): Promise<Blob> {
  const arrayBuffer = await videoFile.arrayBuffer();

  // Decode audio using the browser's native codec support
  const audioCtx = new AudioContext({ sampleRate: 16000 });
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    await audioCtx.close();
  }

  // Mix all channels down to mono
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const monoData = new Float32Array(length);

  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = audioBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      monoData[i] += channelData[i] / numChannels;
    }
  }

  return encodeWav(monoData, 16000);
}

/** Encode a Float32Array of mono PCM samples into a 16-bit PCM WAV Blob. */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const dataBytes = samples.length * 2; // 16-bit = 2 bytes per sample
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

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

  // Convert Float32 → Int16
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}
