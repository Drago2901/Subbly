import { useEffect, useMemo, useRef, useState } from "react";
import {
  Type,
  Sparkles,
  Layers,
  Palette,
  Save,
  Trash2,
  Check,
  Plus,
  Pencil,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Move,
  Upload,
  X,
} from "lucide-react";
import {
  FONT_OPTIONS,
  CAPTION_TEMPLATES,
  PREVIEW_TEXTS,
  DEFAULT_STYLE,
  type CaptionStyle,
  type CaptionTemplate,
  type Caption,
} from "@/lib/captions/types";
import {
  loadGoogleFont,
  getCustomFonts,
  saveCustomFonts,
  getCustomTemplates,
  saveCustomTemplates,
} from "@/lib/captions/fontLoader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { BrandKitDialog, type BrandKit } from "./BrandKitDialog";

type Props = {
  style: CaptionStyle;
  onChange: (s: CaptionStyle) => void;
  selectedCaption?: Caption | null;
  onCaptionChange?: (id: string, patch: Partial<Caption>) => void;
  isLocked?: boolean;
};

type Preset = { id: string; name: string; style: CaptionStyle };
type Tab = "style" | "anim" | "tmpl" | "brand";

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Live animated preview of a caption template, showing the template name in its own effect. */
function TemplatePreview({ style, text, cycle }: { style: CaptionStyle; text: string; cycle: number }) {
  const display = style.uppercase ? text.toUpperCase() : text;
  const size = Math.max(14, Math.min(30, style.fontSize * 0.4));
  const hasBg = style.bgOpacity > 0;
  const stroke =
    style.strokeWidth > 0
      ? { WebkitTextStroke: `${Math.max(0.5, style.strokeWidth * 0.4)}px ${style.strokeColor}` as const }
      : {};
  return (
    <div
      className="relative flex h-[96px] items-center justify-center overflow-hidden rounded-t-[9px] px-4 text-center"
      style={{ background: hasBg && style.bgColor ? "#111" : "#1a1a1a" }}
    >
      <span
        key={`${text}-${style.animation}-${cycle}`}
        className={`cap-anim cap-anim-${style.animation} max-w-full`}
        style={{
          fontFamily: `"${style.fontFamily}", sans-serif`,
          fontWeight: style.fontWeight,
          fontSize: `${size}px`,
          lineHeight: 1.15,
          color: style.color,
          background: hasBg ? hexToRgba(style.bgColor, style.bgOpacity) : "transparent",
          borderRadius: hasBg ? "5px" : 0,
          padding: hasBg ? "3px 9px" : 0,
          whiteSpace: style.animation === "typewriter" ? "nowrap" : "normal",
          ...stroke,
        }}
      >
        {display}
      </span>
    </div>
  );
}



const ANIM_STYLES = [
  {
    id: "none",
    title: "None",
    description: "Static text, no animation",
    iconText: "Aa",
    hasUnderline: false,
    apply: (style: CaptionStyle) => ({ ...style, animation: "none" as const, karaoke: false }),
    isActive: (style: CaptionStyle) => style.animation === "none" && !style.karaoke,
  },
  {
    id: "karaoke",
    title: "Karaoke",
    description: "Highlight words as they are spoken",
    iconText: "Aa",
    hasUnderline: true,
    apply: (style: CaptionStyle) => ({ ...style, animation: "pop" as const, karaoke: true }),
    isActive: (style: CaptionStyle) => style.karaoke === true,
  },
  {
    id: "pop",
    title: "Pop",
    description: "Words pop in with scale effect",
    iconText: "Aa!",
    hasUnderline: false,
    apply: (style: CaptionStyle) => ({ ...style, animation: "pop" as const, karaoke: false }),
    isActive: (style: CaptionStyle) => style.animation === "pop" && !style.karaoke,
  },
  {
    id: "typewriter",
    title: "Typewriter",
    description: "Characters appear one at a time",
    iconText: "Aa|",
    hasUnderline: false,
    apply: (style: CaptionStyle) => ({ ...style, animation: "typewriter" as const, karaoke: false }),
    isActive: (style: CaptionStyle) => style.animation === "typewriter" && !style.karaoke,
  },
  {
    id: "fade",
    title: "Fade",
    description: "Smooth fade in and out",
    iconText: "Aa~",
    hasUnderline: false,
    apply: (style: CaptionStyle) => ({ ...style, animation: "fade" as const, karaoke: false }),
    isActive: (style: CaptionStyle) => style.animation === "fade" && !style.karaoke,
  },
];

export function StylePanel({ style, onChange, selectedCaption, onCaptionChange, isLocked }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("style");
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [brandOpen, setBrandOpen] = useState(false);

  // Custom imported fonts + templates (persisted in localStorage)
  const [customFonts, setCustomFonts] = useState<string[]>([]);
  const [customTemplates, setCustomTemplates] = useState<CaptionTemplate[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [fontInput, setFontInput] = useState("");
  const [templateJson, setTemplateJson] = useState("");

  // Rotating preview text shared across template cards
  const [previewIdx, setPreviewIdx] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof CaptionStyle>(k: K, v: CaptionStyle[K]) =>
    onChange({ ...style, [k]: v });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("style_presets")
        .select("id,name,style")
        .order("created_at", { ascending: false });
      setPresets((data ?? []) as Preset[]);
      const { data: bk } = await supabase.from("brand_kits").select("*").maybeSingle();
      if (bk) setBrandKit(bk as BrandKit);
    })();
  }, [user]);

  // Load persisted custom fonts/templates and register fonts
  useEffect(() => {
    const fonts = getCustomFonts();
    fonts.forEach(loadGoogleFont);
    setCustomFonts(fonts);
    setCustomTemplates(getCustomTemplates() as CaptionTemplate[]);
  }, []);

  // Cycle preview text every 2.6s while on the templates tab
  useEffect(() => {
    if (tab !== "tmpl") return;
    const id = setInterval(() => {
      setPreviewIdx((i) => (i + 1) % PREVIEW_TEXTS.length);
    }, 2600);
    return () => clearInterval(id);
  }, [tab]);

  const NONE_TEMPLATE: CaptionTemplate = useMemo(
    () => ({
      id: "none",
      name: "None",
      description: "Plain default — 20px, weight 300",
      style: { ...DEFAULT_STYLE },
    }),
    [],
  );

  const allTemplates = useMemo(
    () => [NONE_TEMPLATE, ...customTemplates, ...CAPTION_TEMPLATES],
    [NONE_TEMPLATE, customTemplates],
  );
  

  const applyTemplate = (t: CaptionTemplate) => {
    onChange({ ...style, ...t.style });
    if (t.style.fontFamily) loadGoogleFont(t.style.fontFamily);
    toast.success(`Applied "${t.name}"`);
  };

  const importFont = () => {
    const name = fontInput.trim();
    if (!name) return toast.error("Enter a Google Font name");
    if ([...FONT_OPTIONS, ...customFonts].some((f) => f.toLowerCase() === name.toLowerCase()))
      return toast.error("That font is already available");
    loadGoogleFont(name);
    const next = [...customFonts, name];
    setCustomFonts(next);
    saveCustomFonts(next);
    set("fontFamily", name);
    setFontInput("");
    toast.success(`Imported font "${name}"`);
  };

  const importTemplate = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      interface RawTemplate {
        name?: string;
        description?: string;
        style?: Partial<CaptionStyle>;
      }
      const cleaned: CaptionTemplate[] = list.map((t: unknown, i: number) => {
        const item = t as RawTemplate;
        const sty = (item.style ?? item) as Partial<CaptionStyle>;
        return {
          id: `custom-${Date.now()}-${i}`,
          name: item.name || "Imported template",
          description: item.description || "Custom imported template",
          style: { ...DEFAULT_STYLE, ...sty },
        };
      });
      cleaned.forEach((t) => t.style.fontFamily && loadGoogleFont(t.style.fontFamily));
      const next = [...cleaned, ...customTemplates];
      setCustomTemplates(next);
      saveCustomTemplates(next);
      setTemplateJson("");
      setImportOpen(false);
      toast.success(`Imported ${cleaned.length} template${cleaned.length > 1 ? "s" : ""}`);
    } catch {
      toast.error("Invalid template JSON");
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(importTemplate);
    e.target.value = "";
  };

  const deleteCustomTemplate = (id: string) => {
    const next = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(next);
    saveCustomTemplates(next);
  };


  const savePreset = async () => {
    if (!user) return toast.error("Sign in to save presets");
    const name = presetName.trim() || "My preset";
    const { data, error } = await supabase
      .from("style_presets")
      .insert({ user_id: user.id, name, style: JSON.parse(JSON.stringify(style)) })
      .select("id,name,style")
      .single();
    if (error) return toast.error(error.message);
    setPresets((p) => [data as Preset, ...p]);
    setPresetName("");
    toast.success(`Saved "${name}"`);
  };

  const deletePreset = async (id: string) => {
    const { error } = await supabase.from("style_presets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPresets((p) => p.filter((x) => x.id !== id));
  };

  const applyBrand = () => {
    if (!brandKit) return;
    const next = { ...style };
    if (brandKit.primary_color) next.highlightColor = brandKit.primary_color;
    if (brandKit.secondary_color) next.color = brandKit.secondary_color;
    if (brandKit.heading_font) next.fontFamily = brandKit.heading_font;
    onChange(next);
    toast.success("Brand kit applied");
  };

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "style", label: "Style", icon: Type },
    { id: "anim", label: "Anim", icon: Sparkles },
    { id: "tmpl", label: "Tmpl", icon: Layers },
    { id: "brand", label: "Brand", icon: Palette },
  ];

  return (
    <div className="flex h-full flex-col bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="flex flex-shrink-0 border-b border-[#e8e4de]">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-3 text-[12px] font-medium transition ${
                active
                  ? "border-[#ff5c3a] text-[#ff5c3a]"
                  : "border-transparent text-[#aaa] hover:text-[#555]"
              }`}
            >
              <Icon className="h-3 w-3" strokeWidth={1.8} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className={`scrollbar-thin flex-1 overflow-y-auto p-4 ${isLocked ? "pointer-events-none opacity-50 select-none" : ""}`}>
        {tab === "style" && (
          <div className="space-y-5">
            <div className="space-y-4 pb-5 border-b border-[#f0ede8]">
              <div className="text-[13px] font-semibold text-[#1a1a1a]">Caption Settings</div>
              
              <div className="rounded-[8px] border border-[#f0ede8]">
                <ToggleRow
                  icon="😊"
                  label="Add Emojis to Captions"
                  checked={style.emojiEnabled || false}
                  onChange={(v) => set("emojiEnabled", v)}
                  last
                />
              </div>

              {style.emojiEnabled && (
                <Field label="Emoji Density">
                  <select
                    aria-label="Emoji Density"
                    value={style.emojiDensity || "medium"}
                    onChange={(e) => set("emojiDensity", e.target.value as "light" | "medium" | "heavy")}
                    className="w-full cursor-pointer rounded-[7px] border border-[#e8e4de] bg-white px-3 py-2 text-[13px] text-[#1a1a1a] outline-none transition hover:border-[#ccc] focus:border-[#ff5c3a]"
                  >
                    <option value="light">Light (sparse emojis)</option>
                    <option value="medium">Medium (standard emojis)</option>
                    <option value="heavy">Heavy (viral engagement)</option>
                  </select>
                </Field>
              )}
            </div>

            <Field label="Font">
              <select
                aria-label="Caption font"
                value={style.fontFamily}
                onChange={(e) => set("fontFamily", e.target.value)}
                className="w-full cursor-pointer rounded-[7px] border border-[#e8e4de] bg-white px-3 py-2 text-[13px] text-[#1a1a1a] outline-none transition hover:border-[#ccc] focus:border-[#ff5c3a]"
                style={{ fontFamily: `"${style.fontFamily}", sans-serif` }}
              >
                {customFonts.length > 0 && (
                  <optgroup label="Imported">
                    {customFonts.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </optgroup>
                )}
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field>

            <SliderRow label="Size" value={style.fontSize} min={20} max={140} step={2}
              onChange={(v) => set("fontSize", v)} suffix="px" />
            <SliderRow label="Weight" value={style.fontWeight} min={300} max={900} step={100}
              onChange={(v) => set("fontWeight", v)} />

            <div className="grid grid-cols-2 gap-2">
              <ColorField label="Text" value={style.color} onChange={(v) => set("color", v)} />
              <ColorField label="Background" value={style.bgColor} onChange={(v) => set("bgColor", v)} />
            </div>

            <SliderRow label="BG opacity" value={Math.round(style.bgOpacity * 100)} min={0} max={100} step={5}
              onChange={(v) => set("bgOpacity", v / 100)} suffix="%" />

            <SliderRow label="Box width" value={style.boxWidth ?? 84} min={10} max={100} step={1}
              onChange={(v) => set("boxWidth", v)} suffix="%" />

            <SliderRow label="Box height" value={style.boxHeight ?? 0} min={0} max={100} step={1}
              onChange={(v) => set("boxHeight", v === 0 ? undefined as unknown as number : v)} suffix="%" />

            <div className="grid grid-cols-2 gap-2">
              <ColorField label="Stroke" value={style.strokeColor} onChange={(v) => set("strokeColor", v)} />
              <SliderRow label="Stroke W" value={style.strokeWidth} min={0} max={12} step={1}
                onChange={(v) => set("strokeWidth", v)} compact />
            </div>

            <Field label="Position">
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
                              style: { position: "free" }
                            });
                          }
                        }
                      }}
                      className={`flex flex-col items-center justify-center gap-1 rounded-[7px] border px-1 py-2 text-[10.5px] transition ${
                        active
                          ? "border-[#ff5c3a] bg-[#fff5f3] text-[#ff5c3a]"
                          : "border-[#e8e4de] bg-white text-[#aaa] hover:border-[#ff5c3a] hover:text-[#ff5c3a]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                      {p.label}
                    </button>
                  );
                })}
              </div>
              {style.position === "free" && (
                <div className="space-y-1.5 mt-1.5">
                  <p className="text-[11px] text-[#aaa] mb-2">
                    Drag the caption on the video preview to position it, or use the controls below:
                  </p>
                  {selectedCaption && (
                    <div className="space-y-4 border-t border-[#f0ede8] pt-3">
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
                      <SliderRow
                        label="Box Width"
                        value={selectedCaption.width ?? style.boxWidth ?? 84}
                        min={10}
                        max={100}
                        step={1}
                        onChange={(v) => onCaptionChange?.(selectedCaption.id, { width: v })}
                        suffix="%"
                        compact
                      />
                      <SliderRow
                        label="Box Height"
                        value={selectedCaption.height ?? 0}
                        min={0}
                        max={100}
                        step={1}
                        onChange={(v) => onCaptionChange?.(selectedCaption.id, { height: v === 0 ? undefined : v })}
                        suffix="%"
                        compact
                      />
                    </div>
                  )}
                </div>
              )}
            </Field>

            <div className="rounded-[8px] border border-[#f0ede8]">
              <ToggleRow icon="B" label="Bold"
                checked={style.bold} onChange={(v) => set("bold", v)} />
              <ToggleRow icon="AA" label="Uppercase"
                checked={style.uppercase} onChange={(v) => set("uppercase", v)} />
              <ToggleRow icon="✨" label="Karaoke highlight"
                checked={style.karaoke} onChange={(v) => set("karaoke", v)} last />
            </div>

            {style.karaoke && (
              <ColorField label="Highlight color" value={style.highlightColor}
                onChange={(v) => set("highlightColor", v)} />
            )}

          </div>
        )}

        {tab === "anim" && (
          <div className="space-y-4">
            <div className="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#f5f3ee]">Animation Style</div>
            <div className="space-y-2.5">
              {ANIM_STYLES.map((opt) => {
                const active = opt.isActive(style);
                return (
                  <button
                    key={opt.id}
                    onClick={() => onChange(opt.apply(style))}
                    className={`flex w-full items-center gap-4 rounded-xl border p-3.5 text-left transition ${
                      active
                        ? "border-purple-500 bg-purple-50/20 dark:bg-purple-950/10"
                        : "border-[#e8e4de] bg-white hover:border-purple-300 dark:border-[#2a2622] dark:bg-[#15130f]"
                    }`}
                  >
                    {/* Icon block */}
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] font-serif-display text-base font-bold ${
                        active
                          ? "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400"
                          : "bg-[#f5f3ee] text-[#666] dark:bg-[#1a1714] dark:text-[#a8a39c]"
                      }`}
                    >
                      {opt.hasUnderline ? (
                        <span className="underline decoration-2 underline-offset-4">{opt.iconText}</span>
                      ) : (
                        opt.iconText
                      )}
                    </div>

                    {/* Text block */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-[13px] font-semibold ${active ? "text-purple-700 dark:text-purple-300" : "text-[#1a1a1a] dark:text-[#f5f3ee]"}`}>
                        {opt.title}
                      </div>
                      <div className="text-[11px] text-[#999] dark:text-[#908a82] leading-tight mt-0.5">
                        {opt.description}
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {active && (
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 text-white dark:bg-purple-500">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {style.animation === "typewriter" && (
              <div className="mt-4 space-y-4 border-t border-[#f0ede8] pt-4 dark:border-[#2a2622]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#bbb] mb-1">
                  Typewriter settings
                </div>

                <SliderRow
                  label="Typing Speed"
                  value={style.typewriterSpeed || 80}
                  min={30}
                  max={300}
                  step={10}
                  onChange={(v) => set("typewriterSpeed", v)}
                  suffix=" ms"
                  compact
                />

                <SliderRow
                  label="Deleting Speed"
                  value={style.typewriterDeleteSpeed || 40}
                  min={10}
                  max={200}
                  step={10}
                  onChange={(v) => set("typewriterDeleteSpeed", v)}
                  suffix=" ms"
                  compact
                />

                <SliderRow
                  label="Delay Pause"
                  value={style.typewriterDelay || 1500}
                  min={500}
                  max={4000}
                  step={100}
                  onChange={(v) => set("typewriterDelay", v)}
                  suffix=" ms"
                  compact
                />

                <div className="rounded-[8px] border border-[#f0ede8] dark:border-[#2a2622]">
                  <ToggleRow
                    icon="🔁"
                    label="Loop Mode"
                    checked={style.typewriterLoop !== false}
                    onChange={(v) => set("typewriterLoop", v)}
                    last
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10.5px] font-medium uppercase tracking-[0.07em] text-[#aaa]">
                    Text Alignment
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
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
                          className={`flex items-center justify-center gap-1.5 rounded-[7px] border py-2 text-[11px] font-medium transition ${
                            active
                              ? "border-[#ff5c3a] bg-[#fff5f3] text-[#ff5c3a]"
                              : "border-[#e8e4de] bg-white text-[#aaa] hover:border-[#ff5c3a] hover:text-[#ff5c3a]"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <ColorField
                  label="Cursor Color"
                  value={style.typewriterCursorColor || "#ff5c3a"}
                  onChange={(v) => set("typewriterCursorColor", v)}
                />
              </div>
            )}
          </div>
        )}

        {tab === "tmpl" && (
          <div>
            <div className="mb-0.5 flex items-center justify-between">
              <div className="text-[13px] font-semibold text-[#1a1a1a]">Caption templates</div>
              <button
                onClick={() => setImportOpen(true)}
                className="inline-flex items-center gap-1 rounded-[7px] border border-[#e8e4de] bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-[#555] transition hover:border-[#ff5c3a] hover:text-[#ff5c3a]"
              >
                <Upload className="h-3 w-3" strokeWidth={2} />
                Import
              </button>
            </div>
            <div className="mb-4 text-[11.5px] leading-relaxed text-[#aaa]">
              Each template shows its name in its own effect — click to apply.
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2.5">
              {allTemplates.map((t) => {
                const previewStyle = { ...DEFAULT_STYLE, ...t.style } as CaptionStyle;
                const isCustom = t.id.startsWith("custom-");
                return (
                  <div
                    key={t.id}
                    className="group relative overflow-hidden rounded-[9px] border border-[#e8e4de] bg-white text-left transition hover:border-[#ffd5cc]"
                  >
                    {isCustom && (
                      <button
                        onClick={() => deleteCustomTemplate(t.id)}
                        aria-label={`Delete ${t.name}`}
                        className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-500"
                      >
                        <X className="h-3 w-3" strokeWidth={2.5} />
                      </button>
                    )}
                    <button onClick={() => applyTemplate(t)} className="block w-full text-left">
                      <TemplatePreview style={previewStyle} text={t.name} cycle={previewIdx} />
                      <div className="px-3 py-2 text-center">
                        <div className="truncate text-[12px] font-semibold text-[#1a1a1a]">{t.name}</div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>



            <div className="mb-2.5 border-t border-[#f0ede8] pt-3.5 text-[10px] font-semibold tracking-wider text-[#bbb]">
              MY PRESETS
            </div>
            <div className="mb-2 flex gap-1.5">
              <input
                aria-label="Preset name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name"
                className="flex-1 rounded-[7px] border border-[#e8e4de] bg-[#f9f8f5] px-3 py-2 text-[12.5px] text-[#1a1a1a] outline-none transition placeholder:text-[#ccc] focus:border-[#ff5c3a] focus:bg-white"
              />
              <button
                onClick={savePreset}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[7px] bg-[#ff5c3a] px-3.5 py-2 text-[12.5px] font-medium text-white transition hover:bg-[#e84e2e]"
              >
                <Save className="h-3 w-3" strokeWidth={2} />
                Save
              </button>
            </div>
            {presets.length === 0 ? (
              <div className="text-[11.5px] text-[#ccc]">No saved presets yet.</div>
            ) : (
              <div className="space-y-1">
                {presets.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-[7px] border border-[#e8e4de] bg-white p-2"
                  >
                    <button
                      onClick={() => { onChange({ ...style, ...p.style }); toast.success(`Applied "${p.name}"`); }}
                      className="flex-1 truncate text-left text-[12px] font-medium text-[#555] hover:text-[#ff5c3a]"
                    >
                      {p.name}
                    </button>
                    <button
                      onClick={() => deletePreset(p.id)}
                      aria-label={`Delete preset ${p.name}`}
                      className="text-[#aaa] hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "brand" && (
          <div>
            <div className="mb-0.5 text-[13px] font-semibold text-[#1a1a1a]">Brand kit</div>
            <div className="mb-4 text-[11.5px] leading-relaxed text-[#aaa]">
              Your brand colors, fonts, and logo.
            </div>

            {brandKit ? (
              <div className="overflow-hidden rounded-[10px] border border-[#e8e4de]">
                <div className="flex items-center gap-2.5 border-b border-[#f0ede8] p-3.5">
                  <div className="flex gap-1.5">
                    {brandKit.primary_color && (
                      <div
                        className="h-[22px] w-[22px] rounded-[5px] border border-black/10"
                        style={{ background: brandKit.primary_color }}
                      />
                    )}
                    {brandKit.secondary_color && (
                      <div
                        className="h-[22px] w-[22px] rounded-[5px] border border-black/10"
                        style={{ background: brandKit.secondary_color }}
                      />
                    )}
                  </div>
                  <span className="truncate text-[12px] font-medium text-[#555]">
                    {brandKit.heading_font || "—"} / {brandKit.body_font || "—"}
                  </span>
                </div>
                {brandKit.logo_url && (
                  <img
                    src={brandKit.logo_url}
                    alt={`${brandKit.heading_font || "Your"} brand kit logo`}
                    className="mx-3.5 mt-3 h-12 w-auto rounded bg-[#faf9f7] object-contain p-1"
                  />
                )}
                <div className="flex">
                  <button
                    onClick={applyBrand}
                    className="flex flex-1 items-center justify-center gap-1.5 bg-[#ff5c3a] px-4 py-3 text-[13px] font-medium text-white transition hover:bg-[#e84e2e]"
                  >
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                    Apply to captions
                  </button>
                  <button
                    onClick={() => setBrandOpen(true)}
                    className="flex items-center gap-1.5 border-l border-[#e8e4de] bg-[#f9f8f5] px-4 py-3 text-[13px] font-medium text-[#555] transition hover:bg-[#f0ede8] hover:text-[#1a1a1a]"
                  >
                    <Pencil className="h-3 w-3" strokeWidth={2} />
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5 rounded-[10px] border border-[#e8e4de] px-5 py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#e8e4de] bg-[#f5f3ee]">
                  <Palette className="h-[18px] w-[18px] text-[#ccc]" strokeWidth={1.8} />
                </div>
                <div className="text-[12.5px] font-medium text-[#bbb]">No brand kit yet</div>
                <div className="text-[11.5px] leading-relaxed text-[#ccc]">
                  Save your colors and fonts for one-click styling across all projects.
                </div>
                <button
                  onClick={() => setBrandOpen(true)}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-[7px] border border-[#e8e4de] bg-white px-[18px] py-2 text-[12.5px] font-medium text-[#555] transition hover:border-[#ff5c3a] hover:bg-[#fff5f3] hover:text-[#ff5c3a]"
                >
                  <Plus className="h-3 w-3" strokeWidth={2.5} />
                  New brand kit
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <BrandKitDialog
        open={brandOpen}
        onOpenChange={setBrandOpen}
        brandKit={brandKit}
        onSaved={(bk) => setBrandKit(bk)}
      />

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={onFile}
        className="hidden"
      />

      {importOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setImportOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-[12px] border border-[#e8e4de] bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[14px] font-semibold text-[#1a1a1a]">Import</div>
              <button
                onClick={() => setImportOpen(false)}
                aria-label="Close import dialog"
                className="text-[#aaa] hover:text-[#555]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#aaa]">
              Import font
            </div>
            <div className="mb-4 flex gap-1.5">
              <input
                value={fontInput}
                onChange={(e) => setFontInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && importFont()}
                placeholder="Google Font name (e.g. Lobster)"
                className="flex-1 rounded-[7px] border border-[#e8e4de] bg-[#f9f8f5] px-3 py-2 text-[12.5px] text-[#1a1a1a] outline-none transition placeholder:text-[#ccc] focus:border-[#ff5c3a] focus:bg-white"
              />
              <button
                onClick={importFont}
                className="whitespace-nowrap rounded-[7px] bg-[#ff5c3a] px-3.5 py-2 text-[12.5px] font-medium text-white transition hover:bg-[#e84e2e]"
              >
                Add
              </button>
            </div>

            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#aaa]">
              Import template
            </div>
            <textarea
              value={templateJson}
              onChange={(e) => setTemplateJson(e.target.value)}
              placeholder='Paste template JSON, e.g. {"name":"My style","style":{"fontFamily":"Anton","animation":"pop"}}'
              rows={4}
              className="mb-2 w-full resize-none rounded-[7px] border border-[#e8e4de] bg-[#f9f8f5] px-3 py-2 font-mono text-[11px] text-[#1a1a1a] outline-none transition placeholder:text-[#ccc] focus:border-[#ff5c3a] focus:bg-white"
            />
            <div className="flex gap-1.5">
              <button
                onClick={() => importTemplate(templateJson)}
                className="flex-1 rounded-[7px] bg-[#ff5c3a] px-3.5 py-2 text-[12.5px] font-medium text-white transition hover:bg-[#e84e2e]"
              >
                Add template
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#e8e4de] bg-white px-3.5 py-2 text-[12.5px] font-medium text-[#555] transition hover:border-[#ff5c3a] hover:text-[#ff5c3a]"
              >
                <Upload className="h-3 w-3" strokeWidth={2} />
                File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[10.5px] font-medium uppercase tracking-[0.07em] text-[#aaa]">
        {label}
      </label>
      {children}
    </div>
  );
}

function SliderRow({
  label, value, min, max, step, onChange, suffix, compact,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; suffix?: string; compact?: boolean;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className={`block font-medium uppercase tracking-[0.07em] text-[#aaa] ${compact ? "text-[10px]" : "text-[10.5px]"}`}>
          {label}
        </label>
        <span className="text-[11px] text-[#888]">{value}{suffix ?? ""}</span>
      </div>
      <div className="relative">
        <div className="h-1 w-full rounded-full bg-[#f0ede8]" />
        <div
          className="absolute left-0 top-0 h-1 rounded-full bg-[#ff5c3a]"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#ff5c3a] bg-white shadow-[0_1px_4px_rgba(255,92,58,0.3)]"
          style={{ left: `${pct}%` }}
        />
        <input
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void; }) {
  return (
    <div>
      <label className="mb-2 block text-[10.5px] font-medium uppercase tracking-[0.07em] text-[#aaa]">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-[7px] border border-[#e8e4de] bg-white px-2.5 py-1.5 transition hover:border-[#ccc]">
        <label className="relative flex-shrink-0">
          <div
            className="h-[18px] w-[18px] cursor-pointer rounded border border-black/10"
            style={{ background: value }}
          />
          <input
            type="color"
            aria-label={`${label} color picker`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <input
          aria-label={`${label} hex value`}
          value={value.toUpperCase()}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent font-mono text-[11.5px] text-[#555] outline-none"
        />
      </div>
    </div>
  );
}

function ToggleRow({
  icon, label, checked, onChange, last,
}: {
  icon: React.ReactNode; label: string; checked: boolean;
  onChange: (v: boolean) => void; last?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 ${last ? "" : "border-b border-[#f0ede8]"}`}>
      <span className="flex items-center gap-2 text-[12.5px] text-[#555]">
        <span className="flex h-[18px] min-w-[18px] items-center justify-center text-[11px] font-semibold text-[#888]">
          {icon}
        </span>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 flex-shrink-0 rounded-full transition ${
          checked ? "bg-[#ff5c3a]" : "bg-[#e8e4de]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
