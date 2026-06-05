import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronsLeftRight,
  ChevronsLeft,
  ChevronsRight,
  Lock,
  Pause,
  Play,
  Plus,
  Redo2,
  Scissors,
  SkipBack,
  SkipForward,
  Sparkles,
  Trash2,
  Undo2,
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
  | { kind: "move"; id: string; startX: number; origStart: number; origEnd: number }
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
}: Props) {
  const [zoomPct, setZoomPct] = useState(40); // 5–100
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState>(null);
  const [snap, setSnap] = useState(true);
  const [locked, setLocked] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cap1Ref = useRef<HTMLDivElement>(null);

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
      if (locked) return;
      const dx = e.clientX - drag.startX;
      const dt = dx / pxPerSec;
      onChange(
        captions.map((c) => {
          if (c.id !== drag.id) return c;
          if (drag.kind === "move") {
            const len = drag.origEnd - drag.origStart;
            let start = Math.max(0, Math.min(duration - len, drag.origStart + dt));
            if (snap) start = Math.round(start * 10) / 10;
            return { ...c, start, end: start + len };
          }
          if (drag.kind === "resize-l") {
            let start = Math.max(0, Math.min(drag.origEnd - 0.1, drag.origStart + dt));
            if (snap) start = Math.round(start * 10) / 10;
            return { ...c, start };
          }
          let end = Math.max(drag.origStart + 0.1, Math.min(duration, drag.origEnd + dt));
          if (snap) end = Math.round(end * 10) / 10;
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
  }, [drag, captions, duration, pxPerSec, onChange, onSeek, snap, locked]);

  const splitAt = useCallback(
    (id: string, time: number) => {
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
    },
    [captions, onChange],
  );

  const remove = useCallback(
    (id: string) => {
      onChange(captions.filter((c) => c.id !== id));
      if (selected === id) setSelected(null);
    },
    [captions, onChange, selected],
  );

  const selectedCaption = captions.find((c) => c.id === selected) ?? null;
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

  return (
    <div className="flex flex-col border-t border-[#e8e4de] bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* TOOLBAR */}
      <div className="flex h-9 flex-shrink-0 items-center border-b border-[#e8e4de] bg-white px-2.5">
        <ToolGroup>
          <button className="inline-flex h-6 items-center gap-1 rounded border border-[#ff5c3a] bg-[#fff5f3] px-2 text-[11px] font-medium text-[#ff5c3a] hover:bg-[#ffd5cc]">
            <Plus className="h-3 w-3" strokeWidth={2} /> Text
          </button>
        </ToolGroup>
        <ToolGroup>
          <ToolBtn
            title="Delete selected"
            disabled={!selectedCaption}
            onClick={() => selectedCaption && remove(selectedCaption.id)}
          >
            <Trash2 className="h-3 w-3" />
          </ToolBtn>
        </ToolGroup>
        <ToolGroup>
          <ToolBtn title="Auto-transcribe" tone="violet">
            <Sparkles className="h-3 w-3" />
          </ToolBtn>
          <ToolBtn
            title="Split at playhead"
            tone="violet"
            onClick={() => selectedCaption && splitAt(selectedCaption.id, currentTime)}
            disabled={!selectedCaption}
          >
            <Scissors className="h-3 w-3" />
          </ToolBtn>
        </ToolGroup>
        <ToolGroup>
          <ToolBtn title="Undo">
            <Undo2 className="h-3 w-3" />
          </ToolBtn>
          <ToolBtn title="Redo">
            <Redo2 className="h-3 w-3" />
          </ToolBtn>
        </ToolGroup>
        <ToolGroup>
          <ToolBtn title="Snap to grid" active={snap} onClick={() => setSnap((v) => !v)}>
            <ChevronsLeftRight className="h-3 w-3" />
          </ToolBtn>
          <ToolBtn title="Lock track" active={locked} onClick={() => setLocked((v) => !v)}>
            <Lock className="h-3 w-3" />
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
      <div ref={scrollRef} className="scrollbar-thin overflow-x-auto overflow-y-hidden">
        <div className="relative" style={{ width: totalWidth + 80 }}>
          {/* RULER */}
          <div className="relative flex h-5 select-none items-end border-b border-[#e8e4de] bg-[#faf9f7]">
            <div className="w-[72px] flex-shrink-0 border-r border-[#e8e4de]" />
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

          {/* CAP 1 (functional) */}
          <div className="flex h-8 border-b border-[#f5f3ee]">
            <div className="flex w-[72px] flex-shrink-0 items-center gap-1 border-r border-[#e8e4de] bg-[#faf9f7] px-2 text-[9px] font-semibold uppercase tracking-[0.06em] text-[#ff5c3a]">
              <Square /> CAP 1
            </div>
            <div
              ref={(el) => {
                trackRef.current = el;
                cap1Ref.current = el;
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
                      if (locked) return;
                      setDrag({
                        kind: "move",
                        id: c.id,
                        startX: e.clientX,
                        origStart: c.start,
                        origEnd: c.end,
                      });
                    }}
                    onDoubleClick={() => splitAt(c.id, currentTime)}
                    className={`group absolute top-[3px] bottom-[3px] flex items-center overflow-hidden rounded-[3px] border px-1.5 text-[8.5px] font-medium transition active:cursor-grabbing ${
                      isSel
                        ? "z-[3] border-[#ff7558] bg-[#ff5c3a] text-white shadow-[0_0_0_2px_#ffd5cc]"
                        : isActive
                        ? "border-[#ff5c3a] bg-[#fff5f3] text-[#ff5c3a]"
                        : "border-[#ffd5cc] bg-[#fff5f3]/80 text-[#ff5c3a] hover:brightness-95"
                    } ${locked ? "cursor-default" : "cursor-grab"}`}
                    style={{
                      left: c.start * pxPerSec,
                      width: Math.max(6, (c.end - c.start) * pxPerSec),
                      fontFamily: "ui-monospace, monospace",
                    }}
                    title={c.text}
                  >
                    {!locked && (
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
                className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-[#ff5c3a]/60"
                style={{ left: currentTime * pxPerSec }}
              />
            </div>
          </div>

          {/* CAP 2 (decorative ghost track) */}
          <div className="flex h-8 border-b border-[#f5f3ee]">
            <div className="flex w-[72px] flex-shrink-0 items-center gap-1 border-r border-[#e8e4de] bg-[#faf9f7] px-2 text-[9px] font-semibold uppercase tracking-[0.06em] text-[#d4a843]/70">
              <Square /> CAP 2
            </div>
            <div className="relative flex-1 overflow-hidden bg-white">
              <div
                className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-[#ff5c3a]/40"
                style={{ left: currentTime * pxPerSec }}
              />
            </div>
          </div>

          {/* AUDIO waveform */}
          <div className="flex h-[38px]">
            <div className="flex w-[72px] flex-shrink-0 items-center gap-1 border-r border-[#e8e4de] bg-[#faf9f7] px-2 text-[9px] font-semibold uppercase tracking-[0.06em] text-emerald-500">
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

      {/* Inline editor for selected caption */}
      {selectedCaption && (
        <div className="flex items-center gap-2 border-t border-[#e8e4de] bg-white px-3 py-2">
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
            style={{ fontFamily: "ui-monospace, monospace" }}
          >
            {fmtShort(selectedCaption.start)} → {fmtShort(selectedCaption.end)}
          </span>
        </div>
      )}
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
