/**
 * Generate a JPEG thumbnail from a video File by capturing a single frame.
 * Runs entirely in-browser using a hidden <video> + <canvas>. No upload here —
 * the caller decides where to store the resulting Blob.
 */
export async function generateVideoThumbnail(
  file: File,
  opts?: { maxWidth?: number; quality?: number; seekRatio?: number },
): Promise<Blob | null> {
  const maxWidth = opts?.maxWidth ?? 640;
  const quality = opts?.quality ?? 0.8;
  const seekRatio = opts?.seekRatio ?? 0.1;

  return new Promise<Blob | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";

    let settled = false;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
    };
    const finish = (blob: Blob | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(blob);
    };

    const capture = () => {
      try {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (!vw || !vh) return finish(null);
        const scale = Math.min(1, maxWidth / vw);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(vw * scale);
        canvas.height = Math.round(vh * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return finish(null);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => finish(blob),
          "image/jpeg",
          quality,
        );
      } catch {
        finish(null);
      }
    };

    video.onloadedmetadata = () => {
      const target = Math.min(
        Math.max(0.1, (video.duration || 0) * seekRatio),
        (video.duration || 0.1),
      );
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        // Give the frame a tick to paint before drawing.
        requestAnimationFrame(capture);
      };
      video.addEventListener("seeked", onSeeked);
      try {
        video.currentTime = Number.isFinite(target) ? target : 0.1;
      } catch {
        capture();
      }
    };

    video.onerror = () => finish(null);
    // Safety timeout so we never hang the upload flow.
    setTimeout(() => finish(null), 10000);

    video.src = url;
  });
}
