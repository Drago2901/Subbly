import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

// Single-threaded build (no SharedArrayBuffer / COOP+COEP requirement).
const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();
    if (onLog) {
      ffmpeg.on("log", ({ message }) => onLog(message));
    }
    await ffmpeg.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return loadPromise;
}

/**
 * Transcode a WebM blob (produced by MediaRecorder + canvas) to an MP4 file
 * with H.264 video + AAC audio. Runs entirely in-browser via ffmpeg.wasm.
 */
export async function transcodeWebmToMp4(opts: {
  webmBlob: Blob;
  onProgress?: (progress: number) => void;
  onLog?: (msg: string) => void;
  signal?: AbortSignal;
}): Promise<Blob> {
  const { webmBlob, onProgress, onLog, signal } = opts;

  if (signal?.aborted) {
    const err = new Error("Export cancelled");
    err.name = "ExportCancelledError";
    throw err;
  }

  const ffmpeg = await getFFmpeg(onLog);

  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.(Math.max(0, Math.min(1, progress)));
  };
  ffmpeg.on("progress", progressHandler);

  const onAbort = () => {
    try { ffmpeg.terminate(); } catch { /* noop */ }
    // Reset cached instance so next export reloads cleanly.
    ffmpegInstance = null;
    loadPromise = null;
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const inputName = "input.webm";
    const outputName = "output.mp4";

    await ffmpeg.writeFile(inputName, await fetchFile(webmBlob));

    const exitCode = await ffmpeg.exec([
      "-i", inputName,
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-crf", "23",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      outputName,
    ]);

    if (signal?.aborted) {
      const err = new Error("Export cancelled");
      err.name = "ExportCancelledError";
      throw err;
    }

    if (exitCode !== 0) {
      throw new Error("ffmpeg failed to transcode the video to MP4.");
    }

    const data = await ffmpeg.readFile(outputName);
    const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const mp4Blob = new Blob([arrayBuffer], { type: "video/mp4" });

    await ffmpeg.deleteFile(inputName).catch(() => undefined);
    await ffmpeg.deleteFile(outputName).catch(() => undefined);

    return mp4Blob;
  } finally {
    try { ffmpeg.off("progress", progressHandler); } catch { /* instance may be terminated */ }
    signal?.removeEventListener("abort", onAbort);
  }
}
