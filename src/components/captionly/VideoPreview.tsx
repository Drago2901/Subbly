import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Maximize, Minimize, Pencil } from "lucide-react";
import type { Caption, CaptionStyle, CaptionAnimation } from "@/lib/captions/types";

type Props = {
  src: string;
  captions: Caption[];
  style: CaptionStyle;
  onTimeUpdate?: (t: number) => void;
  onLoaded?: (info: { width: number; height: number; duration: number }) => void;
  onPositionChange?: (pos: { posX: number; posY: number }) => void;
  /** Edit the active caption's text inline from the preview. */
  onCaptionChange?: (id: string, text: string) => void;
  /** Optional target frame (e.g. export preset) — preview will be letterboxed/cropped to match. */
  frame?: { width: number; height: number; fit: "cover" | "contain" } | null;
};

export const VideoPreview = forwardRef<HTMLVideoElement, Props>(function VideoPreview(
  { src, captions, style, onTimeUpdate, onLoaded, onPositionChange, onCaptionChange, frame },
  ref,
) {
  const innerRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => innerRef.current as HTMLVideoElement, []);
  const [time, setTime] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const active = captions.find((c) => time >= c.start && time <= c.end);

  useEffect(() => {
    setTime(0);
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
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const c = containerRef.current;
      if (!c) return;
      const rect = c.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      onPositionChange?.({
        posX: Math.max(0.05, Math.min(0.95, x)),
        posY: Math.max(0.05, Math.min(0.95, y)),
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, onPositionChange]);

  const startEditing = () => {
    if (!active) return;
    setEditText(active.text);
    setEditing(true);
  };

  const commitEdit = () => {
    if (active && onCaptionChange) onCaptionChange(active.id, editText);
    setEditing(false);
  };

  // Compute caption position
  const captionPos = computePosition(style);
  const isFree = style.position === "free";

  // Compute animation progress for current caption
  const animProgress = active ? Math.min(1, (time - active.start) / 0.35) : 0;
  const exitProgress = active ? Math.max(0, Math.min(1, (active.end - time) / 0.25)) : 1;

  const aspectStyle = frame && !isFullscreen
    ? { aspectRatio: `${frame.width} / ${frame.height}` }
    : undefined;
  const objectFit: "cover" | "contain" = frame?.fit ?? "contain";

  return (
    <div
      ref={containerRef}
      className={`group/preview relative mx-auto w-full overflow-hidden bg-black ${
        isFullscreen ? "flex h-full items-center justify-center rounded-none" : "rounded-xl shadow-elegant"
      }`}
      style={aspectStyle}
    >
      <video
        ref={innerRef}
        src={src}
        className="block h-full w-full"
        style={{ objectFit }}
        controls
        controlsList="nofullscreen"
        onTimeUpdate={(e) => {
          const t = (e.target as HTMLVideoElement).currentTime;
          setTime(t);
          onTimeUpdate?.(t);
        }}
        onLoadedMetadata={(e) => {
          const v = e.target as HTMLVideoElement;
          onLoaded?.({
            width: v.videoWidth,
            height: v.videoHeight,
            duration: v.duration,
          });
        }}
      />

      {/* Custom fullscreen toggle (native one is disabled so the caption overlay stays visible) */}
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        className="absolute right-2 top-2 z-30 flex h-8 w-8 items-center justify-center rounded-md bg-black/55 text-white opacity-0 backdrop-blur-sm transition hover:bg-black/75 group-hover/preview:opacity-100"
      >
        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </button>

      {active && (
        <div
          onPointerDown={(e) => {
            if (editing) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            startEditing();
          }}
          className={`group absolute flex max-w-[90%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center px-2 ${
            editing ? "cursor-text" : "cursor-grab active:cursor-grabbing"
          } ${dragging ? "ring-2 ring-primary" : ""}`}
          style={{
            left: `${captionPos.x * 100}%`,
            top: `${captionPos.y * 100}%`,
            transform: editing
              ? "translate(-50%, -50%)"
              : `translate(-50%, -50%) ${getAnimationTransform(style.animation, animProgress, exitProgress)}`,
            opacity: editing ? 1 : getAnimationOpacity(style.animation, animProgress, exitProgress),
            transition: dragging ? "none" : "left 80ms linear, top 80ms linear",
          }}
        >
          {editing ? (
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
                if (e.key === "Escape") setEditing(false);
              }}
              rows={2}
              className="w-[min(70vw,420px)] resize-none rounded-md border-2 border-primary bg-black/80 px-3 py-1.5 text-center text-[15px] leading-tight text-white outline-none"
            />
          ) : (
            <span
              className="rounded-md px-3 py-1.5 text-center leading-tight"
              style={{
                fontFamily: `"${style.fontFamily}", sans-serif`,
                fontSize: `clamp(14px, ${(style.fontSize / 1080) * 100}vw, 80px)`,
                color: style.color,
                backgroundColor: hexToRgba(style.bgColor, style.bgOpacity),
                fontWeight: style.bold ? Math.max(style.fontWeight, 700) : style.fontWeight,
                textTransform: style.uppercase ? "uppercase" : "none",
                textShadow: style.strokeWidth > 0
                  ? buildStroke(style.strokeColor, Math.max(1, style.strokeWidth / 3))
                  : "0 2px 4px rgba(0,0,0,0.6)",
                whiteSpace: "pre-wrap",
              }}
            >
              {style.karaoke && active.words && active.words.length > 0
                ? active.words.map((w, i) => {
                    const isActive = time >= w.start && time <= w.end;
                    const isPast = time > w.end;
                    return (
                      <span
                        key={i}
                        style={{
                          color: isActive ? style.highlightColor : style.color,
                          opacity: !isActive && !isPast ? 0.75 : 1,
                          transform: isActive ? "scale(1.08)" : "scale(1)",
                          display: "inline-block",
                          transition: "color 80ms linear, transform 120ms ease-out, opacity 120ms",
                        }}
                      >
                        {style.uppercase ? w.text.toUpperCase() : w.text}
                      </span>
                    );
                  })
                : style.uppercase ? active.text.toUpperCase() : active.text}
            </span>
          )}

          {!editing && (
            <span className="pointer-events-none mt-1 flex items-center gap-2 whitespace-nowrap rounded bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
              <Move className="h-3 w-3" /> drag to move
              <span className="opacity-50">·</span>
              <Pencil className="h-3 w-3" /> double-click to edit
            </span>
          )}
        </div>
      )}
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

function computePosition(style: CaptionStyle): { x: number; y: number } {
  if (style.position === "free") return { x: style.posX, y: style.posY };
  if (style.position === "top") return { x: 0.5, y: 0.12 };
  if (style.position === "middle") return { x: 0.5, y: 0.5 };
  return { x: 0.5, y: 0.88 };
}

function getAnimationTransform(anim: CaptionAnimation, enter: number, exit: number): string {
  const e = easeOutBack(enter);
  if (anim === "zoom-in") return `scale(${0.5 + 0.5 * e})`;
  if (anim === "zoom-out") return `scale(${1.5 - 0.5 * e})`;
  if (anim === "pop") return `scale(${0.7 + 0.3 * e})`;
  if (anim === "slide-up") return `translateY(${(1 - e) * 30}px)`;
  if (anim === "slide-down") return `translateY(${(1 - e) * -30}px)`;
  if (anim === "slide-left") return `translateX(${(1 - e) * 60}px)`;
  if (anim === "slide-right") return `translateX(${(1 - e) * -60}px)`;
  if (anim === "bounce") {
    const b = Math.sin(enter * Math.PI * 2) * (1 - enter) * 0.15;
    return `scale(${0.7 + 0.3 * enter + b})`;
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
  if (anim === "fade" || anim === "typewriter") return enter * exit;
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
