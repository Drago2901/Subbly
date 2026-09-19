import React from "react";
import type { CaptionStyle, Caption } from "@/lib/captions/types";
import { Slider } from "@/components/ui/slider";
import { RotateCcw, Move, Box, Sparkles, Layers } from "lucide-react";
import { DEFAULT_STYLE } from "@/lib/captions/types";

interface AdjustmentsPanelProps {
  style: CaptionStyle;
  onChange: (style: CaptionStyle) => void;
  selectedCaption?: Caption | null;
  onCaptionChange?: (id: string, patch: Partial<Caption>) => void;
}

export const AdjustmentsPanel: React.FC<AdjustmentsPanelProps> = ({
  style,
  onChange,
  selectedCaption,
  onCaptionChange,
}) => {
  const currentX = selectedCaption?.x !== undefined ? Math.round(selectedCaption.x * 100) : Math.round(style.posX * 100);
  const currentY = selectedCaption?.y !== undefined ? Math.round(selectedCaption.y * 100) : Math.round(style.posY * 100);

  const handlePositionX = (val: number) => {
    const normalized = val / 100;
    if (selectedCaption && onCaptionChange) {
      onCaptionChange(selectedCaption.id, { x: normalized, style: { ...selectedCaption.style, posX: normalized } });
    } else {
      onChange({ ...style, posX: normalized, position: "free" });
    }
  };

  const handlePositionY = (val: number) => {
    const normalized = val / 100;
    if (selectedCaption && onCaptionChange) {
      onCaptionChange(selectedCaption.id, { y: normalized, style: { ...selectedCaption.style, posY: normalized } });
    } else {
      onChange({ ...style, posY: normalized, position: "free" });
    }
  };

  const handleBoxWidth = (val: number) => {
    if (selectedCaption && onCaptionChange) {
      onCaptionChange(selectedCaption.id, {
        width: val,
        style: { ...selectedCaption.style, boxWidth: val },
      });
    } else {
      onChange({ ...style, boxWidth: val });
    }
  };

  const handleStrokeWidth = (val: number) => {
    onChange({ ...style, strokeWidth: val });
  };

  const handleBgOpacity = (val: number) => {
    onChange({ ...style, bgOpacity: val / 100 });
  };

  const handleActiveWordScale = (val: number) => {
    onChange({ ...style, activeWordScale: val });
  };

  const resetAdjustments = () => {
    onChange({
      ...style,
      posX: DEFAULT_STYLE.posX,
      posY: DEFAULT_STYLE.posY,
      boxWidth: DEFAULT_STYLE.boxWidth,
      strokeWidth: DEFAULT_STYLE.strokeWidth,
      bgOpacity: DEFAULT_STYLE.bgOpacity,
      activeWordScale: 1.15,
    });
  };

  return (
    <div className="p-4 space-y-6 text-foreground select-none">
      {/* 1. Precise Coordinate Alignment */}
      <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Move className="h-3.5 w-3.5 text-primary" />
            <span>Position Coordinates</span>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            X:{currentX}% Y:{currentY}%
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
            <span>Horizontal (X)</span>
            <span>{currentX}%</span>
          </div>
          <Slider
            value={[currentX]}
            min={5}
            max={95}
            step={1}
            onValueChange={(vals) => handlePositionX(vals[0])}
            className="cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
            <span>Vertical (Y)</span>
            <span>{currentY}%</span>
          </div>
          <Slider
            value={[currentY]}
            min={5}
            max={95}
            step={1}
            onValueChange={(vals) => handlePositionY(vals[0])}
            className="cursor-pointer"
          />
        </div>
      </div>

      {/* 2. Container Box & Width */}
      <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Box className="h-3.5 w-3.5 text-primary" />
            <span>Box Width & Padding</span>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {style.boxWidth || 84}%
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
            <span>Max Caption Width</span>
            <span>{style.boxWidth || 84}%</span>
          </div>
          <Slider
            value={[style.boxWidth || 84]}
            min={20}
            max={100}
            step={2}
            onValueChange={(vals) => handleBoxWidth(vals[0])}
            className="cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
            <span>Background Box Opacity</span>
            <span>{Math.round((style.bgOpacity ?? 0.55) * 100)}%</span>
          </div>
          <Slider
            value={[Math.round((style.bgOpacity ?? 0.55) * 100)]}
            min={0}
            max={100}
            step={5}
            onValueChange={(vals) => handleBgOpacity(vals[0])}
            className="cursor-pointer"
          />
        </div>
      </div>

      {/* 3. Text Stroke & Outline */}
      <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>Outline & Stroke</span>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {style.strokeWidth || 0}px
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
            <span>Stroke Thickness</span>
            <span>{style.strokeWidth || 0}px</span>
          </div>
          <Slider
            value={[style.strokeWidth || 0]}
            min={0}
            max={16}
            step={1}
            onValueChange={(vals) => handleStrokeWidth(vals[0])}
            className="cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground font-medium">Outline Color</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={style.strokeColor || "#000000"}
              onChange={(e) => onChange({ ...style, strokeColor: e.target.value })}
              className="h-6 w-6 rounded border border-border cursor-pointer bg-transparent"
            />
            <span className="text-[10.5px] font-mono text-muted-foreground uppercase">
              {style.strokeColor || "#000000"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Active Word Pop Intensity */}
      <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Active Word Pop Scale</span>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {(style.activeWordScale ?? 1.15).toFixed(2)}x
          </span>
        </div>

        <Slider
          value={[style.activeWordScale ?? 1.15]}
          min={1.0}
          max={1.5}
          step={0.05}
          onValueChange={(vals) => handleActiveWordScale(vals[0])}
          className="cursor-pointer"
        />
      </div>

      {/* Reset button */}
      <button
        type="button"
        onClick={resetAdjustments}
        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-border bg-secondary/50 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>Reset Adjustments</span>
      </button>
    </div>
  );
};
