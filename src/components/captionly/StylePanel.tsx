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

// ---- Template data -------------------------------------------------
// Each template: brand name, category, badge, and a caption "treatment"
// that stands in for the animated style (color pop, box highlight, glow, etc.)

const TEMPLATES = [
  { id: "horizon",  name: "Horizon",  category: "Cinematic", badge: "POPULAR", text: "the sun sets on", highlight: "ordinary", treatment: "gradient", accent: "#f5a623" },
  { id: "aurora",   name: "Aurora",   category: "Cinematic", badge: "NEW",     text: "some things", highlight: "glow", treatment: "glow", accent: "#8ec9ff" },
  { id: "phantom",  name: "Phantom",  category: "Cinematic", badge: null,      text: "you'll feel it before", highlight: "you see it", treatment: "dim", accent: "#e5e5e5" },
  { id: "vortex",   name: "Vortex",   category: "Cinematic", badge: null,      text: "pulled in,", highlight: "not scrolled past", treatment: "outline", accent: "#ffffff" },
  { id: "zenith",   name: "Zenith",   category: "Cinematic", badge: null,      text: "the top,", highlight: "and staying there", treatment: "stacked", accent: "#ffd166" },

  { id: "motion",   name: "Motion",   category: "Phrase", badge: "POPULAR", text: "some days you plan", highlight: "the move", treatment: "color", accent: "#ff5a3c" },
  { id: "pulse",    name: "Pulse",    category: "Phrase", badge: null,      text: "this is happening", highlight: "right now", treatment: "box", accent: "#ff3b3b" },
  { id: "echo",     name: "Echo",     category: "Phrase", badge: null,      text: "say it once,", highlight: "let it land", treatment: "dim", accent: "#e5e5e5" },
  { id: "fusion",   name: "Fusion",   category: "Phrase", badge: "NEW",     text: "two ideas,", highlight: "one thing worth saying", treatment: "gradient", accent: "#c084fc" },
  { id: "momentum", name: "Momentum", category: "Phrase", badge: null,      text: "it's not luck,", highlight: "it's momentum", treatment: "color", accent: "#4ade80" },

  { id: "ember",    name: "Ember",    category: "Karaoke", badge: "POPULAR", text: "not every fire needs", highlight: "to roar", treatment: "karaoke", accent: "#ff7a45" },
  { id: "ignite",   name: "Ignite",   category: "Karaoke", badge: "NEW",     text: "stop waiting for", highlight: "the spark", treatment: "karaoke", accent: "#ffb703" },
  { id: "vertex",   name: "Vertex",   category: "Karaoke", badge: null,      text: "every line leads", highlight: "somewhere", treatment: "mono", accent: "#38bdf8" },
  { id: "spectra",  name: "Spectra",  category: "Karaoke", badge: null,      text: "one idea,", highlight: "every angle", treatment: "gradient", accent: "#f472b6" },

  { id: "elevate",  name: "Elevate",  category: "Build", badge: "POPULAR", text: "good enough was", highlight: "never the goal", treatment: "box", accent: "#22d3ee" },
  { id: "flux",     name: "Flux",     category: "Build", badge: null,      text: "we're made of", highlight: "change", treatment: "dim", accent: "#e5e5e5" },
  { id: "orbit",    name: "Orbit",    category: "Build", badge: null,      text: "everything moves", highlight: "around what matters", treatment: "outline", accent: "#ffffff" },
  { id: "catalyst", name: "Catalyst", category: "Build", badge: "NEW",     text: "this is the thing that", highlight: "changes the thing", treatment: "color", accent: "#facc15" },

  { id: "prime",    name: "Prime",    category: "Boxed", badge: "POPULAR", text: "not one of", highlight: "the options", treatment: "box", accent: "#ffffff" },
  { id: "halo",     name: "Halo",     category: "Boxed", badge: null,      text: "some things just", highlight: "look right", treatment: "box", accent: "#fde68a" },
  { id: "impact",   name: "Impact",   category: "Boxed", badge: null,      text: "said in one line,", highlight: "felt for a while", treatment: "box", accent: "#ff3b3b" },

  { id: "luxe",     name: "Luxe",     category: "Editorial", badge: "POPULAR", text: "this isn't extra,", highlight: "this is standard", treatment: "serif", accent: "#f5e6c8" },
  { id: "neon",     name: "Neon",     category: "Editorial", badge: "NEW",     text: "subtle was never", highlight: "the assignment", treatment: "box", accent: "#39ff14" },
  { id: "atlas",    name: "Atlas",    category: "Editorial", badge: null,      text: "built to", highlight: "hold weight", treatment: "mono", accent: "#93c5fd" },

  { id: "origin",   name: "Origin",   category: "Aesthetic", badge: null,      text: "every big thing", highlight: "starts small", treatment: "dim", accent: "#e5e5e5" },
  { id: "nova",     name: "Nova",     category: "Aesthetic", badge: "NEW",     text: "blink and", highlight: "you missed it", treatment: "glow", accent: "#fbbf24" },
  { id: "titan",    name: "Titan",    category: "Aesthetic", badge: "POPULAR", text: "big enough", highlight: "to notice", treatment: "color", accent: "#ffffff" },
  { id: "velocity", name: "Velocity", category: "Aesthetic", badge: null,      text: "three steps", highlight: "ahead already", treatment: "outline", accent: "#ffffff" },

  { id: "apex",     name: "Apex",     category: "One word", badge: "POPULAR", text: "", highlight: "APEX", treatment: "oneword", accent: "#ff5a3c" },
  { id: "focus",    name: "Focus",    category: "One word", badge: null,      text: "", highlight: "FOCUS", treatment: "oneword", accent: "#4ade80" },
];

const CATEGORY_ORDER = ["Cinematic", "Phrase", "Karaoke", "Build", "Boxed", "Editorial", "Aesthetic", "One word"];

function buildCategories() {
  const counts: Record<string, number> = {};
  TEMPLATES.forEach((t) => {
    counts[t.category] = (counts[t.category] || 0) + 1;
  });
  return [
    { name: "All", count: TEMPLATES.length },
    ...CATEGORY_ORDER.map((name) => ({ name, count: counts[name] || 0 })),
  ];
}

const mapTemplateToStyle = (t: typeof TEMPLATES[number]): Partial<CaptionStyle> => {
  const base = {
    color: "#FFFFFF",
    bgOpacity: 0,
    strokeWidth: 0,
    uppercase: false,
    karaoke: false,
    animation: "fade" as const,
    fontWeight: 700,
  };

  switch (t.treatment) {
    case "oneword":
      return {
        ...base,
        fontFamily: "Anton",
        fontSize: 72,
        color: t.accent,
        uppercase: true,
        animation: "bounce" as const,
      };
      
    case "box":
      return {
        ...base,
        fontFamily: "Montserrat",
        fontSize: 54,
        bgColor: t.accent,
        bgOpacity: 0.85,
        color: "#0a0a0a",
        uppercase: true,
        animation: "pop" as const,
      };
      
    case "color":
      return {
        ...base,
        fontFamily: "Inter",
        fontSize: 56,
        highlightColor: t.accent,
        karaoke: true,
        animation: "pop" as const,
      };
      
    case "glow":
      return {
        ...base,
        fontFamily: "Russo One",
        fontSize: 58,
        color: "#FFFFFF",
        strokeWidth: 2.5,
        strokeColor: t.accent,
        animation: "glitch" as const,
      };
      
    case "outline":
      return {
        ...base,
        fontFamily: "Bebas Neue",
        fontSize: 68,
        color: "transparent",
        strokeWidth: 2,
        strokeColor: t.accent,
        uppercase: true,
        animation: "scale" as const,
      };
      
    case "gradient":
      return {
        ...base,
        fontFamily: "Poppins",
        fontSize: 58,
        highlightColor: t.accent,
        karaoke: true,
        animation: "scale" as const,
      };
      
    case "karaoke":
      return {
        ...base,
        fontFamily: "Montserrat",
        fontSize: 54,
        highlightColor: t.accent,
        karaoke: true,
        animation: "pop" as const,
      };
      
    case "mono":
      return {
        ...base,
        fontFamily: "Space Mono",
        fontSize: 48,
        highlightColor: t.accent,
        karaoke: true,
        animation: "typewriter" as const,
      };
      
    case "serif":
      return {
        ...base,
        fontFamily: "Playfair Display",
        fontSize: 50,
        color: t.accent,
        animation: "fade" as const,
      };
      
    case "stacked":
      return {
        ...base,
        fontFamily: "Archivo Black",
        fontSize: 52,
        highlightColor: t.accent,
        uppercase: true,
        animation: "slide-up" as const,
      };
      
    case "dim":
    default:
      return {
        ...base,
        fontFamily: "Inter",
        fontSize: 50,
        color: "#FFFFFF",
        animation: "fade" as const,
      };
  }
};

function CaptionPreview({ t }: { t: typeof TEMPLATES[number] }) {
  const textWords = useMemo(() => t.text ? t.text.split(" ") : [], [t.text]);
  const highlightWords = useMemo(() => t.highlight ? t.highlight.split(" ") : [], [t.highlight]);
  const words = useMemo(() => [...textWords, ...highlightWords], [textWords, highlightWords]);
  
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (words.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % words.length);
    }, 600);
    return () => clearInterval(interval);
  }, [words]);

  const base = "font-black leading-tight tracking-tight flex flex-wrap justify-center gap-x-1.5 gap-y-1 select-none text-center px-2";

  if (t.treatment === "oneword") {
    return (
      <div 
        className="font-black text-3xl select-none"
        style={{ 
          color: t.accent,
          animation: "pulseScale 1.2s infinite ease-in-out"
        }}
      >
        {t.highlight}
      </div>
    );
  }

  return (
    <div className={base}>
      {words.map((word, idx) => {
        const isHighlightWord = idx >= textWords.length;
        const isActive = idx === activeIdx;

        let style: React.CSSProperties = {
          transition: "all 0.25s ease-in-out",
        };

        let className = "inline-block";

        if (t.treatment === "karaoke") {
          if (isActive) {
            style.color = t.accent;
            style.transform = "scale(1.15)";
          } else {
            style.color = "rgba(255,255,255,0.3)";
          }
        } else if (t.treatment === "box") {
          if (isHighlightWord) {
            style.backgroundColor = t.accent;
            style.color = "#0a0a0a";
            className += " px-1.5 py-0.5 rounded";
            if (isActive) {
              style.transform = "scale(1.1)";
            }
          } else {
            style.color = isActive ? "#FFFFFF" : "rgba(255,255,255,0.6)";
            if (isActive) {
              style.transform = "scale(1.08)";
            }
          }
        } else if (t.treatment === "color") {
          if (isHighlightWord) {
            style.color = t.accent;
            if (isActive) {
              style.transform = "scale(1.15)";
            }
          } else {
            style.color = isActive ? "#FFFFFF" : "rgba(255,255,255,0.6)";
            if (isActive) {
              style.transform = "scale(1.08)";
            }
          }
        } else if (t.treatment === "glow") {
          if (isHighlightWord) {
            style.color = t.accent;
            style.animation = `glowPulse 1.5s infinite ease-in-out`;
            // @ts-ignore
            style["--glow-color"] = t.accent;
            if (isActive) {
              style.transform = "scale(1.1)";
            }
          } else {
            style.color = isActive ? "#FFFFFF" : "rgba(255,255,255,0.6)";
            if (isActive) {
              style.transform = "scale(1.08)";
            }
          }
        } else if (t.treatment === "outline") {
          if (isHighlightWord) {
            style.color = "transparent";
            style.WebkitTextStroke = `1px ${t.accent}`;
            if (isActive) {
              style.transform = "scale(1.1)";
            }
          } else {
            style.color = isActive ? "#FFFFFF" : "rgba(255,255,255,0.6)";
            if (isActive) {
              style.transform = "scale(1.08)";
            }
          }
        } else if (t.treatment === "gradient") {
          if (isHighlightWord) {
            className += " bg-clip-text text-transparent bg-gradient-to-r";
            style.backgroundImage = `linear-gradient(90deg, ${t.accent}, #ffffff)`;
            if (isActive) {
              style.transform = "scale(1.1)";
            }
          } else {
            style.color = isActive ? "#FFFFFF" : "rgba(255,255,255,0.6)";
            if (isActive) {
              style.transform = "scale(1.08)";
            }
          }
        } else if (t.treatment === "mono") {
          className += " font-mono font-bold tracking-wide";
          if (isHighlightWord) {
            style.color = t.accent;
            if (isActive) {
              style.transform = "scale(1.1)";
            }
          } else {
            style.color = isActive ? "#FFFFFF" : "rgba(255,255,255,0.5)";
          }
        } else if (t.treatment === "serif") {
          className += " italic font-serif";
          if (isHighlightWord) {
            style.color = t.accent;
            if (isActive) {
              style.transform = "scale(1.1)";
            }
          } else {
            style.color = isActive ? "#FFFFFF" : "rgba(255,255,255,0.6)";
          }
        } else if (t.treatment === "stacked") {
          if (isHighlightWord) {
            style.color = t.accent;
            className += " block w-full mt-0.5";
            if (isActive) {
              style.transform = "scale(1.08)";
            }
          } else {
            style.color = isActive ? "#FFFFFF" : "rgba(255,255,255,0.6)";
          }
        } else {
          if (isHighlightWord) {
            style.color = "#FFFFFF";
          } else {
            style.color = isActive ? "#FFFFFF" : "rgba(255,255,255,0.4)";
          }
        }

        return (
          <span key={idx} className={className} style={style}>
            {word}
          </span>
        );
      })}
    </div>
  );
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

  const [activeCategory, setActiveCategory] = useState("All");
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

  const isTemplateActive = (t: typeof TEMPLATES[number]) => {
    const mapped = mapTemplateToStyle(t);
    return Object.entries(mapped).every(([key, value]) => {
      return style[key as keyof CaptionStyle] === value;
    });
  };

  const filteredTemplates = useMemo(() => {
    let result = TEMPLATES;
    if (activeCategory !== "All") {
      result = result.filter((item) => item.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => 
        item.name.toLowerCase().includes(query) || 
        item.text.toLowerCase().includes(query) || 
        item.highlight.toLowerCase().includes(query)
      );
    }
    return result;
  }, [activeCategory, searchQuery]);

  const displayedTemplates = useMemo(() => {
    return filteredTemplates.slice(0, loadMoreCount);
  }, [filteredTemplates, loadMoreCount]);

  const applyTemplate = (t: typeof TEMPLATES[number]) => {
    const mapped = mapTemplateToStyle(t);
    onChange({ ...style, ...mapped });
    if (mapped.fontFamily) loadGoogleFont(mapped.fontFamily);
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
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulseScale {
          0%, 100% { transform: scale(0.95); opacity: 0.9; }
          50% { transform: scale(1.12); opacity: 1; }
        }
        @keyframes glowPulse {
          0%, 100% { text-shadow: 0 0 4px var(--glow-color), 0 0 10px var(--glow-color); }
          50% { text-shadow: 0 0 12px var(--glow-color), 0 0 25px var(--glow-color); }
        }
      `}} />
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
            {/* Header + Search Bar */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-[#ff5c3a]" />
                <h2 className="text-[#1a1a1a] font-semibold text-[13px]">Caption templates</h2>
              </div>

              {/* Filter tabs */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                {buildCategories().map((c) => {
                  const active = activeCategory === c.name;
                  return (
                    <button
                      key={c.name}
                      onClick={() => {
                        setActiveCategory(c.name);
                        setLoadMoreCount(8);
                      }}
                      type="button"
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                        active
                          ? "bg-[#ff5c3a] text-white border-[#ff5c3a] shadow-sm"
                          : "bg-white text-zinc-600 border-[#e8e4de] hover:border-zinc-300 hover:text-zinc-800"
                      }`}
                    >
                      {c.name}
                      <span
                        className={`text-[9px] ${
                          active ? "text-white/80" : "text-zinc-400"
                        }`}
                      >
                        {c.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
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
            </div>

            {/* Grid list of TemplateCard */}
            <div className="grid grid-cols-1 gap-3">
              {displayedTemplates.map((t) => {
                const active = isTemplateActive(t);
                const isFav = favorites.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className={`group relative flex flex-col rounded-xl border overflow-hidden text-left transition-all ${
                      active
                        ? "border-[#ff5c3a] ring-1 ring-[#ff5c3a]/30 shadow-[0_2px_12px_rgba(255,92,58,0.06)]"
                        : "border-[#e8e4de] bg-white hover:border-zinc-300 hover:bg-neutral-50/20"
                    }`}
                    type="button"
                  >
                    {/* Card Preview Container */}
                    <div className="h-24 w-full flex items-center justify-center px-4 bg-[#0c0c0c] relative">
                      <CaptionPreview t={t} />
                      
                      {/* Checked Badge Overlay */}
                      {active && (
                        <div className="absolute top-2 left-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#ff5c3a] text-white border border-white shadow-sm">
                          <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                        </div>
                      )}
                      
                      {/* Favorite Star Button */}
                      <button
                        onClick={(e) => toggleFavorite(t.id, e)}
                        className="absolute top-2 right-2 text-zinc-500 hover:text-amber-500 transition-colors p-0.5 bg-black/40 hover:bg-black/60 rounded-full"
                        title={isFav ? "Remove from favorites" : "Favorite template"}
                      >
                        <Star className={`h-3.5 w-3.5 ${isFav ? "fill-amber-500 text-amber-500" : "text-white/70"}`} />
                      </button>
                    </div>
                    
                    {/* Details Bar */}
                    <div className="flex items-center justify-between px-3 py-2 border-t border-[#e8e4de] bg-white w-full">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[12px] font-semibold text-zinc-800 truncate">{t.name}</span>
                        {t.badge && (
                          <span
                            className={`text-[8px] font-bold tracking-wide px-1 py-0.5 rounded select-none ${
                              t.badge === "POPULAR"
                                ? "bg-orange-500/10 text-orange-600 border border-orange-500/10"
                                : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/10"
                            }`}
                          >
                            {t.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[9.5px] text-zinc-400 flex-shrink-0">{t.category}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Load More Templates */}
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

            {/* Empty State */}
            {filteredTemplates.length === 0 && (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <span className="font-semibold text-zinc-400 text-[12px]">No templates found</span>
                <span className="text-[10.5px] text-zinc-500 mt-0.5">Try changing filters or search terms.</span>
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
