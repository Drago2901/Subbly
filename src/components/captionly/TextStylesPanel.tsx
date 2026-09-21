import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Trash2,
  Star,
  Check,
  Sparkles,
  Clock,
} from "lucide-react";
import { type CaptionStyle } from "@/lib/captions/types";
import { CAPTION_TEMPLATES } from "@/lib/captions/types";
import { loadGoogleFont } from "@/lib/captions/fontLoader";
import { ANIM_STYLES } from "./StylePanel/stylePanelConstants";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────

type SavedPreset = { id: string; name: string; style: CaptionStyle };

interface TextStylesPanelProps {
  style: CaptionStyle;
  onChange: (s: CaptionStyle) => void;
  selectedCaptionId: string | null;
  onCollapse: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PRESET_CATEGORIES = [
  "All",
  "Popular",
  "Social",
  "Cinematic",
  "Meme",
  "Anime",
  "Gaming",
  "YouTube",
  "Podcast",
  "News",
  "Minimal",
];

// Map CAPTION_TEMPLATES to category buckets for the pill filter
function getCategoryForTemplate(tpl: typeof CAPTION_TEMPLATES[number]): string[] {
  const cats: string[] = ["All"];
  const id = tpl.id.toLowerCase();
  const name = tpl.name.toLowerCase();

  if (id.includes("tiktok") || id.includes("viral") || id.includes("reel") || id.includes("instagram") || id.includes("party"))
    cats.push("Social");
  if (id.includes("cinematic") || id.includes("cinema") || id.includes("documentary") || id.includes("trailer") || id.includes("film") || id.includes("elegant"))
    cats.push("Cinematic");
  if (id.includes("meme") || id.includes("impact") || id.includes("horror"))
    cats.push("Meme");
  if (id.includes("gaming") || id.includes("game") || id.includes("cyberpunk"))
    cats.push("Gaming");
  if (id.includes("youtube") || id.includes("shorts"))
    cats.push("YouTube");
  if (id.includes("podcast") || id.includes("corporate") || id.includes("news"))
    cats.push("Podcast");
  if (id.includes("news") || id.includes("ticker"))
    cats.push("News");
  if (id.includes("minimal") || id.includes("clean") || id.includes("classic") || id.includes("mono"))
    cats.push("Minimal");

  // "Popular" picks from well-known presets
  if (
    ["tiktok-bold", "bold-yellow-highlight", "viral-reel", "reels-pop", "instagram-reel", "meme-pop", "gaming-stream"].includes(id)
  )
    cats.push("Popular");

  if (name.includes("anime") || id.includes("anime") || id.includes("neon") || id.includes("lofi"))
    cats.push("Anime");

  return cats;
}

// ─── Preset Card ─────────────────────────────────────────────────────────────

function PresetCard({
  template,
  isActive,
  onClick,
}: {
  template: typeof CAPTION_TEMPLATES[number];
  isActive: boolean;
  onClick: () => void;
}) {
  const previewStyle = template.style;
  const bg = previewStyle.bgColor ?? "#000";
  const bgOp = previewStyle.bgOpacity ?? 0;
  const textColor = previewStyle.color ?? "#fff";
  const font = previewStyle.fontFamily ?? "Inter";
  const weight = previewStyle.fontWeight ?? 700;
  const hasStroke = (previewStyle.strokeWidth ?? 0) > 0;
  const strokeColor = previewStyle.strokeColor ?? "#000";
  const strokeWidth = previewStyle.strokeWidth ?? 0;

  // Short display name for the card preview
  const previewText = template.name.length > 12
    ? template.name.slice(0, 10) + "…"
    : template.name;

  return (
    <button
      type="button"
      onClick={onClick}
      title={template.name}
      className={`relative w-full rounded-lg overflow-hidden cursor-pointer transition-all duration-200 group select-none ${
        isActive
          ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-[#13151c]"
          : "hover:ring-1 hover:ring-white/20"
      }`}
      style={{ aspectRatio: "4/3" }}
    >
      {/* Card background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: bgOp > 0 ? bg : "#1a1d27",
          opacity: bgOp > 0 ? 1 : 1,
        }}
      />
      {bgOp > 0 && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: bg, opacity: bgOp }}
        />
      )}

      {/* Preview text */}
      <div className="absolute inset-0 flex items-center justify-center px-2">
        <span
          className="text-center leading-tight select-none"
          style={{
            fontFamily: `"${font}", sans-serif`,
            fontWeight: weight,
            color: textColor,
            fontSize: "12px",
            WebkitTextStroke: hasStroke ? `${Math.min(strokeWidth * 0.4, 1.5)}px ${strokeColor}` : undefined,
            textTransform: (previewStyle.uppercase ?? false) ? "uppercase" : "none",
            wordBreak: "break-word",
            textShadow: hasStroke ? `0 0 ${strokeWidth}px ${strokeColor}` : undefined,
          }}
        >
          {previewText}
        </span>
      </div>

      {/* Bottom label */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pt-3 pb-1.5">
        <span className="text-[9px] font-semibold text-white/80 truncate block leading-tight">
          {template.name}
        </span>
      </div>

      {/* Active check */}
      {isActive && (
        <div className="absolute top-1 right-1 h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

// ─── Animation Effect Card ────────────────────────────────────────────────────

function AnimEffectCard({
  anim,
  isActive,
  onClick,
}: {
  anim: typeof ANIM_STYLES[number];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={anim.description}
      className={`relative flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-2.5 cursor-pointer transition-all duration-200 select-none border ${
        isActive
          ? "border-blue-500 bg-blue-500/10 text-blue-400"
          : "border-white/8 bg-white/4 text-white/60 hover:border-white/20 hover:text-white/90"
      }`}
    >
      <span className="text-[16px] leading-none">{anim.iconText?.length === 1 ? anim.iconText : "✨"}</span>
      <span className="text-[9px] font-semibold truncate w-full text-center leading-tight">
        {anim.title}
      </span>
      {isActive && (
        <div className="absolute top-0.5 right-0.5 h-3 w-3 bg-blue-500 rounded-full flex items-center justify-center">
          <Check className="h-2 w-2 text-white" strokeWidth={3.5} />
        </div>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TextStylesPanel({
  style,
  onChange,
  selectedCaptionId,
  onCollapse,
}: TextStylesPanelProps) {
  const { user } = useAuth();

  // Search & filter state
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Accordion states
  const [animEffectsOpen, setAnimEffectsOpen] = useState(false);
  const [myPresetsOpen, setMyPresetsOpen] = useState(true);

  // My Presets
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  // Recent styles (last 4 applied template IDs stored in localStorage)
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("subbly_recent_text_styles");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Load saved presets
  useEffect(() => {
    if (!user) return;
    const fetchPresets = async () => {
      const { data, error } = await supabase
        .from("style_presets")
        .select("id,name,style")
        .order("created_at", { ascending: false });
      if (!error && data) setSavedPresets(data as SavedPreset[]);
    };
    fetchPresets();
  }, [user]);

  // Filter CAPTION_TEMPLATES
  const filteredTemplates = useMemo(() => {
    let result = CAPTION_TEMPLATES;
    if (activeCategory !== "All") {
      result = result.filter((t) =>
        getCategoryForTemplate(t).includes(activeCategory)
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, search]);

  const recentTemplates = useMemo(
    () =>
      recentIds
        .map((id) => CAPTION_TEMPLATES.find((t) => t.id === id))
        .filter(Boolean) as typeof CAPTION_TEMPLATES,
    [recentIds]
  );

  const applyTemplate = useCallback(
    (tpl: typeof CAPTION_TEMPLATES[number]) => {
      const merged = { ...style, ...tpl.style };
      onChange(merged);
      if (tpl.style.fontFamily) loadGoogleFont(tpl.style.fontFamily);
      // Update recents
      setRecentIds((prev) => {
        const next = [tpl.id, ...prev.filter((id) => id !== tpl.id)].slice(0, 4);
        try {
          localStorage.setItem("subbly_recent_text_styles", JSON.stringify(next));
        } catch {}
        return next;
      });
      toast.success(`Applied "${tpl.name}"`);
    },
    [style, onChange]
  );

  const isTemplateActive = (tpl: typeof CAPTION_TEMPLATES[number]) => {
    return Object.entries(tpl.style ?? {}).every(([k, v]) => {
      const key = k as keyof CaptionStyle;
      return style[key] === v;
    });
  };

  const savePreset = async () => {
    if (!user) return toast.error("Sign in to save presets");
    const name = presetNameInput.trim();
    if (!name) return toast.error("Enter a preset name");
    setSavingPreset(true);
    try {
      const { data, error } = await supabase
        .from("style_presets")
        .insert({ user_id: user.id, name, style: JSON.parse(JSON.stringify(style)) })
        .select("id,name,style")
        .single();
      if (error) throw error;
      setSavedPresets((p) => [data as SavedPreset, ...p]);
      setPresetNameInput("");
      setShowSaveInput(false);
      toast.success(`Saved "${name}"`);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSavingPreset(false);
    }
  };

  const deletePreset = async (id: string) => {
    const { error } = await supabase.from("style_presets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setSavedPresets((p) => p.filter((x) => x.id !== id));
  };

  const applyPreset = (preset: SavedPreset) => {
    onChange({ ...style, ...preset.style });
    if (preset.style.fontFamily) loadGoogleFont(preset.style.fontFamily);
    toast.success(`Applied "${preset.name}"`);
  };

  // Scroll category pills
  const scrollCategories = (dir: "left" | "right") => {
    if (!categoryScrollRef.current) return;
    categoryScrollRef.current.scrollBy({ left: dir === "left" ? -80 : 80, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col h-full bg-[#13151c] border-r border-white/8 overflow-hidden select-none">
      {/* ── Panel Header ── */}
      <div className="flex items-center justify-between px-3 h-10 flex-shrink-0 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-[11px] font-bold text-white/90 tracking-widest uppercase">
            Text Styles
          </span>
        </div>
        <button
          type="button"
          onClick={onCollapse}
          className="h-6 w-6 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/8 transition cursor-pointer"
          title="Collapse panel"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

        {/* Search */}
        <div className="px-3 pt-2.5 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search text styles…"
              className="w-full bg-white/6 border border-white/8 rounded-md pl-7 pr-7 py-1.5 text-[11px] text-white/80 placeholder-white/25 outline-none focus:border-blue-500/50 focus:bg-white/8 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="relative flex items-center px-2 pb-2">
          <button
            type="button"
            onClick={() => scrollCategories("left")}
            className="flex-shrink-0 h-5 w-4 flex items-center justify-center text-white/25 hover:text-white/60 cursor-pointer"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <div
            ref={categoryScrollRef}
            className="flex gap-1 overflow-x-auto scrollbar-none flex-1 px-0.5"
            style={{ scrollbarWidth: "none" }}
          >
            {PRESET_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[9.5px] font-bold transition cursor-pointer border ${
                  activeCategory === cat
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollCategories("right")}
            className="flex-shrink-0 h-5 w-4 flex items-center justify-center text-white/25 hover:text-white/60 cursor-pointer"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* No caption selected notice */}
        {!selectedCaptionId && (
          <div className="mx-3 mb-3 px-2 py-2 bg-blue-500/8 border border-blue-500/20 rounded-lg">
            <p className="text-[9.5px] text-blue-300/70 text-center leading-relaxed">
              Select a caption in the preview or timeline to apply styles
            </p>
          </div>
        )}

        {/* ── PRESET GRID ── */}
        <div className="px-3 pb-1">
          <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/25 mb-2">
            PRESETS {filteredTemplates.length > 0 && `(${filteredTemplates.length})`}
          </div>
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-6 text-white/25 text-[10px]">
              No styles found
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {filteredTemplates.map((tpl) => (
                <PresetCard
                  key={tpl.id}
                  template={tpl}
                  isActive={isTemplateActive(tpl)}
                  onClick={() => applyTemplate(tpl)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── ANIMATED TEXT EFFECTS (collapsed by default) ── */}
        <div className="mt-2 border-t border-white/6">
          <button
            type="button"
            onClick={() => setAnimEffectsOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/4 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px]">✨</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/50">
                Animated Text Effects
              </span>
            </div>
            <ChevronDown
              className={`h-3 w-3 text-white/30 transition-transform duration-200 ${
                animEffectsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {animEffectsOpen && (
            <div className="px-3 pb-3">
              <div className="grid grid-cols-3 gap-1.5">
                {ANIM_STYLES.map((anim) => (
                  <AnimEffectCard
                    key={anim.id}
                    anim={anim}
                    isActive={anim.isActive(style)}
                    onClick={() => onChange(anim.apply(style))}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RECENT STYLES ── */}
        {recentTemplates.length > 0 && (
          <div className="border-t border-white/6">
            <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-white/25" />
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/25">
                Recent
              </span>
            </div>
            <div className="px-3 pb-3 grid grid-cols-4 gap-1">
              {recentTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  title={tpl.name}
                  className="relative rounded overflow-hidden cursor-pointer hover:ring-1 hover:ring-white/20 transition"
                  style={{ aspectRatio: "1" }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      backgroundColor: (tpl.style.bgOpacity ?? 0) > 0 ? tpl.style.bgColor ?? "#111" : "#1a1d27",
                    }}
                  >
                    <span
                      className="text-[8px] font-bold text-center px-0.5 leading-tight"
                      style={{
                        color: tpl.style.color ?? "#fff",
                        fontFamily: `"${tpl.style.fontFamily ?? "Inter"}", sans-serif`,
                        textTransform: tpl.style.uppercase ? "uppercase" : "none",
                      }}
                    >
                      {tpl.name.slice(0, 6)}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 py-0.5 px-0.5">
                    <span className="text-[7px] text-white/60 truncate block">{tpl.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── MY PRESETS ── */}
        <div className="border-t border-white/6">
          <button
            type="button"
            onClick={() => setMyPresetsOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/4 transition cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Star className="h-3 w-3 text-white/30" />
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/40">
                My Presets
              </span>
              {savedPresets.length > 0 && (
                <span className="text-[8px] text-white/25 ml-0.5">({savedPresets.length})</span>
              )}
            </div>
            <ChevronDown
              className={`h-3 w-3 text-white/30 transition-transform duration-200 ${
                myPresetsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {myPresetsOpen && (
            <div className="px-3 pb-3 space-y-1.5">
              {savedPresets.length === 0 && !showSaveInput && (
                <p className="text-[10px] text-white/25 text-center py-2">
                  No saved presets yet
                </p>
              )}

              {savedPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center gap-2 group rounded-md px-2 py-1.5 bg-white/4 border border-white/6 hover:border-white/12 transition"
                >
                  <button
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="flex-1 text-left text-[10px] font-semibold text-white/70 hover:text-white transition truncate cursor-pointer"
                  >
                    {preset.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePreset(preset.id)}
                    className="h-5 w-5 flex items-center justify-center rounded text-white/20 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    title="Delete preset"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Save as preset */}
              {showSaveInput ? (
                <div className="flex gap-1 mt-1">
                  <input
                    type="text"
                    value={presetNameInput}
                    onChange={(e) => setPresetNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") savePreset();
                      if (e.key === "Escape") { setShowSaveInput(false); setPresetNameInput(""); }
                    }}
                    placeholder="Preset name…"
                    autoFocus
                    className="flex-1 bg-white/6 border border-blue-500/40 rounded px-2 py-1 text-[10px] text-white/80 outline-none placeholder-white/25"
                  />
                  <button
                    type="button"
                    onClick={savePreset}
                    disabled={savingPreset}
                    className="px-2 py-1 bg-blue-500 text-white text-[10px] font-bold rounded hover:bg-blue-600 transition cursor-pointer disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowSaveInput(false); setPresetNameInput(""); }}
                    className="h-6 w-6 flex items-center justify-center rounded text-white/30 hover:text-white hover:bg-white/8 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSaveInput(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-dashed border-white/15 text-[9.5px] font-semibold text-white/35 hover:text-white/60 hover:border-white/25 transition cursor-pointer mt-1"
                >
                  <Plus className="h-3 w-3" />
                  Save Current Style as Preset
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
    </div>
  );
}
