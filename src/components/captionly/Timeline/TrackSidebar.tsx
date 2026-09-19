import React from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Volume2,
  VolumeX,
  Plus,
} from "lucide-react";
import type { TimelineTrackId } from "@/lib/captions/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TrackConfig {
  id: TimelineTrackId;
  label: string;
  icon: string;
  badge?: string;
  accentClass: string;
  defaultHeight: number;
}

export const TRACK_CONFIGS: TrackConfig[] = [
  { id: "video", label: "Video", icon: "🎬", accentClass: "text-muted-foreground", defaultHeight: 48 },
  { id: "caption1", label: "Caption 1", icon: "💬", badge: "Primary", accentClass: "text-primary", defaultHeight: 46 },
  { id: "caption2", label: "Caption 2", icon: "✨", badge: "Secondary", accentClass: "text-purple-400", defaultHeight: 46 },
  { id: "memes", label: "Memes/GIFs", icon: "😂", accentClass: "text-orange-400", defaultHeight: 46 },
  { id: "effects", label: "Effects", icon: "✨", accentClass: "text-amber-400", defaultHeight: 38 },
  { id: "vocal", label: "Vocal", icon: "🎙️", badge: "Speech", accentClass: "text-emerald-400", defaultHeight: 52 },
  { id: "audioSfx", label: "Audio / SFX", icon: "🔊", accentClass: "text-teal-400", defaultHeight: 46 },
];

export const COLLAPSED_TRACK_HEIGHT = 22;

interface TrackSidebarProps {
  trackVisibility: Record<TimelineTrackId, boolean>;
  onToggleVisibility: (trackId: TimelineTrackId) => void;
  trackLocks: Record<TimelineTrackId, boolean>;
  onToggleLock: (trackId: TimelineTrackId) => void;
  trackCollapsed: Record<TimelineTrackId, boolean>;
  onToggleCollapse: (trackId: TimelineTrackId) => void;
  vocalVolume: number;
  onVocalVolumeChange: (vol: number) => void;
  audioSfxVolume: number;
  onAudioSfxVolumeChange: (vol: number) => void;
  vocalMuted: boolean;
  onToggleVocalMute: () => void;
  audioSfxMuted: boolean;
  onToggleAudioSfxMute: () => void;
  onQuickAdd: (trackId: TimelineTrackId) => void;
  isMobile?: boolean;
  sidebarScrollRef?: React.RefObject<HTMLDivElement>;
}

export const TrackSidebar: React.FC<TrackSidebarProps> = ({
  trackVisibility,
  onToggleVisibility,
  trackLocks,
  onToggleLock,
  trackCollapsed,
  onToggleCollapse,
  vocalVolume,
  onVocalVolumeChange,
  audioSfxVolume,
  onAudioSfxVolumeChange,
  vocalMuted,
  onToggleVocalMute,
  audioSfxMuted,
  onToggleAudioSfxMute,
  onQuickAdd,
  isMobile = false,
  sidebarScrollRef,
}) => {
  return (
    <div className="flex flex-col bg-card border-r border-border select-none z-20 flex-shrink-0">
      {/* Top Header matching the Time Ruler height */}
      <div className="h-6 px-2.5 flex items-center justify-between border-b border-border bg-secondary/80 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        <span>Tracks</span>
      </div>

      {/* Track Rows — scrolls in sync with the right track lane area */}
      <div
        ref={sidebarScrollRef}
        className="flex flex-col overflow-y-hidden"
      >
        {TRACK_CONFIGS.map((track) => {
          const isCollapsed = trackCollapsed[track.id] ?? false;
          const isVisible = trackVisibility[track.id] ?? true;
          const isLocked = trackLocks[track.id] ?? false;
          const height = isCollapsed ? COLLAPSED_TRACK_HEIGHT : track.defaultHeight;

          const isVocal = track.id === "vocal";
          const isAudioSfx = track.id === "audioSfx";

          return (
            <div
              key={track.id}
              style={{ height }}
              className={`flex items-center justify-between px-2 sm:px-2.5 border-b border-border/80 transition-all duration-150 ${
                isLocked ? "bg-muted/40" : isCollapsed ? "bg-secondary/40" : "bg-card"
              }`}
            >
              {/* Track Icon & Title */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {/* Collapse Toggle */}
                <button
                  type="button"
                  onClick={() => onToggleCollapse(track.id)}
                  title={isCollapsed ? "Expand track" : "Collapse track"}
                  className="p-0.5 rounded text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>

                {/* Track Icon */}
                <span className="text-xs flex-shrink-0 select-none">{track.icon}</span>

                {/* Track Title */}
                {!isMobile && (
                  <div className="flex items-center gap-1 min-w-0 truncate">
                    <span
                      className={`text-[11px] font-bold truncate leading-none ${
                        !isVisible ? "line-through text-muted-foreground/60" : "text-foreground"
                      }`}
                    >
                      {track.label}
                    </span>
                    {track.badge && !isCollapsed && (
                      <span className="text-[8.5px] uppercase font-mono px-1 py-0.2 rounded bg-secondary text-muted-foreground font-semibold flex-shrink-0">
                        {track.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Compact Track Controls: Eye, Lock, More */}
              <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                {/* Visibility (Eye) */}
                <button
                  type="button"
                  onClick={() => onToggleVisibility(track.id)}
                  title={isVisible ? "Hide track" : "Show track"}
                  className={`p-1 rounded transition cursor-pointer ${
                    isVisible
                      ? "text-muted-foreground/70 hover:text-foreground"
                      : "text-muted-foreground/40 hover:text-muted-foreground"
                  }`}
                >
                  {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </button>

                {/* Lock */}
                <button
                  type="button"
                  onClick={() => onToggleLock(track.id)}
                  title={isLocked ? "Unlock track" : "Lock track"}
                  className={`p-1 rounded transition cursor-pointer ${
                    isLocked
                      ? "text-amber-500 hover:text-amber-400 font-bold"
                      : "text-muted-foreground/50 hover:text-muted-foreground"
                  }`}
                >
                  {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                </button>

                {/* More / Volume Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      title="Track settings"
                      className="p-1 rounded text-muted-foreground/50 hover:text-foreground transition cursor-pointer"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-popover border border-border shadow-xl z-50 rounded-xl p-1.5">
                    <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1">
                      {track.label} Options
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />

                    {/* Audio Volume Slider */}
                    {isVocal && (
                      <div className="px-2 py-2 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px] font-medium">
                          <span className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={onToggleVocalMute}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {vocalMuted ? <VolumeX className="h-3.5 w-3.5 text-destructive" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400" />}
                            </button>
                            <span>Vocal Volume</span>
                          </span>
                          <span className="font-mono text-muted-foreground">{vocalMuted ? "0%" : `${Math.round(vocalVolume * 100)}%`}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1.5}
                          step={0.05}
                          value={vocalMuted ? 0 : vocalVolume}
                          onChange={(e) => onVocalVolumeChange(Number(e.target.value))}
                          className="w-full h-1 rounded bg-muted accent-emerald-400 cursor-pointer"
                        />
                      </div>
                    )}

                    {isAudioSfx && (
                      <div className="px-2 py-2 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px] font-medium">
                          <span className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={onToggleAudioSfxMute}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {audioSfxMuted ? <VolumeX className="h-3.5 w-3.5 text-destructive" /> : <Volume2 className="h-3.5 w-3.5 text-teal-400" />}
                            </button>
                            <span>Music/SFX Volume</span>
                          </span>
                          <span className="font-mono text-muted-foreground">{audioSfxMuted ? "0%" : `${Math.round(audioSfxVolume * 100)}%`}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1.5}
                          step={0.05}
                          value={audioSfxMuted ? 0 : audioSfxVolume}
                          onChange={(e) => onAudioSfxVolumeChange(Number(e.target.value))}
                          className="w-full h-1 rounded bg-muted accent-teal-400 cursor-pointer"
                        />
                      </div>
                    )}

                    <DropdownMenuItem
                      onClick={() => onQuickAdd(track.id)}
                      className="text-xs cursor-pointer py-1.5 flex items-center gap-2 rounded-lg"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add item to {track.label}</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => onToggleLock(track.id)}
                      className="text-xs cursor-pointer py-1.5 flex items-center gap-2 rounded-lg"
                    >
                      {isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                      <span>{isLocked ? "Unlock track" : "Lock track"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
