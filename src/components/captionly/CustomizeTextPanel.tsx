import { useState, useCallback, useRef, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Move,
  Zap,
  Sliders,
  MonitorPlay,
  Wand2,
  Check,
} from "lucide-react";
import {
  type CaptionStyle,
  type Caption,
  DEFAULT_STYLE,
  FONT_OPTIONS,
} from "@/lib/captions/types";
import { getCustomFonts, loadGoogleFont } from "@/lib/captions/fontLoader";
import { ANIM_STYLES } from "./StylePanel/stylePanelConstants";
import { FontPicker } from "./FontPicker";

// ─── Design tokens — dynamic CSS variables supporting light and dark mode ─────
const tk = {
  panelBg:   "var(--tk-panel-bg)",
  surfaceBg: "var(--tk-surface-bg)",
  hoverBg:   "var(--tk-hover-bg)",
  border:    "var(--tk-border)",
  textPri:   "var(--tk-text-pri)",
  textMuted: "var(--tk-text-muted)",
  textFaint: "var(--tk-text-faint)",
  accent:    "var(--tk-accent)",
  accentDim: "var(--tk-accent-dim)",
  accentBrd: "var(--tk-accent-brd)",
  accentText:"var(--tk-accent-text)",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type CustomizeTab = "style" | "animation" | "position" | "effects";

interface CustomizeTextPanelProps {
  style: CaptionStyle;
  onChange: (s: CaptionStyle) => void;
  selectedCaption: Caption | null;
  onCaptionChange: (id: string, patch: Partial<Caption>) => void;
  onApplyToAll: (s: CaptionStyle) => void;
  onCollapse: () => void;
}

// ─── Shared inline styles ─────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "6px",
  border: `1px solid var(--tk-border)`,
  background: "var(--tk-surface-bg)",
  padding: "5px 8px",
  fontSize: "11px",
  color: "var(--tk-text-pri)",
  outline: "none",
  boxSizing: "border-box",
  cursor: "pointer",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "auto",
};

// ─── Primitive Controls ───────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: tk.textFaint, fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "6px" }}>
      {children}
    </div>
  );
}

function ControlLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", color: tk.textMuted, fontSize: "9.5px", fontWeight: 600, marginBottom: "4px", lineHeight: 1 }}>
      {children}
    </label>
  );
}

function SliderControl({ label, value, min, max, step, onChange, suffix }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; suffix?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
        <ControlLabel>{label}</ControlLabel>
        <span style={{ fontSize: "10px", fontFamily: "monospace", color: tk.textPri }}>{value}{suffix ?? ""}</span>
      </div>
      <div style={{ position: "relative", height: "4px", borderRadius: "9999px", background: tk.border }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", borderRadius: "9999px", background: tk.accent, width: `${pct}%` }} />
        <div style={{ position: "absolute", top: "50%", width: "14px", height: "14px", borderRadius: "9999px", border: `2px solid ${tk.accent}`, background: tk.panelBg, transform: "translate(-50%, -50%)", left: `${pct}%`, cursor: "pointer" }} />
        <input type="range" aria-label={label} min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} />
      </div>
    </div>
  );
}

function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void; }) {
  return (
    <div>
      <ControlLabel>{label}</ControlLabel>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "6px", border: `1px solid ${tk.border}`, background: tk.surfaceBg, padding: "5px 8px" }}>
        <label style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}>
          <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.15)", background: value }} />
          <input type="color" aria-label={`${label} color picker`} value={value} onChange={(e) => onChange(e.target.value)}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
        </label>
        <input aria-label={`${label} hex`} value={value.toUpperCase()} onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, background: "transparent", fontFamily: "monospace", fontSize: "10.5px", color: tk.textPri, outline: "none", minWidth: 0, border: "none" }} />
      </div>
    </div>
  );
}

function ToggleControl({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void; }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", cursor: "pointer" }}
      onClick={() => onChange(!checked)}>
      <span style={{ fontSize: "10.5px", color: tk.textPri }}>{label}</span>
      <button type="button" role="switch" aria-checked={checked}
        onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
        style={{ position: "relative", width: "36px", height: "20px", borderRadius: "9999px", flexShrink: 0, cursor: "pointer", border: "none", transition: "background 0.2s", background: checked ? tk.accent : tk.border }}>
        <span style={{ position: "absolute", top: "2px", width: "16px", height: "16px", borderRadius: "9999px", background: "#fff", transition: "left 0.2s", left: checked ? "18px" : "2px" }} />
      </button>
    </div>
  );
}

function SelectControl({ label, value, onChange, children }: {
  label: string; value: string | number; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div>
      <ControlLabel>{label}</ControlLabel>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle}>
        {children}
      </select>
    </div>
  );
}

function CollapsibleSection({ title, defaultOpen = true, children }: {
  title: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${tk.border}` }}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", background: "none", border: "none", cursor: "pointer" }}>
        <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: tk.textFaint }}>
          {title}
        </span>
        <ChevronDown style={{ width: "12px", height: "12px", color: tk.textFaint, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open && (
        <div style={{ paddingBottom: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Style Tab ─────────────────────────────────────────────────────────────────

function StyleTab({ style, onChange }: {
  style: CaptionStyle; onChange: (s: CaptionStyle) => void;
  selectedCaption: Caption | null; onCaptionChange: (id: string, patch: Partial<Caption>) => void;
}) {
  const set = <K extends keyof CaptionStyle>(key: K, val: CaptionStyle[K]) => onChange({ ...style, [key]: val });

  return (
    <div>
      <CollapsibleSection title="Typography" defaultOpen>
        <div>
          <ControlLabel>Font</ControlLabel>
          <FontPicker value={style.fontFamily} onChange={(f) => set("fontFamily", f)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <SelectControl label="Weight" value={style.fontWeight} onChange={(v) => set("fontWeight", Number(v))}>
            <option value={300}>Light</option>
            <option value={400}>Regular</option>
            <option value={500}>Medium</option>
            <option value={600}>SemiBold</option>
            <option value={700}>Bold</option>
            <option value={800}>ExtraBold</option>
            <option value={900}>Black</option>
          </SelectControl>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <ControlLabel>Size</ControlLabel>
              <span style={{ fontSize: "10px", fontFamily: "monospace", color: tk.textPri }}>{style.fontSize}px</span>
            </div>
            <input type="number" aria-label="Font size" value={style.fontSize} min={10} max={200}
              onChange={(e) => set("fontSize", Number(e.target.value))} style={inputStyle} />
          </div>
        </div>

        <SliderControl label="Font Size" value={style.fontSize} min={10} max={140} step={2} onChange={(v) => set("fontSize", v)} suffix="px" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <ColorControl label="Text Color" value={style.color} onChange={(v) => set("color", v)} />
          <ColorControl label="Highlight" value={style.highlightColor} onChange={(v) => set("highlightColor", v)} />
        </div>

        <div style={{ borderRadius: "8px", border: `1px solid ${tk.border}`, overflow: "hidden" }}>
          {[
            { label: "Bold", key: "bold" as const },
            { label: "Uppercase", key: "uppercase" as const },
            { label: "Karaoke Highlight", key: "karaoke" as const },
          ].map((item, i, arr) => (
            <div key={item.key} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${tk.border}` : "none", padding: "0 8px" }}>
              <ToggleControl label={item.label} checked={!!style[item.key]} onChange={(v) => set(item.key, v)} />
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Stroke" defaultOpen={false}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <ColorControl label="Stroke Color" value={style.strokeColor} onChange={(v) => set("strokeColor", v)} />
          <SliderControl label="Width" value={style.strokeWidth} min={0} max={12} step={1} onChange={(v) => set("strokeWidth", v)} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Background" defaultOpen={false}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <ColorControl label="BG Color" value={style.bgColor} onChange={(v) => set("bgColor", v)} />
          <SliderControl label="Opacity" value={Math.round(style.bgOpacity * 100)} min={0} max={100} step={5} onChange={(v) => set("bgOpacity", v / 100)} suffix="%" />
        </div>
        <SliderControl label="Box Width" value={style.boxWidth ?? 84} min={10} max={100} step={1} onChange={(v) => set("boxWidth", v)} suffix="%" />
      </CollapsibleSection>

      <CollapsibleSection title="Emoji" defaultOpen={false}>
        <ToggleControl label="Add Emojis to Captions" checked={!!style.emojiEnabled} onChange={(v) => set("emojiEnabled", v)} />
        {style.emojiEnabled && (
          <SelectControl label="Density" value={style.emojiDensity ?? "medium"} onChange={(v) => set("emojiDensity", v as CaptionStyle["emojiDensity"])}>
            <option value="light">Light</option>
            <option value="medium">Medium</option>
            <option value="heavy">Heavy</option>
          </SelectControl>
        )}
      </CollapsibleSection>
    </div>
  );
}

// ─── Animation Tab ─────────────────────────────────────────────────────────────

function AnimationTab({ style, onChange }: { style: CaptionStyle; onChange: (s: CaptionStyle) => void; }) {
  const set = <K extends keyof CaptionStyle>(key: K, val: CaptionStyle[K]) => onChange({ ...style, [key]: val });

  const inAnims: Array<{ value: CaptionStyle["animation"]; label: string }> = [
    { value: "none", label: "None" }, { value: "fade", label: "Fade" }, { value: "pop", label: "Pop" },
    { value: "slide-up", label: "Slide Up" }, { value: "slide-down", label: "Slide Down" },
    { value: "zoom-in", label: "Zoom In" }, { value: "bounce", label: "Bounce" },
    { value: "typewriter", label: "Typewriter" }, { value: "glitch", label: "Glitch" },
    { value: "wave", label: "Wave" }, { value: "shake", label: "Shake" },
  ];

  return (
    <div>
      <CollapsibleSection title="Caption Animation" defaultOpen>
        <div>
          <ControlLabel>Animation Style</ControlLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {inAnims.map((a) => {
              const active = style.animation === a.value && !style.karaoke;
              return (
                <button key={a.value} type="button" onClick={() => set("animation", a.value)}
                  style={{ padding: "6px", borderRadius: "6px", fontSize: "10px", fontWeight: 600, cursor: "pointer",
                    border: `1px solid ${active ? tk.accent : tk.border}`,
                    background: active ? tk.accentDim : tk.surfaceBg,
                    color: active ? "#93c5fd" : tk.textMuted, transition: "all 0.15s" }}>
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        {style.animation === "typewriter" && (
          <div style={{ borderTop: `1px solid ${tk.border}`, paddingTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <SectionLabel>Typewriter Settings</SectionLabel>
            <SliderControl label="Typing Speed" value={style.typewriterSpeed ?? 80} min={30} max={300} step={10} onChange={(v) => set("typewriterSpeed", v)} suffix="ms" />
            <SliderControl label="Delete Speed" value={style.typewriterDeleteSpeed ?? 40} min={10} max={200} step={10} onChange={(v) => set("typewriterDeleteSpeed", v)} suffix="ms" />
            <SliderControl label="Delay" value={style.typewriterDelay ?? 1500} min={500} max={4000} step={100} onChange={(v) => set("typewriterDelay", v)} suffix="ms" />
            <ColorControl label="Cursor Color" value={style.typewriterCursorColor ?? "#3b82f6"} onChange={(v) => set("typewriterCursorColor", v)} />
            <ToggleControl label="Loop" checked={style.typewriterLoop !== false} onChange={(v) => set("typewriterLoop", v)} />
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Karaoke Highlight" defaultOpen={false}>
        <ToggleControl label="Karaoke Mode" checked={style.karaoke} onChange={(v) => set("karaoke", v)} />
        {style.karaoke && (
          <ColorControl label="Highlight Color" value={style.highlightColor} onChange={(v) => set("highlightColor", v)} />
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Animation Presets" defaultOpen={false}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {ANIM_STYLES.slice(0, 12).map((anim) => {
            const active = anim.isActive(style);
            return (
              <button key={anim.id} type="button" onClick={() => onChange(anim.apply(style))} title={anim.description}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 8px", borderRadius: "6px",
                  border: `1px solid ${active ? tk.accent : tk.border}`,
                  background: active ? tk.accentDim : tk.surfaceBg, cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: "12px", flexShrink: 0 }}>{anim.iconText?.slice(0, 2)}</span>
                <span style={{ fontSize: "9.5px", fontWeight: 600, color: active ? "#93c5fd" : tk.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{anim.title}</span>
              </button>
            );
          })}
        </div>
      </CollapsibleSection>
    </div>
  );
}

// ─── Position Tab ──────────────────────────────────────────────────────────────

function PositionTab({ style, onChange, selectedCaption, onCaptionChange }: {
  style: CaptionStyle; onChange: (s: CaptionStyle) => void;
  selectedCaption: Caption | null; onCaptionChange: (id: string, patch: Partial<Caption>) => void;
}) {
  const set = <K extends keyof CaptionStyle>(key: K, val: CaptionStyle[K]) => onChange({ ...style, [key]: val });

  const positionPresets = [
    { key: "top" as const, Icon: AlignStartVertical, label: "Top" },
    { key: "middle" as const, Icon: AlignCenterVertical, label: "Center" },
    { key: "bottom" as const, Icon: AlignEndVertical, label: "Bottom" },
    { key: "free" as const, Icon: Move, label: "Custom" },
  ];
  const alignPresets = [
    { key: "left" as const, Icon: AlignLeft, label: "Left" },
    { key: "center" as const, Icon: AlignCenter, label: "Center" },
    { key: "right" as const, Icon: AlignRight, label: "Right" },
  ];

  const applyPosition = (pos: CaptionStyle["position"]) => {
    set("position", pos);
    if (!selectedCaption) return;
    const coords: Record<string, { x: number; y: number }> = {
      top: { x: 0.5, y: 0.12 }, middle: { x: 0.5, y: 0.5 },
      bottom: { x: 0.5, y: 0.88 }, free: { x: selectedCaption.x ?? 0.5, y: selectedCaption.y ?? 0.88 },
    };
    onCaptionChange(selectedCaption.id, { ...coords[pos], style: { position: pos } });
  };

  return (
    <div>
      <CollapsibleSection title="Position" defaultOpen>
        <div>
          <ControlLabel>Vertical Position</ControlLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px" }}>
            {positionPresets.map(({ key, Icon, label }) => {
              const active = style.position === key;
              return (
                <button key={key} type="button" onClick={() => applyPosition(key)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px",
                    padding: "8px 4px", borderRadius: "6px", border: `1px solid ${active ? tk.accent : tk.border}`,
                    background: active ? tk.accentDim : tk.surfaceBg, cursor: "pointer", minHeight: "52px" }}>
                  <Icon style={{ width: "14px", height: "14px", color: active ? "#93c5fd" : tk.textMuted }} strokeWidth={1.8} />
                  <span style={{ fontSize: "8.5px", fontWeight: 600, color: active ? "#93c5fd" : tk.textMuted }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <ControlLabel>Alignment</ControlLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px" }}>
            {alignPresets.map(({ key, Icon, label }) => {
              const active = (style.alignment ?? "center") === key;
              return (
                <button key={key} type="button" onClick={() => set("alignment", key)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                    padding: "6px", borderRadius: "6px", border: `1px solid ${active ? tk.accent : tk.border}`,
                    background: active ? tk.accentDim : tk.surfaceBg, cursor: "pointer" }}>
                  <Icon style={{ width: "12px", height: "12px", color: active ? tk.accentText : tk.textMuted }} />
                  <span style={{ fontSize: "9.5px", fontWeight: 600, color: active ? tk.accentText : tk.textMuted }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </CollapsibleSection>

      {style.position === "free" && selectedCaption && (
        <CollapsibleSection title="Fine Position" defaultOpen>
          <SliderControl label="X Position" value={Math.round((selectedCaption.x ?? 0.5) * 100)} min={5} max={95} step={1}
            onChange={(v) => onCaptionChange(selectedCaption.id, { x: v / 100 })} suffix="%" />
          <SliderControl label="Y Position" value={Math.round((selectedCaption.y ?? 0.88) * 100)} min={5} max={95} step={1}
            onChange={(v) => onCaptionChange(selectedCaption.id, { y: v / 100 })} suffix="%" />
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Box Size" defaultOpen={false}>
        <SliderControl label="Width" value={style.boxWidth ?? 84} min={10} max={100} step={1}
          onChange={(v) => onChange({ ...style, boxWidth: v })} suffix="%" />
      </CollapsibleSection>
    </div>
  );
}

// ─── Effects Tab ──────────────────────────────────────────────────────────────

function EffectsTab({ style, onChange }: { style: CaptionStyle; onChange: (s: CaptionStyle) => void; }) {
  const effects = [
    { id: "karaoke",    label: "Karaoke Highlight", desc: "Active word highlight",    active: style.karaoke,              toggle: () => onChange({ ...style, karaoke: !style.karaoke }) },
    { id: "stroke",     label: "Stroke / Outline",  desc: "Text border outline",       active: style.strokeWidth > 0,       toggle: () => onChange({ ...style, strokeWidth: style.strokeWidth > 0 ? 0 : 4 }) },
    { id: "background", label: "Background",         desc: "Caption background fill",   active: style.bgOpacity > 0,         toggle: () => onChange({ ...style, bgOpacity: style.bgOpacity > 0 ? 0 : 0.7 }) },
    { id: "bold",       label: "Bold Emphasis",      desc: "Extra bold font weight",    active: style.bold,                  toggle: () => onChange({ ...style, bold: !style.bold }) },
    { id: "uppercase",  label: "UPPERCASE",          desc: "Force all caps text",       active: style.uppercase,             toggle: () => onChange({ ...style, uppercase: !style.uppercase }) },
    { id: "cinematic",  label: "Cinematic Stack",    desc: "Stacked cinematic layout",  active: !!style.isCinematicStacked,  toggle: () => onChange({ ...style, isCinematicStacked: !style.isCinematicStacked }) },
    { id: "emoji",      label: "AI Emojis",          desc: "Auto-add context emojis",   active: !!style.emojiEnabled,        toggle: () => onChange({ ...style, emojiEnabled: !style.emojiEnabled }) },
  ];

  return (
    <div>
      <CollapsibleSection title="Visual Effects" defaultOpen>
        <div>
          {effects.map((effect, i) => (
            <div key={effect.id}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px", cursor: "pointer", borderRadius: "6px" }}
                onClick={effect.toggle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "10.5px", fontWeight: 600, color: tk.textPri }}>{effect.label}</div>
                  <div style={{ fontSize: "9px", color: tk.textFaint, lineHeight: 1.3 }}>{effect.desc}</div>
                </div>
                <button type="button" role="switch" aria-checked={effect.active}
                  onClick={(e) => { e.stopPropagation(); effect.toggle(); }}
                  style={{ position: "relative", width: "36px", height: "20px", borderRadius: "9999px", flexShrink: 0, marginLeft: "8px",
                    cursor: "pointer", border: "none", transition: "background 0.2s", background: effect.active ? tk.accent : tk.border }}>
                  <span style={{ position: "absolute", top: "2px", width: "16px", height: "16px", borderRadius: "9999px",
                    background: "#fff", transition: "left 0.2s", left: effect.active ? "18px" : "2px" }} />
                </button>
              </div>
              {i < effects.length - 1 && <div style={{ height: "1px", background: tk.border }} />}
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {style.strokeWidth > 0 && (
        <CollapsibleSection title="Stroke Settings" defaultOpen>
          <ColorControl label="Stroke Color" value={style.strokeColor} onChange={(v) => onChange({ ...style, strokeColor: v })} />
          <SliderControl label="Width" value={style.strokeWidth} min={1} max={12} step={1} onChange={(v) => onChange({ ...style, strokeWidth: v })} />
        </CollapsibleSection>
      )}

      {style.bgOpacity > 0 && (
        <CollapsibleSection title="Background Settings" defaultOpen>
          <ColorControl label="BG Color" value={style.bgColor} onChange={(v) => onChange({ ...style, bgColor: v })} />
          <SliderControl label="Opacity" value={Math.round(style.bgOpacity * 100)} min={5} max={100} step={5}
            onChange={(v) => onChange({ ...style, bgOpacity: v / 100 })} suffix="%" />
        </CollapsibleSection>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS: { id: CustomizeTab; label: string; Icon: React.ElementType }[] = [
  { id: "style",     label: "Style",    Icon: Sliders },
  { id: "animation", label: "Anim",     Icon: Zap },
  { id: "position",  label: "Position", Icon: Move },
  { id: "effects",   label: "Effects",  Icon: Wand2 },
];

export function CustomizeTextPanel({ style, onChange, selectedCaption, onCaptionChange, onApplyToAll, onCollapse }: CustomizeTextPanelProps) {
  const [activeTab, setActiveTab] = useState<CustomizeTab>("style");

  const handleReset = useCallback(() => {
    onChange({ ...DEFAULT_STYLE, position: style.position, posX: style.posX, posY: style.posY });
  }, [style, onChange]);

  const handleApplyToAll = useCallback(() => { onApplyToAll(style); }, [style, onApplyToAll]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: tk.panelBg, borderRight: `1px solid ${tk.border}`, overflow: "hidden" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", height: "40px", flexShrink: 0, borderBottom: `1px solid ${tk.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Layers style={{ width: "14px", height: "14px", color: tk.accent }} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: tk.textPri, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Customize Text
          </span>
        </div>
        <button type="button" onClick={onCollapse} title="Collapse panel"
          style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "none", background: "transparent", color: tk.textFaint, cursor: "pointer" }}>
          <ChevronRight style={{ width: "14px", height: "14px" }} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${tk.border}`, flexShrink: 0, padding: "6px 8px 0" }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} type="button" onClick={() => setActiveTab(id)}
              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px 6px", fontSize: "10px",
                fontWeight: 700, cursor: "pointer", background: "none", border: "none",
                borderBottom: `2px solid ${active ? tk.accent : "transparent"}`,
                color: active ? tk.accentText : tk.textFaint, transition: "color 0.15s", marginBottom: "-1px" }}>
              <Icon style={{ width: "12px", height: "12px" }} />
              {label}
            </button>
          );
        })}
      </div>

      {/* No Caption Selected */}
      {!selectedCaption ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center" }}>
          <MonitorPlay style={{ width: "32px", height: "32px", color: tk.textFaint, marginBottom: "12px" }} />
          <p style={{ fontSize: "11px", color: tk.textFaint, lineHeight: 1.6 }}>
            Select a caption from the preview or timeline to customize its style.
          </p>
        </div>
      ) : (
        <>
          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px" }}>
            {activeTab === "style" && (
              <StyleTab style={style} onChange={onChange} selectedCaption={selectedCaption} onCaptionChange={onCaptionChange} />
            )}
            {activeTab === "animation" && <AnimationTab style={style} onChange={onChange} />}
            {activeTab === "position" && (
              <PositionTab style={style} onChange={onChange} selectedCaption={selectedCaption} onCaptionChange={onCaptionChange} />
            )}
            {activeTab === "effects" && <EffectsTab style={style} onChange={onChange} />}
          </div>

          {/* Bottom Action Bar */}
          <div style={{ flexShrink: 0, borderTop: `1px solid ${tk.border}`, padding: "8px 12px", display: "flex", gap: "8px" }}>
            <button type="button" onClick={handleReset}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                padding: "8px", borderRadius: "6px", border: `1px solid ${tk.border}`, background: "transparent",
                fontSize: "10.5px", fontWeight: 600, color: tk.textMuted, cursor: "pointer" }}>
              <RotateCcw style={{ width: "12px", height: "12px" }} />
              Reset
            </button>
            <button type="button" onClick={handleApplyToAll}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                padding: "8px", borderRadius: "6px", border: `1px solid ${tk.accentBrd}`, background: tk.accentDim,
                fontSize: "10.5px", fontWeight: 700, color: tk.accentText, cursor: "pointer" }}>
              <Layers style={{ width: "12px", height: "12px" }} />
              Apply to All
            </button>
          </div>
        </>
      )}
    </div>
  );
}
