import React from "react";
import {
  Undo2,
  Redo2,
  Scissors,
  Trash2,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Music,
  Smile,
  Sparkles,
  Type,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TimelineToolbarProps {
  currentTime: number;
  duration: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSplit: () => void;
  onDelete: () => void;
  onAddCaption: (targetTrack?: 1 | 2) => void;
  onAddMemeGif: () => void;
  onAddEffect: () => void;
  onAddAudio: () => void;
  zoomPct: number;
  onZoomChange: (zoom: number) => void;
  onFitTimeline: () => void;
  hasSelection: boolean;
  isMobile?: boolean;
}

const formatTimecode = (secs: number): string => {
  if (!isFinite(secs) || secs < 0) secs = 0;
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 100);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
};

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  currentTime,
  duration,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSplit,
  onDelete,
  onAddCaption,
  onAddMemeGif,
  onAddEffect,
  onAddAudio,
  zoomPct,
  onZoomChange,
  onFitTimeline,
  hasSelection,
  isMobile = false,
}) => {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card/95 backdrop-blur-sm select-none gap-2 text-xs flex-wrap">
      {/* LEFT: History, Split, Delete & Add Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
        {/* Undo / Redo */}
        <div className="flex items-center bg-secondary/80 rounded-lg p-0.5 border border-border/60">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
            className="p-1.5 rounded-md hover:bg-background/80 hover:text-foreground text-muted-foreground transition disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
            className="p-1.5 rounded-md hover:bg-background/80 hover:text-foreground text-muted-foreground transition disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Split & Delete Actions */}
        <div className="flex items-center bg-secondary/80 rounded-lg p-0.5 border border-border/60">
          <button
            type="button"
            onClick={onSplit}
            title="Split clip at playhead (S)"
            aria-label="Split clip"
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-background/80 hover:text-foreground text-muted-foreground transition cursor-pointer font-medium text-[11px]"
          >
            <Scissors className="h-3.5 w-3.5 text-primary" />
            <span className="hidden md:inline">Split</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={!hasSelection}
            title="Delete selected clip (Del)"
            aria-label="Delete clip"
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-destructive/15 hover:text-destructive text-muted-foreground transition disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed font-medium text-[11px]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Delete</span>
          </button>
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-border/80 mx-0.5 hidden sm:block" />

        {/* Quick Add Buttons */}
        {!isMobile ? (
          <div className="flex items-center gap-1">
            {/* + Caption (with dropdown for Caption 1 vs Caption 2) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/80 hover:bg-primary/15 hover:text-primary border border-border/60 text-muted-foreground transition font-semibold text-[11px] cursor-pointer"
                >
                  <Type className="h-3 w-3 text-primary" />
                  <span>+ Caption</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-popover border border-border z-50 shadow-xl rounded-xl">
                <DropdownMenuItem onClick={() => onAddCaption(1)} className="text-xs cursor-pointer py-1.5 flex items-center gap-2">
                  <span className="text-primary font-bold">💬 Caption 1</span> (Primary AI Speech)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddCaption(2)} className="text-xs cursor-pointer py-1.5 flex items-center gap-2">
                  <span className="text-purple-400 font-bold">✨ Caption 2</span> (Secondary / Translation)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={onAddMemeGif}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/80 hover:bg-orange-500/15 hover:text-orange-400 border border-border/60 text-muted-foreground transition font-semibold text-[11px] cursor-pointer"
              title="Add Meme or Reaction GIF"
            >
              <Smile className="h-3 w-3 text-orange-400" />
              <span>+ Meme/GIF</span>
            </button>

            <button
              type="button"
              onClick={onAddEffect}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/80 hover:bg-amber-500/15 hover:text-amber-400 border border-border/60 text-muted-foreground transition font-semibold text-[11px] cursor-pointer"
              title="Add Visual Effect (Zoom, Shake, Glitch...)"
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>+ Effect</span>
            </button>

            <button
              type="button"
              onClick={onAddAudio}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/80 hover:bg-emerald-500/15 hover:text-emerald-400 border border-border/60 text-muted-foreground transition font-semibold text-[11px] cursor-pointer"
              title="Add Audio Track (Voiceover or Music/SFX)"
            >
              <Music className="h-3 w-3 text-emerald-400" />
              <span>+ Audio</span>
            </button>
          </div>
        ) : (
          /* Mobile Simplified Add Dropdown */
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 border border-primary/30 text-primary font-bold text-[11px] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover border border-border z-50 shadow-xl rounded-xl">
              <DropdownMenuItem onClick={() => onAddCaption(1)} className="text-xs cursor-pointer py-1.5 flex items-center gap-2">
                <Type className="h-3.5 w-3.5 text-primary" /> + Caption 1 (Primary)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddCaption(2)} className="text-xs cursor-pointer py-1.5 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" /> + Caption 2 (Secondary)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddMemeGif} className="text-xs cursor-pointer py-1.5 flex items-center gap-2">
                <Smile className="h-3.5 w-3.5 text-orange-400" /> + Meme / GIF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddEffect} className="text-xs cursor-pointer py-1.5 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> + Effect (Zoom/Shake)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddAudio} className="text-xs cursor-pointer py-1.5 flex items-center gap-2">
                <Music className="h-3.5 w-3.5 text-emerald-400" /> + Audio (Voice / SFX)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* RIGHT: Timecode, Zoom & Fit Timeline */}
      <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
        {/* Current Time / Duration display */}
        <div className="flex items-center font-mono text-[11px] font-semibold text-foreground bg-secondary/60 px-2 py-0.5 rounded border border-border/50">
          <span className="text-primary">{formatTimecode(currentTime)}</span>
          <span className="mx-1 text-muted-foreground/60">/</span>
          <span className="text-muted-foreground">{formatTimecode(duration)}</span>
        </div>

        {/* Zoom Controls */}
        <div className="hidden sm:flex items-center gap-1.5 bg-secondary/80 rounded-lg p-0.5 border border-border/60">
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(5, zoomPct - 15))}
            title="Zoom out"
            aria-label="Zoom out"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-background/80 transition cursor-pointer"
          >
            <ZoomOut className="h-3 w-3" />
          </button>
          <input
            type="range"
            min={5}
            max={100}
            value={zoomPct}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="w-16 md:w-24 h-1 rounded-full bg-muted-foreground/30 accent-primary cursor-pointer"
            aria-label="Timeline zoom slider"
          />
          <button
            type="button"
            onClick={() => onZoomChange(Math.min(100, zoomPct + 15))}
            title="Zoom in"
            aria-label="Zoom in"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-background/80 transition cursor-pointer"
          >
            <ZoomIn className="h-3 w-3" />
          </button>
        </div>

        {/* Fit Timeline button */}
        <button
          type="button"
          onClick={onFitTimeline}
          title="Fit Timeline to window"
          aria-label="Fit Timeline"
          className="flex items-center gap-1 p-1 sm:px-2 sm:py-1 rounded-lg bg-secondary/80 hover:bg-background/80 hover:text-foreground text-muted-foreground border border-border/60 transition text-[11px] font-semibold cursor-pointer"
        >
          <Maximize2 className="h-3 w-3" />
          <span className="hidden md:inline">Fit</span>
        </button>
      </div>
    </div>
  );
};
