import { useEffect, useState } from "react";
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
  Move,
} from "lucide-react";
import { FONT_OPTIONS, ANIMATION_OPTIONS, CAPTION_TEMPLATES, type CaptionStyle } from "@/lib/captions/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { BrandKitDialog, type BrandKit } from "./BrandKitDialog";

type Props = {
  style: CaptionStyle;
  onChange: (s: CaptionStyle) => void;
};

type Preset = { id: string; name: string; style: CaptionStyle };
type Tab = "style" | "anim" | "tmpl" | "brand";

export function StylePanel({ style, onChange }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("style");
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [brandOpen, setBrandOpen] = useState(false);

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

  const applyTemplate = (id: string) => {
    const t = CAPTION_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    onChange({ ...style, ...t.style });
    toast.success(`Applied "${t.name}"`);
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

  const tabs: { id: Tab; label: string; icon: any }[] = [
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

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
        {tab === "style" && (
          <div className="space-y-5">
            <Field label="Font">
              <select
                aria-label="Caption font"
                value={style.fontFamily}
                onChange={(e) => set("fontFamily", e.target.value)}
                className="w-full cursor-pointer rounded-[7px] border border-[#e8e4de] bg-white px-3 py-2 text-[13px] text-[#1a1a1a] outline-none transition hover:border-[#ccc] focus:border-[#ff5c3a]"
                style={{ fontFamily: `"${style.fontFamily}", sans-serif` }}
              >
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
                      onClick={() => set("position", p.key as CaptionStyle["position"])}
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
                <p className="mt-2 text-[11px] text-[#aaa]">
                  Drag the caption on the video preview to position it.
                </p>
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
          <div>
            <div className="mb-0.5 text-[13px] font-semibold text-[#1a1a1a]">Caption animation</div>
            <div className="mb-4 text-[11.5px] leading-relaxed text-[#aaa]">
              How captions enter the screen.
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {ANIMATION_OPTIONS.map((a) => {
                const active = style.animation === a.value;
                return (
                  <button
                    key={a.value}
                    onClick={() => set("animation", a.value)}
                    className={`rounded-[8px] border px-3 py-2.5 text-[12.5px] font-medium transition ${
                      active
                        ? "border-[#ff5c3a] bg-[#fff5f3] text-[#ff5c3a] shadow-[0_0_0_3px_rgba(255,92,58,0.08)]"
                        : "border-[#e8e4de] bg-white text-[#555] hover:border-[#ffd5cc] hover:bg-[#fffaf9] hover:text-[#ff5c3a]"
                    }`}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === "tmpl" && (
          <div>
            <div className="mb-0.5 text-[13px] font-semibold text-[#1a1a1a]">Caption templates</div>
            <div className="mb-4 text-[11.5px] leading-relaxed text-[#aaa]">
              One-click style presets.
            </div>

            <div className="mb-4 flex flex-col gap-1.5">
              {CAPTION_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t.id)}
                  className="group flex items-center justify-between gap-2.5 rounded-[9px] border border-[#e8e4de] bg-white px-3.5 py-3 text-left transition hover:border-[#ffd5cc] hover:bg-[#fffaf9]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold text-[#1a1a1a]">{t.name}</div>
                    <div className="truncate text-[11px] text-[#aaa]">{t.description}</div>
                  </div>
                  <div className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#e8e4de] transition group-hover:border-[#ffd5cc]">
                    <Check className="h-2.5 w-2.5 text-transparent" strokeWidth={2.5} />
                  </div>
                </button>
              ))}
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
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <input
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
