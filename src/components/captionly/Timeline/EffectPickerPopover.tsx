import React from "react";
import { Sparkles, ZoomIn, Activity, Zap, Droplets, Binary } from "lucide-react";
import type { VideoEffectType } from "@/lib/captions/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface EffectPickerPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectEffect: (type: VideoEffectType, name: string) => void;
}

interface EffectOption {
  type: VideoEffectType;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  accentClass: string;
  badge: string;
}

const EFFECT_OPTIONS: EffectOption[] = [
  {
    type: "zoom",
    name: "Dramatic Zoom",
    icon: ZoomIn,
    description: "Punches in on key moments to emphasize viral speech or punchlines",
    accentClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    badge: "Punch",
  },
  {
    type: "shake",
    name: "Camera Shake",
    icon: Activity,
    description: "Vigorous impact shake for laughter, reactions, or bass drops",
    accentClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    badge: "Impact",
  },
  {
    type: "flash",
    name: "Impact Flash",
    icon: Zap,
    description: "Sudden bright white flare for transitions and beat drops",
    accentClass: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    badge: "Flare",
  },
  {
    type: "blur",
    name: "Focus Blur",
    icon: Droplets,
    description: "Soft gaussian blur for suspense, thought bubbles, or background focus",
    accentClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    badge: "Cinema",
  },
  {
    type: "glitch",
    name: "Cyber Glitch",
    icon: Binary,
    description: "Distorted RGB chromatic aberration effect for edgy transitions",
    accentClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    badge: "Digital",
  },
];

export const EffectPickerPopover: React.FC<EffectPickerPopoverProps> = ({
  open,
  onOpenChange,
  onSelectEffect,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border border-border shadow-2xl rounded-2xl p-6 select-none z-50">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Add Video Effect
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Choose an effect block to add to the Effects timeline track.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-1 max-h-[380px] overflow-y-auto">
          {EFFECT_OPTIONS.map((eff) => {
            const Icon = eff.icon;
            return (
              <button
                key={eff.type}
                type="button"
                onClick={() => {
                  onSelectEffect(eff.type, eff.name);
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary hover:border-border/80 transition text-left cursor-pointer group"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border ${eff.accentClass} group-hover:scale-105 transition flex-shrink-0`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{eff.name}</span>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-secondary font-bold text-muted-foreground">
                      {eff.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {eff.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
