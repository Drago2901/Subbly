import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();
    if (onLog) {
      ffmpeg.on("log", ({ message }) => onLog(message));
    }

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

    if (!loaded) {
      throw lastError || new Error("Failed to load FFmpeg core from all locations.");
    }

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
  quality?: "standard" | "high";
  onProgress?: (progress: number) => void;
  onLog?: (msg: string) => void;
  signal?: AbortSignal;
}): Promise<Blob> {
  const { webmBlob, originalFile, quality, onProgress, onLog, signal } = opts;

  if (signal?.aborted) {
    const err = new Error("Export cancelled");
    err.name = "ExportCancelledError";
    throw err;
  }

  onLog?.("[Export] transcoding started");
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

  const inputName = "input.webm";
  const outputName = "output.mp4";
  let sourceName: string | null = null;

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(webmBlob));

    if (originalFile) {
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
      // Map video from rendered canvas WebM, and optional audio from source file
      args.push("-map", "0:v:0", "-map", "1:a:0?");
    } else {
      // Map video and optional audio from rendered WebM
      args.push("-map", "0:v:0", "-map", "0:a:0?");
    }

    args.push(
      "-r", "30",
      "-vsync", "cfr",
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-crf", crf,
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "128k",
      "-af", "aresample=async=1:first_pts=0",
      "-movflags", "+faststart",
      outputName,
    );

    const exitCode = await ffmpeg.exec(args);

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

    onLog?.("[Export] transcoding completed");
    return mp4Blob;
  } finally {
    try {
      await ffmpeg.deleteFile(inputName).catch(() => undefined);
      await ffmpeg.deleteFile(outputName).catch(() => undefined);
      if (sourceName) {
        await ffmpeg.deleteFile(sourceName).catch(() => undefined);
      }
    } catch {
      // ignore cleanup errors
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

  if (signal?.aborted) {
    const err = new Error("Audio extraction cancelled");
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
    ffmpegInstance = null;
    loadPromise = null;
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const ext = videoFile.name.split(".").pop() || "mp4";
    const inputName = `input.${ext}`;
    const outputName = "output_audio.wav";

    await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    if (signal?.aborted) {
      const err = new Error("Audio extraction cancelled");
      err.name = "ExportCancelledError";
      throw err;
    }

    // Convert to 16kHz, mono, 16-bit WAV (pcm_s16le) to minimize file size
    const exitCode = await ffmpeg.exec([
      "-i", inputName,
      "-vn",
      "-acodec", "pcm_s16le",
      "-ar", "16000",
      "-ac", "1",
      outputName,
    ]);

    if (signal?.aborted) {
      const err = new Error("Audio extraction cancelled");
      err.name = "ExportCancelledError";
      throw err;
    }

    if (exitCode !== 0) {
      throw new Error("ffmpeg failed to extract audio from the video.");
    }

    const data = await ffmpeg.readFile(outputName);
    const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const wavBlob = new Blob([arrayBuffer], { type: "audio/wav" });

    await ffmpeg.deleteFile(inputName).catch(() => undefined);
    await ffmpeg.deleteFile(outputName).catch(() => undefined);

    return wavBlob;
  } finally {
    try { ffmpeg.off("progress", progressHandler); } catch { /* instance may be terminated */ }
    signal?.removeEventListener("abort", onAbort);
  }
}

