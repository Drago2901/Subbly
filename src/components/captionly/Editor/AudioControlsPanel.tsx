import React, { useState, useEffect, useRef } from "react";
import type { TimelineAudioClip } from "@/lib/captions/types";
import {
  Volume2,
  VolumeX,
  X,
  Trash2,
  Music,
  Mic,
  Radio,
  Sparkles,
} from "lucide-react";

interface AudioControlsPanelProps {
  clip: TimelineAudioClip;
  onUpdateClip: (patch: Partial<TimelineAudioClip>) => void;
  onDeleteClip?: (id: string) => void;
  onClose: () => void;
  liveAudioLevel?: number;
  isPlaying?: boolean;
}

const PRESETS = [25, 50, 75, 100, 125, 150, 200];

/**
 * Formats seconds into mm:ss.mmm format (e.g. 00:18.240)
 */
export function formatAudioTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  const millis = Math.round((s % 1) * 1000);
  if (millis >= 1000) {
    return `${mins.toString().padStart(2, "0")}:${(secs + 1)
      .toString()
      .padStart(2, "0")}.000`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}.${millis.toString().padStart(3, "0")}`;
}

export const AudioControlsPanel: React.FC<AudioControlsPanelProps> = ({
  clip,
  onUpdateClip,
  onDeleteClip,
  onClose,
  liveAudioLevel = 0,
  isPlaying = false,
}) => {
  // Volume state in percentage (0..200)
  const volumePct = Math.round((clip.volume ?? 1.0) * 100);
  const [isEditingVolume, setIsEditingVolume] = useState(false);
  const [volumeInputText, setVolumeInputText] = useState(String(volumePct));

  // Fade In state (0.0..10.0s)
  const maxFade = Math.max(0.1, Math.min(10.0, clip.duration || clip.end - clip.start || 10.0));
  const fadeInVal = Number((clip.fadeIn ?? 0.0).toFixed(1));
  const [isEditingFadeIn, setIsEditingFadeIn] = useState(false);
  const [fadeInInputText, setFadeInInputText] = useState(fadeInVal.toFixed(1));

  // Fade Out state (0.0..10.0s)
  const fadeOutVal = Number((clip.fadeOut ?? 0.0).toFixed(1));
  const [isEditingFadeOut, setIsEditingFadeOut] = useState(false);
  const [fadeOutInputText, setFadeOutInputText] = useState(fadeOutVal.toFixed(1));

  // Sync internal input strings when clip changes
  useEffect(() => {
    if (!isEditingVolume) {
      setVolumeInputText(String(Math.round((clip.volume ?? 1.0) * 100)));
    }
  }, [clip.volume, isEditingVolume]);

  useEffect(() => {
    if (!isEditingFadeIn) {
      setFadeInInputText((clip.fadeIn ?? 0.0).toFixed(1));
    }
  }, [clip.fadeIn, isEditingFadeIn]);

  useEffect(() => {
    if (!isEditingFadeOut) {
      setFadeOutInputText((clip.fadeOut ?? 0.0).toFixed(1));
    }
  }, [clip.fadeOut, isEditingFadeOut]);

  // Determine category badge
  const audioCategory = (() => {
    if (clip.audioType) {
      return clip.audioType.toUpperCase();
    }
    const lower = (clip.title || "").toLowerCase();
    if (lower.includes("bgm") || lower.includes("music") || lower.includes("beat")) return "MUSIC";
    if (lower.includes("voice") || lower.includes("talk") || lower.includes("mic")) return "VOICEOVER";
    return "SFX";
  })();

  // Volume handlers
  const handleVolumeChange = (newPct: number) => {
    const clamped = Math.max(0, Math.min(200, Math.round(newPct)));
    onUpdateClip({
      volume: clamped / 100,
      savedVolume: clamped / 100,
      muted: clamped === 0 ? clip.muted : false, // Unmute if user boosts above 0
    });
  };

  const commitVolumeInput = () => {
    setIsEditingVolume(false);
    const parsed = parseInt(volumeInputText, 10);
    if (!isNaN(parsed)) {
      handleVolumeChange(parsed);
    } else {
      setVolumeInputText(String(volumePct));
    }
  };

  const handleVolumeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitVolumeInput();
    } else if (e.key === "Escape") {
      setIsEditingVolume(false);
      setVolumeInputText(String(volumePct));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      handleVolumeChange(volumePct + step);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      handleVolumeChange(volumePct - step);
    }
  };

  // Mute toggle (preserves previous volume when muted, restores on unmute)
  const handleToggleMute = () => {
    if (clip.muted) {
      // Unmute: restore previous saved volume
      const restored = clip.savedVolume && clip.savedVolume > 0 ? clip.savedVolume : (clip.volume > 0 ? clip.volume : 1.0);
      onUpdateClip({
        muted: false,
        volume: restored,
      });
    } else {
      // Mute: save current volume and set muted flag
      onUpdateClip({
        muted: true,
        savedVolume: clip.volume > 0 ? clip.volume : 1.0,
      });
    }
  };

  // Fade In handlers
  const handleFadeInChange = (newSec: number) => {
    const clamped = Math.max(0, Math.min(maxFade, Math.round(newSec * 10) / 10));
    onUpdateClip({ fadeIn: clamped });
  };

  const commitFadeInInput = () => {
    setIsEditingFadeIn(false);
    const parsed = parseFloat(fadeInInputText);
    if (!isNaN(parsed)) {
      handleFadeInChange(parsed);
    } else {
      setFadeInInputText(fadeInVal.toFixed(1));
    }
  };

  const handleFadeInKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitFadeInInput();
    } else if (e.key === "Escape") {
      setIsEditingFadeIn(false);
      setFadeInInputText(fadeInVal.toFixed(1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      handleFadeInChange(fadeInVal + 0.1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleFadeInChange(fadeInVal - 0.1);
    }
  };

  // Fade Out handlers
  const handleFadeOutChange = (newSec: number) => {
    const clamped = Math.max(0, Math.min(maxFade, Math.round(newSec * 10) / 10));
    onUpdateClip({ fadeOut: clamped });
  };

  const commitFadeOutInput = () => {
    setIsEditingFadeOut(false);
    const parsed = parseFloat(fadeOutInputText);
    if (!isNaN(parsed)) {
      handleFadeOutChange(parsed);
    } else {
      setFadeOutInputText(fadeOutVal.toFixed(1));
    }
  };

  const handleFadeOutKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitFadeOutInput();
    } else if (e.key === "Escape") {
      setIsEditingFadeOut(false);
      setFadeOutInputText(fadeOutVal.toFixed(1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      handleFadeOutChange(fadeOutVal + 0.1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleFadeOutChange(fadeOutVal - 0.1);
    }
  };

  // Dynamic 11 equalizer bar heights based on liveAudioLevel and playback
  const barMultipliers = [0.35, 0.55, 0.85, 1.0, 0.9, 0.6, 0.45, 0.75, 0.95, 0.7, 0.4];

  return (
    <div className="flex flex-col h-full select-none bg-card text-foreground">
      {/* Top Section Header */}
      <div className="flex flex-col border-b border-border px-4 pt-3 pb-2.5 bg-muted/30">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/80">
          PROPERTIES
        </span>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-extrabold text-foreground tracking-tight">
              Audio Controls
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-[#FF6B2C]/15 border border-[#FF6B2C]/40 text-[#FF6B2C] uppercase tracking-wider">
              {audioCategory} SELECTED
            </span>
            <button
              type="button"
              onClick={onClose}
              className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              title="Close panel"
              aria-label="Close Audio Controls"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-5 scrollbar-thin">
        {/* 1. Selected Audio Info Box */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground">
            Selected Audio:
          </span>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/40 hover:border-foreground/20 transition group">
            <div className="h-9 w-9 rounded-lg bg-[#FF6B2C]/15 border border-[#FF6B2C]/30 flex items-center justify-center text-[#FF6B2C] flex-shrink-0 shadow-sm">
              {audioCategory === "MUSIC" ? (
                <Music className="h-4.5 w-4.5" />
              ) : audioCategory === "VOICEOVER" ? (
                <Mic className="h-4.5 w-4.5" />
              ) : (
                <Volume2 className="h-4.5 w-4.5" />
              )}
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[13px] font-bold text-foreground truncate" title={clip.title}>
                {clip.title || "Audio Clip"}
              </span>
              <span className="text-[10.5px] font-mono font-medium text-muted-foreground">
                {audioCategory} • {formatAudioTime(clip.start)} – {formatAudioTime(clip.end)}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* 2. Volume Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-foreground">
              Volume
            </span>

            {/* Editable Volume Percentage */}
            <div className="flex items-center gap-1">
              {isEditingVolume ? (
                <div className="flex items-center">
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={volumeInputText}
                    onChange={(e) => setVolumeInputText(e.target.value)}
                    onBlur={commitVolumeInput}
                    onKeyDown={handleVolumeKeyDown}
                    autoFocus
                    className="w-12 h-6 px-1 text-right text-[12px] font-mono font-bold bg-background border border-[#FF6B2C] rounded text-foreground outline-none"
                  />
                  <span className="text-[11px] font-mono text-muted-foreground ml-0.5">%</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingVolume(true)}
                  className={`text-[12px] font-mono font-bold px-1.5 py-0.5 rounded hover:bg-muted transition cursor-pointer ${
                    clip.muted ? "text-muted-foreground line-through" : "text-foreground"
                  }`}
                  title="Click to type exact percentage or use Up/Down arrows"
                >
                  {clip.muted ? "0%" : `${volumePct}%`}
                </button>
              )}
            </div>
          </div>

          {/* Volume Slider with 0% .. 200% range */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleMute}
                className="text-muted-foreground hover:text-foreground transition cursor-pointer p-0.5"
                title={clip.muted ? "Unmute" : "Mute"}
              >
                {clip.muted || volumePct === 0 ? (
                  <VolumeX className="h-4 w-4 text-[#FF6B2C]" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>

              <div className="relative flex-1 flex items-center">
                <input
                  type="range"
                  min={0}
                  max={200}
                  step={1}
                  value={clip.muted ? 0 : volumePct}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  onKeyDown={handleVolumeKeyDown}
                  className="w-full h-1.5 rounded-full bg-muted accent-[#FF6B2C] cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #FF6B2C 0%, #FF6B2C ${
                      clip.muted ? 0 : (volumePct / 200) * 100
                    }%, hsl(var(--muted)) ${
                      clip.muted ? 0 : (volumePct / 200) * 100
                    }%, hsl(var(--muted)) 100%)`,
                  }}
                />
              </div>
            </div>

            {/* Scale Markers */}
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground/70 px-6">
              <span>0%</span>
              <span className="font-bold">100%</span>
              <span>200%</span>
            </div>
          </div>

          {/* Volume Presets */}
          <div className="grid grid-cols-7 gap-1 pt-1">
            {PRESETS.map((p) => {
              const isActive = !clip.muted && volumePct === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleVolumeChange(p)}
                  className={`py-1 rounded-md text-[10px] font-bold transition cursor-pointer border ${
                    isActive
                      ? "bg-[#FF6B2C] border-[#FF6B2C] text-black font-extrabold shadow-sm"
                      : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {p}%
                </button>
              );
            })}
          </div>

          {/* Mute Button */}
          <button
            type="button"
            onClick={handleToggleMute}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11.5px] font-bold border transition cursor-pointer ${
              clip.muted
                ? "bg-[#FF6B2C]/20 border-[#FF6B2C] text-[#FF6B2C] shadow-sm"
                : "bg-muted/40 border-border text-foreground hover:bg-muted"
            }`}
          >
            {clip.muted ? (
              <>
                <VolumeX className="h-4 w-4" />
                <span>Muted ({volumePct}% saved) — Click to Unmute</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4" />
                <span>Mute</span>
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* 3. Fade In & Fade Out Section */}
        <div className="space-y-4">
          {/* Fade In */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-foreground">
                Fade In
              </span>
              {isEditingFadeIn ? (
                <div className="flex items-center">
                  <input
                    type="number"
                    min={0}
                    max={maxFade}
                    step={0.1}
                    value={fadeInInputText}
                    onChange={(e) => setFadeInInputText(e.target.value)}
                    onBlur={commitFadeInInput}
                    onKeyDown={handleFadeInKeyDown}
                    autoFocus
                    className="w-14 h-6 px-1 text-right text-[12px] font-mono font-bold bg-background border border-[#FF6B2C] rounded text-foreground outline-none"
                  />
                  <span className="text-[11px] font-mono text-muted-foreground ml-0.5">s</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingFadeIn(true)}
                  className="text-[12px] font-mono font-bold text-foreground px-1.5 py-0.5 rounded hover:bg-muted transition cursor-pointer"
                  title="Click to type exact duration (max clip duration)"
                >
                  {fadeInVal.toFixed(1)}s
                </button>
              )}
            </div>
            <input
              type="range"
              min={0}
              max={maxFade}
              step={0.1}
              value={fadeInVal}
              onChange={(e) => handleFadeInChange(Number(e.target.value))}
              onKeyDown={handleFadeInKeyDown}
              className="w-full h-1.5 rounded-full bg-muted accent-[#FF6B2C] cursor-pointer"
              style={{
                background: `linear-gradient(to right, #FF6B2C 0%, #FF6B2C ${
                  (fadeInVal / maxFade) * 100
                }%, hsl(var(--muted)) ${(fadeInVal / maxFade) * 100}%, hsl(var(--muted)) 100%)`,
              }}
            />
          </div>

          {/* Fade Out */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-foreground">
                Fade Out
              </span>
              {isEditingFadeOut ? (
                <div className="flex items-center">
                  <input
                    type="number"
                    min={0}
                    max={maxFade}
                    step={0.1}
                    value={fadeOutInputText}
                    onChange={(e) => setFadeOutInputText(e.target.value)}
                    onBlur={commitFadeOutInput}
                    onKeyDown={handleFadeOutKeyDown}
                    autoFocus
                    className="w-14 h-6 px-1 text-right text-[12px] font-mono font-bold bg-background border border-[#FF6B2C] rounded text-foreground outline-none"
                  />
                  <span className="text-[11px] font-mono text-muted-foreground ml-0.5">s</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingFadeOut(true)}
                  className="text-[12px] font-mono font-bold text-foreground px-1.5 py-0.5 rounded hover:bg-muted transition cursor-pointer"
                  title="Click to type exact duration (max clip duration)"
                >
                  {fadeOutVal.toFixed(1)}s
                </button>
              )}
            </div>
            <input
              type="range"
              min={0}
              max={maxFade}
              step={0.1}
              value={fadeOutVal}
              onChange={(e) => handleFadeOutChange(Number(e.target.value))}
              onKeyDown={handleFadeOutKeyDown}
              className="w-full h-1.5 rounded-full bg-muted accent-[#FF6B2C] cursor-pointer"
              style={{
                background: `linear-gradient(to right, #FF6B2C 0%, #FF6B2C ${
                  (fadeOutVal / maxFade) * 100
                }%, hsl(var(--muted)) ${(fadeOutVal / maxFade) * 100}%, hsl(var(--muted)) 100%)`,
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* 4. Live Audio Level Meter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              AUDIO LEVEL
            </span>
            <span className="inline-flex items-center gap-1.5 text-[9.5px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className={`h-1.5 w-1.5 rounded-full ${isPlaying ? "bg-emerald-400 animate-pulse" : "bg-emerald-600"}`} />
              LIVE
            </span>
          </div>

          {/* Equalizer Visualizer (11 bars) */}
          <div className="h-10 rounded-xl bg-muted/40 border border-border px-3 flex items-end justify-between gap-1 py-2">
            {barMultipliers.map((m, idx) => {
              const activeHeight = isPlaying && !clip.muted
                ? Math.min(100, Math.max(12, liveAudioLevel * m * 100))
                : 10;
              return (
                <div
                  key={idx}
                  className="flex-1 bg-muted rounded-full overflow-hidden h-full flex items-end"
                >
                  <div
                    className="w-full rounded-full transition-all duration-75"
                    style={{
                      height: `${activeHeight}%`,
                      background:
                        activeHeight > 75
                          ? "#FF6B2C"
                          : activeHeight > 40
                          ? "#F59E0B"
                          : "#10B981",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Delete Clip Action */}
        {onDeleteClip && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onDeleteClip(clip.id)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-bold text-red-400/80 hover:text-red-400 hover:bg-red-500/10 border border-red-500/20 transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Remove Audio Clip</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
