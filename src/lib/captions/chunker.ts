import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();
    if (onLog) ffmpeg.on("log", ({ message }) => onLog(message));
    await ffmpeg.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();
  return loadPromise;
}

export type VideoChunk = {
  index: number;
  blob: Blob;
  offset: number; // seconds from start of original video
  duration: number; // chunk duration in seconds
};

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) {
    const err = new Error("Chunking cancelled");
    err.name = "ChunkingCancelledError";
    throw err;
  }
};

/**
 * Probe the duration of a video file (browser-based, no ffmpeg needed).
 */
export function probeVideoDuration(file: File | Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.src = url;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      v.removeAttribute("src");
      v.load();
    };
    v.onloadedmetadata = () => {
      const d = v.duration;
      cleanup();
      if (!isFinite(d) || d <= 0) reject(new Error("Could not read video duration"));
      else resolve(d);
    };
    v.onerror = () => {
      cleanup();
      reject(new Error("Could not read video metadata"));
    };
  });
}

/**
 * Split a video into ordered chunks of approximately `chunkSeconds` each
 * using ffmpeg.wasm. Chunks include both video + audio so transcription
 * accepts them as-is. Chunks are returned in chronological order.
 */
export async function splitVideoIntoChunks(opts: {
  file: File | Blob;
  duration: number;
  chunkSeconds: number;
  signal?: AbortSignal;
  onProgress?: (done: number, total: number) => void;
  onLog?: (msg: string) => void;
}): Promise<VideoChunk[]> {
  const { file, duration, chunkSeconds, signal, onProgress, onLog } = opts;
  throwIfAborted(signal);

  const ffmpeg = await getFFmpeg(onLog);
  const onAbort = () => {
    try { ffmpeg.terminate(); } catch { /* noop */ }
    ffmpegInstance = null;
    loadPromise = null;
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  const inputName = "src.mp4";
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  const total = Math.max(1, Math.ceil(duration / chunkSeconds));
  const chunks: VideoChunk[] = [];

  try {
    for (let i = 0; i < total; i++) {
      throwIfAborted(signal);
      const offset = i * chunkSeconds;
      const dur = Math.min(chunkSeconds, duration - offset);
      if (dur <= 0.1) break;

      const outName = `chunk_${i}.mp4`;
      // Re-encode for clean cuts. ultrafast keeps it quick; audio re-encoded so STT is reliable.
      const code = await ffmpeg.exec([
        "-ss", offset.toFixed(3),
        "-i", inputName,
        "-t", dur.toFixed(3),
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "28",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "96k",
        "-movflags", "+faststart",
        outName,
      ]);
      throwIfAborted(signal);
      if (code !== 0) throw new Error(`ffmpeg failed splitting chunk ${i + 1}/${total}`);

      const data = await ffmpeg.readFile(outName);
      const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
      const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      chunks.push({
        index: i,
        blob: new Blob([ab], { type: "video/mp4" }),
        offset,
        duration: dur,
      });
      await ffmpeg.deleteFile(outName).catch(() => undefined);
      onProgress?.(i + 1, total);
    }
    await ffmpeg.deleteFile(inputName).catch(() => undefined);
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }

  return chunks;
}
