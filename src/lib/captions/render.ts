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

export function computeExportResolution(
  srcW: number,
  srcH: number,
  quality?: "standard" | "high",
  output?: { width?: number; height?: number }
): { width: number; height: number } {
  let width = output?.width && output.width > 0 ? Math.round(output.width) : srcW;
  let height = output?.height && output.height > 0 ? Math.round(output.height) : srcH;

  if (quality) {
    const targetShortDim = quality === "high" ? 1080 : 720;
    const ar = (output?.width && output?.height && output.width > 0 && output.height > 0)
      ? (output.width / output.height)
      : (srcW / srcH);

    if (ar >= 1) {
      // Landscape or Square: Shorter dimension is height
      height = targetShortDim;
      width = Math.round(targetShortDim * ar);
    } else {
      // Portrait: Shorter dimension is width
      width = targetShortDim;
      height = Math.round(targetShortDim / ar);
    }
    // Ensure dimensions are even numbers (critical for encoding compatibility)
    if (width % 2 !== 0) width += 1;
    if (height % 2 !== 0) height += 1;
  }

  return { width, height };
}

export function computeTimelineFrames(
  duration: number,
  fps = 30
): { timestamps: number[]; totalFrames: number } {
  const safeDuration = Math.max(0.001, duration);
  const totalFrames = Math.max(1, Math.ceil(safeDuration * fps));
  const timestamps: number[] = [];

  if (totalFrames === 1) {
    timestamps.push(0);
    return { timestamps, totalFrames: 1 };
  }

  for (let i = 0; i < totalFrames; i++) {
    if (i === 0) {
      timestamps.push(0);
    } else if (i === totalFrames - 1) {
      timestamps.push(safeDuration);
    } else {
      const t = Number((i / fps).toFixed(6));
      timestamps.push(Math.min(t, safeDuration));
    }
  }

  return { timestamps, totalFrames };
}

export function seekVideoToTime(
  video: HTMLVideoElement,
  targetTime: number,
  timeoutMs = 4000
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined" || typeof video.addEventListener !== "function") {
      resolve();
      return;
    }

    // If targetTime is already matching current time and readyState is usable
    if (Math.abs(video.currentTime - targetTime) < 0.0005 && video.readyState >= 2) {
      resolve();
      return;
    }

    let settled = false;
    let timer: number | null = null;

    const cleanup = () => {
      if (timer !== null) window.clearTimeout(timer);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };

    const done = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const onError = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Video playback/seek error during export."));
    };

    const onSeeked = () => {
      done();
    };

    timer = window.setTimeout(() => {
      if (video.readyState >= 2) {
        done();
      } else {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error(`Seeking video to ${targetTime.toFixed(3)}s timed out.`));
      }
    }, timeoutMs);

    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });

    try {
      video.currentTime = targetTime;
    } catch (err) {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    }
  });
}

export async function burnCaptions(opts: {
  videoFile: File;
  captions: Caption[];
  style: CaptionStyle;
  output?: ExportOutput;
  quality?: "standard" | "high";
  fps?: number;
  onProgress?: RenderProgress;
  onLog?: (msg: string) => void;
  signal?: AbortSignal;
}): Promise<Blob> {
  const { videoFile, captions, style, output, quality, fps, onProgress, onLog, signal } = opts;

  if (signal?.aborted) throw new ExportCancelledError();

  if (typeof MediaRecorder === "undefined") {
    throw new Error("This browser does not support video export.");
  }

  const FPS = fps ?? (quality === "high" ? 30 : 24);
  const FRAME_STALL_TIMEOUT_MS = 25000;

  const videoUrl = URL.createObjectURL(videoFile);
  const video = document.createElement("video");
  const canvas = document.createElement("canvas");

  let recorder: MediaRecorder | null = null;
  let outputStream: MediaStream | null = null;
  let canvasStream: MediaStream | null = null;
  let watchdogId: number | null = null;
  let isCleanedUp = false;

  const cleanup = async () => {
    if (isCleanedUp) return;
    isCleanedUp = true;

    if (watchdogId !== null) {
      window.clearInterval(watchdogId);
      watchdogId = null;
    }

    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // ignore
      }
    }

    try {
      outputStream?.getTracks().forEach((track) => {
        try { track.stop(); } catch { /* ignore */ }
      });
      canvasStream?.getTracks().forEach((track) => {
        try { track.stop(); } catch { /* ignore */ }
      });
    } catch {
      // ignore
    }

    try {
      video.pause();
      video.removeAttribute("src");
      video.load();
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
    } catch {
      // ignore
    }

    try {
      URL.revokeObjectURL(videoUrl);
    } catch {
      // ignore
    }
  };

  try {
    video.src = videoUrl;
    video.preload = "auto";
    video.playsInline = true;
    video.muted = false;
    video.volume = 1;
    video.crossOrigin = "anonymous";

    // Keep active offscreen to prevent browser playback throttling
    video.style.position = "absolute";
    video.style.width = "1px";
    video.style.height = "1px";
    video.style.opacity = "0.001";
    video.style.pointerEvents = "none";
    video.style.top = "0";
    video.style.left = "0";
    document.body.appendChild(video);

    video.load();

    await waitForVideoReady(video, 1, "loadedmetadata");
    await waitForVideoReady(video, 3, "canplay");

    if (signal?.aborted) throw new ExportCancelledError();

    // Ensure custom caption fonts are fully loaded before capturing any frames
    if (typeof document !== "undefined" && "fonts" in document) {
      try {
        await (document as Document & { fonts: FontFaceSet }).fonts.ready;
        const fontFamilies = new Set<string>();
        if (style.fontFamily) fontFamilies.add(style.fontFamily);
        captions.forEach((c) => {
          if (c.style?.fontFamily) fontFamilies.add(c.style.fontFamily);
        });
        for (const font of fontFamilies) {
          try {
            await (document as Document & { fonts: FontFaceSet }).fonts.load(`16px "${font}"`);
          } catch {
            // ignore individual font load error
          }
        }
      } catch (fontErr) {
        onLog?.(`[Export] Font loading issue ignored: ${fontErr instanceof Error ? fontErr.message : String(fontErr)}`);
      }
    }

    const srcW = video.videoWidth || 1280;
    const srcH = video.videoHeight || 720;
    const duration = Math.max(video.duration || 0, 0.001);

    const { width, height } = computeExportResolution(srcW, srcH, quality, output);
    const fit = output?.fit ?? "cover";
    const bg = output?.background ?? "#000000";
    const drawRect = computeDrawRect(srcW, srcH, width, height, fit);

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not prepare export canvas.");
    }

    // Feature detection: verify if deterministic CanvasCaptureMediaStreamTrack.requestFrame is supported
    const supportsDeterministicTrack =
      typeof (canvas as unknown as { captureStream?: (fps?: number) => MediaStream }).captureStream === "function" &&
      (() => {
        try {
          const testStream = canvas.captureStream(0);
          const track = testStream.getVideoTracks()[0];
          const hasReq = track && typeof (track as unknown as { requestFrame?: () => void }).requestFrame === "function";
          testStream.getTracks().forEach((t) => t.stop());
          return Boolean(hasReq);
        } catch {
          return false;
        }
      })();

    canvasStream = supportsDeterministicTrack
      ? canvas.captureStream(0)
      : (canvas.captureStream ? canvas.captureStream(FPS) : (canvas as unknown as { mozCaptureStream: (fps: number) => MediaStream }).mozCaptureStream(FPS));

    const videoTrack = canvasStream.getVideoTracks()[0] as unknown as { requestFrame?: () => void } | undefined;
    outputStream = new MediaStream([...canvasStream.getVideoTracks()]);
    const hasAudio = false;

    const renderQuality = quality ?? "standard";
    const videoBitsPerSecond = renderQuality === "high" ? 8_000_000 : 4_000_000;
    const mimeType = getExportMimeType();

    recorder = mimeType
      ? new MediaRecorder(outputStream, { mimeType, videoBitsPerSecond })
      : new MediaRecorder(outputStream, { videoBitsPerSecond });

    const chunks: BlobPart[] = [];
    let lastRecorderActivity = performance.now();

    const result = new Promise<Blob>((resolve, reject) => {
      recorder!.ondataavailable = (event) => {
        lastRecorderActivity = performance.now();
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder!.onerror = () => reject(new Error("Video recorder encountered an error during export."));
      recorder!.onstop = () => {
        const finalType = recorder?.mimeType || mimeType || "video/webm";
        const blob = new Blob(chunks, { type: finalType });
        if (!blob.size) {
          reject(new Error("Export failed to produce valid video data."));
          return;
        }
        resolve(blob);
      };
    });

    // Preload media overlays
    const mediaImageMap = new Map<string, HTMLImageElement>();
    await Promise.all(
      captions
        .filter((c) => c.mediaUrl && c.mediaType !== "video")
        .map(
          (c) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => {
                mediaImageMap.set(c.id, img);
                resolve();
              };
              img.onerror = () => resolve();
              img.src = c.mediaUrl!;
            })
        )
    );

    const { timestamps, totalFrames } = computeTimelineFrames(duration, FPS);

    // Diagnostics
    onLog?.(`[Export] source: ${srcW}x${srcH}`);
    onLog?.(`[Export] duration: ${duration.toFixed(2)}s`);
    onLog?.(`[Export] fps: ${FPS}`);
    onLog?.(`[Export] frames: ${totalFrames}`);
    onLog?.(`[Export] codec: ${mimeType || "default"}`);
    onLog?.(`[Export] audio: ${hasAudio ? "enabled" : "none"}`);
    onLog?.(`[Export] rendering started`);

    recorder.start(250);

    let lastProgressTime = performance.now();
    let lastRenderedFrame = -1;
    let lastRenderedTimestamp = 0;

    // Progress-based watchdog detecting genuine deadlocks rather than slow frames
    watchdogId = window.setInterval(() => {
      if (signal?.aborted) {
        cleanup();
        return;
      }
      const now = performance.now();
      if (now - lastProgressTime > FRAME_STALL_TIMEOUT_MS && now - lastRecorderActivity > FRAME_STALL_TIMEOUT_MS) {
        cleanup();
        throw new Error(
          `Export stalled at frame ${lastRenderedFrame + 1}/${totalFrames} (${lastRenderedTimestamp.toFixed(2)}s). ` +
          "Video decoding took too long or the browser stalled."
        );
      }
    }, 1000);

    const renderCanvasAtTime = (currentTime: number) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(video, drawRect.x, drawRect.y, drawRect.w, drawRect.h);
      drawCaptionOverlay(ctx, captions, style, width, height, currentTime, mediaImageMap);
    };

    let lastProgressEmit = 0;
    const progressThrottleMs = 120; // emit React progress at most ~8 times/sec to prevent main-thread lag

    // Deterministic frame capture loop
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (signal?.aborted) throw new ExportCancelledError();

      const targetTime = timestamps[frameIndex];
      await seekVideoToTime(video, targetTime, 5000);

      renderCanvasAtTime(targetTime);

      if (supportsDeterministicTrack && videoTrack && typeof videoTrack.requestFrame === "function") {
        videoTrack.requestFrame();
      }

      lastRenderedFrame = frameIndex;
      lastRenderedTimestamp = targetTime;
      const now = performance.now();
      lastProgressTime = now;

      const isFirstOrLast = frameIndex === 0 || frameIndex === totalFrames - 1;
      if (isFirstOrLast || (now - lastProgressEmit >= progressThrottleMs)) {
        lastProgressEmit = now;
        const progress = clamp((frameIndex + 1) / totalFrames, 0, 1);
        onProgress?.({
          progress,
          message: `Rendering frame ${frameIndex + 1}/${totalFrames}`,
        });
      }

      if (frameIndex === 0 || frameIndex === totalFrames - 1 || frameIndex % Math.max(1, Math.floor(totalFrames / 10)) === 0) {
        const progress = clamp((frameIndex + 1) / totalFrames, 0, 1);
        onLog?.(`[Export] progress: ${Math.round(progress * 100)}% (frame ${frameIndex + 1}/${totalFrames})`);
      }

      if (!supportsDeterministicTrack) {
        await new Promise((r) => setTimeout(r, Math.max(16, 1000 / FPS)));
      } else {
        // Micro-yield allowing the browser's MediaRecorder worker to cleanly encode each frame
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    onLog?.(`[Export] rendering completed`);
    onProgress?.({ progress: 1, message: "Finalizing export" });

    // Allow MediaRecorder to capture and commit the final frame chunk
    await new Promise((r) => setTimeout(r, 100));

    if (recorder.state !== "inactive") {
      recorder.stop();
      onLog?.(`[Export] recorder stopped`);
    }

    const finalBlob = await result;
    return finalBlob;
  } finally {
    await cleanup();
  }
}

function drawCinematicStacked(
  ctx: CanvasRenderingContext2D,
  active: Caption,
  activeStyle: CaptionStyle,
  width: number,
  height: number,
  time: number,
) {
  let lines = active.text.split("\n");
  if (lines.length === 1) {
    const words = active.text.split(" ");
    if (words.length >= 3) {
      const mid = Math.max(1, Math.floor(words.length / 2));
      lines = [
        words.slice(0, mid - 1).join(" ") || "GREETINGS FROM",
        words[mid - 1] || "CINEMATIC",
        words.slice(mid).join(" ") || "MAKE IT SIMPLE, BUT SIGNIFICANT."
      ];
    } else {
      lines = ["", active.text, ""];
    }
  }

  // Animation calculation
  const enter = clamp((time - active.start) / 0.35, 0, 1);
  const exit = clamp((active.end - time) / 0.25, 0, 1);
  const anim = computeAnim(activeStyle.animation, enter, exit);

  // Layout parameters
  const posX = active.x ?? 0.5;
  const posY = active.y ?? activeStyle.posY;
  const center = { x: width * posX, y: height * posY };

  ctx.save();
  ctx.globalAlpha = anim.opacity;
  ctx.translate(center.x, center.y);
  if (anim.scale !== 1) ctx.scale(anim.scale, anim.scale);
  if (anim.translateY) ctx.translate(0, anim.translateY * (height / 1080));

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Line 1: GREETINGS FROM (small, yellow/amber)
  const size1 = clamp(Math.round((22 / 1080) * height), 12, 45);
  ctx.font = `700 ${size1}px "Outfit", "Inter", sans-serif`;
  ctx.fillStyle = "#fbbf24";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  const line1Text = lines[0] ? lines[0].toUpperCase() : "";
  ctx.fillText(line1Text, 0, -size1 * 2);

  // Line 2: CINEMATIC (large, italic, gold, serif)
  const size2 = clamp(Math.round((70 / 1080) * height), 24, 150);
  ctx.font = `italic 800 ${size2}px "Playfair Display", Georgia, serif`;
  ctx.fillStyle = "#ffd166";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  const line2Text = lines[1] ? lines[1].toUpperCase() : "";
  ctx.fillText(line2Text, 0, 0);

  // Line 3: MAKE IT SIMPLE, BUT SIGNIFICANT (medium, white)
  const size3 = clamp(Math.round((18 / 1080) * height), 10, 40);
  ctx.font = `600 ${size3}px "Outfit", "Inter", sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  const line3Text = lines[2] ? lines[2].toUpperCase() : "";
  ctx.fillText(line3Text, 0, size2 * 0.9);

  ctx.restore();
}

function drawMediaOverlay(
  ctx: CanvasRenderingContext2D,
  active: Caption,
  img: HTMLImageElement,
  width: number,
  height: number,
  time: number,
) {
  const posX = active.x ?? 0.5;
  const posY = active.y ?? 0.5;
  const boxWidthPct = active.width ?? (active.mediaType === "sticker" ? 22 : 36);
  const boxHeightPct = active.height ?? (active.mediaType === "sticker" ? 22 : 36);
  const drawW = width * (boxWidthPct / 100);
  const drawH = height * (boxHeightPct / 100);
  const centerX = width * posX;
  const centerY = height * posY;

  const enter = clamp((time - active.start) / 0.35, 0, 1);
  const exit = clamp((active.end - time) / 0.25, 0, 1);
  const anim = computeAnim(active.style?.animation || "pop", enter, exit);

  ctx.save();
  ctx.globalAlpha = anim.opacity;
  ctx.translate(centerX, centerY);
  if (anim.scale !== 1) ctx.scale(anim.scale, anim.scale);
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

function drawCaptionOverlay(
  ctx: CanvasRenderingContext2D,
  captions: Caption[],
  style: CaptionStyle,
  width: number,
  height: number,
  time: number,
  mediaImageMap?: Map<string, HTMLImageElement>,
) {
  const activeCaptions = captions.filter((caption) => time >= caption.start && time <= caption.end);
  if (activeCaptions.length === 0) return;

  activeCaptions.forEach((active) => {
    if (active.mediaUrl) {
      const img = mediaImageMap?.get(active.id);
      if (img) {
        drawMediaOverlay(ctx, active, img, width, height, time);
      }
      return;
    }

    const activeStyle = active.style ? { ...style, ...active.style } : style;
    const isCinematicStacked = Boolean(activeStyle.isCinematicStacked);
    if (isCinematicStacked) {
      drawCinematicStacked(ctx, active, activeStyle, width, height, time);
      return;
    }
    const fontSize = clamp(Math.round((activeStyle.fontSize / 1080) * height), 18, 160);
    const padX = Math.round(fontSize * 0.36);
    const padY = Math.round(fontSize * 0.24);
    const lineGap = Math.round(fontSize * 0.2);

    const boxWidth = active.width ?? activeStyle.boxWidth ?? 84;
    const boxHeight = active.height ?? activeStyle.boxHeight;

    const maxLineWidth = width * (boxWidth / 100);

    setCanvasFont(ctx, activeStyle, fontSize);
    const words = getRenderWords(ctx, active, activeStyle);
    const lines = wrapWords(words, maxLineWidth);
    const lineBoxHeight = fontSize + padY * 2;
    const textBlockHeight = lines.length * lineBoxHeight + Math.max(0, lines.length - 1) * lineGap;
    // If a custom boxHeight is set, the visible container is taller than the text block — centre text vertically.
    const containerHeight = boxHeight ? height * (boxHeight / 100) : textBlockHeight;
    const blockHeight = Math.max(textBlockHeight, containerHeight);
    const maxLineW = lines.reduce((m, l) => Math.max(m, l.width), 0);
    const blockWidth = maxLineW + padX * 2;

    // Compute anchor position
    const center = computeCenter(active, activeStyle, width, height, blockWidth, blockHeight);
    // Vertical offset so text is centred inside the container
    const textAreaTop = center.y - blockHeight / 2 + (blockHeight - textBlockHeight) / 2;
    const blockTop = textAreaTop;
    const blockCenterX = center.x;
    const alignLeftX = blockCenterX - maxLineW / 2;

    // Animation transform (origin = block center)
    const enter = clamp((time - active.start) / 0.35, 0, 1);
    const exit = clamp((active.end - time) / 0.25, 0, 1);
    const anim = computeAnim(activeStyle.animation, enter, exit);

    ctx.save();
    ctx.globalAlpha = anim.opacity;
    ctx.translate(blockCenterX, center.y);
    if (anim.scale !== 1) ctx.scale(anim.scale, anim.scale);
    if (anim.translateY) ctx.translate(0, anim.translateY * (height / 1080));
    ctx.translate(-blockCenterX, -center.y);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    const strokePx = Math.round((activeStyle.strokeWidth / 1080) * height);

    // Typewriter character budget
    const isTypewriter = activeStyle.animation === "typewriter";
    const elapsedMs = Math.max(0, (time - active.start) * 1000);
    const typewriterState = isTypewriter
      ? getTypewriterState(active.text, activeStyle, elapsedMs)
      : { text: active.text, showCursor: false };

    const charBudget = typewriterState.text.length;
    let charsDrawn = 0;
    let cursorDrawn = false;
    const isCursorVisible = typewriterState.showCursor && (Math.floor(time * 2) % 2 === 0);

    lines.forEach((line, lineIndex) => {
      let lineLeft = blockCenterX - line.width / 2;
      if (activeStyle.alignment === "left") {
        lineLeft = alignLeftX;
      } else if (activeStyle.alignment === "right") {
        lineLeft = alignLeftX + (maxLineW - line.width);
      }
      const lineTop = blockTop + lineIndex * (lineBoxHeight + lineGap);
      const baselineY = lineTop + padY + fontSize * 0.82;

      if (activeStyle.bgOpacity > 0) {
        ctx.save();
        ctx.fillStyle = hexToRgba(activeStyle.bgColor, activeStyle.bgOpacity);
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
        let textToDraw = word.text;
        let drawLen = word.text.length;

        if (isTypewriter) {
          const remaining = charBudget - charsDrawn;
          if (remaining <= 0) {
            return;
          }
          drawLen = Math.min(word.text.length, remaining);
          textToDraw = word.text.substring(0, drawLen);
        }

        const isActiveWord = activeStyle.karaoke && time >= word.start && time <= word.end;
        const isFutureWord = activeStyle.karaoke && time < word.start;
        const scale = isActiveWord ? 1.08 : 1;
        const fillColor = isActiveWord ? activeStyle.highlightColor : activeStyle.color;
        const alpha = isFutureWord ? 0.75 : 1;

        ctx.save();
        setCanvasFont(ctx, activeStyle, fontSize);

        const textWidth = ctx.measureText(textToDraw).width;

        // Stroke first
        if (strokePx > 0) {
          ctx.strokeStyle = activeStyle.strokeColor;
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
          ctx.strokeText(textToDraw, cursorX, baselineY);
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
          ? hexToRgba(activeStyle.highlightColor, 0.7)
          : "rgba(0, 0, 0, 0.55)";
        ctx.shadowBlur = isActiveWord ? Math.round(fontSize * 0.45) : Math.round(fontSize * 0.12);
        ctx.shadowOffsetY = 2;

        ctx.fillText(textToDraw, cursorX, baselineY);
        ctx.restore();

        if (isTypewriter) {
          if (drawLen < word.text.length && isCursorVisible && !cursorDrawn) {
            drawCursor(ctx, cursorX + textWidth, baselineY, fontSize, activeStyle.typewriterCursorColor || "#ff5c3a");
            cursorDrawn = true;
          }
          charsDrawn += word.text.length;
          if (charsDrawn === charBudget && isCursorVisible && !cursorDrawn) {
            drawCursor(ctx, cursorX + textWidth, baselineY, fontSize, activeStyle.typewriterCursorColor || "#ff5c3a");
            cursorDrawn = true;
          }
        }

        cursorX += word.width;
      });

      if (isTypewriter && charBudget === 0 && lineIndex === 0 && isCursorVisible && !cursorDrawn) {
        drawCursor(ctx, lineLeft, baselineY, fontSize, activeStyle.typewriterCursorColor || "#ff5c3a");
        cursorDrawn = true;
      }
    });

    ctx.restore();
  });
}

function computeCenter(
  caption: Caption,
  style: CaptionStyle,
  width: number,
  height: number,
  blockWidth: number,
  blockHeight: number,
): { x: number; y: number } {
  const posX = caption.x ?? (style.position === "top" ? 0.5 : style.position === "middle" ? 0.5 : style.posX);
  const posY = caption.y ?? (style.position === "top" ? 0.12 : style.position === "middle" ? 0.5 : style.posY);

  const basePos = {
    x: clamp(posX * width, 0.05 * width, 0.95 * width),
    y: clamp(posY * height, 0.05 * height, 0.95 * height),
  };

  if (caption.track && caption.track > 1 && caption.y === undefined) {
    return {
      x: basePos.x,
      y: clamp(basePos.y - height * (caption.track - 1) * 0.15, 0.05 * height, 0.95 * height),
    };
  }
  return basePos;
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
  const hasRealWords = Array.isArray(caption.words) && caption.words.length > 0;
  const sourceWords = hasRealWords
    ? caption.words!
        .map((word) => ({
          text: (word.text || "").trim(),
          start: typeof word.start === "number" ? word.start : caption.start,
          end: typeof word.end === "number" ? word.end : caption.end,
        }))
        .filter((w) => w.text.length > 0)
    : (() => {
        const tokens = splitIntoWordTokens(caption.text)
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
        const safeTokens = tokens.length > 0 ? tokens : [caption.text.trim() || ""];
        const duration = Math.max(0.1, caption.end - caption.start);
        const wordDur = duration / safeTokens.length;
        return safeTokens.map((text, idx) => ({
          text,
          start: caption.start + idx * wordDur,
          end: caption.start + (idx + 1) * wordDur,
        }));
      })();

  return sourceWords.map((word, idx) => {
    let text = style.uppercase ? word.text.toUpperCase() : word.text;
    const isCJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(caption.text);
    // Append a single trailing space between words for clean horizontal flow (skip for CJK)
    if (!isCJK && idx < sourceWords.length - 1 && !text.endsWith(" ")) {
      text += " ";
    }
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


function computeAnim(
  anim: CaptionStyle["animation"],
  enter: number,
  exit: number,
): { scale: number; translateY: number; opacity: number } {
  const e = easeOutBack(enter);
  const ex = easeOutBack(exit);
  const fade = Math.min(enter * 1.5, 1) * Math.min(exit * 1.5, 1);
  switch (anim) {
    case "zoom-in":
      return { scale: (0.5 + 0.5 * e) * (0.5 + 0.5 * ex), translateY: 0, opacity: fade };
    case "zoom-out":
      return { scale: (1.5 - 0.5 * e) * (1.5 - 0.5 * ex), translateY: 0, opacity: fade };
    case "pop":
      return { scale: (0.7 + 0.3 * e) * (0.7 + 0.3 * ex), translateY: 0, opacity: fade };
    case "fade":
      return { scale: 1, translateY: 0, opacity: enter * exit };
    case "slide-up":
      return { scale: 1, translateY: (1 - e) * 30 + (1 - ex) * -30, opacity: fade };
    case "slide-down":
      return { scale: 1, translateY: (1 - e) * -30 + (1 - ex) * 30, opacity: fade };
    case "bounce": {
      const b = Math.sin(enter * Math.PI * 2) * (1 - enter) * 0.15;
      return { scale: (0.7 + 0.3 * enter + b) * ex, translateY: 0, opacity: fade };
    }
    case "wave":
      return { scale: 1, translateY: Math.sin(performance.now() / 200) * 4, opacity: fade };
    case "typewriter":
      return { scale: 1, translateY: 0, opacity: exit };
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

export function getExportMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";

  const priorityList = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4;codecs=h264,aac",
    "video/mp4",
  ];

  for (const mime of priorityList) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    } catch {
      // Continue to next codec
    }
  }

  return "";
}

export function getSupportedMimeType(): string {
  return getExportMimeType();
}

export function computeDrawRect(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  fit: "cover" | "contain",
): { x: number; y: number; w: number; h: number } {
  if (srcW <= 0 || srcH <= 0) return { x: 0, y: 0, w: dstW, h: dstH };
  const srcAR = srcW / srcH;
  const dstAR = dstW / dstH;
  let w: number;
  let h: number;
  if (fit === "cover") {
    if (srcAR > dstAR) {
      // Source wider — match height, crop sides.
      h = dstH;
      w = h * srcAR;
    } else {
      w = dstW;
      h = w / srcAR;
    }
  } else {
    // contain: letterbox
    if (srcAR > dstAR) {
      w = dstW;
      h = w / srcAR;
    } else {
      h = dstH;
      w = h * srcAR;
    }
  }
  return { x: (dstW - w) / 2, y: (dstH - h) / 2, w, h };
}

function drawCursor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fontSize: number,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const cursorH = fontSize * 1.15;
  const cursorW = Math.max(2, Math.round(fontSize * 0.08));
  ctx.fillRect(x + 1, y - fontSize * 0.95, cursorW, cursorH);
  ctx.restore();
}

function getTypewriterState(text: string, style: CaptionStyle, elapsedMs: number) {
  const L = text.length;
  const speed = style.typewriterSpeed || 80;
  const delSpeed = style.typewriterDeleteSpeed || 40;
  const delay = style.typewriterDelay || 1500;
  const loop = style.typewriterLoop !== false;
  const emptyPause = 500;

  const typeTime = L * speed;
  const deleteTime = L * delSpeed;
  const cycleTime = typeTime + delay + deleteTime + emptyPause;

  let charCount = L;
  let showCursor = true;

  if (loop) {
    const t = elapsedMs % cycleTime;
    if (t < typeTime) {
      charCount = Math.floor(t / speed);
    } else if (t < typeTime + delay) {
      charCount = L;
    } else if (t < typeTime + delay + deleteTime) {
      const elapsedDelete = t - (typeTime + delay);
      const deletedChars = Math.floor(elapsedDelete / delSpeed);
      charCount = Math.max(0, L - deletedChars);
    } else {
      charCount = 0;
      showCursor = false;
    }
  } else {
    if (elapsedMs < typeTime) {
      charCount = Math.floor(elapsedMs / speed);
    } else {
      charCount = L;
    }
  }

  return {
    text: text.slice(0, charCount),
    showCursor,
  };
}
