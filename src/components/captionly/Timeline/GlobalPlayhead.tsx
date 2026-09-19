import React from "react";

interface GlobalPlayheadProps {
  currentTime: number;
  pxPerSec: number;
  totalHeight: number;
  onScrubStart?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

const formatPlayheadBadge = (secs: number): string => {
  if (!isFinite(secs) || secs < 0) secs = 0;
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 100);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
};

export const GlobalPlayhead: React.FC<GlobalPlayheadProps> = ({
  currentTime,
  pxPerSec,
  totalHeight,
  onScrubStart,
}) => {
  const left = currentTime * pxPerSec;

  return (
    <div
      style={{
        left: `${left}px`,
        height: `${totalHeight}px`,
      }}
      className="absolute top-0 pointer-events-none z-30 transition-none will-change-[left]"
    >
      {/* Playhead Vertical Guide Line */}
      <div className="absolute top-0 bottom-0 left-0 w-[2px] -translate-x-[1px] bg-primary shadow-[0_0_10px_rgba(255,92,58,0.55)]" />

      {/* Playhead Grab Handle & Timestamp Tooltip */}
      <div
        onPointerDown={onScrubStart}
        className="absolute top-0 left-0 -translate-x-1/2 pointer-events-auto cursor-ew-resize group flex flex-col items-center select-none"
      >
        {/* Floating Timestamp Badge */}
        <div className="bg-primary text-primary-foreground font-mono text-[9.5px] font-bold px-1.5 py-0.5 rounded-md shadow-md opacity-90 group-hover:opacity-100 group-hover:scale-105 transition tracking-tight whitespace-nowrap -translate-y-1">
          {formatPlayheadBadge(currentTime)}
        </div>

        {/* Playhead Triangle Pointer */}
        <div className="w-0 h-0 border-x-[5px] border-x-transparent border-t-[6px] border-t-primary -mt-0.5 shadow-sm" />
      </div>
    </div>
  );
};
