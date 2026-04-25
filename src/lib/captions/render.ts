import type { Caption, CaptionStyle } from "@/lib/captions/types";

export type RenderProgress = (info: { progress: number; message?: string }) => void;

export type ExportOutput = {
  /** Target width in pixels. If omitted, source width is used. */
  width?: number;
  /** Target height in pixels. If omitted, source height is used. */
  height?: number;
  /** "cover" crops to fill (no bars), "contain" letterboxes. Default: "cover". */
  fit?: "cover" | "contain";
  /** Background color used when letterboxing. Default: black. */
  background?: string;
};

export class ExportCancelledError extends Error {
  constructor() {
    super("Export cancelled");
    this.name = "ExportCancelledError";
  }
}

export async function burnCaptions(opts: {
  videoFile: File;
  captions: Caption[];
  style: CaptionStyle;
  output?: ExportOutput;
  onProgress?: RenderProgress;
  onLog?: (msg: string) => void;
  signal?: AbortSignal;
}): Promise<Blob> {
  const { videoFile, captions, style, output, onProgress, onLog, signal } = opts;

  if (signal?.aborted) throw new ExportCancelledError();

  if (typeof MediaRecorder === "undefined") {
    throw new Error("This browser does not support video export.");
  }

  const videoUrl = URL.createObjectURL(videoFile);
  const video = document.createElement("video");
  const canvas = document.createElement("canvas");

  let recorder: MediaRecorder | null = null;
  let animationFrame = 0;
  let audioContext: AudioContext | null = null;
  let audioSource: MediaElementAudioSourceNode | null = null;
  let audioDestination: MediaStreamAudioDestinationNode | null = null;
  let outputStream: MediaStream | null = null;

  try {
    video.src = videoUrl;
    video.preload = "auto";
    video.playsInline = true;
    // Do NOT set muted = true: muting an HTMLMediaElement causes
    // MediaElementAudioSourceNode to output silence in most browsers,
    // which would strip audio from the exported file.
    video.muted = false;
    video.volume = 1;
    video.crossOrigin = "anonymous";
    video.load();

    await waitForVideoReady(video, 1, "loadedmetadata");
    await waitForVideoReady(video, 3, "canplay");

    if ("fonts" in document) {
      await (document as Document & { fonts: FontFaceSet }).fonts.ready;
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const duration = Math.max(video.duration || 0, 0.001);

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not prepare export canvas.");
    }

    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      try {
        audioContext = new AudioContextClass();
        audioSource = audioContext.createMediaElementSource(video);
        audioDestination = audioContext.createMediaStreamDestination();
        audioSource.connect(audioDestination);
        await audioContext.resume();
      } catch (error) {
        onLog?.(`Audio capture unavailable: ${error instanceof Error ? error.message : String(error)}`);
        audioSource?.disconnect();
        audioDestination?.disconnect();
        audioSource = null;
        audioDestination = null;
        if (audioContext) {
          await audioContext.close().catch(() => undefined);
          audioContext = null;
        }
      }
    }

    const canvasStream = canvas.captureStream(30);
    const audioTracks = audioDestination?.stream.getAudioTracks() ?? [];
    outputStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);

    const mimeType = getSupportedMimeType();
    recorder = mimeType
      ? new MediaRecorder(outputStream, { mimeType, videoBitsPerSecond: 8_000_000, audioBitsPerSecond: 128_000 })
      : new MediaRecorder(outputStream, { videoBitsPerSecond: 8_000_000, audioBitsPerSecond: 128_000 });

    const chunks: BlobPart[] = [];
    const result = new Promise<Blob>((resolve, reject) => {
      recorder!.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder!.onerror = () => reject(new Error("Recording failed during export."));
      recorder!.onstop = () => {
        const finalType = recorder?.mimeType || mimeType || "video/webm";
        const blob = new Blob(chunks, { type: finalType });
        if (!blob.size) {
          reject(new Error("Export failed to produce a video file."));
          return;
        }
        resolve(blob);
      };
    });

    let lastProgressTime = performance.now();
    let lastReportedTime = -1;

    const renderFrame = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(video, 0, 0, width, height);
      drawCaptionOverlay(ctx, captions, style, width, height, video.currentTime);
      if (video.currentTime !== lastReportedTime) {
        lastReportedTime = video.currentTime;
        lastProgressTime = performance.now();
      }
      onProgress?.({
        progress: clamp(video.currentTime / duration, 0, 1),
        message: "Rendering video",
      });
      if (!video.ended) {
        animationFrame = requestAnimationFrame(renderFrame);
      }
    };

    // Make sure we start from the very beginning.
    try { video.currentTime = 0; } catch { /* ignore */ }

    recorder.start(250);
    try {
      await video.play();
    } catch (err) {
      throw new Error(
        `Could not start playback for export: ${err instanceof Error ? err.message : String(err)}. ` +
        `Try clicking inside the page once before exporting.`
      );
    }
    animationFrame = requestAnimationFrame(renderFrame);

    // Wait for "ended" but with a stall watchdog so we never hang forever
    // (e.g. if the tab is backgrounded and rAF/playback is throttled, or
    // if the source video never fires "ended" reliably).
    await new Promise<void>((resolve, reject) => {
      const STALL_MS = 8000;
      const onEnded = () => { cleanup(); resolve(); };
      const onError = () => { cleanup(); reject(new Error("Video playback errored during export.")); };
      const onAbort = () => { cleanup(); reject(new ExportCancelledError()); };
      const watchdog = window.setInterval(() => {
        if (signal?.aborted) {
          cleanup();
          reject(new ExportCancelledError());
          return;
        }
        if (duration && video.currentTime >= duration - 0.05) {
          cleanup();
          resolve();
          return;
        }
        if (performance.now() - lastProgressTime > STALL_MS) {
          cleanup();
          reject(new Error(
            "Export stalled — playback didn't progress. " +
            "Keep this tab focused while exporting and try again."
          ));
        }
      }, 500);
      const cleanup = () => {
        window.clearInterval(watchdog);
        video.removeEventListener("ended", onEnded);
        video.removeEventListener("error", onError);
        signal?.removeEventListener("abort", onAbort);
      };
      video.addEventListener("ended", onEnded, { once: true });
      video.addEventListener("error", onError, { once: true });
      signal?.addEventListener("abort", onAbort, { once: true });
    });

    cancelAnimationFrame(animationFrame);
    renderFrame();
    onProgress?.({ progress: 1, message: "Finalizing export" });

    if (recorder.state !== "inactive") {
      recorder.stop();
    }

    return await result;
  } finally {
    cancelAnimationFrame(animationFrame);
    recorder?.stream.getTracks().forEach((track) => track.stop());
    outputStream?.getTracks().forEach((track) => track.stop());
    audioSource?.disconnect();
    audioDestination?.disconnect();
    if (audioContext) {
      await audioContext.close().catch(() => undefined);
    }
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(videoUrl);
  }
}

function drawCaptionOverlay(
  ctx: CanvasRenderingContext2D,
  captions: Caption[],
  style: CaptionStyle,
  width: number,
  height: number,
  time: number,
) {
  const active = captions.find((caption) => time >= caption.start && time <= caption.end);
  if (!active) return;

  const fontSize = clamp(Math.round((style.fontSize / 1080) * height), 18, 160);
  const padX = Math.round(fontSize * 0.36);
  const padY = Math.round(fontSize * 0.24);
  const lineGap = Math.round(fontSize * 0.2);
  const maxLineWidth = width * 0.84;

  setCanvasFont(ctx, style, fontSize);
  const words = getRenderWords(ctx, active, style);
  const lines = wrapWords(words, maxLineWidth);
  const lineBoxHeight = fontSize + padY * 2;
  const blockHeight = lines.length * lineBoxHeight + Math.max(0, lines.length - 1) * lineGap;
  const maxLineW = lines.reduce((m, l) => Math.max(m, l.width), 0);
  const blockWidth = maxLineW + padX * 2;

  // Compute anchor position
  const center = computeCenter(style, width, height, blockWidth, blockHeight);
  const blockTop = center.y - blockHeight / 2;
  const blockCenterX = center.x;

  // Animation transform (origin = block center)
  const enter = clamp((time - active.start) / 0.35, 0, 1);
  const exit = clamp((active.end - time) / 0.25, 0, 1);
  const anim = computeAnim(style.animation, enter, exit);

  ctx.save();
  ctx.globalAlpha = anim.opacity;
  ctx.translate(blockCenterX, center.y);
  if (anim.scale !== 1) ctx.scale(anim.scale, anim.scale);
  if (anim.translateY) ctx.translate(0, anim.translateY * (height / 1080));
  ctx.translate(-blockCenterX, -center.y);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const strokePx = Math.round((style.strokeWidth / 1080) * height);

  lines.forEach((line, lineIndex) => {
    const lineLeft = blockCenterX - line.width / 2;
    const lineTop = blockTop + lineIndex * (lineBoxHeight + lineGap);
    const baselineY = lineTop + padY + fontSize * 0.82;

    if (style.bgOpacity > 0) {
      ctx.save();
      ctx.fillStyle = hexToRgba(style.bgColor, style.bgOpacity);
      fillRoundedRect(
        ctx,
        lineLeft - padX,
        lineTop,
        line.width + padX * 2,
        lineBoxHeight,
        Math.max(8, Math.round(fontSize * 0.18)),
      );
      ctx.restore();
    }

    let cursorX = lineLeft;
    line.words.forEach((word) => {
      const isActiveWord = style.karaoke && time >= word.start && time <= word.end;
      const isFutureWord = style.karaoke && time < word.start;
      const scale = isActiveWord ? 1.08 : 1;
      const fillColor = isActiveWord ? style.highlightColor : style.color;
      const alpha = isFutureWord ? 0.75 : 1;

      ctx.save();
      setCanvasFont(ctx, style, fontSize);

      // Stroke first
      if (strokePx > 0) {
        ctx.strokeStyle = style.strokeColor;
        ctx.lineWidth = strokePx;
        ctx.lineJoin = "round";
        ctx.miterLimit = 2;
        if (scale !== 1) {
          const cx = cursorX + word.width / 2;
          const cy = baselineY - fontSize * 0.38;
          ctx.translate(cx, cy);
          ctx.scale(scale, scale);
          ctx.translate(-cx, -cy);
        }
        ctx.strokeText(word.text, cursorX, baselineY);
      } else {
        if (scale !== 1) {
          const cx = cursorX + word.width / 2;
          const cy = baselineY - fontSize * 0.38;
          ctx.translate(cx, cy);
          ctx.scale(scale, scale);
          ctx.translate(-cx, -cy);
        }
      }

      ctx.fillStyle = hexToRgba(fillColor, alpha);
      ctx.shadowColor = isActiveWord
        ? hexToRgba(style.highlightColor, 0.7)
        : "rgba(0, 0, 0, 0.55)";
      ctx.shadowBlur = isActiveWord ? Math.round(fontSize * 0.45) : Math.round(fontSize * 0.12);
      ctx.shadowOffsetY = 2;

      ctx.fillText(word.text, cursorX, baselineY);
      ctx.restore();
      cursorX += word.width;
    });
  });

  ctx.restore();
}

type RenderWord = {
  text: string;
  start: number;
  end: number;
  width: number;
};

type RenderLine = {
  words: RenderWord[];
  width: number;
};

function getRenderWords(
  ctx: CanvasRenderingContext2D,
  caption: Caption,
  style: CaptionStyle,
): RenderWord[] {
  const sourceWords = style.karaoke && caption.words?.length
    ? caption.words.map((word) => ({ text: word.text, start: word.start, end: word.end }))
    : splitIntoWordTokens(caption.text).map((text) => ({ text, start: caption.start, end: caption.end }));

  return sourceWords.map((word) => {
    const text = style.uppercase ? word.text.toUpperCase() : word.text;
    return {
      ...word,
      text,
      width: ctx.measureText(text).width,
    };
  });
}

function splitIntoWordTokens(text: string) {
  const matches = text.match(/\S+\s*/g);
  return matches?.length ? matches : [text];
}

function wrapWords(words: RenderWord[], maxWidth: number): RenderLine[] {
  const lines: RenderLine[] = [];
  let current: RenderLine = { words: [], width: 0 };

  words.forEach((word) => {
    const nextWidth = current.width + word.width;
    if (current.words.length > 0 && nextWidth > maxWidth) {
      lines.push(current);
      current = { words: [word], width: word.width };
      return;
    }
    current.words.push(word);
    current.width = nextWidth;
  });

  if (current.words.length > 0) {
    lines.push(current);
  }

  return lines.length ? lines : [{ words: [], width: 0 }];
}

function setCanvasFont(ctx: CanvasRenderingContext2D, style: CaptionStyle, fontSize: number) {
  const weight = style.bold ? Math.max(style.fontWeight ?? 700, 700) : (style.fontWeight ?? 500);
  ctx.font = `${weight} ${fontSize}px "${style.fontFamily}", sans-serif`;
}

function computeCenter(
  style: CaptionStyle,
  width: number,
  height: number,
  blockWidth: number,
  blockHeight: number,
): { x: number; y: number } {
  if (style.position === "free") {
    const x = clamp(style.posX * width, blockWidth / 2, width - blockWidth / 2);
    const y = clamp(style.posY * height, blockHeight / 2, height - blockHeight / 2);
    return { x, y };
  }
  const x = width / 2;
  if (style.position === "top") return { x, y: height * 0.12 };
  if (style.position === "middle") return { x, y: height / 2 };
  return { x, y: height * 0.88 };
}

function computeAnim(
  anim: CaptionStyle["animation"],
  enter: number,
  exit: number,
): { scale: number; translateY: number; opacity: number } {
  const e = easeOutBack(enter);
  const fade = Math.min(enter * 1.5, 1) * Math.min(exit * 1.5, 1);
  switch (anim) {
    case "zoom-in":
      return { scale: 0.5 + 0.5 * e, translateY: 0, opacity: fade };
    case "zoom-out":
      return { scale: 1.5 - 0.5 * e, translateY: 0, opacity: fade };
    case "pop":
      return { scale: 0.7 + 0.3 * e, translateY: 0, opacity: fade };
    case "fade":
      return { scale: 1, translateY: 0, opacity: enter * exit };
    case "slide-up":
      return { scale: 1, translateY: (1 - e) * 30, opacity: fade };
    case "slide-down":
      return { scale: 1, translateY: (1 - e) * -30, opacity: fade };
    case "bounce": {
      const b = Math.sin(enter * Math.PI * 2) * (1 - enter) * 0.15;
      return { scale: 0.7 + 0.3 * enter + b, translateY: 0, opacity: fade };
    }
    case "wave":
      return { scale: 1, translateY: Math.sin(performance.now() / 200) * 4, opacity: fade };
    case "typewriter":
      return { scale: 1, translateY: 0, opacity: enter * exit };
    case "none":
    default:
      return { scale: 1, translateY: 0, opacity: 1 };
  }
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function waitForVideoReady(video: HTMLVideoElement, readyState: number, event: string) {
  if (video.readyState >= readyState) {
    return Promise.resolve();
  }

  return waitForVideoEvent(video, event);
}

function waitForVideoEvent(video: HTMLVideoElement, event: string) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener(event, onResolve);
      video.removeEventListener("error", onError);
    };

    const onResolve = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error(`Video export failed while waiting for ${event}.`));
    };

    video.addEventListener(event, onResolve, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

function getSupportedMimeType() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4;codecs=h264,aac",
    "video/mp4",
  ];

  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || "";
}
