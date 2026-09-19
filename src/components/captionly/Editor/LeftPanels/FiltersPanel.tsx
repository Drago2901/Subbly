import React from "react";
import { FILTER_PRESETS, type FilterPreset } from "./EffectsPanel";
import { Sliders, Check, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface FiltersPanelProps {
  activeFilterId?: string | null;
  onSelectFilter: (filter: FilterPreset | null) => void;
  onOpenAdjustments?: () => void;
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  activeFilterId,
  onSelectFilter,
  onOpenAdjustments,
}) => {
  return (
    <div className="p-4 space-y-5 text-foreground select-none">
      {/* Shortcut to Level 3: Adjustments */}
      {onOpenAdjustments && (
        <button
          type="button"
          onClick={onOpenAdjustments}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/50 hover:bg-muted text-foreground transition cursor-pointer group shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground">Filter Adjustments</span>
              <span className="text-[10px] text-muted-foreground">Intensity, Contrast, Blend</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Cinematic LUTs & Filters
          </span>
          {activeFilterId && (
            <button
              type="button"
              onClick={() => {
                onSelectFilter(null);
                toast.info("Reset filter to Normal");
              }}
              className="text-[10.5px] text-primary hover:underline font-bold cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {FILTER_PRESETS.map((preset) => {
            const isSelected = activeFilterId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onSelectFilter(preset);
                  toast.success(`Applied ${preset.name} filter`);
                }}
                className={`relative flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-[0_0_12px_rgba(255,92,58,0.2)] ring-1 ring-primary"
                    : "border-border bg-card/80 hover:border-primary/40 hover:bg-secondary/40"
                }`}
              >
                {/* Visual Swatch Preview */}
                <div
                  className="h-16 w-full rounded-lg mb-2 overflow-hidden bg-gradient-to-tr from-amber-600 via-rose-500 to-indigo-600 flex items-center justify-center relative shadow-inner"
                  style={{ filter: preset.cssFilter }}
                >
                  <span className="text-[10px] font-black text-white/90 drop-shadow">
                    {preset.name.split(" ")[0]}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </div>
                  )}
                </div>

                <span className="text-xs font-bold text-foreground truncate">
                  {preset.name}
                </span>
                <span className="text-[9.5px] text-muted-foreground truncate">
                  {preset.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
