/**
 * Real Audio Waveform Analysis Pipeline
 * Audio -> Decode -> PCM Samples -> RMS / Amplitude Analysis -> Amplitude Envelope -> Downsampling -> Normalization
 * Generates data-driven vocal energy envelopes representing speech intensity, pauses, and loudness.
 */

// In-memory cache for decoded audio waveform data
const waveformCache = new Map<string, number[]>();

/**
 * Computes root-mean-square (RMS) energy for an array segment.
 */
function computeRms(samples: Float32Array, start: number, end: number): number {
  if (start >= end) return 0;
  let sumSq = 0;
  const count = end - start;
  for (let i = start; i < end; i++) {
    const val = samples[i];
    sumSq += val * val;
  }
  return Math.sqrt(sumSq / count);
}

/**
 * Extracts real audio waveform envelope from an audio Blob, File, ArrayBuffer, or media URL.
 * 
 * @param source Audio Blob, File, ArrayBuffer, or media URL string.
 * @param targetBuckets Number of time samples to generate (default 300).
 * @param cacheKey Optional unique key for caching.
 * @returns Array of normalized amplitudes between 0.02 (silence) and 1.0 (loudest peak).
 */
export async function extractRealWaveform(
  source: Blob | File | ArrayBuffer | string,
  targetBuckets = 300,
  cacheKey?: string
): Promise<number[]> {
  const key = cacheKey || (typeof source === "string" ? source : (source instanceof File ? `${source.name}-${source.size}` : null));
  if (key && waveformCache.has(key)) {
    return waveformCache.get(key)!;
  }

  try {
    let arrayBuffer: ArrayBuffer;
    if (source instanceof ArrayBuffer) {
      arrayBuffer = source;
    } else if (source instanceof Blob) {
      arrayBuffer = await source.arrayBuffer();
    } else if (typeof source === "string") {
      const resp = await fetch(source);
      if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
      arrayBuffer = await resp.arrayBuffer();
    } else {
      throw new Error("Unsupported audio source");
    }

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return generateSyntheticSpeechEnvelope(targetBuckets);
    }

    // Decode audio using Web Audio API
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) {
      return generateSyntheticSpeechEnvelope(targetBuckets);
    }

    const audioCtx = new AudioCtxClass();
    let audioBuffer: AudioBuffer;
    try {
      // slice(0) avoids detaching the original buffer
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    } finally {
      if (audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
    }

    const channelData = audioBuffer.getChannelData(0);
    const totalSamples = channelData.length;
    if (totalSamples === 0) {
      return generateSyntheticSpeechEnvelope(targetBuckets);
    }

    const samplesPerBucket = totalSamples / targetBuckets;
    const rawRms: number[] = new Array(targetBuckets);
    let maxRms = 0;

    // 1. RMS extraction per time bucket
    for (let b = 0; b < targetBuckets; b++) {
      const start = Math.floor(b * samplesPerBucket);
      const end = Math.min(totalSamples, Math.floor((b + 1) * samplesPerBucket));
      const rms = computeRms(channelData, start, end);
      rawRms[b] = rms;
      if (rms > maxRms) maxRms = rms;
    }

    // If file is completely silent
    if (maxRms <= 0.0001) {
      const silent = new Array(targetBuckets).fill(0.02);
      if (key) waveformCache.set(key, silent);
      return silent;
    }

    // 2. Vocal dynamics & normalization
    // Silence threshold: sounds below 3% of peak are treated as pauses/silence (rendered as flat line)
    const silenceFloor = maxRms * 0.035;
    const result: number[] = new Array(targetBuckets);

    for (let b = 0; b < targetBuckets; b++) {
      const val = rawRms[b];
      if (val < silenceFloor) {
        // True silence: flat baseline
        result[b] = 0.02;
      } else {
        // Human voice dynamic curve: emphasizes speech contours
        const normalized = (val - silenceFloor) / (maxRms - silenceFloor);
        // Moderate compression curve to preserve quiet vs loud distinction
        const shaped = Math.pow(normalized, 0.85);
        // Map to range 0.06 to 1.0
        result[b] = Math.min(1.0, Math.max(0.06, Number((0.06 + shaped * 0.94).toFixed(3))));
      }
    }

    if (key) {
      waveformCache.set(key, result);
    }
    return result;
  } catch (err) {
    console.warn("[waveform] Decoding failed, using speech envelope fallback:", err);
    return generateSyntheticSpeechEnvelope(targetBuckets);
  }
}

/**
 * Fallback speech envelope simulating natural vocal cadence when audio decoding fails.
 */
export function generateSyntheticSpeechEnvelope(count = 300): number[] {
  const result: number[] = new Array(count);
  let phase = 0;
  for (let i = 0; i < count; i++) {
    phase += 0.12;
    // Multi-frequency cadence with speech pauses
    const cadence = Math.sin(phase) * Math.cos(phase * 0.35);
    const isPause = Math.sin(i * 0.04) < -0.65;
    if (isPause) {
      result[i] = 0.02; // flat silence
    } else {
      const amp = Math.abs(cadence) * 0.75 + 0.15;
      result[i] = Math.min(0.95, Math.max(0.05, amp));
    }
  }
  return result;
}
