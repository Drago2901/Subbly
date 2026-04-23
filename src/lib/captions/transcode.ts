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
}): Promise<Blob> {
  const { webmBlob, onProgress, onLog } = opts;

  const ffmpeg = await getFFmpeg(onLog);

  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.(Math.max(0, Math.min(1, progress)));
  };
  ffmpeg.on("progress", progressHandler);

  try {
    const inputName = "input.webm";
    const outputName = "output.mp4";

    await ffmpeg.writeFile(inputName, await fetchFile(webmBlob));

    // H.264 video + AAC audio. yuv420p ensures broad player compatibility.
    // +faststart moves moov atom to the front so the file plays immediately.
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

    if (exitCode !== 0) {
      throw new Error("ffmpeg failed to transcode the video to MP4.");
    }

    const data = await ffmpeg.readFile(outputName);
    const buffer = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
    const mp4Blob = new Blob([buffer], { type: "video/mp4" });

    // Best-effort cleanup so memory doesn't balloon across exports.
    await ffmpeg.deleteFile(inputName).catch(() => undefined);
    await ffmpeg.deleteFile(outputName).catch(() => undefined);

    return mp4Blob;
  } finally {
    ffmpeg.off("progress", progressHandler);
  }
}
