import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Scissors, Trash2, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type { Caption } from "@/lib/captions/types";

type Props = {
  duration: number;
  currentTime: number;
  captions: Caption[];
  onChange: (next: Caption[]) => void;
  onSeek: (t: number) => void;
};

const fmt = (t: number) => {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  const ms = Math.floor((t % 1) * 10);
  return `${m}:${s}.${ms}`;
};

type DragState =
  | { kind: "move"; id: string; startX: number; origStart: number; origEnd: number }
  | { kind: "resize-l"; id: string; startX: number; origStart: number; origEnd: number }
  | { kind: "resize-r"; id: string; startX: number; origStart: number; origEnd: number }
  | { kind: "scrub"; startX: number }
  | null;

export function Timeline({ duration, currentTime, captions, onChange, onSeek }: Props) {
  const [pxPerSec, setPxPerSec] = useState(60);
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalWidth = Math.max(400, (duration || 0) * pxPerSec);

  const ticks = useMemo(() => {
    const step = pxPerSec >= 80 ? 0.5 : pxPerSec >= 40 ? 1 : pxPerSec >= 20 ? 2 : 5;
    const arr: number[] = [];
    for (let t = 0; t <= duration; t += step) arr.push(t);
    return { arr, step };
  }, [duration, pxPerSec]);

  const fitZoom = useCallback(() => {
    const w = scrollRef.current?.clientWidth ?? 800;
    if (duration > 0) setPxPerSec(Math.max(10, (w - 24) / duration));
  }, [duration]);

  // Pointer move handler
  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      if (drag.kind === "scrub") {
        const rect = trackRef.current?.getBoundingClientRect();
        if (!rect) return;
        const t = Math.max(0, Math.min(duration, (e.clientX - rect.left) / pxPerSec));
        onSeek(t);
        return;
      }
      const dx = e.clientX - drag.startX;
      const dt = dx / pxPerSec;
      onChange(
        captions.map((c) => {
          if (c.id !== drag.id) return c;
          if (drag.kind === "move") {
            const len = drag.origEnd - drag.origStart;
            const start = Math.max(0, Math.min(duration - len, drag.origStart + dt));
            return { ...c, start, end: start + len };
          }
          if (drag.kind === "resize-l") {
            const start = Math.max(0, Math.min(drag.origEnd - 0.1, drag.origStart + dt));
            return { ...c, start };
          }
          // resize-r
          const end = Math.max(drag.origStart + 0.1, Math.min(duration, drag.origEnd + dt));
          return { ...c, end };
        }),
      );
    };
    const onUp = () => setDrag(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, captions, duration, pxPerSec, onChange, onSeek]);

  const splitAt = (id: string, time: number) => {
    const idx = captions.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const c = captions[idx];
    if (time <= c.start + 0.05 || time >= c.end - 0.05) return;
    const tokens = c.text.trim().split(/\s+/);
    const half = Math.max(1, Math.floor(tokens.length / 2));
    const left: Caption = { ...c, end: time, text: tokens.slice(0, half).join(" ") };
    const right: Caption = {
      id: crypto.randomUUID(),
      start: time,
      end: c.end,
      text: tokens.slice(half).join(" ") || "...",
    };
    const next = [...captions];
    next.splice(idx, 1, left, right);
    onChange(next);
  };

  const remove = (id: string) => {
    onChange(captions.filter((c) => c.id !== id));
    if (selected === id) setSelected(null);
  };

  const selectedCaption = captions.find((c) => c.id === selected) ?? null;

  return (
    <div
      className="flex flex-col border-t border-[#e8e4de] bg-white"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Toolbar */}
      <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-[#f0ede8] px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-[#1a1a1a]">Timeline</span>
          <span
            className="text-[10.5px] text-[#bbb]"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
          >
            {fmt(currentTime)} / {fmt(duration)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selectedCaption && (
            <>
              <button
                onClick={() => splitAt(selectedCaption.id, currentTime)}
                title="Split at playhead"
                className="inline-flex items-center gap-1 rounded-md border border-[#e8e4de] bg-white px-2 py-1 text-[11px] text-[#555] hover:border-[#ff5c3a] hover:text-[#ff5c3a]"
              >
                <Scissors className="h-3 w-3" /> Split
              </button>
              <button
                onClick={() => remove(selectedCaption.id)}
                title="Delete"
                className="inline-flex items-center gap-1 rounded-md border border-[#e8e4de] bg-white px-2 py-1 text-[11px] text-[#555] hover:border-red-300 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
              <div className="h-4 w-px bg-[#e8e4de]" />
            </>
          )}
          <button
            onClick={() => setPxPerSec((z) => Math.max(8, z / 1.4))}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-[#e8e4de] bg-white text-[#666] hover:bg-[#f5f3ee]"
            title="Zoom out"
          >
            <ZoomOut className="h-3 w-3" />
          </button>
          <button
            onClick={() => setPxPerSec((z) => Math.min(400, z * 1.4))}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-[#e8e4de] bg-white text-[#666] hover:bg-[#f5f3ee]"
            title="Zoom in"
          >
            <ZoomIn className="h-3 w-3" />
          </button>
          <button
            onClick={fitZoom}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-[#e8e4de] bg-white text-[#666] hover:bg-[#f5f3ee]"
            title="Fit"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Scroll area */}
      <div ref={scrollRef} className="scrollbar-thin overflow-x-auto overflow-y-hidden">
        <div style={{ width: totalWidth + 24, padding: "0 12px" }}>
          {/* Ruler */}
          <div className="relative h-6 select-none">
            {ticks.arr.map((t) => {
              const major = Math.round(t / ticks.step) % 5 === 0;
              return (
                <div
                  key={t}
                  className="absolute top-0 flex flex-col items-start"
                  style={{ left: t * pxPerSec }}
                >
                  <div
                    className={`w-px ${major ? "h-3 bg-[#999]" : "h-1.5 bg-[#ddd]"}`}
                  />
                  {major && (
                    <span
                      className="mt-0.5 text-[9px] text-[#999]"
                      style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                    >
                      {fmt(t)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Track */}
          <div
            ref={trackRef}
            onPointerDown={(e) => {
              if (e.target !== trackRef.current) return;
              const rect = trackRef.current!.getBoundingClientRect();
              const t = Math.max(0, Math.min(duration, (e.clientX - rect.left) / pxPerSec));
              onSeek(t);
              setSelected(null);
              setDrag({ kind: "scrub", startX: e.clientX });
            }}
            className="relative h-16 cursor-crosshair rounded-md border border-[#e8e4de] bg-[#faf9f7]"
            style={{ width: totalWidth }}
          >
            {/* Caption blocks */}
            {captions.map((c) => {
              const isActive = currentTime >= c.start && currentTime <= c.end;
              const isSel = selected === c.id;
              return (
                <div
                  key={c.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelected(c.id);
                    onSeek(c.start);
                    setDrag({
                      kind: "move",
                      id: c.id,
                      startX: e.clientX,
                      origStart: c.start,
                      origEnd: c.end,
                    });
                  }}
                  onDoubleClick={() => splitAt(c.id, currentTime)}
                  className={`group absolute top-1.5 bottom-1.5 cursor-grab overflow-hidden rounded-md border-2 px-2 py-1 text-[11px] transition active:cursor-grabbing ${
                    isSel
                      ? "border-[#ff5c3a] bg-[#ffe8e2] shadow-md"
                      : isActive
                      ? "border-[#ff5c3a] bg-[#fff5f3]"
                      : "border-[#ffd5cc] bg-[#fff5f3]/70 hover:border-[#ff5c3a]"
                  }`}
                  style={{
                    left: c.start * pxPerSec,
                    width: Math.max(8, (c.end - c.start) * pxPerSec),
                  }}
                  title={c.text}
                >
                  {/* Left handle */}
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setSelected(c.id);
                      setDrag({
                        kind: "resize-l",
                        id: c.id,
                        startX: e.clientX,
                        origStart: c.start,
                        origEnd: c.end,
                      });
                    }}
                    className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize bg-[#ff5c3a]/0 hover:bg-[#ff5c3a]/30"
                  />
                  {/* Right handle */}
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setSelected(c.id);
                      setDrag({
                        kind: "resize-r",
                        id: c.id,
                        startX: e.clientX,
                        origStart: c.start,
                        origEnd: c.end,
                      });
                    }}
                    className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize bg-[#ff5c3a]/0 hover:bg-[#ff5c3a]/30"
                  />
                  <div className="pointer-events-none truncate font-medium text-[#1a1a1a]">
                    {c.text}
                  </div>
                  <div
                    className="pointer-events-none truncate text-[9.5px] text-[#ff5c3a]"
                    style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                  >
                    {(c.end - c.start).toFixed(2)}s
                  </div>
                </div>
              );
            })}

            {/* Playhead */}
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-[#ff5c3a]"
              style={{ left: currentTime * pxPerSec }}
            >
              <div className="absolute -top-1 -left-[5px] h-2.5 w-2.5 rotate-45 bg-[#ff5c3a]" />
            </div>
          </div>

          {/* Editable selected caption row */}
          {selectedCaption && (
            <div className="mt-2 mb-2 flex items-center gap-2">
              <input
                value={selectedCaption.text}
                onChange={(e) =>
                  onChange(
                    captions.map((c) =>
                      c.id === selectedCaption.id ? { ...c, text: e.target.value } : c,
                    ),
                  )
                }
                className="flex-1 rounded-md border border-[#e8e4de] bg-white px-2 py-1 text-[12px] outline-none focus:border-[#ff5c3a]"
                placeholder="Caption text"
              />
              <span
                className="text-[10.5px] text-[#999]"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
              >
                {fmt(selectedCaption.start)} → {fmt(selectedCaption.end)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
