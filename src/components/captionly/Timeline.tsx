import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Caption, TimelineEffect, TimelineAudioClip, TimelineTrackId, VideoEffectType } from "@/lib/captions/types";
import { TimelineToolbar } from "./Timeline/TimelineToolbar";
import { TimeRuler } from "./Timeline/TimeRuler";
import { TrackSidebar, TRACK_CONFIGS, COLLAPSED_TRACK_HEIGHT } from "./Timeline/TrackSidebar";
import { TrackLanes, type ActiveDragInfo } from "./Timeline/TrackLanes";
import { GlobalPlayhead } from "./Timeline/GlobalPlayhead";
import { AudioRoutingDialog } from "./Timeline/AudioRoutingDialog";
import { EffectPickerPopover } from "./Timeline/EffectPickerPopover";
import { extractRealWaveform, generateSyntheticSpeechEnvelope } from "@/lib/captions/waveform";
import { useVideoThumbnails } from "@/lib/captions/thumbnails";
import { useIsMobile } from "@/hooks/use-mobile";

export type TimelineProps = {
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
  // Optional multi-track media enhancements
  videoUrl?: string | null;
  audioSource?: Blob | File | string | null;
  effects?: TimelineEffect[];
  onEffectsChange?: (effects: TimelineEffect[]) => void;
  audioClips?: TimelineAudioClip[];
  onAudioClipsChange?: (clips: TimelineAudioClip[]) => void;
  onOpenMemeStudio?: () => void;
  zoomPct?: number;
  onZoomChange?: (zoom: number) => void;
};

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
  canUndo = false,
  canRedo = false,
  selectedId,
  onSelect,
  lockedTracks = [],
  onToggleLockTrack,
  videoUrl,
  audioSource,
  effects = [],
  onEffectsChange,
  audioClips = [],
  onAudioClipsChange,
  onOpenMemeStudio,
  zoomPct: zoomPctProp,
  onZoomChange,
}: TimelineProps) {
  const isMobile = useIsMobile();
  const [internalZoomPct, setInternalZoomPct] = useState(35);
  const zoomPct = zoomPctProp !== undefined ? zoomPctProp : internalZoomPct;
  const setZoomPct = useCallback(
    (newZoom: number | ((prev: number) => number)) => {
      const nextVal = typeof newZoom === "function" ? newZoom(zoomPct) : newZoom;
      const clamped = Math.max(5, Math.min(100, Math.round(nextVal)));
      onZoomChange?.(clamped);
      setInternalZoomPct(clamped);
    },
    [zoomPct, onZoomChange]
  );
  const selected = selectedId ?? null;
  const setSelected = useMemo(() => onSelect ?? (() => {}), [onSelect]);

  // Local state for effects and audio clips if not controlled from parent
  const [localEffects, setLocalEffects] = useState<TimelineEffect[]>([]);
  const currentEffects = onEffectsChange ? effects : localEffects;
  const setEffects = onEffectsChange ? onEffectsChange : setLocalEffects;

  const [localAudioClips, setLocalAudioClips] = useState<TimelineAudioClip[]>([]);
  const currentAudioClips = onAudioClipsChange ? audioClips : localAudioClips;
  const setAudioClips = onAudioClipsChange ? onAudioClipsChange : setLocalAudioClips;

  // Track states
  const [trackVisibility, setTrackVisibility] = useState<Record<TimelineTrackId, boolean>>({
    video: true,
    caption1: true,
    caption2: true,
    memes: true,
    effects: true,
    vocal: true,
    audioSfx: true,
  });

  const [trackLocks, setTrackLocks] = useState<Record<TimelineTrackId, boolean>>({
    video: lockedTracks.includes(0),
    caption1: lockedTracks.includes(1),
    caption2: lockedTracks.includes(2),
    memes: lockedTracks.includes(3),
    effects: lockedTracks.includes(5),
    vocal: lockedTracks.includes(6),
    audioSfx: lockedTracks.includes(7),
  });

  const [trackCollapsed, setTrackCollapsed] = useState<Record<TimelineTrackId, boolean>>({
    video: false,
    caption1: false,
    caption2: false,
    memes: false,
    effects: false,
    vocal: false,
    audioSfx: false,
  });

  const [vocalVolume, setVocalVolume] = useState(1.0);
  const [vocalMuted, setVocalMuted] = useState(false);
  const [audioSfxVolume, setAudioSfxVolume] = useState(0.7);
  const [audioSfxMuted, setAudioSfxMuted] = useState(false);

  // Dialogs
  const [audioRoutingOpen, setAudioRoutingOpen] = useState(false);
  const [effectPickerOpen, setEffectPickerOpen] = useState(false);

  // Dragging & Snapping
  const [activeDrag, setActiveDrag] = useState<ActiveDragInfo | null>(null);
  const [snapGuideTime, setSnapGuideTime] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Real Audio Waveform state
  const [vocalWaveform, setVocalWaveform] = useState<number[]>(() => generateSyntheticSpeechEnvelope(300));
  useEffect(() => {
    const src = audioSource || videoUrl;
    if (!src) return;

    let isMounted = true;
    extractRealWaveform(src, 360)
      .then((data) => {
        if (isMounted && data.length > 0) {
          setVocalWaveform(data);
        }
      })
      .catch((err) => {
        console.warn("[Timeline] Real waveform extraction fallback:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [audioSource, videoUrl]);

  // Video Thumbnails Strip
  const { thumbnails: videoThumbnails } = useVideoThumbnails(videoUrl || null, duration, 24);

  // Wheel Zoom (Ctrl/Cmd + Wheel)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 5 : -5;
        setZoomPct((cur) => Math.max(5, Math.min(100, cur + delta)));
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [setZoomPct]);

  // Scale calculations (smooth horizontal zooming)
  const pxPerSec = useMemo(() => {
    const min = 15;
    const max = 280;
    return min + ((zoomPct - 5) / 95) * (max - min);
  }, [zoomPct]);

  const totalWidth = Math.max(500, (duration || 0) * pxPerSec);

  // Total height calculation based on collapse states
  const totalContentHeight = useMemo(() => {
    let h = 0;
    TRACK_CONFIGS.forEach((t) => {
      if (trackVisibility[t.id]) {
        h += trackCollapsed[t.id] ? COLLAPSED_TRACK_HEIGHT : t.defaultHeight;
      }
    });
    return Math.max(200, h);
  }, [trackVisibility, trackCollapsed]);

  // Track toggles
  const handleToggleVisibility = useCallback((trackId: TimelineTrackId) => {
    setTrackVisibility((prev) => ({ ...prev, [trackId]: !prev[trackId] }));
  }, []);

  const handleToggleLock = useCallback(
    (trackId: TimelineTrackId) => {
      setTrackLocks((prev) => {
        const nextState = !prev[trackId];
        const trackNumMap: Record<TimelineTrackId, number> = {
          video: 0,
          caption1: 1,
          caption2: 2,
          memes: 3,
          effects: 5,
          vocal: 6,
          audioSfx: 7,
        };
        if (onToggleLockTrack) {
          onToggleLockTrack(trackNumMap[trackId]);
        }
        return { ...prev, [trackId]: nextState };
      });
    },
    [onToggleLockTrack]
  );

  const handleToggleCollapse = useCallback((trackId: TimelineTrackId) => {
    setTrackCollapsed((prev) => ({ ...prev, [trackId]: !prev[trackId] }));
  }, []);

  // Fit timeline to container width
  const handleFitTimeline = useCallback(() => {
    if (!scrollContainerRef.current || duration <= 0) return;
    const containerW = scrollContainerRef.current.clientWidth - 40;
    if (containerW <= 0) return;
    const neededPxPerSec = containerW / duration;
    const clampedPx = Math.max(15, Math.min(280, neededPxPerSec));
    const targetPct = Math.round(5 + ((clampedPx - 15) / (280 - 15)) * 95);
    setZoomPct(targetPct);
  }, [duration]);

  // Snapping logic
  const findSnapTime = useCallback(
    (rawTime: number, excludeId: string): number => {
      const snapDistSec = 8 / pxPerSec; // 8-pixel magnetic radius
      const candidates: number[] = [0, duration, currentTime];

      // Snap to whole seconds
      const nearestInt = Math.round(rawTime);
      if (Math.abs(rawTime - nearestInt) <= snapDistSec) {
        candidates.push(nearestInt);
      }

      // Snap to other clips
      captions.forEach((c) => {
        if (c.id !== excludeId) {
          candidates.push(c.start, c.end);
        }
      });
      currentEffects.forEach((e) => {
        if (e.id !== excludeId) {
          candidates.push(e.start, e.end);
        }
      });

      let closestCandidate: number | null = null;
      let minDelta = snapDistSec;

      for (const cand of candidates) {
        const delta = Math.abs(rawTime - cand);
        if (delta <= minDelta) {
          minDelta = delta;
          closestCandidate = cand;
        }
      }

      if (closestCandidate !== null) {
        setSnapGuideTime(closestCandidate);
        return closestCandidate;
      }
      setSnapGuideTime(null);
      return rawTime;
    },
    [captions, currentEffects, currentTime, duration, pxPerSec]
  );

  // Global Drag listeners (move, resize-left, resize-right)
  useEffect(() => {
    if (!activeDrag) return;

    const onPointerMove = (e: PointerEvent) => {
      const dx = e.clientX - activeDrag.startX;
      const dt = dx / pxPerSec;

      if (activeDrag.trackId === "caption1" || activeDrag.trackId === "caption2" || activeDrag.trackId === "memes") {
        onChange(
          captions.map((c) => {
            if (c.id !== activeDrag.id) return c;
            const len = activeDrag.origEnd - activeDrag.origStart;

            if (activeDrag.kind === "move") {
              let nextStart = Math.max(0, Math.min(duration - len, activeDrag.origStart + dt));
              // Shift disables magnetic snapping
              if (!e.shiftKey) {
                nextStart = findSnapTime(nextStart, c.id);
              }
              const offset = nextStart - activeDrag.origStart;
              const words = activeDrag.origWords?.map((w) => ({
                ...w,
                start: w.start + offset,
                end: w.end + offset,
              }));
              return { ...c, start: nextStart, end: nextStart + len, words };
            }

            if (activeDrag.kind === "resize-l") {
              let nextStart = Math.max(0, Math.min(activeDrag.origEnd - 0.15, activeDrag.origStart + dt));
              if (!e.shiftKey) {
                nextStart = findSnapTime(nextStart, c.id);
              }
              return { ...c, start: nextStart, words: undefined };
            }

            // resize-r
            let nextEnd = Math.max(activeDrag.origStart + 0.15, Math.min(duration, activeDrag.origEnd + dt));
            if (!e.shiftKey) {
              nextEnd = findSnapTime(nextEnd, c.id);
            }
            return { ...c, end: nextEnd, words: undefined };
          })
        );
      } else if (activeDrag.trackId === "effects") {
        setEffects(
          currentEffects.map((eff) => {
            if (eff.id !== activeDrag.id) return eff;
            const len = activeDrag.origEnd - activeDrag.origStart;

            if (activeDrag.kind === "move") {
              let nextStart = Math.max(0, Math.min(duration - len, activeDrag.origStart + dt));
              if (!e.shiftKey) nextStart = findSnapTime(nextStart, eff.id);
              return { ...eff, start: nextStart, end: nextStart + len };
            }
            if (activeDrag.kind === "resize-l") {
              let nextStart = Math.max(0, Math.min(activeDrag.origEnd - 0.2, activeDrag.origStart + dt));
              if (!e.shiftKey) nextStart = findSnapTime(nextStart, eff.id);
              return { ...eff, start: nextStart };
            }
            let nextEnd = Math.max(activeDrag.origStart + 0.2, Math.min(duration, activeDrag.origEnd + dt));
            if (!e.shiftKey) nextEnd = findSnapTime(nextEnd, eff.id);
            return { ...eff, end: nextEnd };
          })
        );
      } else if (activeDrag.trackId === "audioSfx") {
        setAudioClips(
          currentAudioClips.map((clip) => {
            if (clip.id !== activeDrag.id) return clip;
            const len = activeDrag.origEnd - activeDrag.origStart;

            if (activeDrag.kind === "move") {
              let nextStart = Math.max(0, Math.min(duration - len, activeDrag.origStart + dt));
              if (!e.shiftKey) nextStart = findSnapTime(nextStart, clip.id);
              return { ...clip, start: nextStart, end: nextStart + len };
            }
            if (activeDrag.kind === "resize-l") {
              let nextStart = Math.max(0, Math.min(activeDrag.origEnd - 0.2, activeDrag.origStart + dt));
              return { ...clip, start: nextStart };
            }
            let nextEnd = Math.max(activeDrag.origStart + 0.2, Math.min(duration, activeDrag.origEnd + dt));
            return { ...clip, end: nextEnd };
          })
        );
      }
    };

    const onPointerUp = () => {
      setActiveDrag(null);
      setSnapGuideTime(null);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [activeDrag, captions, currentAudioClips, currentEffects, duration, findSnapTime, onChange, pxPerSec, setAudioClips, setEffects]);

  // Actions: Split clip at playhead
  const handleSplit = useCallback(() => {
    let target = captions.find((c) => c.id === selected);
    if (!target) {
      target = captions.find((c) => currentTime >= c.start && currentTime <= c.end);
    }
    if (!target) return;
    if (currentTime <= target.start + 0.08 || currentTime >= target.end - 0.08) return;

    const words = target.text.trim().split(/\s+/);
    const mid = Math.max(1, Math.floor(words.length / 2));
    const leftText = words.slice(0, mid).join(" ");
    const rightText = words.slice(mid).join(" ") || "...";

    const left: Caption = { ...target, end: currentTime, text: leftText, words: undefined };
    const right: Caption = {
      ...target,
      id: crypto.randomUUID(),
      start: currentTime,
      text: rightText,
      words: undefined,
    };

    const idx = captions.findIndex((c) => c.id === target!.id);
    if (idx >= 0) {
      const next = [...captions];
      next.splice(idx, 1, left, right);
      onChange(next);
      setSelected(right.id);
    }
  }, [captions, currentTime, onChange, selected, setSelected]);

  // Actions: Delete selected clip
  const handleDelete = useCallback(() => {
    if (!selected) return;
    if (captions.some((c) => c.id === selected)) {
      onChange(captions.filter((c) => c.id !== selected));
      setSelected(null);
      return;
    }
    if (currentEffects.some((e) => e.id === selected)) {
      setEffects(currentEffects.filter((e) => e.id !== selected));
      setSelected(null);
      return;
    }
    if (currentAudioClips.some((a) => a.id === selected)) {
      setAudioClips(currentAudioClips.filter((a) => a.id !== selected));
      setSelected(null);
    }
  }, [captions, currentAudioClips, currentEffects, onChange, selected, setAudioClips, setEffects, setSelected]);

  // Quick Add handlers
  const handleAddCaptionTrack = useCallback(
    (targetTrack: 1 | 2 = 1) => {
      const start = currentTime;
      const end = duration > 0 ? Math.min(duration, start + 2.2) : start + 2.2;
      const newCap: Caption = {
        id: crypto.randomUUID(),
        start,
        end,
        text: targetTrack === 1 ? "New caption" : "Secondary text",
        track: targetTrack,
        x: 0.5,
        y: targetTrack === 1 ? 0.88 : 0.72,
      };
      onChange([...captions, newCap]);
      setSelected(newCap.id);
      // Auto-expand track if collapsed
      const trackKey = targetTrack === 1 ? "caption1" : "caption2";
      setTrackCollapsed((prev) => ({ ...prev, [trackKey]: false }));
    },
    [captions, currentTime, duration, onChange, setSelected]
  );

  const handleAddMemeGif = useCallback(() => {
    if (onOpenMemeStudio) {
      onOpenMemeStudio();
    } else {
      const start = currentTime;
      const end = duration > 0 ? Math.min(duration, start + 2.5) : start + 2.5;
      const newMeme: Caption = {
        id: crypto.randomUUID(),
        start,
        end,
        text: "Reaction GIF",
        track: 3,
        mediaType: "gif",
        mediaTitle: "Reaction",
        x: 0.5,
        y: 0.45,
        width: 32,
        height: 32,
      };
      onChange([...captions, newMeme]);
      setSelected(newMeme.id);
      setTrackCollapsed((prev) => ({ ...prev, memes: false }));
    }
  }, [captions, currentTime, duration, onChange, onOpenMemeStudio, setSelected]);

  const handleSelectEffect = useCallback(
    (type: VideoEffectType, name: string) => {
      const start = currentTime;
      const end = duration > 0 ? Math.min(duration, start + 1.2) : start + 1.2;
      const newEff: TimelineEffect = {
        id: crypto.randomUUID(),
        type,
        name,
        start,
        end,
        intensity: 1.0,
      };
      setEffects([...currentEffects, newEff]);
      setSelected(newEff.id);
      setTrackCollapsed((prev) => ({ ...prev, effects: false }));
    },
    [currentEffects, currentTime, duration, setEffects, setSelected]
  );

  const handleAddAudioFile = useCallback(
    (target: "vocal" | "audioSfx", file: File) => {
      const audioUrl = URL.createObjectURL(file);
      const start = currentTime;
      const end = duration > 0 ? Math.min(duration, start + 10.0) : start + 10.0;
      const newAudio: TimelineAudioClip = {
        id: crypto.randomUUID(),
        url: audioUrl,
        title: file.name.replace(/\.[^/.]+$/, ""),
        start,
        end,
        duration: end - start,
        volume: target === "vocal" ? 1.0 : 0.7,
        muted: false,
        trackType: target,
      };
      setAudioClips([...currentAudioClips, newAudio]);
      setSelected(newAudio.id);
      setTrackCollapsed((prev) => ({ ...prev, [target]: false }));
    },
    [currentAudioClips, currentTime, duration, setAudioClips, setSelected]
  );

  const handleQuickAdd = useCallback(
    (trackId: TimelineTrackId) => {
      if (trackId === "caption1") handleAddCaptionTrack(1);
      else if (trackId === "caption2") handleAddCaptionTrack(2);
      else if (trackId === "memes") handleAddMemeGif();
      else if (trackId === "effects") setEffectPickerOpen(true);
      else if (trackId === "vocal" || trackId === "audioSfx") setAudioRoutingOpen(true);
    },
    [handleAddCaptionTrack, handleAddMemeGif]
  );

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full bg-card border border-border/80 rounded-xl overflow-hidden select-none shadow-xl"
    >
      {/* 1. TOP TIMELINE TOOLBAR */}
      <TimelineToolbar
        currentTime={currentTime}
        duration={duration}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo || (() => {})}
        onRedo={onRedo || (() => {})}
        onSplit={handleSplit}
        onDelete={handleDelete}
        onAddCaption={handleAddCaptionTrack}
        onAddMemeGif={handleAddMemeGif}
        onAddEffect={() => setEffectPickerOpen(true)}
        onAddAudio={() => setAudioRoutingOpen(true)}
        zoomPct={zoomPct}
        onZoomChange={setZoomPct}
        onFitTimeline={handleFitTimeline}
        hasSelection={Boolean(selected)}
        isMobile={isMobile}
      />

      {/* 2. MAIN HORIZONTAL MULTI-TRACK AREA */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* FIXED TRACK-LABEL SIDEBAR (LEFT) */}
        <TrackSidebar
          trackVisibility={trackVisibility}
          onToggleVisibility={handleToggleVisibility}
          trackLocks={trackLocks}
          onToggleLock={handleToggleLock}
          trackCollapsed={trackCollapsed}
          onToggleCollapse={handleToggleCollapse}
          vocalVolume={vocalVolume}
          onVocalVolumeChange={setVocalVolume}
          audioSfxVolume={audioSfxVolume}
          onAudioSfxVolumeChange={setAudioSfxVolume}
          vocalMuted={vocalMuted}
          onToggleVocalMute={() => setVocalMuted((prev) => !prev)}
          audioSfxMuted={audioSfxMuted}
          onToggleAudioSfxMute={() => setAudioSfxMuted((prev) => !prev)}
          onQuickAdd={handleQuickAdd}
          isMobile={isMobile}
        />

        {/* HORIZONTAL SCROLLABLE TIMELINE CONTENT (RIGHT) */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-w-0 overflow-x-auto overflow-y-auto relative scrollbar-thin select-none"
        >
          <div style={{ width: totalWidth }} className="relative flex flex-col min-h-full">
            {/* TIME RULER */}
            <TimeRuler
              duration={duration}
              pxPerSec={pxPerSec}
              totalWidth={totalWidth}
              currentTime={currentTime}
              onSeek={onSeek}
            />

            {/* TRACK LANES */}
            <TrackLanes
              duration={duration}
              currentTime={currentTime}
              pxPerSec={pxPerSec}
              totalWidth={totalWidth}
              captions={captions}
              effects={currentEffects}
              audioClips={currentAudioClips}
              vocalWaveform={vocalWaveform}
              videoThumbnails={videoThumbnails}
              selectedId={selected}
              onSelect={setSelected}
              trackVisibility={trackVisibility}
              trackLocks={trackLocks}
              trackCollapsed={trackCollapsed}
              onStartDrag={setActiveDrag}
              snapGuideTime={snapGuideTime}
              onQuickAdd={handleQuickAdd}
            />

            {/* SINGLE GLOBAL PLAYHEAD PASSING DOWN EVERY TRACK */}
            <GlobalPlayhead
              currentTime={currentTime}
              pxPerSec={pxPerSec}
              totalHeight={totalContentHeight + 24}
              onScrubStart={(e) => {
                const startX = e.clientX;
                const origTime = currentTime;
                const onMove = (moveEv: PointerEvent) => {
                  const dt = (moveEv.clientX - startX) / pxPerSec;
                  onSeek(Math.max(0, Math.min(duration, origTime + dt)));
                };
                const onUp = () => {
                  window.removeEventListener("pointermove", onMove);
                  window.removeEventListener("pointerup", onUp);
                };
                window.addEventListener("pointermove", onMove);
                window.addEventListener("pointerup", onUp);
              }}
            />
          </div>
        </div>
      </div>

      {/* MODALS: Audio Routing & Effect Picker */}
      <AudioRoutingDialog
        open={audioRoutingOpen}
        onOpenChange={setAudioRoutingOpen}
        onAddAudioFile={handleAddAudioFile}
      />

      <EffectPickerPopover
        open={effectPickerOpen}
        onOpenChange={setEffectPickerOpen}
        onSelectEffect={handleSelectEffect}
      />
    </div>
  );
}
