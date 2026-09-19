import React, { useRef, useMemo, useCallback } from "react";

interface TimeRulerProps {
  duration: number;
  pxPerSec: number;
  totalWidth: number;
  currentTime: number;
  onSeek: (t: number) => void;
}

const formatMarkerTime = (secs: number, step: number): string => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  if (step < 1) {
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const TimeRuler: React.FC<TimeRulerProps> = ({
  duration,
  pxPerSec,
  totalWidth,
  currentTime,
  onSeek,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Dynamic interval calculation based on zoom level
  const { majorStep, minorDivisions } = useMemo(() => {
    if (pxPerSec >= 160) return { majorStep: 0.5, minorDivisions: 5 }; // 0.1s minor
    if (pxPerSec >= 90) return { majorStep: 1, minorDivisions: 5 };    // 0.2s minor
    if (pxPerSec >= 45) return { majorStep: 2, minorDivisions: 4 };    // 0.5s minor
    if (pxPerSec >= 25) return { majorStep: 5, minorDivisions: 5 };    // 1s minor
    return { majorStep: 10, minorDivisions: 5 };                        // 2s minor
  }, [pxPerSec]);

  // Generate tick markers
  const markers = useMemo(() => {
    const list: { time: number; isMajor: boolean; label?: string }[] = [];
    const minorStep = majorStep / minorDivisions;
    const end = duration > 0 ? duration + majorStep : 60;

    for (let t = 0; t <= end; t += minorStep) {
      // Float precision rounding
      const roundedT = Number(t.toFixed(3));
      const isMajor = Math.abs(roundedT % majorStep) < 0.001 || Math.abs((roundedT % majorStep) - majorStep) < 0.001;
      list.push({
        time: roundedT,
        isMajor,
        label: isMajor ? formatMarkerTime(roundedT, majorStep) : undefined,
      });
    }
    return list;
  }, [duration, majorStep, minorDivisions]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      isDraggingRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);

      const rect = rulerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clickX = e.clientX - rect.left;
      const targetTime = Math.max(0, Math.min(duration, clickX / pxPerSec));
      onSeek(targetTime);
    },
    [duration, pxPerSec, onSeek]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      const rect = rulerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clickX = e.clientX - rect.left;
      const targetTime = Math.max(0, Math.min(duration, clickX / pxPerSec));
      onSeek(targetTime);
    },
    [duration, pxPerSec, onSeek]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    },
    []
  );

  return (
    <div
      ref={rulerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ width: totalWidth }}
      className="h-6 relative bg-secondary/70 border-b border-border select-none cursor-pointer overflow-hidden group"
    >
      {markers.map((m, idx) => {
        const left = m.time * pxPerSec;
        if (left > totalWidth + 50) return null;

        return (
          <React.Fragment key={idx}>
            {m.isMajor ? (
              <div
                className="absolute top-0 bottom-0 pointer-events-none flex flex-col justify-between"
                style={{ left }}
              >
                <span className="text-[9px] font-mono font-semibold text-muted-foreground/80 pl-1 leading-none select-none tracking-tight">
                  {m.label}
                </span>
                <div className="h-2 w-px bg-border group-hover:bg-border/90 transition-colors" />
              </div>
            ) : (
              <div
                className="absolute bottom-0 h-1 w-px bg-border/40 pointer-events-none"
                style={{ left }}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* Subtle hover line */}
      <div className="absolute inset-0 pointer-events-none group-hover:bg-primary/[0.02] transition-colors" />
    </div>
  );
};
