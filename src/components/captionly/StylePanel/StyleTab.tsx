import React from "react";
import { AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical, Move } from "lucide-react";
import { type CaptionStyle, type Caption } from "@/lib/captions/types";
import { AccordionCard, Field, SliderRow, ColorField, ToggleRow } from "./stylePanelControls";
import { FontPicker } from "../FontPicker";

interface StyleTabProps {
  style: CaptionStyle;
  onChange: (s: CaptionStyle) => void;
  customFonts: string[];
  selectedCaption?: Caption | null;
  onCaptionChange?: (id: string, patch: Partial<Caption>) => void;
  showTabsHeader?: boolean;
  openSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

export function StyleTab({
  style,
  onChange,
  customFonts,
  selectedCaption,
  onCaptionChange,
  showTabsHeader = true,
  openSections,
  toggleSection,
}: StyleTabProps) {
  const set = <K extends keyof CaptionStyle>(key: K, val: CaptionStyle[K]) => {
    onChange({ ...style, [key]: val });
  };

  return (
    <div className="space-y-4.5">
      {/* Accordion Card 1: Caption Emojis settings */}
      <AccordionCard
        title="Caption & Emojis"
        isOpen={!showTabsHeader || openSections.caption}
        onToggle={() => toggleSection("caption")}
        icon="😊"
        isCollapsible={showTabsHeader}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-1">
            <span className="text-[12.5px] font-semibold text-[#555] dark:text-[#A1A8B5]">Add Emojis to Captions</span>
            <div className="flex rounded-lg bg-[#F0EDE8] dark:bg-[#181B22] p-0.5 border border-[#E8E4DE] dark:border-[#2C313C]">
              <button
                type="button"
                onClick={() => set("emojiEnabled", true)}
                className={`px-3.5 py-1.5 text-[11.5px] font-bold rounded-md transition-all cursor-pointer ${
                  style.emojiEnabled
                    ? "bg-[#FF6B2C] text-white shadow-sm"
                    : "text-[#888] dark:text-[#A1A8B5] hover:text-[#1a1a1a] dark:hover:text-white bg-transparent"
                }`}
              >
                On
              </button>
              <button
                type="button"
                onClick={() => set("emojiEnabled", false)}
                className={`px-3.5 py-1.5 text-[11.5px] font-bold rounded-md transition-all cursor-pointer ${
                  !style.emojiEnabled
                    ? "bg-white dark:bg-[#1F232D] text-[#1a1a1a] dark:text-white border border-[#E8E4DE] dark:border-[#2C313C]/60 shadow-sm"
                    : "text-[#888] dark:text-[#A1A8B5] hover:text-[#1a1a1a] dark:hover:text-white bg-transparent"
                }`}
              >
                Off
              </button>
            </div>
          </div>
          {style.emojiEnabled && (
            <Field label="Emoji Density">
              <select
                aria-label="Emoji Density"
                value={style.emojiDensity || "medium"}
                onChange={(e) => set("emojiDensity", e.target.value as "light" | "medium" | "heavy")}
                className="w-full cursor-pointer rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#181B22] px-3 py-2 text-[12.5px] text-[#1a1a1a] dark:text-white outline-none focus:border-[#FF6B2C]"
              >
                <option value="light">Light (sparse emojis)</option>
                <option value="medium">Medium (standard emojis)</option>
                <option value="heavy">Heavy (viral engagement)</option>
              </select>
            </Field>
          )}
        </div>
      </AccordionCard>

      {/* Accordion Card 2: Typography settings */}
      <AccordionCard
        title="Typography"
        isOpen={!showTabsHeader || openSections.typography}
        onToggle={() => toggleSection("typography")}
        icon="Aa"
        isCollapsible={showTabsHeader}
      >
        <div className="space-y-4">
          <Field label="Font Family">
            <FontPicker
              value={style.fontFamily}
              onChange={(f) => set("fontFamily", f)}
              customFonts={customFonts}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <SliderRow
              label="Size"
              value={style.fontSize}
              min={20}
              max={140}
              step={2}
              onChange={(v) => set("fontSize", v)}
              suffix="px"
            />
            <SliderRow
              label="Weight"
              value={style.fontWeight}
              min={300}
              max={900}
              step={100}
              onChange={(v) => set("fontWeight", v)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <ColorField label="Text Color" value={style.color} onChange={(v) => set("color", v)} />
            <ColorField label="Highlight Color" value={style.highlightColor} onChange={(v) => set("highlightColor", v)} />
          </div>

          <div className="rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#181B22] overflow-hidden mt-2">
            <ToggleRow icon="B" label="Bold Outlines" checked={style.bold} onChange={(v) => set("bold", v)} />
            <ToggleRow icon="AA" label="Uppercase Text" checked={style.uppercase} onChange={(v) => set("uppercase", v)} />
            <ToggleRow icon="✨" label="Karaoke Highlight" checked={style.karaoke} onChange={(v) => set("karaoke", v)} last />
          </div>
        </div>
      </AccordionCard>

      {/* Accordion Card 3: Background & Sizing */}
      <AccordionCard
        title="Background & Sizing"
        isOpen={!showTabsHeader || openSections.background}
        onToggle={() => toggleSection("background")}
        icon="🖼️"
        isCollapsible={showTabsHeader}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ColorField label="BG Color" value={style.bgColor} onChange={(v) => set("bgColor", v)} />
            <SliderRow
              label="BG Opacity"
              value={Math.round(style.bgOpacity * 100)}
              min={0}
              max={100}
              step={5}
              onChange={(v) => set("bgOpacity", v / 100)}
              suffix="%"
            />
          </div>

          <SliderRow
            label="Box Width Limit"
            value={style.boxWidth ?? 84}
            min={10}
            max={100}
            step={1}
            onChange={(v) => set("boxWidth", v)}
            suffix="%"
          />

          <SliderRow
            label="Box Height Limit"
            value={style.boxHeight ?? 0}
            min={0}
            max={100}
            step={1}
            onChange={(v) => set("boxHeight", v === 0 ? (undefined as unknown as number) : v)}
            suffix="%"
          />
        </div>
      </AccordionCard>

      {/* Accordion Card 4: Stroke & Position */}
      <AccordionCard
        title="Stroke & Position"
        isOpen={!showTabsHeader || openSections.strokePos}
        onToggle={() => toggleSection("strokePos")}
        icon="🎯"
        isCollapsible={showTabsHeader}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ColorField label="Stroke Color" value={style.strokeColor} onChange={(v) => set("strokeColor", v)} />
            <SliderRow
              label="Stroke Width"
              value={style.strokeWidth}
              min={0}
              max={12}
              step={1}
              onChange={(v) => set("strokeWidth", v)}
              compact
            />
          </div>

          <Field label="Text Alignment">
            <div className="grid grid-cols-3 gap-1.5 bg-[#F0EDE8] dark:bg-[#181B22] p-1 rounded-lg border border-[#E8E4DE] dark:border-[#2C313C]">
              {[
                { key: "left", icon: AlignLeft, label: "Left" },
                { key: "center", icon: AlignCenter, label: "Center" },
                { key: "right", icon: AlignRight, label: "Right" },
              ].map((p) => {
                const Icon = p.icon;
                const active = (style.alignment || "center") === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => set("alignment", p.key as CaptionStyle["alignment"])}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded text-[11.5px] font-bold transition cursor-pointer ${
                      active
                        ? "bg-[#FF6B2C] text-white shadow-sm"
                        : "text-[#666] dark:text-[#A1A8B5] hover:text-[#1a1a1a] dark:hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Vertical Position Preset">
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { key: "top", icon: AlignStartVertical, label: "Top" },
                { key: "middle", icon: AlignCenterVertical, label: "Middle" },
                { key: "bottom", icon: AlignEndVertical, label: "Bottom" },
                { key: "free", icon: Move, label: "Free" },
              ].map((p) => {
                const Icon = p.icon;
                const active = style.position === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      const newPos = p.key as CaptionStyle["position"];
                      set("position", newPos);
                      if (selectedCaption && onCaptionChange) {
                        if (newPos === "top") {
                          onCaptionChange(selectedCaption.id, { x: 0.5, y: 0.12, style: { position: "top" } });
                        } else if (newPos === "middle") {
                          onCaptionChange(selectedCaption.id, { x: 0.5, y: 0.5, style: { position: "middle" } });
                        } else if (newPos === "bottom") {
                          onCaptionChange(selectedCaption.id, { x: 0.5, y: 0.88, style: { position: "bottom" } });
                        } else if (newPos === "free") {
                          onCaptionChange(selectedCaption.id, {
                            x: selectedCaption.x ?? style.posX ?? 0.5,
                            y: selectedCaption.y ?? style.posY ?? 0.88,
                            style: { position: "free" },
                          });
                        }
                      }
                    }}
                    className={`flex flex-col items-center justify-center gap-1 rounded-lg border py-2 text-[10.5px] font-bold transition min-h-[44px] cursor-pointer ${
                      active
                        ? "border-[#FF6B2C] bg-[#FF6B2C]/10 text-[#FF6B2C]"
                        : "border-[#E8E8E8] dark:border-[#2C313C] bg-white dark:bg-[#181B22] text-[#6B7280] dark:text-[#A1A8B5] hover:border-[#FF6B2C] hover:text-[#FF6B2C]"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {style.position === "free" && selectedCaption && (
            <div className="space-y-4 border-t border-[#E8E8E8] dark:border-[#2C313C] pt-4">
              <SliderRow
                label="Position X"
                value={Math.round((selectedCaption.x ?? 0.5) * 100)}
                min={5}
                max={95}
                step={1}
                onChange={(v) => onCaptionChange?.(selectedCaption.id, { x: v / 100 })}
                suffix="%"
                compact
              />
              <SliderRow
                label="Position Y"
                value={Math.round((selectedCaption.y ?? 0.88) * 100)}
                min={5}
                max={95}
                step={1}
                onChange={(v) => onCaptionChange?.(selectedCaption.id, { y: v / 100 })}
                suffix="%"
                compact
              />
            </div>
          )}
        </div>
      </AccordionCard>
    </div>
  );
}
