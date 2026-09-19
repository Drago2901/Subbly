import React, { useRef } from "react";
import type { TimelineAudioClip } from "@/lib/captions/types";
import { Music, Volume2, Play, Plus, Upload, Sliders, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface SFXItem {
  id: string;
  title: string;
  category: "sfx" | "bgm" | "meme";
  duration: number;
  url: string;
}

const SFX_LIBRARY: SFXItem[] = [
  { id: "whoosh", title: "Clean Whoosh Transition", category: "sfx", duration: 0.8, url: "" },
  { id: "pop", title: "Bubble Pop Click", category: "sfx", duration: 0.4, url: "" },
  { id: "impact", title: "Cinematic Sub Bass Boom", category: "sfx", duration: 2.2, url: "" },
  { id: "riser", title: "Tension Riser Swoop", category: "sfx", duration: 3.0, url: "" },
  { id: "vine_boom", title: "Vine Boom Punch", category: "meme", duration: 1.5, url: "" },
  { id: "bell", title: "Success Notification Bell", category: "sfx", duration: 1.2, url: "" },
  { id: "ambient_lofi", title: "Lo-Fi Beats Ambient Loop", category: "bgm", duration: 15.0, url: "" },
  { id: "upbeat_vlog", title: "Energetic Creator Groove", category: "bgm", duration: 12.0, url: "" },
];

interface AudioPanelProps {
  currentTime: number;
  audioClips: TimelineAudioClip[];
  onAudioClipsChange: (clips: TimelineAudioClip[]) => void;
  onOpenClipSettings?: () => void;
}

export const AudioPanel: React.FC<AudioPanelProps> = ({
  currentTime,
  audioClips,
  onAudioClipsChange,
  onOpenClipSettings,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddSFX = (item: SFXItem) => {
    const newClip: TimelineAudioClip = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 9),
      url: item.url || "/test-audio.mp3",
      title: item.title,
      start: currentTime,
      end: currentTime + item.duration,
      duration: item.duration,
      volume: 1.0,
      muted: false,
      fadeIn: 0.1,
      fadeOut: 0.2,
      trackType: item.category === "bgm" ? "vocal" : "audioSfx",
    };

    onAudioClipsChange([...audioClips, newClip]);
    toast.success(`Added "${item.title}" at ${currentTime.toFixed(1)}s`);
  };

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const newClip: TimelineAudioClip = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 9),
      url,
      title: file.name.replace(/\.[^/.]+$/, ""),
      start: currentTime,
      end: currentTime + 5.0,
      duration: 5.0,
      volume: 1.0,
      muted: false,
      trackType: "audioSfx",
    };

    onAudioClipsChange([...audioClips, newClip]);
    toast.success(`Uploaded "${file.name}" to Audio track`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-4 space-y-5 text-foreground select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a"
        className="hidden"
        onChange={handleCustomAudioUpload}
      />

      {/* Upload Custom Audio Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition cursor-pointer active:scale-98"
      >
        <Upload className="h-4 w-4" />
        <span>Upload Audio / SFX (.mp3, .wav)</span>
      </button>

      {/* Shortcut to Level 2: Clip Settings */}
      {onOpenClipSettings && audioClips.length > 0 && (
        <button
          type="button"
          onClick={onOpenClipSettings}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/50 hover:bg-muted text-foreground transition cursor-pointer group shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground">Audio Track Controls</span>
              <span className="text-[10px] text-muted-foreground">{audioClips.length} active clip{audioClips.length === 1 ? "" : "s"}</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* SFX Library List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Curated SFX & BGM
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {audioClips.length} clips on timeline
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {SFX_LIBRARY.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-card/90 hover:border-primary/50 transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-foreground group-hover:text-primary transition-colors flex-shrink-0">
                  <Music className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0 pr-1">
                  <span className="text-xs font-bold text-foreground truncate">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {item.duration.toFixed(1)}s · {item.category.toUpperCase()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAddSFX(item)}
                className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-gradient-primary hover:text-primary-foreground text-primary text-[11px] font-bold transition cursor-pointer active:scale-95 shadow-sm"
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
