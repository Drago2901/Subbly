import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Pencil, Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import type { Caption, CaptionStyle, CaptionAnimation } from "@/lib/captions/types";

type Props = {
  src: string;
  captions: Caption[];
  style: CaptionStyle;
  selectedCaptionId?: string | null;
  onSelect?: (id: string | null) => void;
  onTimeUpdate?: (t: number) => void;
  onLoaded?: (info: { width: number; height: number; duration: number }) => void;
  onCaptionStyleChange?: (id: string, style: Partial<CaptionStyle>) => void;
  onCaptionChange?: (id: string, text: string) => void;
  onCaptionPositionChange?: (id: string, patch: Partial<Caption>) => void;
  frame?: { width: number; height: number; fit: "cover" | "contain" } | null;
  lockedTracks?: number[];
  quality?: "standard" | "high";
};

export const VideoPreview = forwardRef<HTMLVideoElement, Props>(function VideoPreview(
  {
    src,
    captions,
    style,
    selectedCaptionId,
    onSelect,
    onTimeUpdate,
    onLoaded,
    onCaptionStyleChange,
    onCaptionChange,
    onCaptionPositionChange,
    frame,
    lockedTracks,
    quality = "standard",
  },
  ref,
) {
  const innerRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => innerRef.current as HTMLVideoElement, []);
  const [time, setTime] = useState(0);
  const [draggingCaptionId, setDraggingCaptionId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizing, setResizing] = useState<{
    id: string;
    edge: "top" | "bottom" | "left" | "right";
    startPosX: number;
    startPosY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [videoRatio, setVideoRatio] = useState<number | null>(null);
  const activeCaptions = captions.filter((c) => time >= c.start && time <= c.end);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  // Sync state with HTML5 video element events
  useEffect(() => {
    const v = innerRef.current;
    if (!v) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onVolumeChange = () => {
      setVolume(v.volume);
      setIsMuted(v.muted);
    };
    const onLoadedMetadata = () => {
      setDuration(v.duration || 0);
    };

    setIsPlaying(!v.paused);
    setVolume(v.volume);
    setIsMuted(v.muted);
    setDuration(v.duration || 0);

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("volumechange", onVolumeChange);
    v.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("volumechange", onVolumeChange);
      v.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [src]);

  useEffect(() => {
    setTime(0);
    setVideoRatio(null);
  }, [src]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = innerRef.current;
      if (v && !v.paused && !v.ended) {
        setTime(v.currentTime);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Track fullscreen state of the preview container (so captions render in fullscreen).
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const [dimensions, setDimensions] = useState({ width: 640, height: 360 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setDimensions({
      width: container.clientWidth || 640,
      height: container.clientHeight || 360,
    });

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [src, isFullscreen]);

  // Controls visibility and auto-hide timer
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);

  const triggerControlsShow = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      const v = innerRef.current;
      if (v && !v.paused) {
        setShowControls(false);
      }
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Custom progress bar seeking scrubbing logic
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [scrubbing, setScrubbing] = useState(false);

  const handleScrub = (clientX: number) => {
    const el = scrubberRef.current;
    if (!el || duration === 0) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = pct * duration;
    setTime(newTime);
    if (innerRef.current) {
      innerRef.current.currentTime = newTime;
    }
  };

  useEffect(() => {
    if (!scrubbing) return;
    const onMove = (e: PointerEvent) => {
      handleScrub(e.clientX);
    };
    const onUp = () => setScrubbing(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrubbing, duration]);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      /* ignore */
    }
  };

  // Free position drag handlers
  useEffect(() => {
    if (!draggingCaptionId) return;
    const onMove = (e: PointerEvent) => {
      const c = canvasRef.current;
      if (!c) return;
      const rect = c.getBoundingClientRect();
      const x = (e.clientX - dragOffset.x - rect.left) / rect.width;
      const y = (e.clientY - dragOffset.y - rect.top) / rect.height;
      onCaptionPositionChange?.(draggingCaptionId, {
        x: Math.max(0.05, Math.min(0.95, x)),
        y: Math.max(0.05, Math.min(0.95, y)),
        style: {
          position: "free"
        }
      });
    };
    const onUp = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target && typeof target.releasePointerCapture === "function") {
        try {
          target.releasePointerCapture(e.pointerId);
        } catch { /* ignore */ }
      }
      setDraggingCaptionId(null);
    };
    const onCancel = () => setDraggingCaptionId(null);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [draggingCaptionId, onCaptionPositionChange, dragOffset]);

  const captionBoxRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleResizeStart = (
    e: React.PointerEvent<HTMLDivElement>,
    id: string,
    edge: "top" | "bottom" | "left" | "right"
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const targetCaption = captions.find((c) => c.id === id);
    const track = targetCaption ? (targetCaption.track || 1) : 1;
    if (lockedTracks?.includes(track)) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const captionEl = captionBoxRefs.current.get(id);
    if (!captionEl) return;

    const canvasRect = canvas.getBoundingClientRect();
    const captionRect = captionEl.getBoundingClientRect();

    const startWidth = (captionRect.width / canvasRect.width) * 100;
    const startHeight = (captionRect.height / canvasRect.height) * 100;

    const startPosX = ((captionRect.left + captionRect.width / 2) - canvasRect.left) / canvasRect.width;
    const startPosY = ((captionRect.top + captionRect.height / 2) - canvasRect.top) / canvasRect.height;

    setResizing({
      id,
      edge,
      startPosX,
      startPosY,
      startWidth,
      startHeight,
    });
  };

  // Resize width & height handlers
  useEffect(() => {
    if (!resizing) return;

    const onMove = (e: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const pointerX = (e.clientX - rect.left) / rect.width;
      const pointerY = (e.clientY - rect.top) / rect.height;

      // Calculate original bounds in normalized coordinates (0..1)
      const leftLimit = resizing.startPosX - resizing.startWidth / 200;
      const rightLimit = resizing.startPosX + resizing.startWidth / 200;
      const topLimit = resizing.startPosY - resizing.startHeight / 200;
      const bottomLimit = resizing.startPosY + resizing.startHeight / 200;

      let newWidth = resizing.startWidth;
      let newHeight = resizing.startHeight;
      let newPosX = resizing.startPosX;
      let newPosY = resizing.startPosY;

      const minWidthPercent = 10;
      const minHeightPercent = 5;

      if (resizing.edge === "right") {
        const clampedPointerX = Math.max(leftLimit + minWidthPercent / 100, Math.min(1.0, pointerX));
        newWidth = (clampedPointerX - leftLimit) * 100;
        newPosX = (leftLimit + clampedPointerX) / 2;
      } else if (resizing.edge === "left") {
        const clampedPointerX = Math.max(0.0, Math.min(rightLimit - minWidthPercent / 100, pointerX));
        newWidth = (rightLimit - clampedPointerX) * 100;
        newPosX = (clampedPointerX + rightLimit) / 2;
      } else if (resizing.edge === "bottom") {
        const clampedPointerY = Math.max(topLimit + minHeightPercent / 100, Math.min(1.0, pointerY));
        newHeight = (clampedPointerY - topLimit) * 100;
        newPosY = (topLimit + clampedPointerY) / 2;
      } else if (resizing.edge === "top") {
        const clampedPointerY = Math.max(0.0, Math.min(bottomLimit - minHeightPercent / 100, pointerY));
        newHeight = (bottomLimit - clampedPointerY) * 100;
        newPosY = (clampedPointerY + bottomLimit) / 2;
      }

      onCaptionPositionChange?.(resizing.id, {
        x: Math.max(0.05, Math.min(0.95, newPosX)),
        y: Math.max(0.05, Math.min(0.95, newPosY)),
        width: Math.max(minWidthPercent, Math.min(100, newWidth)),
        height: Math.max(minHeightPercent, Math.min(100, newHeight)),
        style: {
          position: "free"
        }
      });
    };

    const onUp = () => {
      setResizing(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [resizing, onCaptionPositionChange]);

  // Override native video element fullscreen requests
  useEffect(() => {
    const video = innerRef.current;
    if (!video) return;

    interface FullscreenElement extends HTMLElement {
      webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
      mozRequestFullScreen?: (options?: FullscreenOptions) => Promise<void>;
      msRequestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
    }

    interface FullscreenVideo extends HTMLVideoElement {
      webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
      webkitEnterFullscreen?: (options?: FullscreenOptions) => Promise<void>;
      webkitEnterFullScreen?: (options?: FullscreenOptions) => Promise<void>;
      mozRequestFullScreen?: (options?: FullscreenOptions) => Promise<void>;
      msRequestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
    }

    const customRequestFs = function (this: HTMLVideoElement, options?: FullscreenOptions) {
      const el = containerRef.current as FullscreenElement | null;
      if (!el) return Promise.reject(new Error("No container"));

      if (el.requestFullscreen) {
        return el.requestFullscreen(options);
      } else if (el.webkitRequestFullscreen) {
        return el.webkitRequestFullscreen(options);
      } else if (el.mozRequestFullScreen) {
        return el.mozRequestFullScreen(options);
      } else if (el.msRequestFullscreen) {
        return el.msRequestFullscreen(options);
      }
      return Promise.reject(new Error("Fullscreen not supported on container"));
    };

    const fsVideo = video as FullscreenVideo;
    fsVideo.requestFullscreen = customRequestFs;
    fsVideo.webkitRequestFullscreen = customRequestFs;
    fsVideo.webkitEnterFullscreen = customRequestFs;
    fsVideo.webkitEnterFullScreen = customRequestFs;
    fsVideo.mozRequestFullScreen = customRequestFs;
    fsVideo.msRequestFullscreen = customRequestFs;
  }, []);

  const startEditing = (c: Caption) => {
    setEditText(c.text);
    setEditingCaptionId(c.id);
  };

  const commitEdit = () => {
    if (editingCaptionId && onCaptionChange) onCaptionChange(editingCaptionId, editText);
    setEditingCaptionId(null);
  };

  const isFree = style.position === "free";

  const alignmentClass =
    style.alignment === "left" ? "text-left items-start justify-start" :
    style.alignment === "right" ? "text-right items-end justify-end" :
    "text-center items-center justify-center";

  const targetRatio = frame
    ? (frame.width / frame.height)
    : (videoRatio || 16 / 9);

  let canvasWidth = dimensions.width;
  let canvasHeight = dimensions.width / targetRatio;
  if (canvasHeight > dimensions.height) {
    canvasHeight = dimensions.height;
    canvasWidth = dimensions.height * targetRatio;
  }

  const objectFit: "cover" | "contain" = frame?.fit ?? "contain";

  return (
    <div
      ref={containerRef}
      onPointerMove={triggerControlsShow}
      className={`group/preview relative mx-auto overflow-hidden bg-black flex items-center justify-center ${
        isFullscreen ? "h-full rounded-none" : "w-full h-full rounded-xl shadow-elegant"
      }`}
      style={{
        width: "100%",
        height: "100%",
        maxWidth: "100%",
        maxHeight: "100%",
      }}
    >
      {/* Resolution Badge */}
      <div className="absolute top-3 right-3 z-50 pointer-events-none select-none">
        <span className="px-2 py-1 text-[10px] font-bold tracking-wider text-white/90 bg-black/60 backdrop-blur-sm rounded border border-white/10 uppercase">
          {quality === "high" ? "1080p" : "720p"}
        </span>
      </div>
      <div
        ref={canvasRef}
        className="relative flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === "VIDEO") {
            if (innerRef.current) {
              if (isPlaying) innerRef.current.pause();
              else innerRef.current.play();
            }
          }
        }}
      >
      <video
        ref={innerRef}
        src={src}
        className="block h-full w-full"
        style={{ objectFit }}
        playsInline
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFullscreen();
        }}
        onTimeUpdate={(e) => {
          const t = (e.target as HTMLVideoElement).currentTime;
          setTime(t);
          onTimeUpdate?.(t);
        }}
        onLoadedMetadata={(e) => {
          const v = e.target as HTMLVideoElement;
          if (v.videoWidth && v.videoHeight) {
            setVideoRatio(v.videoWidth / v.videoHeight);
          }
          onLoaded?.({
            width: v.videoWidth,
            height: v.videoHeight,
            duration: v.duration,
          });
        }}
      />

      {/* Custom player controls bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex flex-col gap-1.5 z-50 transition-opacity duration-300 pointer-events-auto ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Timeline Progress Scrubber */}
        <div
          ref={scrubberRef}
          onPointerDown={(e) => {
            e.stopPropagation();
            setScrubbing(true);
            handleScrub(e.clientX);
          }}
          className="group/scrub relative w-full h-3 flex items-center cursor-pointer animate-fade-in"
        >
          {/* Track background */}
          <div className="w-full h-1 bg-white/20 rounded-full group-hover/scrub:h-1.5 transition-all" />

          {/* Fill progress */}
          <div
            className="absolute left-0 h-1 bg-primary rounded-full group-hover/scrub:h-1.5 transition-all pointer-events-none"
            style={{ width: `${duration > 0 ? (time / duration) * 100 : 0}%` }}
          />

          {/* Draggable indicator knob */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md scale-0 group-hover/scrub:scale-100 transition-transform pointer-events-none"
            style={{ left: `${duration > 0 ? (time / duration) * 100 : 0}%` }}
          />
        </div>

        {/* Playback Actions Row */}
        <div className="flex items-center justify-between text-white text-[12.5px] px-0.5 select-none">
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (innerRef.current) {
                  if (isPlaying) innerRef.current.pause();
                  else innerRef.current.play();
                }
              }}
              className="hover:scale-110 active:scale-95 transition-transform p-0.5 cursor-pointer"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-4.5 w-4.5 fill-white text-white" />
              ) : (
                <Play className="h-4.5 w-4.5 fill-white text-white" />
              )}
            </button>

            {/* Time display */}
            <span className="font-mono text-[11px] select-none text-white/80">
              {formatTime(time)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Mute/Volume controls */}
            <div className="flex items-center gap-1.5 group/volume">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (innerRef.current) {
                    innerRef.current.muted = !isMuted;
                  }
                }}
                className="hover:scale-115 active:scale-95 transition-transform p-0.5 cursor-pointer"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="h-4.5 w-4.5 text-white" />
                ) : (
                  <Volume2 className="h-4.5 w-4.5 text-white" />
                )}
              </button>
              
              <input
                type="range"
                aria-label="Volume"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  e.stopPropagation();
                  const v = Number(e.target.value);
                  if (innerRef.current) {
                    innerRef.current.volume = v;
                    innerRef.current.muted = v === 0;
                  }
                }}
                className="w-0 group-hover/volume:w-16 h-1 rounded-full bg-white/20 accent-primary cursor-pointer transition-all duration-300 opacity-0 group-hover/volume:opacity-100"
              />
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="hover:scale-115 active:scale-95 transition-transform p-0.5 cursor-pointer"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="h-4.5 w-4.5 text-white" />
              ) : (
                <Maximize className="h-4.5 w-4.5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {activeCaptions.map((activeItem) => {
        const isEditing = editingCaptionId === activeItem.id;
        const itemStyle = activeItem.style ? { ...style, ...activeItem.style } : style;
        
        const posX = activeItem.x ?? (itemStyle.position === "top" ? 0.5 : itemStyle.position === "middle" ? 0.5 : itemStyle.posX);
        let posY = activeItem.y ?? (itemStyle.position === "top" ? 0.12 : itemStyle.position === "middle" ? 0.5 : itemStyle.posY);
        if (activeItem.track && activeItem.track > 1 && activeItem.y === undefined) {
          posY = Math.max(0.05, posY - (activeItem.track - 1) * 0.15);
        }

        const boxWidth = activeItem.width ?? itemStyle.boxWidth ?? 84;
        const boxHeight = activeItem.height ?? itemStyle.boxHeight;

        const animProgress = Math.min(1, (time - activeItem.start) / 0.35);
        const exitProgress = Math.max(0, Math.min(1, (activeItem.end - time) / 0.25));
        const isSelected = selectedCaptionId === activeItem.id;

        return (
          <div
            key={activeItem.id}
            ref={(el) => {
              if (el) captionBoxRefs.current.set(activeItem.id, el);
              else captionBoxRefs.current.delete(activeItem.id);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onSelect?.(activeItem.id);
              if (isEditing) return;

              const cTrack = activeItem.track || 1;
              if (lockedTracks?.includes(cTrack)) {
                return;
              }

              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);

              const rect = e.currentTarget.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              setDragOffset({
                x: e.clientX - centerX,
                y: e.clientY - centerY,
              });

              setDraggingCaptionId(activeItem.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (lockedTracks?.includes(activeItem.track || 1)) return;
              startEditing(activeItem);
            }}
            className={`group/caption absolute z-40 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center ${
              isEditing
                ? "cursor-text"
                : lockedTracks?.includes(activeItem.track || 1)
                ? "cursor-default"
                : "cursor-grab active:cursor-grabbing"
            } ${draggingCaptionId === activeItem.id || resizing?.id === activeItem.id || isSelected ? "ring-2 ring-primary/80" : ""} outline outline-1 outline-dashed outline-transparent hover:outline-primary/45 focus-within:outline-primary/45 rounded-lg transition-all overflow-hidden`}
            style={{
              left: `${posX * 100}%`,
              top: `${posY * 100}%`,
              width: `${boxWidth}%`,
              minHeight: boxHeight ? `${boxHeight}%` : undefined,
              height: boxHeight ? `${boxHeight}%` : undefined,
              transform: isEditing
                ? "translate(-50%, -50%)"
                : `translate(-50%, -50%) ${getAnimationTransform(itemStyle.animation, animProgress, exitProgress)}`,
              opacity: isEditing ? 1 : getAnimationOpacity(itemStyle.animation, animProgress, exitProgress),
              transition: draggingCaptionId === activeItem.id || resizing?.id === activeItem.id ? "none" : "left 80ms linear, top 80ms linear, width 80ms linear, height 80ms linear",
            }}
          >
            {isEditing ? (
              <textarea
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    commitEdit();
                  }
                  if (e.key === "Escape") setEditingCaptionId(null);
                }}
                rows={2}
                style={{ textAlign: itemStyle.alignment || "center" }}
                className="w-[min(70vw,420px)] resize-none rounded-md border-2 border-primary bg-black/80 px-3 py-1.5 text-[15px] leading-tight text-white outline-none"
              />
            ) : (
              <span
                className="rounded-md px-3 py-1.5 leading-tight"
                style={{
                  fontFamily: `"${itemStyle.fontFamily}", sans-serif`,
                  fontSize: `${Math.max(14, Math.min(80, (itemStyle.fontSize / 1080) * canvasHeight))}px`,
                  color: itemStyle.color,
                  backgroundColor: hexToRgba(itemStyle.bgColor, itemStyle.bgOpacity),
                  fontWeight: itemStyle.bold ? Math.max(itemStyle.fontWeight, 700) : itemStyle.fontWeight,
                  textTransform: itemStyle.uppercase ? "uppercase" : "none",
                  textShadow: itemStyle.strokeWidth > 0
                    ? buildStroke(itemStyle.strokeColor, Math.max(1, itemStyle.strokeWidth / 3))
                    : "0 2px 4px rgba(0,0,0,0.6)",
                  whiteSpace: "pre-wrap",
                  textAlign: itemStyle.alignment || "center",
                }}
              >
                {(() => {
                  if (itemStyle.animation === "typewriter") {
                    const elapsedMs = Math.max(0, (time - activeItem.start) * 1000);
                    const { text: slicedText, showCursor } = getTypewriterState(activeItem.text, itemStyle, elapsedMs);
                    const displayText = itemStyle.uppercase ? slicedText.toUpperCase() : slicedText;
                    return (
                      <>
                        <span>{displayText}</span>
                        {showCursor && (
                          <span
                            className="inline-block w-[0.07em] h-[1.15em] ml-1 animate-cursor-blink flex-shrink-0"
                            style={{
                              backgroundColor: itemStyle.typewriterCursorColor || "#ff5c3a",
                              verticalAlign: "middle",
                            }}
                          />
                        )}
                      </>
                    );
                  }
                  if (itemStyle.karaoke) {
                    const wordsToRender = (activeItem.words && activeItem.words.length > 0)
                      ? activeItem.words
                      : (() => {
                          const tokens = activeItem.text.match(/\S+\s*/g) || [activeItem.text];
                          const duration = Math.max(0.1, activeItem.end - activeItem.start);
                          const wordDur = duration / tokens.length;
                          return tokens.map((text, idx) => ({
                            text,
                            start: activeItem.start + idx * wordDur,
                            end: activeItem.start + (idx + 1) * wordDur,
                          }));
                        })();

                    return wordsToRender.map((w, i) => {
                      const isActive = time >= w.start && time <= w.end;
                      const isPast = time > w.end;
                      const text = itemStyle.uppercase ? w.text.toUpperCase() : w.text;
                      const hasTrailingSpace = text.endsWith(" ");
                      const showSpace = i < wordsToRender.length - 1 && !hasTrailingSpace;
                      return (
                        <span key={i} className="inline-block">
                          <span
                            style={{
                              color: isActive ? itemStyle.highlightColor : itemStyle.color,
                              opacity: !isActive && !isPast ? 0.75 : 1,
                              transform: isActive ? "scale(1.08)" : "scale(1)",
                              display: "inline-block",
                              transition: "color 80ms linear, transform 120ms ease-out, opacity 120ms",
                            }}
                          >
                            {text}
                          </span>
                          {showSpace ? "\u00A0" : ""}
                        </span>
                      );
                    });
                  }
                  return itemStyle.uppercase ? activeItem.text.toUpperCase() : activeItem.text;
                })()}
              </span>
            )}

            {!isEditing && !lockedTracks?.includes(activeItem.track || 1) && (
              <>
                <span className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-1 flex items-center gap-2 whitespace-nowrap rounded bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition group-hover/caption:opacity-100 z-50">
                  <Move className="h-3 w-3" /> drag · <Pencil className="h-3 w-3" /> dbl-click · <ResizeIcon className="h-3 w-3" /> edges to resize
                </span>

                {/* Left Resize Handle */}
                <div
                  onPointerDown={(e) => handleResizeStart(e, activeItem.id, "left")}
                  className="absolute top-0 bottom-0 left-0 w-4 -translate-x-1/2 cursor-ew-resize flex items-center justify-center z-50 group/handle"
                >
                  <div className={`w-1.5 h-6 rounded-full bg-primary/70 border border-white/85 shadow-md transition-all duration-150 group-hover/handle:bg-primary group-hover/handle:scale-y-110 group-hover/handle:w-2 ${isSelected ? "opacity-100" : "opacity-0 group-hover/caption:opacity-100"}`} />
                </div>

                {/* Right Resize Handle */}
                <div
                  onPointerDown={(e) => handleResizeStart(e, activeItem.id, "right")}
                  className="absolute top-0 bottom-0 right-0 w-4 translate-x-1/2 cursor-ew-resize flex items-center justify-center z-50 group/handle"
                >
                  <div className={`w-1.5 h-6 rounded-full bg-primary/70 border border-white/85 shadow-md transition-all duration-150 group-hover/handle:bg-primary group-hover/handle:scale-y-110 group-hover/handle:w-2 ${isSelected ? "opacity-100" : "opacity-0 group-hover/caption:opacity-100"}`} />
                </div>

                {/* Top Resize Handle */}
                <div
                  onPointerDown={(e) => handleResizeStart(e, activeItem.id, "top")}
                  className="absolute top-0 left-0 right-0 h-4 -translate-y-1/2 cursor-ns-resize flex items-center justify-center z-50 group/handle"
                >
                  <div className={`h-1.5 w-6 rounded-full bg-primary/70 border border-white/85 shadow-md transition-all duration-150 group-hover/handle:bg-primary group-hover/handle:scale-x-110 group-hover/handle:h-2 ${isSelected ? "opacity-100" : "opacity-0 group-hover/caption:opacity-100"}`} />
                </div>

                {/* Bottom Resize Handle */}
                <div
                  onPointerDown={(e) => handleResizeStart(e, activeItem.id, "bottom")}
                  className="absolute bottom-0 left-0 right-0 h-4 translate-y-1/2 cursor-ns-resize flex items-center justify-center z-50 group/handle"
                >
                  <div className={`h-1.5 w-6 rounded-full bg-primary/70 border border-white/85 shadow-md transition-all duration-150 group-hover/handle:bg-primary group-hover/handle:scale-x-110 group-hover/handle:h-2 ${isSelected ? "opacity-100" : "opacity-0 group-hover/caption:opacity-100"}`} />
                </div>
              </>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
});

function Move({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="5 9 2 12 5 15" />
      <polyline points="9 5 12 2 15 5" />
      <polyline points="15 19 12 22 9 19" />
      <polyline points="19 9 22 12 19 15" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  );
}

function ResizeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="8 5 3 10 8 15" />
      <polyline points="16 5 21 10 16 15" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function computePosition(style: CaptionStyle, track?: number): { x: number; y: number } {
  let basePos = { x: 0.5, y: 0.88 };
  if (style.position === "free") basePos = { x: style.posX, y: style.posY };
  else if (style.position === "top") basePos = { x: 0.5, y: 0.12 };
  else if (style.position === "middle") basePos = { x: 0.5, y: 0.5 };

  if (track === 2) {
    return { x: basePos.x, y: Math.max(0.05, basePos.y - 0.15) };
  }
  return basePos;
}

function getAnimationTransform(anim: CaptionAnimation, enter: number, exit: number): string {
  const e = easeOutBack(enter);
  const ex = easeOutBack(exit);
  if (anim === "zoom-in") return `scale(${(0.5 + 0.5 * e) * (0.5 + 0.5 * ex)})`;
  if (anim === "zoom-out") return `scale(${(1.5 - 0.5 * e) * (1.5 - 0.5 * ex)})`;
  if (anim === "pop") return `scale(${(0.7 + 0.3 * e) * (0.7 + 0.3 * ex)})`;
  if (anim === "slide-up") return `translateY(${(1 - e) * 30 + (1 - ex) * -30}px)`;
  if (anim === "slide-down") return `translateY(${(1 - e) * -30 + (1 - ex) * 30}px)`;
  if (anim === "slide-left") return `translateX(${(1 - e) * 60 + (1 - ex) * -60}px)`;
  if (anim === "slide-right") return `translateX(${(1 - e) * -60 + (1 - ex) * 60}px)`;
  if (anim === "bounce") {
    const b = Math.sin(enter * Math.PI * 2) * (1 - enter) * 0.15;
    return `scale(${(0.7 + 0.3 * enter + b) * ex})`;
  }
  if (anim === "wave") {
    const w = Math.sin(performance.now() / 200) * 4;
    return `translateY(${w}px)`;
  }
  if (anim === "shake") {
    const intensity = (1 - enter) * 8 + 1.5;
    const x = (Math.sin(performance.now() / 30) * intensity) | 0;
    const y = (Math.cos(performance.now() / 25) * intensity * 0.6) | 0;
    return `translate(${x}px, ${y}px)`;
  }
  if (anim === "glitch") {
    const x = Math.sin(performance.now() / 60) * 3;
    return `translateX(${x}px) skewX(${x * 0.6}deg)`;
  }
  return "";
}

function getAnimationOpacity(anim: CaptionAnimation, enter: number, exit: number): number {
  if (anim === "none") return 1;
  if (anim === "typewriter") return exit;
  if (anim === "fade") return enter * exit;
  return Math.min(enter * 1.5, 1) * Math.min(exit * 1.5, 1);
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function buildStroke(color: string, w: number): string {
  // 8-direction text stroke via text-shadow
  const offsets = [
    [w, 0], [-w, 0], [0, w], [0, -w],
    [w, w], [-w, w], [w, -w], [-w, -w],
  ];
  return offsets.map(([x, y]) => `${x}px ${y}px 0 ${color}`).join(", ") + ", 0 2px 4px rgba(0,0,0,0.6)";
}

function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
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

const formatTime = (secs: number) => {
  if (isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};
