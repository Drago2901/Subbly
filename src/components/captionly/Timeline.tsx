import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronsLeftRight,
  ChevronsLeft,
  ChevronsRight,
  Lock,
  Pause,
  Pencil,
  Play,
  Plus,
  Redo2,
  Scissors,
  SkipBack,
  SkipForward,
  Trash2,
  Undo2,
  Unlock,
  ZoomIn,
  ZoomOut,
  Video,
  Music,
} from "lucide-react";
import type { Caption } from "@/lib/captions/types";

type Props = {
  duration: number;
  currentTime: number;
  captions: Caption[];
  onChange: (next: Caption[]) => void;
  onSeek: (t: number) => void;
  playing?: boolean;
  onTogglePlay?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  lockedTracks?: number[];
  onToggleLockTrack?: (trackNum: number) => void;
};

const fmtMs = (t: number) => {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = (t % 60).toFixed(3).padStart(6, "0");
  return `${m}:${s}`;
};
const fmtShort = (t: number) => {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

type DragState =
  | { kind: "move"; id: string; startX: number; origStart: number; origEnd: number; origWords?: Caption["words"] }
  | { kind: "resize-l"; id: string; startX: number; origStart: number; origEnd: number }
  | { kind: "resize-r"; id: string; startX: number; origStart: number; origEnd: number }
  | { kind: "scrub"; startX: number }
  | null;

export function Timeline({
  duration,
  currentTime,
  captions,
  onChange,
  onSeek,
  playing,
  onTogglePlay,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  selectedId,
  onSelect,
  lockedTracks = [],
  onToggleLockTrack,
}: Props) {
  const [zoomPct, setZoomPct] = useState(40);
  const selected = selectedId ?? null;
  const setSelected = useMemo(() => onSelect ?? (() => { }), [onSelect]);
  const [drag, setDrag] = useState<DragState>(null);
  const [snap, setSnap] = useState(true);

  const trackRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [numTracks, setNumTracks] = useState(() => {
    const maxCapTrack = captions.reduce((max, c) => Math.max(max, c.track || 1), 2);
    return Math.max(2, Math.min(6, maxCapTrack));
  });
  const trackRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const pxPerSec = useMemo(() => {
    const min = 15;
    const max = 250;
    return min + ((zoomPct - 5) / 95) * (max - min);
  }, [zoomPct]);

  const totalWidth = Math.max(400, (duration || 0) * pxPerSec);

  const wave = useMemo(() => {
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
      return Math.abs(seed) / 0x7fffffff;
    };
    const N = 120;
    return Array.from({ length: N }, (_, i) =>
      Math.max(0.15, rand() * Math.sin((i / N) * Math.PI) * 0.85 + 0.15),
    );
  }, []);

  const ticks = useMemo(() => {
    const step = pxPerSec >= 80 ? 0.5 : pxPerSec >= 40 ? 1 : pxPerSec >= 20 ? 2 : 5;
    const arr: number[] = [];
    for (let t = 0; t <= duration; t += step) arr.push(t);
    return { arr, step };
  }, [duration, pxPerSec]);

  // Drag handlers
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
      if (drag.id) {
        const draggingCap = captions.find((c) => c.id === drag.id);
        const origTrack = draggingCap ? (draggingCap.track || 1) : 1;
        if (lockedTracks.includes(origTrack)) return;
      }
      const dx = e.clientX - drag.startX;
      const dt = dx / pxPerSec;
      onChange(
        captions.map((c) => {
          if (c.id !== drag.id) return c;
          if (drag.kind === "move") {
            const len = drag.origEnd - drag.origStart;
            let start = Math.max(0, Math.min(duration - len, drag.origStart + dt));
            if (snap) start = Math.round(start * 10) / 10;
            const offset = start - drag.origStart;
            const words = drag.origWords?.map((w) => ({
              ...w,
              start: w.start + offset,
              end: w.end + offset,
            }));

            let track = c.track || 1;
            if (trackRefs.current.size > 0) {
              let minDistance = Infinity;
              let closestTrack = 1;
              trackRefs.current.forEach((el, trackNum) => {
                if (el) {
                  const rect = el.getBoundingClientRect();
                  const centerY = rect.top + rect.height / 2;
                  const dist = Math.abs(e.clientY - centerY);
                  if (dist < minDistance) {
                    minDistance = dist;
                    closestTrack = trackNum;
                  }
                }
              });
              track = closestTrack;
            }

            return { ...c, start, end: start + len, words, track };
          }
          if (drag.kind === "resize-l") {
            let start = Math.max(0, Math.min(drag.origEnd - 0.1, drag.origStart + dt));
            if (snap) start = Math.round(start * 10) / 10;
            return { ...c, start, words: undefined };
          }
          let end = Math.max(drag.origStart + 0.1, Math.min(duration, drag.origEnd + dt));
          if (snap) end = Math.round(end * 10) / 10;
          return { ...c, end, words: undefined };
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
  }, [drag, captions, duration, pxPerSec, onChange, onSeek, snap, lockedTracks]);

  const splitAt = useCallback(
    (id: string, time: number) => {
      const idx = captions.findIndex((c) => c.id === id);
      if (idx < 0) return;
      const c = captions[idx];
      if (lockedTracks.includes(c.track || 1)) return;
      if (time <= c.start + 0.05 || time >= c.end - 0.05) return;
      const tokens = c.text.trim().split(/\s+/);
      const half = Math.max(1, Math.floor(tokens.length / 2));
      const left: Caption = { ...c, end: time, text: tokens.slice(0, half).join(" ") };
      const right: Caption = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        start: time,
        end: c.end,
        text: tokens.slice(half).join(" ") || "...",
        style: c.style ? JSON.parse(JSON.stringify(c.style)) : undefined,
        x: c.x,
        y: c.y,
        width: c.width,
        height: c.height,
        track: c.track,
      };
      const next = [...captions];
      next.splice(idx, 1, left, right);
      onChange(next);
    },
    [captions, onChange, lockedTracks],
  );

  const remove = useCallback(
    (id: string) => {
      const c = captions.find((cap) => cap.id === id);
      if (c && lockedTracks.includes(c.track || 1)) return;
      onChange(captions.filter((cap) => cap.id !== id));
      if (selected === id) setSelected(null);
    },
    [captions, onChange, selected, lockedTracks, setSelected],
  );

  const selectedCaption = captions.find((c) => c.id === selected) ?? null;
  const activeCaptionAtPlayhead = useMemo(() => {
    return captions.find((c) => currentTime >= c.start && currentTime <= c.end) ?? null;
  }, [captions, currentTime]);

  const handleAddCaption = useCallback(() => {
    const start = currentTime;
    const end = duration > 0 ? Math.min(duration, start + 2.0) : start + 2.0;
    if (end <= start) return;

    let targetTrack = 1;
    for (let t = 1; t <= numTracks; t++) {
      if (!lockedTracks.includes(t)) {
        targetTrack = t;
        break;
      }
    }

    const refCap = captions.find((c) => c.x !== undefined);
    const newCap: Caption = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      start,
      end,
      text: "New Caption",
      track: targetTrack,
      x: refCap?.x ?? 0.5,
      y: refCap?.y ?? 0.88,
      width: refCap?.width ?? 84,
      height: refCap?.height,
      style: refCap?.style ? JSON.parse(JSON.stringify(refCap.style)) : undefined,
    };
    const next = [...captions, newCap].sort((a, b) => a.start - b.start);
    onChange(next);
    setSelected(newCap.id);
  }, [captions, currentTime, duration, onChange, numTracks, lockedTracks, setSelected]);

  const handleDeleteTrack = useCallback((targetTrack: number) => {
    if (numTracks <= 2 || targetTrack <= 2) return;
    onChange(
      captions
        .filter((c) => {
          const trackVal = c.track || 1;
          return trackVal !== targetTrack;
        })
        .map((c) => {
          const trackVal = c.track || 1;
          if (trackVal > targetTrack) {
            return { ...c, track: trackVal - 1 };
          }
          return c;
        })
    );
    setNumTracks((prev) => Math.max(2, prev - 1));
  }, [numTracks, captions, onChange]);

  const phPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const phX = currentTime * pxPerSec;
    if (phX < el.scrollLeft + 40) el.scrollLeft = Math.max(0, phX - 40);
    else if (phX > el.scrollLeft + el.clientWidth - 80)
      el.scrollLeft = phX - el.clientWidth + 80;
  }, [currentTime, pxPerSec]);

  const allTracksLocked = useMemo(() => {
    return Array.from({ length: numTracks }, (_, i) => i + 1).every((t) => lockedTracks.includes(t));
  }, [numTracks, lockedTracks]);

  return (
    <div className="flex flex-col border-t border-[#E8E4DE] dark:border-[#2C313C] bg-[#F9F8F6] dark:bg-[#0F1117] h-full text-[#1A1A1A] dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* TIMELINE TOOLBAR */}
      <div className="flex h-11 flex-shrink-0 items-center border-b border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#181B22] px-4 justify-between select-none shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 border-r border-[#E8E4DE] dark:border-[#2C313C] pr-3">
            <button
              onClick={handleAddCaption}
              disabled={allTracksLocked}
              className="inline-flex h-7 items-center gap-1 rounded-lg bg-[#FF6B2C] hover:bg-[#FF874D] px-2.5 text-[11px] font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.8} /> Text Clip
            </button>
            <button
              onClick={() => setNumTracks((prev) => Math.min(6, prev + 1))}
              disabled={numTracks >= 6}
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-[#F9F8F5] dark:bg-[#1F232D] hover:bg-neutral-50 dark:hover:bg-[#2C313C] px-2.5 text-[11px] font-bold text-[#1A1A1A] dark:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" /> Add Track
            </button>
          </div>

          <div className="flex items-center gap-1">
            <ToolBtn
              title="Delete selected clip"
              disabled={!selectedCaption || lockedTracks.includes(selectedCaption.track || 1)}
              onClick={() => selectedCaption && remove(selectedCaption.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn
              title="Split clip at playhead"
              onClick={() => {
                const target = selectedCaption || activeCaptionAtPlayhead;
                if (target) splitAt(target.id, currentTime);
              }}
              disabled={
                (!selectedCaption && !activeCaptionAtPlayhead) ||
                lockedTracks.includes((selectedCaption || activeCaptionAtPlayhead)?.track || 1)
              }
            >
              <Scissors className="h-3.5 w-3.5 text-[#FF6B2C]" />
            </ToolBtn>
            <div className="h-4 w-px bg-[#E8E4DE] dark:bg-[#2C313C]" />
            <ToolBtn title="Undo Edit" onClick={onUndo} disabled={!canUndo}>
              <Undo2 className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn title="Redo Edit" onClick={onRedo} disabled={!canRedo}>
              <Redo2 className="h-3.5 w-3.5" />
            </ToolBtn>
            <div className="h-4 w-px bg-[#E8E4DE] dark:bg-[#2C313C]" />
            <ToolBtn title="Snap boundary to grid" active={snap} onClick={() => setSnap((v) => !v)}>
              <ChevronsLeftRight className="h-3.5 w-3.5" />
            </ToolBtn>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <ToolBtn title="Zoom Out" onClick={() => setZoomPct((z) => Math.max(5, z - 10))}>
            <ZoomOut className="h-3.5 w-3.5" />
          </ToolBtn>
          <div
            className="relative h-1.5 w-[80px] cursor-pointer rounded-full bg-[#E8E4DE] dark:bg-[#2C313C]"
            onPointerDown={(e) => {
              const el = e.currentTarget;
              const update = (clientX: number) => {
                const r = el.getBoundingClientRect();
                const p = Math.max(5, Math.min(100, ((clientX - r.left) / r.width) * 100));
                setZoomPct(p);
              };
              update(e.clientX);
              const onMove = (ev: PointerEvent) => update(ev.clientX);
              const onUp = () => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
              };
              window.addEventListener("pointermove", onMove);
              window.addEventListener("pointerup", onUp);
            }}
          >
            <div
              className="relative h-full rounded-full bg-[#FF6B2C]"
              style={{ width: `${zoomPct}%` }}
            >
              <span className="absolute right-[-4px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-[#FF6B2C] bg-white shadow-md" />
            </div>
          </div>
          <ToolBtn title="Zoom In" onClick={() => setZoomPct((z) => Math.min(100, z + 10))}>
            <ZoomIn className="h-3.5 w-3.5" />
          </ToolBtn>
        </div>
      </div>

      {/* TRACKS LIST SCROLL GRID */}
      <div ref={scrollRef} className="scrollbar-thin overflow-x-auto overflow-y-auto flex-1 min-h-0">
        <div className="relative" style={{ width: totalWidth + 96 }}>

          {/* TIME RULE GRID HEADER */}
          <div className="relative flex h-6 select-none items-end border-b border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#181B22]">
            <div className="sticky left-0 z-30 w-24 flex-shrink-0 border-r border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#181B22]" />
            <div className="relative flex-1 h-full">
              {ticks.arr.map((t) => {
                const major = Math.round(t / ticks.step) % 5 === 0;
                return (
                  <div
                    key={t}
                    className="absolute bottom-0"
                    style={{ left: t * pxPerSec, height: major ? "100%" : "40%" }}
                  >
                    <div className={`w-px h-full ${major ? "bg-[#E8E4DE] dark:bg-[#2C313C]" : "bg-[#E8E4DE]/40 dark:bg-[#2C313C]/40"}`} />
                    {major && (
                      <span className="absolute left-1.5 top-0 text-[9px] font-mono text-[#666]/60 dark:text-[#A1A8B5]/60 font-semibold">
                        {fmtShort(t)}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Playhead needle */}
              <div
                className="absolute top-0 bottom-0 z-20 w-px bg-[#FF6B2C] pointer-events-none"
                style={{ left: currentTime * pxPerSec }}
              >
                <div className="absolute -top-px -left-[3.5px] h-0 w-0 border-x-[4px] border-t-[5.5px] border-x-transparent border-t-[#FF6B2C]" />
              </div>
            </div>
          </div>

          {/* 1. LAYERED VIDEO TRACK */}
          <div className="flex h-8.5 border-b border-[#E8E4DE]/60 dark:border-[#2C313C]/60 bg-[#FAF9F6] dark:bg-[#0F1117]">
            <div className="sticky left-0 z-30 flex w-24 flex-shrink-0 items-center gap-1.5 border-r border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#181B22] px-3.5 text-[9.5px] font-bold uppercase tracking-wider text-blue-500">
              <Video className="h-3.5 w-3.5" /> Video
            </div>
            <div className="relative flex-1 bg-[#F9F8F5] dark:bg-[#1F232D]/40">
              <div
                className="absolute top-[3px] bottom-[3px] rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-[#FAF9F6] dark:bg-[#181B22] opacity-60 flex items-center justify-center text-[9px] font-bold text-[#666] dark:text-[#A1A8B5]"
                style={{ left: 0, width: (duration || 0) * pxPerSec }}
              >
                [ Video Channel ]
              </div>
            </div>
          </div>

          {/* 2. LAYERED CAPTION TRACKS */}
          {Array.from({ length: numTracks }, (_, i) => {
            const trackNum = i + 1;

            // Layout styling configurations
            const trackLabels = [
              { color: "text-[#FF6B2C]", activeBorder: "border-[#FF6B2C]" },
              { color: "text-[#F59E0B]", activeBorder: "border-[#F59E0B]" },
              { color: "text-blue-400", activeBorder: "border-blue-400" },
              { color: "text-purple-400", activeBorder: "border-purple-400" },
              { color: "text-pink-400", activeBorder: "border-pink-400" },
              { color: "text-teal-400", activeBorder: "border-teal-400" },
            ];
            const trackStyle = trackLabels[i] || trackLabels[0];

            return (
              <div key={trackNum} className="flex h-9 border-b border-[#E8E4DE]/60 dark:border-[#2C313C]/60 bg-[#FAF9F6] dark:bg-[#0F1117]">
                <div className={`sticky left-0 z-30 flex w-24 flex-shrink-0 items-center justify-between border-r border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#181B22] pl-3.5 pr-1.5 text-[9.5px] font-bold uppercase tracking-wider ${trackStyle.color}`}>
                  <span className="truncate">Cap {trackNum}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onToggleLockTrack?.(trackNum)}
                      className={`h-5 w-5 rounded border flex items-center justify-center transition cursor-pointer ${lockedTracks.includes(trackNum)
                          ? "bg-red-500/10 border-red-500/30 text-red-400"
                          : "bg-[#F9F8F5] border-[#E8E4DE] text-[#666] hover:text-[#1A1A1A] dark:bg-[#1F232D] dark:border-[#2C313C] dark:text-[#A1A8B5] dark:hover:text-white"
                        }`}
                      title={lockedTracks.includes(trackNum) ? `Unlock Track ${trackNum}` : `Lock Track ${trackNum}`}
                    >
                      {lockedTracks.includes(trackNum) ? (
                        <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
                      ) : (
                        <Unlock className="h-2.5 w-2.5" strokeWidth={2.5} />
                      )}
                    </button>
                    {trackNum > 2 && (
                      <button
                        onClick={() => handleDeleteTrack(trackNum)}
                        className="h-5 w-5 rounded bg-[#F9F8F5] border border-[#E8E4DE] flex items-center justify-center text-[#666] hover:text-red-400 dark:bg-[#1F232D] dark:border-[#2C313C] dark:text-[#A1A8B5] transition cursor-pointer"
                        title={`Delete Track ${trackNum}`}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div
                  ref={(el) => {
                    if (trackNum === 1) trackRef.current = el;
                    if (el) trackRefs.current.set(trackNum, el);
                    else trackRefs.current.delete(trackNum);
                  }}
                  onPointerDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const t = Math.max(0, Math.min(duration, (e.clientX - rect.left) / pxPerSec));
                    onSeek(t);
                    setSelected(null);
                    setDrag({ kind: "scrub", startX: e.clientX });
                  }}
                  className="relative flex-1 cursor-crosshair bg-[#FAF9F6] dark:bg-[#0F1117]"
                >
                  {captions.filter(c => (!c.track && trackNum === 1) || c.track === trackNum).map((c) => {
                    const isActive = currentTime >= c.start && currentTime <= c.end;
                    const isSel = selected === c.id;

                    return (
                      <div
                        key={c.id}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setSelected(c.id);
                          onSeek(c.start);
                          if (lockedTracks.includes(trackNum)) return;
                          setDrag({
                            kind: "move",
                            id: c.id,
                            startX: e.clientX,
                            origStart: c.start,
                            origEnd: c.end,
                            origWords: c.words,
                          });
                        }}
                        onDoubleClick={() => {
                          if (!lockedTracks.includes(trackNum)) {
                            splitAt(c.id, currentTime);
                          }
                        }}
                        className={`group absolute top-[4px] bottom-[4px] flex items-center overflow-hidden rounded-lg border px-2.5 text-[10px] font-semibold transition shadow-md active:cursor-grabbing select-none ${isSel
                            ? `border-[#FF6B2C] bg-[#FF6B2C] text-white shadow-[0_0_12px_rgba(255,107,44,0.3)]`
                            : isActive
                              ? `border-[#FF6B2C] bg-white dark:bg-[#1F232D] text-[#1A1A1A] dark:text-white`
                              : `border-[#E8E4DE] bg-white dark:border-[#2C313C] dark:bg-[#1F232D] text-[#666] dark:text-[#A1A8B5] hover:border-[#FF6B2C]/50 hover:text-[#1A1A1A] dark:hover:text-white`
                          } ${lockedTracks.includes(trackNum) ? "cursor-default" : "cursor-grab"}`}
                        style={{
                          left: c.start * pxPerSec,
                          width: Math.max(12, (c.end - c.start) * pxPerSec),
                        }}
                        title={c.text}
                      >
                        {!lockedTracks.includes(trackNum) && (
                          <>
                            {/* Resize handle left */}
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
                              className="absolute inset-y-0 left-0 w-2.5 cursor-ew-resize hover:bg-[#FF6B2C]/20"
                            />
                            {/* Resize handle right */}
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
                              className="absolute inset-y-0 right-0 w-2.5 cursor-ew-resize hover:bg-[#FF6B2C]/20"
                            />
                          </>
                        )}
                        <span className="pointer-events-none truncate select-none">{c.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 3. LAYERED AUDIO TRACK */}
          <div className="flex h-10 border-b border-[#E8E4DE]/60 dark:border-[#2C313C]/60 bg-[#FAF9F6] dark:bg-[#0F1117]">
            <div className="sticky left-0 z-30 flex w-24 flex-shrink-0 items-center gap-1.5 border-r border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#181B22] px-3.5 text-[9.5px] font-bold uppercase tracking-wider text-[#22C55E]">
              <Music className="h-3.5 w-3.5" /> Audio
            </div>
            <div className="relative flex-1 overflow-hidden bg-[#F9F8F5] dark:bg-[#1F232D]/10">
              <div className="absolute inset-0 flex items-center gap-px px-1">
                {wave.map((h, i) => {
                  const played = i / wave.length < (duration ? currentTime / duration : 0);
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-[1.5px] transition-all duration-300"
                      style={{
                        height: `${h * 90}%`,
                        minHeight: 2,
                        background: played ? "#22C55E" : "rgba(34,197,94,0.45)",
                        opacity: played ? 0.9 : 0.35,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* TIMELINE TRANSPORT CONTROLS BAR */}
      <div className="flex h-11 flex-shrink-0 items-center gap-4 border-t border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#181B22] px-4 select-none justify-between">
        <div className="flex items-center gap-2">
          <SkipBtn title="To Start" onClick={() => onSeek(0)}>
            <SkipBack className="h-3.5 w-3.5" />
          </SkipBtn>
          <SkipBtn title="Step Backward (1s)" onClick={() => onSeek(Math.max(0, currentTime - 1))}>
            <ChevronsLeft className="h-3.5 w-3.5" />
          </SkipBtn>
          <button
            onClick={onTogglePlay}
            disabled={!onTogglePlay}
            title="Play / Pause"
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-[#FF6B2C] text-white hover:bg-[#FF874D] shadow-md shadow-orange-500/10 cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            {playing ? (
              <Pause className="h-3.5 w-3.5 fill-current" />
            ) : (
              <Play className="h-3.5 w-3.5 translate-x-[0.5px] fill-current" />
            )}
          </button>
          <SkipBtn title="Step Forward (1s)" onClick={() => onSeek(Math.min(duration, currentTime + 1))}>
            <ChevronsRight className="h-3.5 w-3.5" />
          </SkipBtn>
          <SkipBtn title="To End" onClick={() => onSeek(duration)}>
            <SkipForward className="h-3.5 w-3.5" />
          </SkipBtn>
        </div>

        {/* Time slider */}
        <div
          className="relative h-1 flex-1 max-w-[420px] cursor-pointer rounded-full bg-[#E8E4DE] dark:bg-[#2C313C] hidden sm:block"
          onPointerDown={(e) => {
            const el = e.currentTarget;
            const update = (clientX: number) => {
              const r = el.getBoundingClientRect();
              const t = Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * (duration || 0);
              onSeek(t);
            };
            update(e.clientX);
            const onMove = (ev: PointerEvent) => update(ev.clientX);
            const onUp = () => {
              window.removeEventListener("pointermove", onMove);
              window.removeEventListener("pointerup", onUp);
            };
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
          }}
        >
          <div
            className="relative h-full rounded-full bg-[#FF6B2C]"
            style={{ width: `${phPct}%` }}
          >
            <span className="absolute right-[-4px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white border border-[#FF6B2C] shadow-md" />
          </div>
        </div>

        {/* Playhead Pos / Duration */}
        <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#666] dark:text-[#A1A8B5]">
          <span className="text-[#FF6B2C]">{fmtMs(currentTime)}</span>
          <span className="opacity-45">/</span>
          <span>{fmtMs(duration)}</span>
        </div>
      </div>

      {/* TIMELINE BOTTOM STATUS INFORMATION BAR */}
      <div className="flex h-6.5 flex-shrink-0 flex-wrap items-center gap-3 border-t border-[#E8E4DE] dark:border-[#2C313C] bg-[#F9F8F6] dark:bg-[#0F1117] px-4 text-[9px] text-[#666] dark:text-[#A1A8B5] font-mono select-none">
        <Pill dot="#22C55E">Audio Engine Ready · 48kHz</Pill>
        <Sep />
        <Pill dot="#FF6B2C">{captions.length} Timed Segments</Pill>
        <Sep />
        <Pill dot="#FF874D">{selectedCaption ? "Selected Clip Active" : "No clip selected"}</Pill>
        <span className="ml-auto font-bold">
          Duration: {duration ? `${duration.toFixed(2)}s` : "0.00s"}
        </span>
      </div>

    </div>
  );
}

/* Helpers */
function ToolGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 border-r border-[#E8E4DE] dark:border-[#2C313C] px-2.5 first:pl-0 last:border-r-0">
      {children}
    </div>
  );
}

function ToolBtn({
  children, title, active, tone, disabled, onClick,
}: {
  children: React.ReactNode; title: string; active?: boolean; tone?: "violet"; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all cursor-pointer hover:scale-105 active:scale-95 ${active
          ? "bg-[#FF6B2C] border-[#FF6B2C] text-white shadow-md shadow-orange-500/10"
          : "bg-[#F9F8F5] border-[#E8E4DE] text-[#666] hover:border-[#FF6B2C]/40 hover:text-[#1A1A1A] dark:bg-[#1F232D] dark:border-[#2C313C] dark:text-[#A1A8B5] dark:hover:text-white"
        } disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function SkipBtn({
  children, title, onClick,
}: {
  children: React.ReactNode; title: string; onClick?: () => void;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F9F8F5] border border-[#E8E4DE] text-[#666] hover:text-[#1A1A1A] hover:border-[#FF6B2C]/40 dark:bg-[#1F232D] dark:border-[#2C313C] dark:text-[#A1A8B5] dark:hover:text-white transition hover:scale-105 active:scale-95 cursor-pointer"
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="h-2.5 w-px bg-[#E8E4DE] dark:bg-[#2C313C]" />;
}

function Pill({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[8.5px]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
      {children}
    </span>
  );
}
