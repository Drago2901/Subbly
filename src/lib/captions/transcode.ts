import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();
    if (onLog) ffmpeg.on("log", ({ message }) => onLog(message));

    const localBase = typeof window !== "undefined" ? window.location.origin : "";
    const urls = [
      localBase,
      "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm",
      "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm",
      "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm",
    ].filter(Boolean);

    let loaded = false;
    let lastError: unknown = null;
    for (const baseUrl of urls) {
      try {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseUrl}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseUrl}/ffmpeg-core.wasm`, "application/wasm"),
        });
        loaded = true;
        break;
      } catch (err) {
        console.warn(`Failed to load FFmpeg core from ${baseUrl}:`, err);
        lastError = err;
      }
    }
    if (!loaded) throw lastError || new Error("Failed to load FFmpeg core from all locations.");
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })().catch((err) => {
    loadPromise = null;
    throw err;
  });

  return loadPromise;
}

export async function transcodeWebmToMp4(opts: {
  webmBlob: Blob;
  quality?: "standard" | "high";
  onProgress?: (progress: number) => void;
  onLog?: (msg: string) => void;
  signal?: AbortSignal;
}): Promise<Blob> {
  const { webmBlob, quality, onProgress, onLog, signal } = opts;
  if (signal?.aborted) throw cancelled();

  const ffmpeg = await getFFmpeg(onLog);
  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.(Math.max(0, Math.min(1, progress)));
  };
  ffmpeg.on("progress", progressHandler);

  const onAbort = () => {
    try { ffmpeg.terminate(); } catch { /* noop */ }
    ffmpegInstance = null;
    loadPromise = null;
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  const inputName = "rendered-input.webm";
  const outputName = "rendered-output.mp4";

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(webmBlob));
    if (signal?.aborted) throw cancelled();

    const crf = quality === "high" ? "18" : "23";
    // Keep the encode strictly CFR and explicitly generate timestamps. The
    // browser recorder can emit slightly irregular timestamps when the main
    // thread is busy; normalising them here prevents freezes/green/glitchy
    // tails in the final MP4.
    const exitCode = await ffmpeg.exec([
      "-fflags", "+genpts",
      "-i", inputName,
      "-map", "0:v:0",
      "-map", "0:a:0?",
      "-vf", "fps=30",
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-crf", crf,
      "-pix_fmt", "yuv420p",
      "-fps_mode", "cfr",
      "-c:a", "aac",
      "-b:a", "128k",
      "-ar", "48000",
      "-ac", "2",
      "-af", "aresample=async=1:first_pts=0",
      "-avoid_negative_ts", "make_zero",
      "-movflags", "+faststart",
      outputName,
    ]);

    if (signal?.aborted) throw cancelled();
    if (exitCode !== 0) throw new Error("ffmpeg failed to transcode the video to MP4.");

    const data = await ffmpeg.readFile(outputName);
    const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const mp4Blob = new Blob([arrayBuffer], { type: "video/mp4" });
    if (!mp4Blob.size) throw new Error("FFmpeg produced an empty MP4 file.");
    return mp4Blob;
  } finally {
    await ffmpeg.deleteFile(inputName).catch(() => undefined);
    await ffmpeg.deleteFile(outputName).catch(() => undefined);
    try { ffmpeg.off("progress", progressHandler); } catch { /* instance may be terminated */ }
    signal?.removeEventListener("abort", onAbort);
  }
}

export async function extractAudio(opts: {
  videoFile: File;
  onProgress?: (progress: number) => void;
  onLog?: (msg: string) => void;
  signal?: AbortSignal;
}): Promise<Blob> {
  const { videoFile, onProgress, onLog, signal } = opts;
  if (signal?.aborted) throw cancelled("Audio extraction cancelled");

  const ffmpeg = await getFFmpeg(onLog);
  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.(Math.max(0, Math.min(1, progress)));
  };
  ffmpeg.on("progress", progressHandler);
  const onAbort = () => {
    try { ffmpeg.terminate(); } catch { /* noop */ }
    ffmpegInstance = null;
    loadPromise = null;
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  const ext = videoFile.name.split(".").pop() || "mp4";
  const inputName = `audio-input.${ext}`;
  const outputName = "output_audio.wav";

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
    if (signal?.aborted) throw cancelled("Audio extraction cancelled");

    const exitCode = await ffmpeg.exec([
      "-i", inputName,
      "-vn",
      "-acodec", "pcm_s16le",
      "-ar", "16000",
      "-ac", "1",
      outputName,
    ]);
    if (signal?.aborted) throw cancelled("Audio extraction cancelled");
    if (exitCode !== 0) throw new Error("ffmpeg failed to extract audio from the video.");

    const data = await ffmpeg.readFile(outputName);
    const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return new Blob([arrayBuffer], { type: "audio/wav" });
  } finally {
    await ffmpeg.deleteFile(inputName).catch(() => undefined);
    await ffmpeg.deleteFile(outputName).catch(() => undefined);
    try { ffmpeg.off("progress", progressHandler); } catch { /* instance may be terminated */ }
    signal?.removeEventListener("abort", onAbort);
  }
}

function cancelled(message = "Export cancelled") {
  const err = new Error(message);
  err.name = "ExportCancelledError";
  return err;
}
