// Runtime environment check for FFmpeg.wasm prerequisites.
// Detects file:// origin, VS Code Live Server (default ports 5500/5501),
// and missing cross-origin isolation (no SharedArrayBuffer).
//
// Returned `message` is user-facing — keep it actionable.

export type EnvIssue = {
  code: "file-protocol" | "live-server" | "not-isolated" | "no-wasm";
  message: string;
};

export function checkRuntimeEnv(): EnvIssue | null {
  if (typeof window === "undefined") return null;

  const { protocol, port, hostname } = window.location;

  if (protocol === "file:") {
    return {
      code: "file-protocol",
      message:
        "This app is open from a file:// path. Video processing needs a real local server. In VS Code, open a terminal and run `bun install` then `bun run dev`, then open the printed http://localhost URL.",
    };
  }

  // VS Code "Live Server" extension defaults to 5500/5501 and does NOT send
  // the COOP/COEP headers FFmpeg.wasm needs.
  const isLiveServerPort = port === "5500" || port === "5501";
  const isLocalHost =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";

  if (isLiveServerPort && isLocalHost) {
    return {
      code: "live-server",
      message:
        "This looks like VS Code Live Server (port 5500/5501). It can't run video processing because it doesn't enable cross-origin isolation. Stop Live Server and run `bun run dev` instead, then open the http://localhost:5173 URL.",
    };
  }

  if (typeof WebAssembly === "undefined" || typeof Worker === "undefined") {
    return {
      code: "no-wasm",
      message:
        "Your browser doesn't support WebAssembly or Web Workers, which are required for video processing. Please use a recent version of Chrome, Edge, Firefox, or Safari.",
    };
  }

  // Note: cross-origin isolation is NOT required — we use the single-threaded
  // UMD build of @ffmpeg/core, same as the rest of the Subbly pipeline.

  return null;
}
