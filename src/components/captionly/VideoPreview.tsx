import { forwardRef, useEffect, useState } from "react";
import type { Caption, CaptionStyle } from "@/lib/captions/types";

type Props = {
  src: string;
  captions: Caption[];
  style: CaptionStyle;
  onTimeUpdate?: (t: number) => void;
  onLoaded?: (info: { width: number; height: number; duration: number }) => void;
};

export const VideoPreview = forwardRef<HTMLVideoElement, Props>(function VideoPreview(
  { src, captions, style, onTimeUpdate, onLoaded },
  ref,
) {
  const [time, setTime] = useState(0);
  const active = captions.find((c) => time >= c.start && time <= c.end);

  useEffect(() => {
    setTime(0);
  }, [src]);

  const positionClass =
    style.position === "top"
      ? "top-[8%] items-start"
      : style.position === "middle"
      ? "top-1/2 -translate-y-1/2 items-center"
      : "bottom-[8%] items-end";

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black shadow-elegant">
      <video
        ref={ref}
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
      <div
        className={`pointer-events-none absolute inset-x-0 flex justify-center px-6 ${positionClass}`}
      >
        {active && (
          <span
            className="max-w-[90%] rounded-md px-3 py-1.5 text-center leading-tight"
            style={{
              fontFamily: style.fontFamily,
              fontSize: `clamp(14px, ${(style.fontSize / 1080) * 100}vw, 64px)`,
              color: style.color,
              backgroundColor: hexToRgba(style.bgColor, style.bgOpacity),
              fontWeight: style.bold ? 700 : 500,
              textTransform: style.uppercase ? "uppercase" : "none",
              textShadow: "0 2px 4px rgba(0,0,0,0.6)",
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
                        textShadow: isActive
                          ? `0 0 12px ${hexToRgba(style.highlightColor, 0.6)}, 0 2px 4px rgba(0,0,0,0.6)`
                          : "0 2px 4px rgba(0,0,0,0.6)",
                      }}
                    >
                      {w.text}
                    </span>
                  );
                })
              : active.text}
          </span>
        )}
      </div>
    </div>
  );
});

function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
