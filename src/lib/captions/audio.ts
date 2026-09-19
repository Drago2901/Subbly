/**
 * Audio extraction and processing utilities.
 * Leverages the robust multi-tier audio pipeline (FFmpeg WASM stream extraction,
 * adaptive timeouts, format validation, and WAV chunking) with fallback support.
 */

import {
  extractAudioWithFallback,
  encodeWav,
  splitWavIntoChunks,
  validateMediaFile,
  TranscriptionError,
  type TranscriptionErrorCode,
  type AudioChunk,
  type AudioExtractionProgress,
  ERROR_MESSAGES,
} from "./audioPipeline";

export {
  encodeWav,
  splitWavIntoChunks,
  validateMediaFile,
  TranscriptionError,
  type TranscriptionErrorCode,
  type AudioChunk,
  type AudioExtractionProgress,
  ERROR_MESSAGES,
};

/**
 * Extracts audio from a video/audio file.
 * - If the file is already an audio file (mp3, wav, m4a, ogg, etc.), returns it immediately without re-encoding.
 * - Extracts audio via FFmpeg WASM (-map 0:a:0? -vn -c:a pcm_s16le -ar 16000 -ac 1) to a 16kHz mono WAV.
 * - Uses dynamic, size-based timeouts instead of fixed limits to avoid timeout errors on normal user uploads.
 * - Implements multi-tier fallbacks (permissive FFmpeg -> Web Audio API -> direct passthrough).
 * - Accurately reports missing audio streams, corrupted files, and unsupported containers.
 */
export async function extractAudioNative(
  file: File,
  opts?: {
    durationSec?: number;
    onProgress?: (progress: AudioExtractionProgress) => void;
    onLog?: (msg: string) => void;
    signal?: AbortSignal;
  }
): Promise<Blob> {
  return extractAudioWithFallback({
    file,
    fileName: file.name,
    durationSec: opts?.durationSec,
    onProgress: opts?.onProgress,
    onLog: opts?.onLog,
    signal: opts?.signal,
  });
}
