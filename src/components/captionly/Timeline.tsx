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
  const [zoomPct, setZoomPct] = useState(40); // 5–100
  const selected = selectedId ?? null;
  const setSelected = onSelect ?? (() => {});
  const [drag, setDrag] = useState<DragState>(null);
  const [snap, setSnap] = useState(true);

  const trackRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [numTracks, setNumTracks] = useState(() => {
    const maxCapTrack = captions.reduce((max, c) => Math.max(max, c.track || 1), 2);
    return Math.max(2, Math.min(6, maxCapTrack));
  });
  const trackRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Map zoomPct (5–100) → pxPerSec (12 → 240)
  const pxPerSec = useMemo(() => {
    const min = 12;
    const max = 240;
    return min + ((zoomPct - 5) / 95) * (max - min);
  }, [zoomPct]);

  const totalWidth = Math.max(400, (duration || 0) * pxPerSec);

  // Build static fake "cap2" / waveform data deterministically
  const wave = useMemo(() => {
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
      return Math.abs(seed) / 0x7fffffff;
    };
    const N = 200;
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
            
            // Determine if dragging vertically to the closest track
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
        id: crypto.randomUUID(),
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
    [captions, onChange, selected, lockedTracks],
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
      id: crypto.randomUUID(),
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
  }, [captions, currentTime, duration, onChange, numTracks, lockedTracks]);

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

  // Scroll bg areas in sync with cap1 track
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Auto-scroll playhead into view
    const phX = currentTime * pxPerSec;
    if (phX < el.scrollLeft + 40) el.scrollLeft = Math.max(0, phX - 40);
    else if (phX > el.scrollLeft + el.clientWidth - 80)
      el.scrollLeft = phX - el.clientWidth + 80;
  }, [currentTime, pxPerSec]);

  const allTracksLocked = useMemo(() => {
    return Array.from({ length: numTracks }, (_, i) => i + 1).every((t) => lockedTracks.includes(t));
  }, [numTracks, lockedTracks]);

  return (
    <div className="flex flex-col border-t border-[#e8e4de] bg-white h-full" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* TOOLBAR */}
      <div className="flex h-9 flex-shrink-0 items-center border-b border-[#e8e4de] bg-white px-2.5">
        <ToolGroup>
          <button
            aria-label="Add text caption"
            onClick={handleAddCaption}
            disabled={allTracksLocked}
            className="inline-flex h-6 items-center gap-1 rounded border border-[#ff5c3a] bg-[#fff5f3] px-2 text-[11px] font-medium text-[#ff5c3a] hover:bg-[#ffd5cc] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus className="h-3 w-3" strokeWidth={2} /> Text
          </button>
          <button
            aria-label="Add caption track"
            onClick={() => setNumTracks((prev) => Math.min(6, prev + 1))}
            disabled={numTracks >= 6}
            className="inline-flex h-6 items-center gap-1 rounded border border-[#ffd5cc] bg-[#fff5f3] px-2 text-[11px] font-medium text-[#ff5c3a] hover:bg-[#ffd5cc] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus className="h-3 w-3" strokeWidth={2} /> Track
          </button>
        </ToolGroup>
        <ToolGroup>
          <ToolBtn
            title="Delete selected"
            disabled={!selectedCaption || lockedTracks.includes(selectedCaption.track || 1)}
            onClick={() => selectedCaption && remove(selectedCaption.id)}
          >
            <Trash2 className="h-3 w-3" />
          </ToolBtn>
        </ToolGroup>

        <ToolGroup>
          <ToolBtn
            title="Split at playhead"
            tone="violet"
            onClick={() => {
              const target = selectedCaption || activeCaptionAtPlayhead;
              if (target) splitAt(target.id, currentTime);
            }}
            disabled={
              (!selectedCaption && !activeCaptionAtPlayhead) ||
              lockedTracks.includes((selectedCaption || activeCaptionAtPlayhead)?.track || 1)
            }
          >
            <Scissors className="h-3 w-3" />
          </ToolBtn>
        </ToolGroup>
        <ToolGroup>
          <ToolBtn title="Undo" onClick={onUndo} disabled={!canUndo}>
            <Undo2 className="h-3 w-3" />
          </ToolBtn>
          <ToolBtn title="Redo" onClick={onRedo} disabled={!canRedo}>
            <Redo2 className="h-3 w-3" />
          </ToolBtn>
        </ToolGroup>
        <ToolGroup>
          <ToolBtn title="Snap to grid" active={snap} onClick={() => setSnap((v) => !v)}>
            <ChevronsLeftRight className="h-3 w-3" />
          </ToolBtn>
        </ToolGroup>
        <div className="ml-auto flex items-center gap-1.5 pl-2">
          <ToolBtn title="Zoom out" onClick={() => setZoomPct((z) => Math.max(5, z - 10))}>
            <ZoomOut className="h-3 w-3" />
          </ToolBtn>
          <div
            className="relative h-[3px] w-[70px] cursor-pointer rounded bg-[#e8e4de]"
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
              className="relative h-full rounded bg-[#ff5c3a]"
              style={{ width: `${zoomPct}%` }}
            >
              <span className="absolute right-[-4px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border-2 border-[#ff5c3a] bg-white shadow-[0_0_4px_rgba(255,92,58,0.3)]" />
            </div>
          </div>
          <ToolBtn title="Zoom in" onClick={() => setZoomPct((z) => Math.min(100, z + 10))}>
            <ZoomIn className="h-3 w-3" />
          </ToolBtn>
        </div>
      </div>

      {/* SCROLL: ruler + tracks */}
      <div ref={scrollRef} className="scrollbar-thin overflow-x-auto overflow-y-auto flex-1 min-h-0">
        <div className="relative" style={{ width: totalWidth + 92 }}>
          {/* RULER */}
          <div className="relative flex h-5 select-none items-end border-b border-[#e8e4de] bg-[#faf9f7]">
            <div className="sticky left-0 z-30 w-[84px] flex-shrink-0 border-r border-[#e8e4de] bg-[#faf9f7]" />
            <div className="relative flex-1" style={{ height: "100%" }}>
              {ticks.arr.map((t) => {
                const major = Math.round(t / ticks.step) % 5 === 0;
                return (
                  <div
                    key={t}
                    className="absolute bottom-0"
                    style={{ left: t * pxPerSec, height: major ? "100%" : "50%" }}
                  >
                    <div
                      className={`w-px ${major ? "h-full bg-[#1a1a1a]/20" : "h-full bg-[#1a1a1a]/8"}`}
                    />
                    {major && (
                      <span
                        className="absolute left-[2px] top-0 text-[8.5px] text-[#1a1a1a]/40"
                        style={{ fontFamily: "ui-monospace, monospace" }}
                      >
                        {fmtShort(t)}
                      </span>
                    )}
                  </div>
                );
              })}
              <div
                className="absolute top-0 bottom-0 z-20 w-px bg-[#ff5c3a]"
                style={{ left: currentTime * pxPerSec }}
              >
                <div className="absolute -top-px -left-[3px] h-0 w-0 border-x-[3.5px] border-t-[5px] border-x-transparent border-t-[#ff5c3a]" />
              </div>
            </div>
          </div>

          {Array.from({ length: numTracks }, (_, i) => {
            const trackNum = i + 1;
            // Distinct labels colors for each track
            const labelColors = [
              "text-[#ff5c3a]",        // CAP 1
              "text-[#d4a843]/70",     // CAP 2
              "text-blue-500/80",      // CAP 3
              "text-purple-500/80",    // CAP 4
              "text-pink-500/80",      // CAP 5
              "text-teal-500/80",      // CAP 6
            ];
            const labelColor = labelColors[i] || "text-[#ff5c3a]";
            
            // Distinct styling for active caption items per track
            const activeBgColors = [
              "border-[#ff5c3a] bg-[#fff5f3] text-[#ff5c3a]",
              "border-[#d4a843] bg-[#fffbeb] text-[#d4a843]",
              "border-blue-500 bg-blue-50 text-blue-600",
              "border-purple-500 bg-purple-50 text-purple-600",
              "border-pink-500 bg-pink-50 text-pink-600",
              "border-teal-500 bg-teal-50 text-teal-600",
            ];
            const activeBgColor = activeBgColors[i] || activeBgColors[0];
            
            // Distinct styling for selected caption items per track
            const selectedColors = [
              "border-[#ff7558] bg-[#ff5c3a] text-white shadow-[0_0_0_2px_#ffd5cc]",
              "border-[#d4a843] bg-[#d4a843] text-white shadow-[0_0_0_2px_#fef3c7]",
              "border-blue-600 bg-blue-500 text-white shadow-[0_0_0_2px_#dbeafe]",
              "border-purple-600 bg-purple-500 text-white shadow-[0_0_0_2px_#f3e8ff]",
              "border-pink-600 bg-pink-500 text-white shadow-[0_0_0_2px_#fce7f3]",
              "border-teal-600 bg-teal-500 text-white shadow-[0_0_0_2px_#ccfbf1]",
            ];
            const selectedColor = selectedColors[i] || selectedColors[0];

            // Distinct styling for inactive/default caption items per track
            const defaultColors = [
              "border-[#ffd5cc] bg-[#fff5f3]/80 text-[#ff5c3a]",
              "border-[#f59e0b]/30 bg-[#fffbeb]/80 text-[#d4a843]",
              "border-blue-200 bg-blue-50/50 text-blue-500",
              "border-purple-200 bg-purple-50/50 text-purple-500",
              "border-pink-200 bg-pink-50/50 text-pink-500",
              "border-teal-200 bg-teal-50/50 text-teal-500",
            ];
            const defaultColor = defaultColors[i] || defaultColors[0];

            return (
              <div key={trackNum} className="flex h-8 border-b border-[#f5f3ee]">
                <div className={`sticky left-0 z-30 flex w-[84px] flex-shrink-0 items-center justify-between border-r border-[#e8e4de] bg-[#faf9f7] pl-1.5 pr-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] ${labelColor}`}>
                  <div className="flex items-center gap-0.5 truncate">
                    <Square /> CAP {trackNum}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {/* Lock button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLockTrack?.(trackNum);
                      }}
                      className={`h-[18px] w-[18px] rounded border flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                        lockedTracks.includes(trackNum)
                          ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
                          : "bg-white border-[#e8e4de] text-neutral-500 hover:bg-[#f5f3ee] hover:text-neutral-800"
                      }`}
                      title={lockedTracks.includes(trackNum) ? `Unlock CAP ${trackNum} track` : `Lock CAP ${trackNum} track`}
                    >
                      {lockedTracks.includes(trackNum) ? (
                        <Lock className="h-2.5 w-2.5" strokeWidth={2.4} />
                      ) : (
                        <Unlock className="h-2.5 w-2.5" strokeWidth={2.4} />
                      )}
                    </button>

                    {/* Delete button */}
                    {trackNum > 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTrack(trackNum);
                        }}
                        className="rounded p-0.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer flex items-center justify-center"
                        title={`Delete CAP ${trackNum} track`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div
                  ref={(el) => {
                    if (trackNum === 1) trackRef.current = el;
                    if (el) {
                      trackRefs.current.set(trackNum, el);
                    } else {
                      trackRefs.current.delete(trackNum);
                    }
                  }}
                  onPointerDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const t = Math.max(0, Math.min(duration, (e.clientX - rect.left) / pxPerSec));
                    onSeek(t);
                    setSelected(null);
                    setDrag({ kind: "scrub", startX: e.clientX });
                  }}
                  className="relative flex-1 cursor-crosshair overflow-hidden bg-white"
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
                        className={`group absolute top-[3px] bottom-[3px] flex items-center overflow-hidden rounded-[3px] border px-1.5 text-[8.5px] font-medium transition active:cursor-grabbing ${
                          isSel
                            ? selectedColor
                            : isActive
                            ? activeBgColor
                            : defaultColor
                        } ${lockedTracks.includes(trackNum) ? "cursor-default" : "cursor-grab"}`}
                        style={{
                          left: c.start * pxPerSec,
                          width: Math.max(6, (c.end - c.start) * pxPerSec),
                          fontFamily: "ui-monospace, monospace",
                        }}
                        title={c.text}
                      >
                        {!lockedTracks.includes(trackNum) && (
                          <>
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
                              className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize hover:bg-white/30"
                            />
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
                              className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize hover:bg-white/30"
                            />
                          </>
                        )}
                        <span className="pointer-events-none truncate">{c.text}</span>
                      </div>
                    );
                  })}
                  <div
                    className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-[#ff5c3a]/40"
                    style={{ left: currentTime * pxPerSec }}
                  />
                </div>
              </div>
            );
          })}

          {/* AUDIO waveform */}
          <div className="flex h-[38px]">
            <div className="sticky left-0 z-30 flex w-[84px] flex-shrink-0 items-center gap-1 border-r border-[#e8e4de] bg-[#faf9f7] px-2 text-[9px] font-semibold uppercase tracking-[0.06em] text-emerald-500">
              <Square /> AUDIO
            </div>
            <div className="relative flex-1 overflow-hidden bg-white">
              <div className="absolute inset-0 flex items-center gap-px px-1">
                {wave.map((h, i) => {
                  const played = i / wave.length < (duration ? currentTime / duration : 0);
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-[1px]"
                      style={{
                        height: `${h * 100}%`,
                        minHeight: 2,
                        background: played ? "#10b981" : "rgba(16,185,129,0.5)",
                        opacity: played ? 0.85 : 0.3,
                      }}
                    />
                  );
                })}
              </div>
              <div
                className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-[#ff5c3a]/60"
                style={{ left: currentTime * pxPerSec }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* TRANSPORT BAR */}
      <div className="flex h-9 flex-shrink-0 items-center gap-1.5 border-t border-[#e8e4de] bg-[#faf9f7] px-2.5">
        <div className="flex items-center gap-0.5">
          <SkipBtn title="To start" onClick={() => onSeek(0)}>
            <SkipBack className="h-[11px] w-[11px]" />
          </SkipBtn>
          <SkipBtn title="Step back" onClick={() => onSeek(Math.max(0, currentTime - 1))}>
            <ChevronsLeft className="h-[11px] w-[11px]" />
          </SkipBtn>
          <button
            onClick={onTogglePlay}
            disabled={!onTogglePlay}
            title="Play / Pause"
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-[1.5px] border-[#ff5c3a] bg-[#ff5c3a] text-white transition hover:bg-[#ff7558] disabled:opacity-50"
          >
            {playing ? (
              <Pause className="h-[10px] w-[10px] fill-current" />
            ) : (
              <Play className="h-[10px] w-[10px] translate-x-[1px] fill-current" />
            )}
          </button>
          <SkipBtn
            title="Step forward"
            onClick={() => onSeek(Math.min(duration, currentTime + 1))}
          >
            <ChevronsRight className="h-[11px] w-[11px]" />
          </SkipBtn>
          <SkipBtn title="To end" onClick={() => onSeek(duration)}>
            <SkipForward className="h-[11px] w-[11px]" />
          </SkipBtn>
        </div>
        <div
          className="min-w-[66px] text-[11px] font-semibold tracking-[0.03em] text-[#ff5c3a]"
          style={{ fontFamily: "ui-monospace, monospace" }}
        >
          {fmtMs(currentTime)}
        </div>
        <div
          className="relative h-1 flex-1 cursor-pointer rounded-full bg-[#e8e4de]"
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
            className="relative h-full rounded-full bg-[#ff5c3a]"
            style={{ width: `${phPct}%` }}
          >
            <span className="absolute right-[-5px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-[#ff5c3a] bg-white shadow-[0_0_6px_rgba(255,92,58,0.3)]" />
          </div>
        </div>
        <div
          className="min-w-[60px] text-right text-[10px] text-[#b0aba4]"
          style={{ fontFamily: "ui-monospace, monospace" }}
        >
          / {fmtMs(duration)}
        </div>
      </div>

      {/* INFO BAR */}
      <div className="flex h-6 flex-shrink-0 flex-wrap items-center gap-3 border-t border-[#e8e4de] bg-[#f5f3ee] px-3 text-[9px] text-[#b0aba4]" style={{ fontFamily: "ui-monospace, monospace" }}>
        <Pill dot="#10b981">Audio · 48kHz</Pill>
        <Sep />
        <Pill dot="#ffd5cc">{captions.length} caption segments</Pill>
        <Sep />
        <Pill dot="#ff5c3a">{selectedCaption ? "1 selected" : "0 selected"}</Pill>
        <span className="ml-auto">
          {duration ? `${duration.toFixed(2)}s` : "—"}
        </span>
      </div>


    </div>
  );
}

/* ---------- helpers ---------- */
function ToolGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-0.5 border-r border-[#e8e4de] px-1.5 first:pl-0 last:border-r-0">
      {children}
    </div>
  );
}
function ToolBtn({
  children,
  title,
  active,
  tone,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  active?: boolean;
  tone?: "violet";
  disabled?: boolean;
  onClick?: () => void;
}) {
  const base =
    "flex h-6 w-6 items-center justify-center rounded transition disabled:opacity-40 disabled:cursor-not-allowed";
  const cls = active
    ? "bg-[#fff5f3] text-[#ff5c3a]"
    : tone === "violet"
    ? "text-violet-500 hover:bg-[#f5f3ee] hover:text-violet-600"
    : "text-[#b0aba4] hover:bg-[#f5f3ee] hover:text-[#1a1a1a]";
  return (
    <button title={title} aria-label={title} aria-pressed={active} onClick={onClick} disabled={disabled} className={`${base} ${cls}`}>
      {children}
    </button>
  );
}
function SkipBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className="flex h-[22px] w-[22px] items-center justify-center rounded text-[#b0aba4] transition hover:bg-[#e8e4de] hover:text-[#1a1a1a]"
    >
      {children}
    </button>
  );
}
function Square() {
  return (
    <span className="inline-block h-2 w-2 rounded-[2px] border border-current" aria-hidden />
  );
}
function Sep() {
  return <span className="h-2.5 w-px bg-[#e8e4de]" />;
}
function Pill({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-[5px] w-[5px] rounded-full" style={{ background: dot }} />
      {children}
    </span>
  );
}
