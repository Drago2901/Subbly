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
  Search,
  Star,
  ChevronDown,
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
import { TemplateLibraryDialog } from "./TemplateLibraryDialog";

type Props = {
  style: CaptionStyle;
  onChange: (s: CaptionStyle) => void;
  selectedCaption?: Caption | null;
  onCaptionChange?: (id: string, patch: Partial<Caption>) => void;
  isLocked?: boolean;
  activeTab?: Tab;
  showTabsHeader?: boolean;
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

const CATEGORIES = [
  "All Templates",
  "Trending",
  "Minimal",
  "Bold",
  "Dynamic",
  "Elegant",
  "Gaming",
  "Social Media",
];

// Mockup details for the 8 featured templates matching your screenshot
const FEATURED_DETAILS: Record<string, { badge: "New" | "Pro" | null; categories: string[]; tags: string[] }> = {
  "modern-clean": { badge: "New", categories: ["Trending", "Minimal", "Social Media"], tags: ["Text", "Accent", "Fade"] },
  "gradient-pop": { badge: "Pro", categories: ["Trending", "Bold", "Dynamic"], tags: ["Text", "Accent", "Scale"] },
  "bold-impact": { badge: "Pro", categories: ["Trending", "Bold", "Social Media"], tags: ["Text", "Accent", "Pop"] },
  "neon-glow-premium": { badge: "Pro", categories: ["Dynamic", "Gaming"], tags: ["Text", "Accent", "Glow"] },
  "minimal-box": { badge: "New", categories: ["Minimal"], tags: ["Text", "Accent", "Slide"] },
  "wave-style-premium": { badge: "Pro", categories: ["Elegant", "Social Media"], tags: ["Text", "Accent", "Wave"] },
  "street-vibe-premium": { badge: "Pro", categories: ["Bold", "Gaming"], tags: ["Text", "Accent", "Shake"] },
  "luxury-gold-premium": { badge: "Pro", categories: ["Elegant"], tags: ["Text", "Accent", "Fade"] },
};

function TemplateCardPreview({ template }: { template: CaptionTemplate }) {
  switch (template.id) {
    case "modern-clean":
      return (
        <div className="w-full h-full bg-[#0d0d0f] relative overflow-hidden flex flex-col items-center justify-center p-2 select-none">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />
          <div className="text-center font-sans tracking-tight">
            <span className="block text-[11px] font-semibold text-white">Your captions</span>
            <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-extrabold bg-[#FF5C3A] text-white rounded-[3px] shadow-sm">here</span>
          </div>
        </div>
      );
      
    case "gradient-pop":
      return (
        <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-950 relative overflow-hidden flex items-center justify-center p-2 select-none">
          <div className="text-center">
            <span className="block text-[10px] font-black tracking-wider text-white uppercase">YOUR CAPTIONS</span>
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-black uppercase text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-[4px] shadow-sm">HERE</span>
          </div>
        </div>
      );
      
    case "bold-impact":
      return (
        <div className="w-full h-full bg-[#0a0a0b] relative overflow-hidden flex items-center justify-center p-2 select-none">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
            <span className="font-extrabold text-[28px] text-zinc-900 tracking-wider uppercase opacity-35 select-none scale-125">BOLD</span>
          </div>
          <div className="text-center relative z-10">
            <span className="block text-[12px] font-black italic text-white uppercase [text-shadow:_1px_1px_0_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000]">Your captions</span>
            <span className="inline-block text-[13px] font-black italic text-[#FACC15] uppercase [text-shadow:_1px_1px_0_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000] transform -rotate-2">here</span>
          </div>
        </div>
      );
      
    case "neon-glow-premium":
      return (
        <div className="w-full h-full bg-[#09090b] relative overflow-hidden flex items-center justify-center p-2 select-none">
          <div className="text-center">
            <span className="block text-[10px] font-bold tracking-wide text-white uppercase drop-shadow-[0_0_4px_rgba(6,182,212,0.8)]">Your Captions</span>
            <span className="inline-block mt-0.5 text-[12px] font-bold text-cyan-400 uppercase drop-shadow-[0_0_6px_rgba(34,211,238,0.9)]">Here</span>
          </div>
        </div>
      );
      
    case "minimal-box":
      return (
        <div className="w-full h-full bg-[#0c0c0d] relative overflow-hidden flex items-center justify-center p-2 select-none">
          <div className="border border-pink-500/80 px-2.5 py-1 relative bg-black/45">
            <span className="absolute -top-1.5 -left-0.5 text-[7px] font-bold text-pink-500">+</span>
            <span className="absolute -top-1.5 -right-0.5 text-[7px] font-bold text-pink-500">+</span>
            <span className="absolute -bottom-1.5 -left-0.5 text-[7px] font-bold text-pink-500">+</span>
            <span className="absolute -bottom-1.5 -right-0.5 text-[7px] font-bold text-pink-500">+</span>
            <span className="text-[8px] font-bold tracking-widest text-white uppercase">YOUR CAPTIONS HERE</span>
          </div>
        </div>
      );
      
    case "wave-style-premium":
      return (
        <div className="w-full h-full bg-[#07080a] relative overflow-hidden flex items-center justify-center p-2 select-none">
          <div className="text-center">
            <span className="block text-[10px] font-semibold text-white">Your captions</span>
            <span className="inline-block mt-0.5 px-2 py-0.5 text-[9px] font-bold bg-cyan-500 text-white rounded-[2px]">here</span>
          </div>
        </div>
      );
      
    case "street-vibe-premium":
      return (
        <div className="w-full h-full bg-[#0a0a0b] relative overflow-hidden flex items-center justify-center p-2 select-none">
          <div className="text-center relative z-10 font-mono">
            <span className="block text-[10px] font-extrabold text-yellow-400 uppercase tracking-tight">YOUR CAPTIONS</span>
            <span className="inline-block px-1.5 py-0.5 bg-white text-black text-[9px] font-black uppercase transform rotate-1">HERE</span>
          </div>
        </div>
      );
      
    case "luxury-gold-premium":
      return (
        <div className="w-full h-full bg-[#080809] border border-amber-500/10 relative overflow-hidden flex items-center justify-center p-2 select-none">
          <div className="absolute inset-0.5 border border-amber-500/10 pointer-events-none" />
          <div className="text-center font-serif">
            <span className="block text-[11px] italic text-[#FCD34D] font-medium">Your captions</span>
            <span className="inline-block mt-0.5 px-2 py-0.5 text-[9px] uppercase border border-amber-500/40 text-amber-400 font-semibold bg-amber-950/20">here</span>
          </div>
        </div>
      );
      
    default:
      const s = template.style || {};
      const fontFamily = s.fontFamily || "Inter";
      const uppercase = s.uppercase || false;
      return (
        <div className="w-full h-full bg-gradient-to-tr from-[#0e0f12] to-[#16171c] relative overflow-hidden flex items-center justify-center p-2 select-none">
          <span 
            className="text-[9px] text-center font-bold px-1.5 py-0.5 rounded"
            style={{ 
              fontFamily: `"${fontFamily}", sans-serif`,
              color: s.color || "#FFFFFF",
              backgroundColor: s.bgColor ? `${s.bgColor}${Math.round((s.bgOpacity ?? 1) * 255).toString(16).padStart(2, "0")}` : "transparent",
              textShadow: s.strokeWidth ? `0 0 ${s.strokeWidth}px ${s.strokeColor || "#000"}` : "none",
            }}
          >
            {uppercase ? "YOUR CAPTIONS" : "Your captions"}
          </span>
        </div>
      );
  }
}

export function StylePanel({
  style,
  onChange,
  selectedCaption,
  onCaptionChange,
  isLocked,
  activeTab,
  showTabsHeader = true,
}: Props) {
  const { user } = useAuth();
  const [internalTab, setInternalTab] = useState<Tab>("style");
  const tab = activeTab ?? internalTab;
  const setTab = activeTab ? () => {} : setInternalTab;
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

  const [activeCategory, setActiveCategory] = useState("All Templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loadMoreCount, setLoadMoreCount] = useState(8);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("subbly.favoriteTemplates");
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = favorites.includes(id) 
      ? favorites.filter(f => f !== id) 
      : [...favorites, id];
    setFavorites(next);
    localStorage.setItem("subbly.favoriteTemplates", JSON.stringify(next));
    toast.success(favorites.includes(id) ? "Removed from favorites" : "Added to favorites");
  };

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

  const allTemplates = useMemo(() => {
    const list: CaptionTemplate[] = [NONE_TEMPLATE];

    const featuredIds = [
      "modern-clean",
      "gradient-pop",
      "bold-impact",
      "neon-glow-premium",
      "minimal-box",
      "wave-style-premium",
      "street-vibe-premium",
      "luxury-gold-premium",
    ];

    featuredIds.forEach((fid) => {
      const existing = CAPTION_TEMPLATES.find(t => t.id === fid || t.id === fid.replace("-premium", ""));
      const details = FEATURED_DETAILS[fid] || { badge: null, categories: ["Trending"], tags: ["Text"] };
      
      if (existing) {
        list.push({
          ...existing,
          id: fid,
          badge: details.badge as any,
          categories: details.categories,
          tags: details.tags
        });
      } else {
        list.push({
          id: fid,
          name: fid.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
          description: "Stunning template designed for professional look",
          badge: details.badge as any,
          categories: details.categories,
          tags: details.tags,
          style: { fontFamily: "Inter", fontSize: 50, color: "#FFFFFF" }
        });
      }
    });

    CAPTION_TEMPLATES.forEach((t) => {
      if (!featuredIds.some(fid => fid === t.id || fid.replace("-premium", "") === t.id)) {
        list.push({
          ...t,
          badge: null,
          categories: ["Trending", "Social Media"],
          tags: ["Text", "Accent"]
        });
      }
    });

    customTemplates.forEach((ct) => {
      list.push({
        ...ct,
        badge: "New",
        categories: ["Social Media"],
        tags: ["Custom"]
      });
    });

    return list;
  }, [NONE_TEMPLATE, customTemplates]);

  const isTemplateActive = (t: CaptionTemplate) => {
    if (t.id === "none") {
      const keysToCheck: (keyof CaptionStyle)[] = [
        "fontFamily",
        "color",
        "bgColor",
        "bold",
        "uppercase",
        "animation",
        "karaoke",
        "strokeWidth",
      ];
      return keysToCheck.every((key) => style[key] === DEFAULT_STYLE[key]);
    }

    return Object.entries(t.style).every(([key, value]) => {
      return style[key as keyof CaptionStyle] === value;
    });
  };

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(query);
        const matchesDesc = t.description.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }

      // 2. Category Filter
      if (activeCategory !== "All Templates") {
        if (!t.categories?.includes(activeCategory)) return false;
      }

      return true;
    });
  }, [allTemplates, activeCategory, searchQuery]);

  const displayedTemplates = useMemo(() => {
    return filteredTemplates.slice(0, loadMoreCount);
  }, [filteredTemplates, loadMoreCount]);

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
      {showTabsHeader && (
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
      )}

      <div className={`scrollbar-thin flex-1 overflow-y-auto p-4 ${isLocked ? "pointer-events-none opacity-50 select-none" : ""}`}>
        {tab === "style" && (
          <div className="space-y-5">
            {/* Primary Settings */}
            <div className="space-y-4 pb-5 border-b border-[#f0ede8]">
              <div className="text-[13px] font-semibold text-[#1a1a1a]">Caption Settings</div>
              
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 text-[12.5px] font-medium text-[#555]">
                  <span className="text-base">😊</span>
                  <span>Add Emojis to Captions</span>
                </div>
                <div className="flex rounded-[7px] bg-[#f5f3ee] p-0.5 border border-[#e8e4de]">
                  <button
                    type="button"
                    onClick={() => set("emojiEnabled", true)}
                    className={`px-3.5 py-1.5 text-[12px] font-semibold rounded-[5px] transition-all cursor-pointer ${
                      style.emojiEnabled
                        ? "bg-[#ff5c3a] text-white shadow-sm"
                        : "text-[#888] hover:text-[#555] bg-transparent"
                    }`}
                  >
                    On
                  </button>
                  <button
                    type="button"
                    onClick={() => set("emojiEnabled", false)}
                    className={`px-3.5 py-1.5 text-[12px] font-semibold rounded-[5px] transition-all cursor-pointer ${
                      !style.emojiEnabled
                        ? "bg-white text-[#1a1a1a] border border-[#e8e4de]/60 shadow-sm"
                        : "text-[#888] hover:text-[#555] bg-transparent"
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
                    className="w-full cursor-pointer rounded-[7px] border border-[#e8e4de] bg-white px-3 py-2 text-[13px] text-[#1a1a1a] outline-none transition hover:border-[#ccc] focus:border-[#ff5c3a] min-h-[44px]"
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
                className="w-full cursor-pointer rounded-[7px] border border-[#e8e4de] bg-white px-3 py-2 text-[13px] text-[#1a1a1a] outline-none transition hover:border-[#ccc] focus:border-[#ff5c3a] min-h-[44px]"
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

            {/* Paired Sliders in 2-Column Grid */}
            <div className="grid grid-cols-2 gap-4">
              <SliderRow label="Size" value={style.fontSize} min={20} max={140} step={2}
                onChange={(v) => set("fontSize", v)} suffix="px" />
              <SliderRow label="Weight" value={style.fontWeight} min={300} max={900} step={100}
                onChange={(v) => set("fontWeight", v)} />
            </div>

            {/* Color Swatches in 2-Column Grid */}
            <div className="grid grid-cols-2 gap-4">
              <ColorField label="Text" value={style.color} onChange={(v) => set("color", v)} />
              <ColorField label="Background" value={style.bgColor} onChange={(v) => set("bgColor", v)} />
            </div>

            <SliderRow label="Box width" value={style.boxWidth ?? 84} min={10} max={100} step={1}
              onChange={(v) => set("boxWidth", v)} suffix="%" />
            <div className="space-y-5 pt-3 border-t border-[#f0ede8]">
              <SliderRow label="BG opacity" value={Math.round(style.bgOpacity * 100)} min={0} max={100} step={5}
                onChange={(v) => set("bgOpacity", v / 100)} suffix="%" />

              <SliderRow label="Box height" value={style.boxHeight ?? 0} min={0} max={100} step={1}
                onChange={(v) => set("boxHeight", v === 0 ? undefined as unknown as number : v)} suffix="%" />

              <div className="grid grid-cols-2 gap-4">
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
                                style: { position: "free" }
                              });
                            }
                          }
                        }}
                        className={`flex flex-col items-center justify-center gap-1 rounded-[7px] border px-1 py-2 text-[10.5px] transition min-h-[44px] cursor-pointer ${
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
                  <div className="space-y-3 mt-3 border-t border-[#f0ede8] pt-3">
                    <p className="text-[11px] text-[#aaa]">
                      Drag the caption on the video preview to position it, or use the controls below:
                    </p>
                    {selectedCaption && (
                      <div className="space-y-4">
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
          <div className="space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-semibold text-[#1a1a1a]">Caption Templates</div>
                <button
                  onClick={() => setImportOpen(true)}
                  className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#e8e4de] bg-white px-2.5 text-[11.5px] font-semibold text-zinc-600 hover:text-[#ff5c3a] hover:border-[#ff5c3a]/50 transition-all cursor-pointer shadow-sm"
                >
                  <Upload className="h-3.5 w-3.5" strokeWidth={2} />
                  Import
                </button>
              </div>

              <div className="relative w-full">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8.5 rounded-lg border border-[#e8e4de] bg-[#f5f3ee]/40 pl-8.5 pr-3 text-[12px] text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-[#ff5c3a] focus:ring-0 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const active = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat);
                        setLoadMoreCount(8);
                      }}
                      className={`flex-shrink-0 px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                        active
                          ? "bg-[#ff5c3a] text-white shadow-sm"
                          : "bg-[#f5f3ee] text-zinc-500 hover:text-zinc-800 hover:bg-[#ebd2cc]/10"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              {displayedTemplates.map((t) => {
                const active = isTemplateActive(t);
                const isFav = favorites.includes(t.id);
                const isCustom = t.id.startsWith("custom-");

                return (
                  <div
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className={`flex h-[88px] rounded-xl overflow-hidden bg-white border transition-all cursor-pointer relative ${
                      active
                        ? "border-[#ff5c3a] ring-1 ring-[#ff5c3a]/30 shadow-[0_2px_12px_rgba(255,92,58,0.06)]"
                        : "border-[#e8e4de] hover:border-zinc-300 hover:bg-neutral-50/40"
                    }`}
                  >
                    <div className="w-[110px] h-full border-r border-[#e8e4de] flex-shrink-0 overflow-hidden bg-black">
                      <TemplateCardPreview template={t} />
                    </div>

                    <div className="flex-1 p-2 flex flex-col justify-between min-w-0">
                      <div className="space-y-0.5">
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="font-semibold text-[12px] text-zinc-800 truncate">{t.name}</span>
                            {t.badge && (
                              <span className={`px-1 rounded text-[8px] font-black tracking-wide uppercase select-none ${
                                t.badge === "New" 
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/10" 
                                  : "bg-purple-500/10 text-purple-600 border border-purple-500/10"
                              }`}>
                                {t.badge}
                              </span>
                            )}
                          </div>

                          {isCustom ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCustomTemplate(t.id);
                              }}
                              className="text-zinc-400 hover:text-red-500 p-0.5"
                              title="Delete template"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => toggleFavorite(t.id, e)}
                              className="text-zinc-400 hover:text-amber-500 transition-colors p-0.5"
                              title={isFav ? "Remove from favorites" : "Favorite template"}
                            >
                              <Star className={`h-3.5 w-3.5 ${isFav ? "fill-amber-500 text-amber-500" : ""}`} />
                            </button>
                          )}
                        </div>

                        <p className="text-[10px] text-zinc-400 line-clamp-2 leading-tight">
                          {t.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 overflow-hidden mt-0.5">
                        {t.tags?.map((tag) => (
                          <span 
                            key={tag} 
                            className="px-1 py-0.5 rounded bg-zinc-100 text-zinc-500 text-[8px] font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {active && (
                      <div className="absolute top-1.5 left-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#ff5c3a] text-white border border-white shadow-sm">
                        <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredTemplates.length > loadMoreCount && (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => setLoadMoreCount((prev) => prev + 6)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#e8e4de] bg-[#f5f3ee]/40 px-3.5 text-[11.5px] font-semibold text-zinc-500 hover:text-zinc-800 hover:border-zinc-300 hover:bg-neutral-50 transition-all cursor-pointer"
                >
                  Load More Templates
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            )}

            {filteredTemplates.length === 0 && (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <span className="font-semibold text-zinc-400 text-[12px]">No templates found</span>
                <span className="text-[10.5px] text-zinc-500 mt-0.5">Try searching for something else.</span>
              </div>
            )}

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
    <div
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between px-3.5 py-3 cursor-pointer select-none min-h-[44px] ${last ? "" : "border-b border-[#f0ede8]"}`}
    >
      <span className="flex items-center gap-2.5 text-[12.5px] font-medium text-[#555]">
        <span className="flex h-5 min-w-[20px] items-center justify-center text-[11.5px] font-semibold text-[#888]">
          {icon}
        </span>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
        className={`relative h-5.5 w-10 flex-shrink-0 rounded-full transition cursor-pointer ${
          checked ? "bg-[#ff5c3a]" : "bg-[#e8e4de]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-all ${
            checked ? "left-[20px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
