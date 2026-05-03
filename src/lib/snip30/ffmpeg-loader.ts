import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;
const LOAD_TIMEOUT_MS = 60_000;

/** Drop the cached FFmpeg instance. Call after a terminate() or fatal error so the next getFFmpeg() reloads cleanly. */
export function resetFFmpeg() {
  try { ffmpegInstance?.terminate(); } catch {}
  ffmpegInstance = null;
  loadPromise = null;
}

export async function getFFmpeg(onProgress?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (typeof window !== "undefined" && window.location.protocol === "file:") {
      throw new Error("FFmpeg needs a local web server. In VS Code, run `bun install` then `bun run dev` and open the localhost URL instead of opening index.html directly.");
    }

    if (typeof WebAssembly === "undefined" || typeof Worker === "undefined") {
      throw new Error("This browser does not support the WebAssembly/Worker features required for video processing.");
    }

    // Single-threaded UMD build — does not need cross-origin isolation,
    // matches the rest of the Subbly codebase (see src/lib/captions/transcode.ts).
    const CDN_BASE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

    const createInstance = () => {
      const ffmpeg = new FFmpeg();
      if (onProgress) {
        ffmpeg.on("log", ({ message }) => {
          if (message) onProgress(message);
        });
      }
      return ffmpeg;
    };

    const loadWithTimeout = async (ffmpeg: FFmpeg, config: { coreURL: string; wasmURL: string }) => {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), LOAD_TIMEOUT_MS);
      try {
        await ffmpeg.load(config, { signal: controller.signal });
      } catch (error) {
        if (controller.signal.aborted) {
          throw new Error(`FFmpeg engine load timed out after ${Math.round(LOAD_TIMEOUT_MS / 1000)}s. Make sure you are running the app with Vite/Bun on localhost, not VS Code Live Server or file://.`);
        }
        throw error;
      } finally {
        window.clearTimeout(timer);
      }
    };

    const tryLoadLocal = async (ffmpeg: FFmpeg) => {
      onProgress?.("Loading local FFmpeg engine…");
      await loadWithTimeout(ffmpeg, {
        coreURL: `${LOCAL_BASE}/ffmpeg-core.js`,
        wasmURL: `${LOCAL_BASE}/ffmpeg-core.wasm`,
      });
    };

    const tryLoadCdn = async (ffmpeg: FFmpeg) => {
      const [coreURL, wasmURL] = await Promise.all([
        toBlobURL(`${CDN_BASE}/ffmpeg-core.js`, "text/javascript"),
        toBlobURL(`${CDN_BASE}/ffmpeg-core.wasm`, "application/wasm"),
      ]);
      await loadWithTimeout(ffmpeg, { coreURL, wasmURL });
    };

    let ffmpeg = createInstance();
    try {
      await tryLoadLocal(ffmpeg);
    } catch (localErr) {
      onProgress?.(`Local FFmpeg load failed (${(localErr as Error).message}); falling back to CDN…`);
      try { ffmpeg.terminate(); } catch {}
      ffmpeg = createInstance();
      await tryLoadCdn(ffmpeg);
    }

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  try {
    return await loadPromise;
  } catch (e) {
    loadPromise = null;
    throw e;
  }
}
