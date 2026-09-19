import React, { useRef, useEffect, useMemo, useState } from "react";
import type { Caption, TimelineEffect, TimelineAudioClip, TimelineTrackId } from "@/lib/captions/types";
import type { VideoThumbnail } from "@/lib/captions/thumbnails";
import { COLLAPSED_TRACK_HEIGHT, TRACK_CONFIGS } from "./TrackSidebar";
import { Smile, Sparkles, Volume2, Plus, Film } from "lucide-react";

export type DragKind =
  | "move"
  | "resize-l"
  | "resize-r";

export interface ActiveDragInfo {
  kind: DragKind;
  id: string;
  trackId: TimelineTrackId;
  startX: number;
  origStart: number;
  origEnd: number;
  origWords?: Caption["words"];
}

interface TrackLanesProps {
  duration: number;
  currentTime: number;
  pxPerSec: number;
  totalWidth: number;
  captions: Caption[];
  effects: TimelineEffect[];
  audioClips: TimelineAudioClip[];
  vocalWaveform: number[];
  videoThumbnails: VideoThumbnail[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  trackVisibility: Record<TimelineTrackId, boolean>;
  trackLocks: Record<TimelineTrackId, boolean>;
  trackCollapsed: Record<TimelineTrackId, boolean>;
  onStartDrag: (info: ActiveDragInfo) => void;
  snapGuideTime: number | null;
  onQuickAdd: (trackId: TimelineTrackId) => void;
  onAddAfter?: (captionId: string) => void;
  onUpdateText?: (captionId: string, text: string) => void;
}

export const TrackLanes: React.FC<TrackLanesProps> = ({
  duration,
  currentTime,
  pxPerSec,
  totalWidth,
  captions,
  effects,
  audioClips,
  vocalWaveform,
  videoThumbnails,
  selectedId,
  onSelect,
  trackVisibility,
  trackLocks,
  trackCollapsed,
  onStartDrag,
  snapGuideTime,
  onQuickAdd,
  onAddAfter,
  onUpdateText,
}) => {
  const vocalCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioSfxCanvasRef = useRef<HTMLCanvasElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus the input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const commitEdit = () => {
    if (editingId && onUpdateText) {
      onUpdateText(editingId, editText.trim() || "Secondary text");
    }
    setEditingId(null);
    setEditText("");
  };

  const startEdit = (c: Caption) => {
    setEditingId(c.id);
    setEditText(c.text);
  };

  // Group captions into tracks
  const caption1Items = useMemo(
    () => captions.filter((c) => !c.mediaType && (c.track || 1) === 1),
    [captions]
  );
  const caption2Items = useMemo(
    () => captions.filter((c) => !c.mediaType && c.track === 2),
    [captions]
  );
  const memeGifItems = useMemo(
    () => captions.filter((c) => Boolean(c.mediaType) || c.track === 3),
    [captions]
  );

  // Draw real vocal waveform (centered mirrored waveform)
  useEffect(() => {
    const canvas = vocalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (!vocalWaveform || vocalWaveform.length === 0) return;

    const midY = height / 2;
    const numBars = vocalWaveform.length;
    const barWidth = Math.max(1, width / numBars);

    // Baseline center line
    ctx.strokeStyle = "rgba(16, 185, 129, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    for (let i = 0; i < numBars; i++) {
      const amp = vocalWaveform[i];
      const x = i * barWidth;
      // Centered mirrored height
      const halfH = Math.max(1, amp * (height / 2 - 2));

      // Color variation based on vocal energy: louder = brighter emerald
      const isLoud = amp > 0.65;
      const isQuiet = amp < 0.15;
      const isSilence = amp <= 0.03;

      if (isSilence) {
        ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
        ctx.fillRect(x, midY - 0.5, Math.max(1, barWidth - 0.5), 1);
      } else {
        ctx.fillStyle = isLoud
          ? "rgba(52, 211, 153, 0.95)"
          : isQuiet
          ? "rgba(16, 185, 129, 0.5)"
          : "rgba(16, 185, 129, 0.78)";

        // Top half
        ctx.fillRect(x, midY - halfH, Math.max(1, barWidth - 0.5), halfH);
        // Bottom mirrored half
        ctx.fillRect(x, midY, Math.max(1, barWidth - 0.5), halfH);
      }
    }
  }, [vocalWaveform, totalWidth]);

  // Draw Audio / SFX waveform
  useEffect(() => {
    const canvas = audioSfxCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (audioClips.length === 0) return;

    const midY = height / 2;
    // Draw clip waveform regions
    audioClips.forEach((clip) => {
      const clipLeft = clip.start * pxPerSec;
      const clipW = (clip.end - clip.start) * pxPerSec;
      const bars = Math.max(10, Math.floor(clipW / 3));

      ctx.fillStyle = "rgba(20, 184, 166, 0.7)";
      for (let b = 0; b < bars; b++) {
        const bx = clipLeft + (b / bars) * clipW;
        // Simulated audio wave contour
        const env = Math.sin((b / bars) * Math.PI);
        const amp = (Math.sin(b * 0.4) * 0.4 + 0.5) * env * (clip.volume || 1);
        const barH = Math.max(2, amp * (height / 2 - 3));
        ctx.fillRect(bx, midY - barH, 2, barH * 2);
      }
    });
  }, [audioClips, pxPerSec, totalWidth]);

  return (
    <div
      style={{ width: totalWidth }}
      className="relative flex flex-col bg-background/50 select-none overflow-hidden"
    >
      {/* Magnetic Snapping Guide Line */}
      {snapGuideTime !== null && (
        <div
          style={{ left: `${snapGuideTime * pxPerSec}px` }}
          className="absolute top-0 bottom-0 w-px bg-amber-400 z-40 pointer-events-none shadow-[0_0_8px_rgba(251,191,36,0.8)]"
        />
      )}

      {/* 1. 🎬 VIDEO TRACK */}
      <div
        style={{
          height: trackCollapsed.video ? COLLAPSED_TRACK_HEIGHT : TRACK_CONFIGS[0].defaultHeight,
          display: trackVisibility.video ? "flex" : "none",
        }}
        className="relative border-b border-border/80 bg-secondary/30 items-center overflow-hidden"
      >
        {/* Continuous Video Thumbnails Strip */}
        <div className="absolute inset-0 flex items-center overflow-hidden pointer-events-none opacity-85">
          {videoThumbnails.length > 0 ? (
            videoThumbnails.map((thumb, idx) => (
              <div
                key={idx}
                className="h-full border-r border-background/40 flex-shrink-0 relative overflow-hidden group"
              >
                <img
                  src={thumb.dataUrl}
                  alt={`Video frame at ${thumb.time.toFixed(1)}s`}
                  className="h-full w-auto object-cover select-none pointer-events-none"
                />
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 pl-4 text-muted-foreground/60 text-xs font-mono select-none">
              <Film className="h-4 w-4" />
              <span>Video timeline track</span>
            </div>
          )}
        </div>
        {/* Filmstrip perforation dots top & bottom */}
        <div className="absolute top-0 left-0 right-0 h-1 flex gap-2 pointer-events-none opacity-40 px-1">
          {Array.from({ length: Math.min(100, Math.floor(totalWidth / 16)) }).map((_, i) => (
            <div key={i} className="w-1.5 h-0.5 bg-background/80 rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* 2. 💬 CAPTION 1 TRACK (PRIMARY AI SPEECH) */}
      <div
        style={{
          height: trackCollapsed.caption1 ? COLLAPSED_TRACK_HEIGHT : TRACK_CONFIGS[1].defaultHeight,
          display: trackVisibility.caption1 ? "flex" : "none",
        }}
        className="relative border-b border-border/80 bg-background/40 items-center"
      >
        {caption1Items.map((c) => {
          const left = c.start * pxPerSec;
          const width = Math.max(20, (c.end - c.start) * pxPerSec);
          const isSelected = selectedId === c.id;
          const isLocked = trackLocks.caption1;
          const isCurrent = currentTime >= c.start && currentTime <= c.end;

          return (
            <React.Fragment key={c.id}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(c.id);
                }}
                style={{
                  left: `${left}px`,
                  width: `${width}px`,
                }}
                className={`absolute top-1 bottom-1 rounded-lg border flex items-center px-2 cursor-pointer transition-shadow select-none group overflow-hidden ${
                  isSelected
                    ? "bg-primary/25 border-primary shadow-glow text-foreground font-bold z-20"
                    : isCurrent
                    ? "bg-primary/15 border-primary/60 text-foreground z-10"
                    : "bg-secondary/90 hover:bg-secondary border-border/80 text-foreground/90 hover:border-primary/40"
                }`}
              >
                {/* Left Trim Handle */}
                {!isLocked && (
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onStartDrag({
                        kind: "resize-l",
                        id: c.id,
                        trackId: "caption1",
                        startX: e.clientX,
                        origStart: c.start,
                        origEnd: c.end,
                      });
                    }}
                    className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-primary/40 flex items-center justify-center transition-opacity"
                  >
                    <div className="w-0.5 h-3 bg-muted-foreground rounded-full" />
                  </div>
                )}

                {/* Clip Text Preview */}
                <div
                  onPointerDown={(e) => {
                    if (isLocked) return;
                    e.stopPropagation();
                    onSelect(c.id);
                    onStartDrag({
                      kind: "move",
                      id: c.id,
                      trackId: "caption1",
                      startX: e.clientX,
                      origStart: c.start,
                      origEnd: c.end,
                      origWords: c.words,
                    });
                  }}
                  className="flex-1 min-w-0 truncate text-[11px] select-none cursor-grab active:cursor-grabbing px-1"
                >
                  <span>{c.text}</span>
                </div>

                {/* Right Trim Handle */}
                {!isLocked && (
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onStartDrag({
                        kind: "resize-r",
                        id: c.id,
                        trackId: "caption1",
                        startX: e.clientX,
                        origStart: c.start,
                        origEnd: c.end,
                      });
                    }}
                    className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-primary/40 flex items-center justify-center transition-opacity"
                  >
                    <div className="w-0.5 h-3 bg-muted-foreground rounded-full" />
                  </div>
                )}
              </div>

              {/* ➕ Add More button — floats to the right of the clip */}
              {!isLocked && onAddAfter && isSelected && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddAfter(c.id);
                  }}
                  style={{ left: `${left + width + 4}px` }}
                  className="absolute top-1/2 -translate-y-1/2 z-30 flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-bold shadow-glow hover:opacity-90 transition cursor-pointer whitespace-nowrap select-none"
                  title="Add new clip after this one"
                >
                  <Plus className="h-2.5 w-2.5" />
                  Add more
                </button>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 3. ✨ CAPTION 2 TRACK (SECONDARY / TRANSLATION) */}
      <div
        style={{
          height: trackCollapsed.caption2 ? COLLAPSED_TRACK_HEIGHT : TRACK_CONFIGS[2].defaultHeight,
          display: trackVisibility.caption2 ? "flex" : "none",
        }}
        className="relative border-b border-border/80 bg-background/30 items-center"
      >
        {caption2Items.length === 0 && !trackCollapsed.caption2 && (
          <button
            type="button"
            onClick={() => onQuickAdd("caption2")}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-dashed border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-[11px] font-semibold ml-4 transition cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>Add Caption 2 (Translation / Subtitle)</span>
          </button>
        )}

        {caption2Items.map((c) => {
          const left = c.start * pxPerSec;
          const width = Math.max(20, (c.end - c.start) * pxPerSec);
          const isSelected = selectedId === c.id;
          const isLocked = trackLocks.caption2;

          return (
            <React.Fragment key={c.id}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(c.id);
                }}
                style={{
                  left: `${left}px`,
                  width: `${width}px`,
                }}
                className={`absolute top-1 bottom-1 rounded-lg border flex items-center px-2 cursor-pointer transition-shadow select-none group overflow-hidden ${
                  isSelected
                    ? "bg-purple-500/25 border-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.4)] text-foreground font-bold z-20"
                    : "bg-purple-950/40 hover:bg-purple-900/40 border-purple-500/40 text-purple-200"
                }`}
              >
                {!isLocked && (
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onStartDrag({
                        kind: "resize-l",
                        id: c.id,
                        trackId: "caption2",
                        startX: e.clientX,
                        origStart: c.start,
                        origEnd: c.end,
                      });
                    }}
                    className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-purple-500/40 flex items-center justify-center transition-opacity"
                  >
                    <div className="w-0.5 h-3 bg-purple-300 rounded-full" />
                  </div>
                )}

                {/* Inline editable text OR static text */}
                {editingId === c.id ? (
                  <input
                    ref={editInputRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit();
                      if (e.key === "Escape") { setEditingId(null); setEditText(""); }
                      e.stopPropagation();
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="flex-1 min-w-0 bg-transparent border-none outline-none text-[11px] text-purple-100 font-bold placeholder-purple-300/50 cursor-text px-1"
                    placeholder="Type text…"
                  />
                ) : (
                  <div
                    onPointerDown={(e) => {
                      if (isLocked) return;
                      e.stopPropagation();
                      onSelect(c.id);
                      onStartDrag({
                        kind: "move",
                        id: c.id,
                        trackId: "caption2",
                        startX: e.clientX,
                        origStart: c.start,
                        origEnd: c.end,
                        origWords: c.words,
                      });
                    }}
                    onDoubleClick={(e) => {
                      if (isLocked) return;
                      e.stopPropagation();
                      startEdit(c);
                    }}
                    className="flex-1 min-w-0 truncate text-[11px] select-none cursor-grab active:cursor-grabbing px-1"
                    title="Double-click to edit text"
                  >
                    <span>{c.text || <span className="opacity-40 italic">Double-click to type…</span>}</span>
                  </div>
                )}

                {!isLocked && (
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onStartDrag({
                        kind: "resize-r",
                        id: c.id,
                        trackId: "caption2",
                        startX: e.clientX,
                        origStart: c.start,
                        origEnd: c.end,
                      });
                    }}
                    className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-purple-500/40 flex items-center justify-center transition-opacity"
                  >
                    <div className="w-0.5 h-3 bg-purple-300 rounded-full" />
                  </div>
                )}
              </div>

              {/* ➕ Add more button — appears to the right when selected */}
              {!isLocked && onAddAfter && isSelected && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddAfter(c.id);
                  }}
                  style={{ left: `${left + width + 4}px` }}
                  className="absolute top-1/2 -translate-y-1/2 z-30 flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-purple-500 text-white text-[10px] font-bold shadow-[0_0_10px_rgba(168,85,247,0.5)] hover:bg-purple-400 transition cursor-pointer whitespace-nowrap select-none"
                  title="Add new clip after this one"
                >
                  <Plus className="h-2.5 w-2.5" />
                  Add more
                </button>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 4. 😂 MEMES / GIFS TRACK */}
      <div
        style={{
          height: trackCollapsed.memes ? COLLAPSED_TRACK_HEIGHT : TRACK_CONFIGS[3].defaultHeight,
          display: trackVisibility.memes ? "flex" : "none",
        }}
        className="relative border-b border-border/80 bg-background/40 items-center"
      >
        {memeGifItems.length === 0 && !trackCollapsed.memes && (
          <button
            type="button"
            onClick={() => onQuickAdd("memes")}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-dashed border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-[11px] font-semibold ml-4 transition cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>Add Meme / GIF</span>
          </button>
        )}

        {memeGifItems.map((m) => {
          const left = m.start * pxPerSec;
          const width = Math.max(24, (m.end - m.start) * pxPerSec);
          const isSelected = selectedId === m.id;
          const isLocked = trackLocks.memes;

          return (
            <div
              key={m.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(m.id);
              }}
              style={{
                left: `${left}px`,
                width: `${width}px`,
              }}
              className={`absolute top-1 bottom-1 rounded-lg border flex items-center px-2 cursor-pointer transition-shadow select-none group overflow-hidden ${
                isSelected
                  ? "bg-orange-500/25 border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.4)] text-foreground font-bold z-20"
                  : "bg-orange-950/40 hover:bg-orange-900/40 border-orange-500/40 text-orange-200"
              }`}
            >
              {!isLocked && (
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onStartDrag({
                      kind: "resize-l",
                      id: m.id,
                      trackId: "memes",
                      startX: e.clientX,
                      origStart: m.start,
                      origEnd: m.end,
                    });
                  }}
                  className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-orange-500/40 flex items-center justify-center transition-opacity"
                >
                  <div className="w-0.5 h-3 bg-orange-300 rounded-full" />
                </div>
              )}

              <div
                onPointerDown={(e) => {
                  if (isLocked) return;
                  e.stopPropagation();
                  onSelect(m.id);
                  onStartDrag({
                    kind: "move",
                    id: m.id,
                    trackId: "memes",
                    startX: e.clientX,
                    origStart: m.start,
                    origEnd: m.end,
                  });
                }}
                className="flex-1 min-w-0 flex items-center gap-1.5 truncate text-[11px] select-none cursor-grab active:cursor-grabbing px-1"
              >
                {m.mediaUrl ? (
                  <img
                    src={m.mediaUrl}
                    alt={m.mediaTitle || "media"}
                    className="h-5 w-5 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <Smile className="h-4 w-4 text-orange-400 flex-shrink-0" />
                )}
                <span className="truncate">{m.mediaTitle || m.text}</span>
              </div>

              {!isLocked && (
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onStartDrag({
                      kind: "resize-r",
                      id: m.id,
                      trackId: "memes",
                      startX: e.clientX,
                      origStart: m.start,
                      origEnd: m.end,
                    });
                  }}
                  className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-orange-500/40 flex items-center justify-center transition-opacity"
                >
                  <div className="w-0.5 h-3 bg-orange-300 rounded-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. ✨ EFFECTS TRACK */}
      <div
        style={{
          height: trackCollapsed.effects ? COLLAPSED_TRACK_HEIGHT : TRACK_CONFIGS[4].defaultHeight,
          display: trackVisibility.effects ? "flex" : "none",
        }}
        className="relative border-b border-border/80 bg-background/30 items-center"
      >
        {effects.length === 0 && !trackCollapsed.effects && (
          <button
            type="button"
            onClick={() => onQuickAdd("effects")}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-dashed border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-[11px] font-semibold ml-4 transition cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>Add Effect (Zoom, Shake, Glitch...)</span>
          </button>
        )}

        {effects.map((eff) => {
          const left = eff.start * pxPerSec;
          const width = Math.max(20, (eff.end - eff.start) * pxPerSec);
          const isSelected = selectedId === eff.id;
          const isLocked = trackLocks.effects;

          return (
            <div
              key={eff.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(eff.id);
              }}
              style={{
                left: `${left}px`,
                width: `${width}px`,
              }}
              className={`absolute top-1 bottom-1 rounded-lg border flex items-center px-2 cursor-pointer transition-shadow select-none group overflow-hidden ${
                isSelected
                  ? "bg-amber-500/25 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)] text-foreground font-bold z-20"
                  : "bg-amber-950/40 hover:bg-amber-900/40 border-amber-500/40 text-amber-200"
              }`}
            >
              {!isLocked && (
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onStartDrag({
                      kind: "resize-l",
                      id: eff.id,
                      trackId: "effects",
                      startX: e.clientX,
                      origStart: eff.start,
                      origEnd: eff.end,
                    });
                  }}
                  className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-amber-500/40 flex items-center justify-center transition-opacity"
                >
                  <div className="w-0.5 h-3 bg-amber-300 rounded-full" />
                </div>
              )}

              <div
                onPointerDown={(e) => {
                  if (isLocked) return;
                  e.stopPropagation();
                  onSelect(eff.id);
                  onStartDrag({
                    kind: "move",
                    id: eff.id,
                    trackId: "effects",
                    startX: e.clientX,
                    origStart: eff.start,
                    origEnd: eff.end,
                  });
                }}
                className="flex-1 min-w-0 flex items-center gap-1.5 truncate text-[10.5px] font-bold uppercase select-none cursor-grab active:cursor-grabbing px-1"
              >
                <Sparkles className="h-3 w-3 text-amber-400 flex-shrink-0" />
                <span className="truncate">{eff.name || eff.type}</span>
              </div>

              {!isLocked && (
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onStartDrag({
                      kind: "resize-r",
                      id: eff.id,
                      trackId: "effects",
                      startX: e.clientX,
                      origStart: eff.start,
                      origEnd: eff.end,
                    });
                  }}
                  className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-amber-500/40 flex items-center justify-center transition-opacity"
                >
                  <div className="w-0.5 h-3 bg-amber-300 rounded-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 6. 🎙️ VOCAL / ORIGINAL AUDIO TRACK (REAL RMS WAVEFORM) */}
      <div
        style={{
          height: trackCollapsed.vocal ? COLLAPSED_TRACK_HEIGHT : TRACK_CONFIGS[5].defaultHeight,
          display: trackVisibility.vocal ? "flex" : "none",
        }}
        className="relative border-b border-border/80 bg-background/50 items-center overflow-hidden"
      >
        <canvas
          ref={vocalCanvasRef}
          width={Math.max(400, Math.round(totalWidth))}
          height={trackCollapsed.vocal ? COLLAPSED_TRACK_HEIGHT : TRACK_CONFIGS[5].defaultHeight}
          className="absolute inset-0 pointer-events-none w-full h-full"
        />
        {/* Subtle Vocal Audio Overlay Label */}
        <div className="absolute left-3 top-1 pointer-events-none text-[9px] font-mono font-bold text-emerald-400/60 uppercase select-none">
          Original Audio Waveform
        </div>
      </div>

      {/* 7. 🔊 AUDIO / SFX TRACK */}
      <div
        style={{
          height: trackCollapsed.audioSfx ? COLLAPSED_TRACK_HEIGHT : TRACK_CONFIGS[6].defaultHeight,
          display: trackVisibility.audioSfx ? "flex" : "none",
        }}
        className="relative border-b border-border/80 bg-background/30 items-center overflow-hidden"
      >
        <canvas
          ref={audioSfxCanvasRef}
          width={Math.max(400, Math.round(totalWidth))}
          height={trackCollapsed.audioSfx ? COLLAPSED_TRACK_HEIGHT : TRACK_CONFIGS[6].defaultHeight}
          className="absolute inset-0 pointer-events-none w-full h-full"
        />

        {audioClips.length === 0 && !trackCollapsed.audioSfx && (
          <button
            type="button"
            onClick={() => onQuickAdd("audioSfx")}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-dashed border-teal-500/30 text-teal-400 hover:bg-teal-500/10 text-[11px] font-semibold ml-4 transition cursor-pointer z-10"
          >
            <Plus className="h-3 w-3" />
            <span>Add Music / SFX</span>
          </button>
        )}

        {audioClips.map((clip) => {
          const left = clip.start * pxPerSec;
          const width = Math.max(24, (clip.end - clip.start) * pxPerSec);
          const isSelected = selectedId === clip.id;
          const isLocked = trackLocks.audioSfx;

          return (
            <div
              key={clip.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(clip.id);
              }}
              style={{
                left: `${left}px`,
                width: `${width}px`,
              }}
              className={`absolute top-1 bottom-1 rounded-lg border flex items-center px-2 cursor-pointer transition-shadow select-none group overflow-hidden ${
                isSelected
                  ? "bg-teal-500/25 border-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.4)] text-foreground font-bold z-20"
                  : "bg-teal-950/40 hover:bg-teal-900/40 border-teal-500/40 text-teal-200"
              }`}
            >
              {!isLocked && (
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onStartDrag({
                      kind: "resize-l",
                      id: clip.id,
                      trackId: "audioSfx",
                      startX: e.clientX,
                      origStart: clip.start,
                      origEnd: clip.end,
                    });
                  }}
                  className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-teal-500/40 flex items-center justify-center transition-opacity"
                >
                  <div className="w-0.5 h-3 bg-teal-300 rounded-full" />
                </div>
              )}

              <div
                onPointerDown={(e) => {
                  if (isLocked) return;
                  e.stopPropagation();
                  onSelect(clip.id);
                  onStartDrag({
                    kind: "move",
                    id: clip.id,
                    trackId: "audioSfx",
                    startX: e.clientX,
                    origStart: clip.start,
                    origEnd: clip.end,
                  });
                }}
                className="flex-1 min-w-0 flex items-center gap-1.5 truncate text-[11px] select-none cursor-grab active:cursor-grabbing px-1"
              >
                <Volume2 className="h-3.5 w-3.5 text-teal-400 flex-shrink-0" />
                <span className="truncate">{clip.title}</span>
              </div>

              {!isLocked && (
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onStartDrag({
                      kind: "resize-r",
                      id: clip.id,
                      trackId: "audioSfx",
                      startX: e.clientX,
                      origStart: clip.start,
                      origEnd: clip.end,
                    });
                  }}
                  className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-teal-500/40 flex items-center justify-center transition-opacity"
                >
                  <div className="w-0.5 h-3 bg-teal-300 rounded-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
