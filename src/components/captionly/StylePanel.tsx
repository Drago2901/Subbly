import { Bold, Type, AlignStartVertical, AlignCenterVertical, AlignEndVertical } from "lucide-react";
import { FONT_OPTIONS, type CaptionStyle } from "@/lib/captions/types";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

type Props = {
  style: CaptionStyle;
  onChange: (s: CaptionStyle) => void;
};

export function StylePanel({ style, onChange }: Props) {
  const set = <K extends keyof CaptionStyle>(k: K, v: CaptionStyle[K]) =>
    onChange({ ...style, [k]: v });

  return (
    <div className="space-y-5 p-4">
      <div>
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <Type className="h-4 w-4 text-primary" /> Style
        </h3>
        <p className="text-xs text-muted-foreground">Live preview updates as you edit.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Font</Label>
        <select
          value={style.fontFamily}
          onChange={(e) => set("fontFamily", e.target.value)}
          className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <Label className="uppercase tracking-wide text-muted-foreground">Size</Label>
          <span className="font-mono text-muted-foreground">{style.fontSize}px</span>
        </div>
        <Slider
          min={20}
          max={120}
          step={2}
          value={[style.fontSize]}
          onValueChange={(v) => set("fontSize", v[0])}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ColorField
          label="Text"
          value={style.color}
          onChange={(v) => set("color", v)}
        />
        <ColorField
          label="Background"
          value={style.bgColor}
          onChange={(v) => set("bgColor", v)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <Label className="uppercase tracking-wide text-muted-foreground">BG Opacity</Label>
          <span className="font-mono text-muted-foreground">
            {Math.round(style.bgOpacity * 100)}%
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          step={5}
          value={[style.bgOpacity * 100]}
          onValueChange={(v) => set("bgOpacity", v[0] / 100)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Position</Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "top", icon: AlignStartVertical },
            { key: "middle", icon: AlignCenterVertical },
            { key: "bottom", icon: AlignEndVertical },
          ].map((p) => {
            const Icon = p.icon;
            const active = style.position === p.key;
            return (
              <button
                key={p.key}
                onClick={() => set("position", p.key as CaptionStyle["position"])}
                className={`flex items-center justify-center rounded-md border px-2 py-2 text-xs capitalize transition-all ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface-2 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="mr-1 h-3.5 w-3.5" />
                {p.key}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-3">
        <ToggleRow
          icon={<Bold className="h-3.5 w-3.5" />}
          label="Bold"
          checked={style.bold}
          onCheckedChange={(v) => set("bold", v)}
        />
        <ToggleRow
          icon={<span className="text-[10px] font-bold">AA</span>}
          label="Uppercase"
          checked={style.uppercase}
          onCheckedChange={(v) => set("uppercase", v)}
        />
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-2 py-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent"
        />
        <input
          value={value.toUpperCase()}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent font-mono text-xs outline-none"
        />
      </div>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onCheckedChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-surface-3 text-muted-foreground">
          {icon}
        </span>
        {label}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
