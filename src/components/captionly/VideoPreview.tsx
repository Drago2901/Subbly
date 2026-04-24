import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Caption, CaptionStyle, CaptionAnimation } from "@/lib/captions/types";

type Props = {
  src: string;
  captions: Caption[];
  style: CaptionStyle;
  onTimeUpdate?: (t: number) => void;
  onLoaded?: (info: { width: number; height: number; duration: number }) => void;
  onPositionChange?: (pos: { posX: number; posY: number }) => void;
};

export const VideoPreview = forwardRef<HTMLVideoElement, Props>(function VideoPreview(
  { src, captions, style, onTimeUpdate, onLoaded, onPositionChange },
  ref,
) {
  const innerRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => innerRef.current as HTMLVideoElement, []);
  const [time, setTime] = useState(0);
  const [dragging, setDragging] = useState(false);
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

  // Compute caption position
  const captionPos = computePosition(style);
  const isFree = style.position === "free";

  // Compute animation progress for current caption
  const animProgress = active ? Math.min(1, (time - active.start) / 0.35) : 0;
  const exitProgress = active ? Math.max(0, Math.min(1, (active.end - time) / 0.25)) : 1;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl bg-black shadow-elegant"
    >
      <video
        ref={innerRef}
        src={src}
        className="block h-full w-full"
        controls
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
      {active && (
        <div
          onPointerDown={(e) => {
            if (!isFree) return;
            e.preventDefault();
            setDragging(true);
          }}
          className={`absolute flex max-w-[90%] -translate-x-1/2 -translate-y-1/2 justify-center px-2 ${
            isFree ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
          } ${dragging ? "ring-2 ring-primary" : ""}`}
          style={{
            left: `${captionPos.x * 100}%`,
            top: `${captionPos.y * 100}%`,
            transform: `translate(-50%, -50%) ${getAnimationTransform(style.animation, animProgress, exitProgress)}`,
            opacity: getAnimationOpacity(style.animation, animProgress, exitProgress),
            transition: dragging ? "none" : "left 80ms linear, top 80ms linear",
          }}
        >
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
          {isFree && (
            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground opacity-0 group-hover:opacity-100">
              drag to move
            </span>
          )}
        </div>
      )}
    </div>
  );
});

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
  if (anim === "bounce") {
    const b = Math.sin(enter * Math.PI * 2) * (1 - enter) * 0.15;
    return `scale(${0.7 + 0.3 * enter + b})`;
  }
  if (anim === "wave") {
    const w = Math.sin(performance.now() / 200) * 4;
    return `translateY(${w}px)`;
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
