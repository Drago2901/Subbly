import React from "react";
import type { TimelineEffect, VideoEffectType } from "@/lib/captions/types";
import { Sparkles, Sliders, ChevronRight, Zap, Eye, Film, Layers } from "lucide-react";
import { toast } from "sonner";

interface EffectsCatalogItem {
  type: VideoEffectType;
  name: string;
  desc: string;
  badge: string;
  color: string;
}

const EFFECT_ITEMS: EffectsCatalogItem[] = [
  { type: "zoom", name: "Dynamic Zoom In", desc: "Smooth push-in on key statements", badge: "Viral", color: "from-amber-500/20 to-orange-500/20 text-orange-400" },
  { type: "shake", name: "Camera Impact Shake", desc: "High-energy jitter on beat drops", badge: "Popular", color: "from-rose-500/20 to-red-500/20 text-rose-400" },
  { type: "flash", name: "White Flash Flare", desc: "Punchy transition flash", badge: "Trending", color: "from-yellow-500/20 to-amber-500/20 text-yellow-300" },
  { type: "blur", name: "Radial Focus Blur", desc: "Draws attention to center subtitles", badge: "Pro", color: "from-blue-500/20 to-indigo-500/20 text-blue-400" },
  { type: "glitch", name: "Digital RGB Glitch", desc: "Cyberpunk distortion & split", badge: "Trending", color: "from-purple-500/20 to-pink-500/20 text-pink-400" },
];

export interface FilterPreset {
  id: string;
  name: string;
  desc: string;
  cssFilter: string;
}

export const FILTER_PRESETS: FilterPreset[] = [
  { id: "cinema", name: "Teal & Orange", desc: "Hollywood blockbuster tones", cssFilter: "contrast(115%) saturate(120%)" },
  { id: "vintage", name: "90s Camcorder", desc: "Retro VHS grain & warm wash", cssFilter: "sepia(25%) contrast(105%) brightness(105%)" },
  { id: "cyber", name: "Cyberpunk Neon", desc: "Vibrant high-contrast neon blues", cssFilter: "saturate(150%) hue-rotate(15deg) contrast(110%)" },
  { id: "noir", name: "Dramatic B&W", desc: "High contrast cinematic monochrome", cssFilter: "grayscale(100%) contrast(135%)" },
  { id: "warm", name: "Golden Sunset", desc: "Warm flattering skin tones", cssFilter: "sepia(15%) saturate(115%) brightness(102%)" },
  { id: "cool", name: "Nordic Teal", desc: "Modern desaturated moody cold", cssFilter: "saturate(85%) hue-rotate(-10deg) contrast(105%)" },
];

interface EffectsPanelProps {
  currentTime: number;
  effects: TimelineEffect[];
  onEffectsChange: (effects: TimelineEffect[]) => void;
  onOpenFilters?: () => void;
}

export const EffectsPanel: React.FC<EffectsPanelProps> = ({
  currentTime,
  effects,
  onEffectsChange,
  onOpenFilters,
}) => {
  const handleAddEffect = (item: EffectsCatalogItem) => {
    const duration = 1.5;
    const start = currentTime;
    const end = start + duration;

    const newEffect: TimelineEffect = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 9),
      type: item.type,
      name: item.name,
      start,
      end,
      intensity: 0.8,
    };

    onEffectsChange([...effects, newEffect]);
    toast.success(`Added ${item.name} at ${start.toFixed(1)}s`);
  };

  return (
    <div className="p-4 space-y-5 text-foreground select-none">
      {/* Shortcut to Level 2: Filters */}
      {onOpenFilters && (
        <button
          type="button"
          onClick={onOpenFilters}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary transition cursor-pointer group shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground">Color Filters & LUTs</span>
              <span className="text-[10px] text-muted-foreground">Cinematic, Vintage, Cyberpunk</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Effects Catalog */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Video Effects Catalog
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {effects.length} active
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {EFFECT_ITEMS.map((item) => (
            <div
              key={item.type}
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-card/90 hover:border-primary/50 transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} flex-shrink-0`}>
                  <Zap className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground truncate">
                      {item.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[8.5px] font-extrabold uppercase tracking-wider bg-primary/15 text-primary">
                      {item.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {item.desc}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAddEffect(item)}
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
