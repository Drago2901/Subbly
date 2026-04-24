import { useEffect, useState } from "react";
import { Bold, Type, AlignStartVertical, AlignCenterVertical, AlignEndVertical, Move, Sparkles, Layers, Palette, Save, Trash2 } from "lucide-react";
import { FONT_OPTIONS, ANIMATION_OPTIONS, CAPTION_TEMPLATES, type CaptionStyle } from "@/lib/captions/types";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { BrandKitDialog, type BrandKit } from "./BrandKitDialog";

type Props = {
  style: CaptionStyle;
  onChange: (s: CaptionStyle) => void;
};

type Preset = { id: string; name: string; style: CaptionStyle };

export function StylePanel({ style, onChange }: Props) {
  const { user } = useAuth();
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

  return (
    <div className="flex h-full flex-col">
      <Tabs defaultValue="style" className="flex h-full flex-col">
        <TabsList className="mx-3 mt-3 grid grid-cols-4">
          <TabsTrigger value="style" className="text-xs"><Type className="mr-1 h-3 w-3" />Style</TabsTrigger>
          <TabsTrigger value="anim" className="text-xs"><Sparkles className="mr-1 h-3 w-3" />Anim</TabsTrigger>
          <TabsTrigger value="templates" className="text-xs"><Layers className="mr-1 h-3 w-3" />Tmpl</TabsTrigger>
          <TabsTrigger value="brand" className="text-xs"><Palette className="mr-1 h-3 w-3" />Brand</TabsTrigger>
        </TabsList>

        <div className="scrollbar-thin flex-1 overflow-y-auto">
          <TabsContent value="style" className="m-0 space-y-5 p-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Font</Label>
              <select
                value={style.fontFamily}
                onChange={(e) => set("fontFamily", e.target.value)}
                className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
                style={{ fontFamily: `"${style.fontFamily}", sans-serif` }}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: `"${f}", sans-serif` }}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <SliderRow label="Size" value={style.fontSize} min={20} max={140} step={2}
              onChange={(v) => set("fontSize", v)} suffix="px" />

            <SliderRow label="Weight" value={style.fontWeight} min={300} max={900} step={100}
              onChange={(v) => set("fontWeight", v)} />

            <div className="grid grid-cols-2 gap-3">
              <ColorField label="Text" value={style.color} onChange={(v) => set("color", v)} />
              <ColorField label="Background" value={style.bgColor} onChange={(v) => set("bgColor", v)} />
            </div>

            <SliderRow label="BG Opacity" value={Math.round(style.bgOpacity * 100)} min={0} max={100} step={5}
              onChange={(v) => set("bgOpacity", v / 100)} suffix="%" />

            <div className="grid grid-cols-2 gap-3">
              <ColorField label="Stroke" value={style.strokeColor} onChange={(v) => set("strokeColor", v)} />
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label className="uppercase tracking-wide text-muted-foreground">Stroke W</Label>
                  <span className="font-mono text-muted-foreground">{style.strokeWidth}</span>
                </div>
                <Slider min={0} max={12} step={1} value={[style.strokeWidth]}
                  onValueChange={(v) => set("strokeWidth", v[0])} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Position</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: "top", icon: AlignStartVertical },
                  { key: "middle", icon: AlignCenterVertical },
                  { key: "bottom", icon: AlignEndVertical },
                  { key: "free", icon: Move },
                ].map((p) => {
                  const Icon = p.icon;
                  const active = style.position === p.key;
                  return (
                    <button
                      key={p.key}
                      onClick={() => set("position", p.key as CaptionStyle["position"])}
                      className={`flex flex-col items-center justify-center gap-0.5 rounded-md border px-1 py-2 text-[10px] capitalize transition-all ${
                        active ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface-2 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {p.key}
                    </button>
                  );
                })}
              </div>
              {style.position === "free" && (
                <p className="text-[11px] text-muted-foreground">
                  Drag the caption on the video preview to position it.
                </p>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-3">
              <ToggleRow icon={<Bold className="h-3.5 w-3.5" />} label="Bold"
                checked={style.bold} onCheckedChange={(v) => set("bold", v)} />
              <ToggleRow icon={<span className="text-[10px] font-bold">AA</span>} label="Uppercase"
                checked={style.uppercase} onCheckedChange={(v) => set("uppercase", v)} />
              <ToggleRow icon={<span className="text-[10px]">✨</span>} label="Karaoke highlight"
                checked={style.karaoke} onCheckedChange={(v) => set("karaoke", v)} />
            </div>

            {style.karaoke && (
              <ColorField label="Highlight color" value={style.highlightColor}
                onChange={(v) => set("highlightColor", v)} />
            )}
          </TabsContent>

          <TabsContent value="anim" className="m-0 space-y-4 p-4">
            <div>
              <h3 className="mb-1 text-sm font-semibold">Caption animation</h3>
              <p className="text-xs text-muted-foreground">How captions enter the screen.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ANIMATION_OPTIONS.map((a) => {
                const active = style.animation === a.value;
                return (
                  <button
                    key={a.value}
                    onClick={() => set("animation", a.value)}
                    className={`rounded-md border px-3 py-3 text-xs font-medium transition-all ${
                      active ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface-2 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="m-0 space-y-4 p-4">
            <div>
              <h3 className="mb-1 text-sm font-semibold">Caption templates</h3>
              <p className="text-xs text-muted-foreground">One-click style presets.</p>
            </div>
            <div className="space-y-2">
              {CAPTION_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t.id)}
                  className="block w-full rounded-lg border border-border bg-surface-2 p-3 text-left transition-all hover:border-primary/60"
                >
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">{t.description}</div>
                </button>
              ))}
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">My presets</h4>
              <div className="mb-3 flex gap-2">
                <Input placeholder="Preset name" value={presetName}
                  onChange={(e) => setPresetName(e.target.value)} className="h-8 text-xs" />
                <Button size="sm" onClick={savePreset}>
                  <Save className="mr-1 h-3.5 w-3.5" />Save
                </Button>
              </div>
              {presets.length === 0 && (
                <p className="text-[11px] text-muted-foreground">No saved presets yet.</p>
              )}
              <div className="space-y-1.5">
                {presets.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-md border border-border bg-surface-2 p-2">
                    <button
                      onClick={() => { onChange({ ...style, ...p.style }); toast.success(`Applied "${p.name}"`); }}
                      className="flex-1 truncate text-left text-xs font-medium hover:text-primary"
                    >
                      {p.name}
                    </button>
                    <button onClick={() => deletePreset(p.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="brand" className="m-0 space-y-4 p-4">
            <div>
              <h3 className="mb-1 text-sm font-semibold">Brand kit</h3>
              <p className="text-xs text-muted-foreground">Your brand colors, fonts, and logo.</p>
            </div>
            {brandKit ? (
              <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-3">
                <div className="flex items-center gap-2">
                  {brandKit.primary_color && (
                    <div className="h-6 w-6 rounded border border-border" style={{ background: brandKit.primary_color }} />
                  )}
                  {brandKit.secondary_color && (
                    <div className="h-6 w-6 rounded border border-border" style={{ background: brandKit.secondary_color }} />
                  )}
                  <div className="text-xs text-muted-foreground">
                    {brandKit.heading_font || "—"} / {brandKit.body_font || "—"}
                  </div>
                </div>
                {brandKit.logo_url && (
                  <img src={brandKit.logo_url} alt="Brand logo" className="h-12 w-auto rounded bg-black/30 object-contain p-1" />
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={applyBrand} className="flex-1">Apply to captions</Button>
                  <Button size="sm" variant="secondary" onClick={() => setBrandOpen(true)}>Edit</Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setBrandOpen(true)} className="w-full">
                <Palette className="mr-2 h-4 w-4" /> Create brand kit
              </Button>
            )}
          </TabsContent>
        </div>
      </Tabs>

      <BrandKitDialog
        open={brandOpen}
        onOpenChange={setBrandOpen}
        brandKit={brandKit}
        onSaved={(bk) => setBrandKit(bk)}
      />
    </div>
  );
}

function SliderRow({ label, value, min, max, step, onChange, suffix }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <Label className="uppercase tracking-wide text-muted-foreground">{label}</Label>
        <span className="font-mono text-muted-foreground">{value}{suffix ?? ""}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]}
        onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void; }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-2 py-1.5">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent" />
        <input value={value.toUpperCase()} onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent font-mono text-xs outline-none" />
      </div>
    </div>
  );
}

function ToggleRow({ icon, label, checked, onCheckedChange }: {
  icon: React.ReactNode; label: string; checked: boolean; onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-surface-3 text-muted-foreground">{icon}</span>
        {label}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
