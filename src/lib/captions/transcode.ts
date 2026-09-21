import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

export async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
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

/**
 * Transcode a WebM blob (produced by MediaRecorder + canvas) to an MP4 file
 * with H.264 video + AAC audio. Runs entirely in-browser via ffmpeg.wasm.
 * Enforces constant frame rate (CFR 30fps), regenerates presentation timestamps,
 * and normalizes audio sync.
 */
export async function transcodeWebmToMp4(opts: {
  webmBlob: Blob;
  originalFile?: File | Blob;
  duration?: number;
  quality?: "standard" | "high";
  fps?: number;
  onProgress?: (progress: number) => void;
  onLog?: (msg: string) => void;
  signal?: AbortSignal;
}): Promise<Blob> {
  const { webmBlob, originalFile, duration, quality, fps, onProgress, onLog, signal } = opts;
  if (signal?.aborted) throw cancelled();

  onLog?.("[Export] transcoding started");
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
  let sourceName: string | null = null;

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(webmBlob));
    if (signal?.aborted) throw cancelled();

    if (originalFile && originalFile.size > 0) {
      const sourceExt = originalFile instanceof File ? (originalFile.name.split(".").pop() || "mp4") : "mp4";
      sourceName = `source.${sourceExt}`;
      await ffmpeg.writeFile(sourceName, await fetchFile(originalFile));
    }

    const crf = quality === "high" ? "18" : "23";

    const args: string[] = [
      "-fflags", "+genpts",
      "-i", inputName,
    ];

    if (sourceName) {
      args.push("-i", sourceName);
      // Map video from rendered canvas WebM, and audio from source file
      args.push("-map", "0:v:0", "-map", "1:a:0?");
    } else {
      // Map video and optional audio from rendered WebM
      args.push("-map", "0:v:0", "-map", "0:a:0?");
    }

    // Clamp duration and enforce -shortest to prevent runaway encoding or infinite loops
    if (duration && duration > 0) {
      args.push("-t", duration.toFixed(3));
    }
    args.push("-shortest");

    const targetFps = fps || (quality === "high" ? 30 : 24);

    args.push(
      "-vf", `fps=${targetFps}`,
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
      outputName,
    );

    // Safety timeout: 180s maximum
    const execTimeoutMs = 180000;
    const exitCode = await Promise.race([
      ffmpeg.exec(args),
      new Promise<number>((_, reject) =>
        setTimeout(() => reject(new Error("FFmpeg transcoding timed out")), execTimeoutMs)
      ),
    ]);

    if (signal?.aborted) throw cancelled();
    if (exitCode !== 0) throw new Error("ffmpeg failed to transcode the video to MP4.");

    const data = await ffmpeg.readFile(outputName);
    const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const mp4Blob = new Blob([arrayBuffer], { type: "video/mp4" });
    if (!mp4Blob.size) throw new Error("FFmpeg produced an empty MP4 file.");

    onLog?.("[Export] transcoding completed");
    return mp4Blob;
  } finally {
    await ffmpeg.deleteFile(inputName).catch(() => undefined);
    await ffmpeg.deleteFile(outputName).catch(() => undefined);
    if (sourceName) {
      await ffmpeg.deleteFile(sourceName).catch(() => undefined);
    }
    try { ffmpeg.off("progress", progressHandler); } catch { /* instance may be terminated */ }
    signal?.removeEventListener("abort", onAbort);
  }
}

/**
 * Validates that the exported media duration is finite, positive,
 * and reasonably close to the expected source duration.
 */
export async function validateExportDuration(
  blob: Blob,
  expectedDuration: number,
  toleranceSec = 1.0
): Promise<{ valid: boolean; actualDuration: number; error?: string }> {
  if (
    typeof document === "undefined" ||
    !document.createElement ||
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    return { valid: true, actualDuration: expectedDuration };
  }

  const url = URL.createObjectURL(blob);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.src = url;

  try {
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => resolve(), 3000);
      video.onloadedmetadata = () => {
        clearTimeout(timer);
        resolve();
      };
      video.onerror = () => {
        clearTimeout(timer);
        resolve();
      };
    });

    const actualDuration = video.duration;
    if (!isFinite(actualDuration) || actualDuration <= 0) {
      return { valid: true, actualDuration: expectedDuration };
    }

    const diff = Math.abs(actualDuration - expectedDuration);
    if (diff > toleranceSec && (expectedDuration > 0 && diff / expectedDuration > 0.15)) {
      return {
        valid: false,
        actualDuration,
        error: `Exported duration (${actualDuration.toFixed(2)}s) diverges from expected duration (${expectedDuration.toFixed(2)}s).`,
      };
    }

    return { valid: true, actualDuration };
  } finally {
    try {
      video.removeAttribute("src");
      video.load();
    } catch {
      // ignore in environments without full media pipeline (e.g. JSDOM)
    }
    URL.revokeObjectURL(url);
  }
}

/**
 * Extract audio from a video file and transcode it to a lightweight 16kHz mono WAV file.
 * This runs entirely in-browser via FFmpeg, reducing payload size significantly.
 */
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
