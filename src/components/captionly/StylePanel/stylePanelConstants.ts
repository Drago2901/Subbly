import { type CaptionStyle } from "@/lib/captions/types";

export type Preset = { id: string; name: string; style: CaptionStyle };
export type Tab = "style" | "anim" | "tmpl" | "brand";

export function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const TEMPLATES = [
  { id: "horizon", name: "Horizon", category: "Cinematic", badge: "POPULAR", text: "the sun sets on", highlight: "ordinary", treatment: "gradient", accent: "#f5a623" },
  { id: "aurora", name: "Aurora", category: "Cinematic", badge: "NEW", text: "some things", highlight: "glow", treatment: "glow", accent: "#8ec9ff" },
  { id: "phantom", name: "Phantom", category: "Cinematic", badge: null, text: "you'll feel it before", highlight: "you see it", treatment: "dim", accent: "#e5e5e5" },
  { id: "vortex", name: "Vortex", category: "Cinematic", badge: null, text: "pulled in,", highlight: "not scrolled past", treatment: "outline", accent: "#ffffff" },
  { id: "zenith", name: "Zenith", category: "Cinematic", badge: null, text: "the top,", highlight: "and staying there", treatment: "stacked", accent: "#ffd166" },
  { id: "cinematic_gold", name: "Cinematic Gold", category: "Cinematic", badge: "NEW", text: "GREETINGS FROM\n", highlight: "CINEMATIC\nMAKE IT SIMPLE, BUT SIGNIFICANT.", treatment: "cinematic_gold", accent: "#fbbf24" },

  { id: "motion", name: "Motion", category: "Phrase", badge: "POPULAR", text: "some days you plan", highlight: "the move", treatment: "color", accent: "#ff5a3c" },
  { id: "pulse", name: "Pulse", category: "Phrase", badge: null, text: "this is happening", highlight: "right now", treatment: "box", accent: "#ff3b3b" },
  { id: "echo", name: "Echo", category: "Phrase", badge: null, text: "say it once,", highlight: "let it land", treatment: "dim", accent: "#e5e5e5" },
  { id: "fusion", name: "Fusion", category: "Phrase", badge: "NEW", text: "two ideas,", highlight: "one thing worth saying", treatment: "gradient", accent: "#c084fc" },
  { id: "momentum", name: "Momentum", category: "Phrase", badge: null, text: "it's not luck,", highlight: "it's momentum", treatment: "color", accent: "#4ade80" },

  { id: "ember", name: "Ember", category: "Karaoke", badge: "POPULAR", text: "not every fire needs", highlight: "to roar", treatment: "karaoke", accent: "#ff7a45" },
  { id: "ignite", name: "Ignite", category: "Karaoke", badge: "NEW", text: "stop waiting for", highlight: "the spark", treatment: "karaoke", accent: "#ffb703" },
  { id: "vertex", name: "Vertex", category: "Karaoke", badge: null, text: "every line leads", highlight: "somewhere", treatment: "mono", accent: "#38bdf8" },
  { id: "spectra", name: "Spectra", category: "Karaoke", badge: null, text: "one idea,", highlight: "every angle", treatment: "gradient", accent: "#f472b6" },

  { id: "elevate", name: "Elevate", category: "Build", badge: "POPULAR", text: "good enough was", highlight: "never the goal", treatment: "box", accent: "#22d3ee" },
  { id: "flux", name: "Flux", category: "Build", badge: null, text: "we're made of", highlight: "change", treatment: "dim", accent: "#e5e5e5" },
  { id: "orbit", name: "Orbit", category: "Build", badge: null, text: "everything moves", highlight: "around what matters", treatment: "outline", accent: "#ffffff" },
  { id: "catalyst", name: "Catalyst", category: "Build", badge: "NEW", text: "this is the thing that", highlight: "changes the thing", treatment: "color", accent: "#facc15" },

  { id: "prime", name: "Prime", category: "Boxed", badge: "POPULAR", text: "not one of", highlight: "the options", treatment: "box", accent: "#ffffff" },
  { id: "halo", name: "Halo", category: "Boxed", badge: null, text: "some things just", highlight: "look right", treatment: "box", accent: "#fde68a" },
  { id: "impact", name: "Impact", category: "Boxed", badge: null, text: "said in one line,", highlight: "felt for a while", treatment: "box", accent: "#ff3b3b" },

  { id: "luxe", name: "Luxe", category: "Editorial", badge: "POPULAR", text: "this isn't extra,", highlight: "this is standard", treatment: "serif", accent: "#f5e6c8" },
  { id: "neon", name: "Neon", category: "Editorial", badge: "NEW", text: "subtle was never", highlight: "the assignment", treatment: "box", accent: "#39ff14" },
  { id: "atlas", name: "Atlas", category: "Editorial", badge: null, text: "built to", highlight: "hold weight", treatment: "mono", accent: "#93c5fd" },

  { id: "origin", name: "Origin", category: "Aesthetic", badge: null, text: "every big thing", highlight: "starts small", treatment: "dim", accent: "#e5e5e5" },
  { id: "nova", name: "Nova", category: "Aesthetic", badge: "NEW", text: "blink and", highlight: "you missed it", treatment: "glow", accent: "#fbbf24" },
  { id: "titan", name: "Titan", category: "Aesthetic", badge: "POPULAR", text: "big enough", highlight: "to notice", treatment: "color", accent: "#ffffff" },
  { id: "velocity", name: "Velocity", category: "Aesthetic", badge: null, text: "three steps", highlight: "ahead already", treatment: "outline", accent: "#ffffff" },

  { id: "apex", name: "Apex", category: "One word", badge: "POPULAR", text: "", highlight: "APEX", treatment: "oneword", accent: "#ff5a3c" },
  { id: "focus", name: "Focus", category: "One word", badge: null, text: "", highlight: "FOCUS", treatment: "oneword", accent: "#4ade80" },
  { id: "amber_glow", name: "Amber Glow", category: "Cinematic", badge: "NEW", text: "words are", highlight: "glowing", treatment: "amber_glow", accent: "#fbbf24" },
  { id: "tiktok_style", name: "TikTok Style", category: "Phrase", badge: "POPULAR", text: "post with", highlight: "impact", treatment: "tiktok_style", accent: "#FFFFFF" },
  { id: "neon_glow", name: "Neon Glow", category: "Cinematic", badge: "NEW", text: "bright and", highlight: "electric", treatment: "neon_glow", accent: "#ff5c3a" },
  { id: "classic_srt", name: "Classic SRT", category: "Editorial", badge: null, text: "standard readable", highlight: "subtitles", treatment: "classic_srt", accent: "#FFFFFF" },
];

export const CATEGORY_ORDER = ["Cinematic", "Phrase", "Karaoke", "Build", "Boxed", "Editorial", "Aesthetic", "One word"];

export interface AnimPreset {
  id: string;
  title: string;
  description: string;
  category: "Social Media" | "Cinematic" | "Handwritten" | "Creative Effects";
  iconText: string;
  badge?: "NEW" | "POPULAR" | "TRENDING" | "PRO";
  isPro?: boolean;
  filterTags: string[];
  apply: (style: CaptionStyle) => CaptionStyle;
  isActive: (style: CaptionStyle) => boolean;
}

export const ANIM_STYLES: AnimPreset[] = [
  // ✨ Core & Social Media
  {
    id: "none",
    title: "None",
    description: "Static text, no animation",
    category: "Cinematic",
    iconText: "Aa",
    filterTags: ["popular"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "none" as const, karaoke: false }),
    isActive: (style: CaptionStyle) => style.animation === "none" && !style.karaoke,
  },
  {
    id: "karaoke",
    title: "Karaoke",
    description: "Highlight words as they are spoken",
    category: "Social Media",
    iconText: "Aa",
    badge: "POPULAR",
    filterTags: ["popular", "trending"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "pop" as const, karaoke: true }),
    isActive: (style: CaptionStyle) => style.karaoke === true,
  },
  {
    id: "pop",
    title: "Pop",
    description: "Words pop in with scale effect",
    category: "Social Media",
    iconText: "Aa!",
    filterTags: ["popular"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "pop" as const, karaoke: false }),
    isActive: (style: CaptionStyle) => style.animation === "pop" && !style.karaoke,
  },
  {
    id: "typewriter",
    title: "Typewriter",
    description: "Characters appear one at a time",
    category: "Handwritten",
    iconText: "Aa|",
    filterTags: ["popular"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "typewriter" as const, karaoke: false }),
    isActive: (style: CaptionStyle) => style.animation === "typewriter" && !style.karaoke,
  },
  {
    id: "fade",
    title: "Fade",
    description: "Smooth fade in and out",
    category: "Cinematic",
    iconText: "Aa~",
    filterTags: ["popular"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "fade" as const, karaoke: false }),
    isActive: (style: CaptionStyle) => style.animation === "fade" && !style.karaoke,
  },
  {
    id: "tiktok",
    title: "TikTok",
    description: "Pop + bounce animation inspired by short-form videos",
    category: "Social Media",
    iconText: "📱",
    badge: "POPULAR",
    filterTags: ["popular", "trending"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "pop" as const, karaoke: true, bold: true, uppercase: true }),
    isActive: (style: CaptionStyle) => style.animation === "pop" && style.karaoke && style.bold && style.uppercase,
  },
  {
    id: "instagram",
    title: "Instagram",
    description: "Clean fade with smooth motion",
    category: "Social Media",
    iconText: "📸",
    badge: "TRENDING",
    filterTags: ["trending"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "fade" as const, karaoke: false, uppercase: false }),
    isActive: (style: CaptionStyle) => style.animation === "fade" && !style.karaoke && !style.uppercase,
  },
  {
    id: "youtube",
    title: "YouTube Shorts",
    description: "High-contrast bold pop animation",
    category: "Social Media",
    iconText: "▶️",
    badge: "POPULAR",
    filterTags: ["popular"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "pop" as const, fontWeight: 900, bold: true, uppercase: true }),
    isActive: (style: CaptionStyle) => style.animation === "pop" && style.fontWeight === 900,
  },
  {
    id: "reels",
    title: "Reels Dynamic",
    description: "Subtle zoom with vibrant active words",
    category: "Social Media",
    iconText: "🎬",
    badge: "TRENDING",
    filterTags: ["trending"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "zoom-in" as const, karaoke: true, activeWordScale: 1.2 }),
    isActive: (style: CaptionStyle) => style.animation === "zoom-in" && style.karaoke && style.activeWordScale === 1.2,
  },
  {
    id: "podcast",
    title: "Podcast Talk",
    description: "Gentle line reveals for long-form dialogue",
    category: "Social Media",
    iconText: "🎙️",
    filterTags: [],
    apply: (style: CaptionStyle) => ({ ...style, animation: "fade" as const, fontWeight: 600, fontSize: 44 }),
    isActive: (style: CaptionStyle) => style.animation === "fade" && style.fontWeight === 600 && style.fontSize === 44,
  },

  // 🎬 Cinematic & Film
  {
    id: "documentary",
    title: "Documentary",
    description: "Classic subdued cinematic typography",
    category: "Cinematic",
    iconText: "📽️",
    filterTags: ["popular"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "fade" as const, fontFamily: "Playfair Display", fontSize: 42, color: "#e5e7eb" }),
    isActive: (style: CaptionStyle) => style.fontFamily === "Playfair Display" && style.animation === "fade",
  },
  {
    id: "movie_trailer",
    title: "Trailer Hit",
    description: "Punchy zoom-out impact for dramatic moments",
    category: "Cinematic",
    iconText: "🍿",
    badge: "TRENDING",
    filterTags: ["trending"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "zoom-out" as const, uppercase: true, fontWeight: 800 }),
    isActive: (style: CaptionStyle) => style.animation === "zoom-out" && style.uppercase,
  },
  {
    id: "film_noir",
    title: "Film Noir",
    description: "High-contrast monochrome with elegant pacing",
    category: "Cinematic",
    iconText: "🎞️",
    filterTags: [],
    apply: (style: CaptionStyle) => ({ ...style, animation: "fade" as const, color: "#ffffff", strokeWidth: 1, strokeColor: "#000000" }),
    isActive: (style: CaptionStyle) => style.animation === "fade" && style.strokeWidth === 1,
  },
  {
    id: "hollywood",
    title: "Hollywood",
    description: "Gold shimmer with cinematic letter-spacing",
    category: "Cinematic",
    iconText: "⭐",
    badge: "PRO",
    isPro: true,
    filterTags: ["pro"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "fade" as const, color: "#fbbf24", isCinematicStacked: true }),
    isActive: (style: CaptionStyle) => style.isCinematicStacked === true,
  },
  {
    id: "retro_vhs",
    title: "Retro VHS",
    description: "Glitchy retro aesthetic tracking",
    category: "Cinematic",
    iconText: "📼",
    badge: "NEW",
    filterTags: ["new"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "shake" as const, color: "#38bdf8", strokeWidth: 2, strokeColor: "#f43f5e" }),
    isActive: (style: CaptionStyle) => style.animation === "shake" && style.strokeWidth === 2,
  },

  // ✍️ Handwritten & Organic
  {
    id: "cursive",
    title: "Cursive Script",
    description: "Realistic handwriting animation",
    category: "Handwritten",
    iconText: "✍️",
    badge: "TRENDING",
    filterTags: ["trending"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "typewriter" as const, typewriterSpeed: 70 }),
    isActive: (style: CaptionStyle) => style.animation === "typewriter" && style.typewriterSpeed === 70,
  },
  {
    id: "chalk",
    title: "Chalk",
    description: "Chalkboard writing effect",
    category: "Handwritten",
    iconText: "✏️",
    badge: "NEW",
    filterTags: ["new"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "typewriter" as const, color: "#f3f4f6", typewriterSpeed: 120 }),
    isActive: (style: CaptionStyle) => style.animation === "typewriter" && style.color === "#f3f4f6",
  },
  {
    id: "brush_stroke",
    title: "Brush Stroke",
    description: "Paint brush reveal",
    category: "Handwritten",
    iconText: "🖌️",
    isPro: true,
    filterTags: ["pro"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "typewriter" as const, typewriterSpeed: 50 }),
    isActive: (style: CaptionStyle) => style.animation === "typewriter" && style.typewriterSpeed === 50,
  },
  {
    id: "ink_spread",
    title: "Ink Spread",
    description: "Ink spreading animation",
    category: "Handwritten",
    iconText: "✒️",
    isPro: true,
    filterTags: ["pro"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "fade" as const, typewriterSpeed: 80 }),
    isActive: (style: CaptionStyle) => style.animation === "fade" && style.typewriterSpeed === 80,
  },

  // 🔥 Creative Effects
  {
    id: "fire",
    title: "Fire",
    description: "Burning text animation",
    category: "Creative Effects",
    iconText: "🔥",
    badge: "TRENDING",
    isPro: true,
    filterTags: ["trending", "pro"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "wave" as const, color: "#f97316", highlightColor: "#ef4444" }),
    isActive: (style: CaptionStyle) => style.animation === "wave" && style.color === "#f97316",
  },
  {
    id: "ice",
    title: "Ice",
    description: "Frozen text reveal",
    category: "Creative Effects",
    iconText: "❄️",
    badge: "NEW",
    filterTags: ["new"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "fade" as const, color: "#93c5fd", strokeWidth: 1, strokeColor: "#ffffff" }),
    isActive: (style: CaptionStyle) => style.animation === "fade" && style.color === "#93c5fd",
  },
  {
    id: "smoke",
    title: "Smoke",
    description: "Soft smoke fade effect",
    category: "Creative Effects",
    iconText: "💨",
    filterTags: [],
    apply: (style: CaptionStyle) => ({ ...style, animation: "fade" as const, bgOpacity: 0.1, bgColor: "#71717a" }),
    isActive: (style: CaptionStyle) => style.animation === "fade" && style.bgColor === "#71717a",
  },
  {
    id: "explosion",
    title: "Explosion",
    description: "Small impact burst animation",
    category: "Creative Effects",
    iconText: "💥",
    badge: "POPULAR",
    isPro: true,
    filterTags: ["popular", "pro"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "zoom-out" as const, fontWeight: 800, color: "#ef4444" }),
    isActive: (style: CaptionStyle) => style.animation === "zoom-out" && style.color === "#ef4444",
  },
  {
    id: "confetti",
    title: "Confetti",
    description: "Celebration particle animation",
    category: "Creative Effects",
    iconText: "🎉",
    filterTags: [],
    apply: (style: CaptionStyle) => ({ ...style, animation: "bounce" as const, highlightColor: "#10b981" }),
    isActive: (style: CaptionStyle) => style.animation === "bounce" && style.highlightColor === "#10b981",
  },
  {
    id: "sparkle",
    title: "Sparkle",
    description: "Glitter and sparkle effect",
    category: "Creative Effects",
    iconText: "✨",
    badge: "TRENDING",
    filterTags: ["trending"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "wave" as const, strokeWidth: 1, strokeColor: "#fbbf24" }),
    isActive: (style: CaptionStyle) => style.animation === "wave" && style.strokeColor === "#fbbf24",
  },
  {
    id: "lightning",
    title: "Lightning",
    description: "Electric flash animation",
    category: "Creative Effects",
    iconText: "⚡",
    isPro: true,
    filterTags: ["pro"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "shake" as const, color: "#facc15" }),
    isActive: (style: CaptionStyle) => style.animation === "shake" && style.color === "#facc15",
  },
  {
    id: "liquid",
    title: "Liquid",
    description: "Water ripple reveal",
    category: "Creative Effects",
    iconText: "💧",
    badge: "NEW",
    filterTags: ["new"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "wave" as const, color: "#3b82f6" }),
    isActive: (style: CaptionStyle) => style.animation === "wave" && style.color === "#3b82f6",
  },
];

export function buildCategories() {
  const counts: Record<string, number> = {};
  TEMPLATES.forEach((t) => {
    counts[t.category] = (counts[t.category] || 0) + 1;
  });
  return [
    { name: "All", count: TEMPLATES.length },
    ...CATEGORY_ORDER.map((name) => ({ name, count: counts[name] || 0 })),
  ];
}

export const mapTemplateToStyle = (t: typeof TEMPLATES[number]): Partial<CaptionStyle> => {
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
    case "amber_glow":
      return {
        ...base,
        fontFamily: "Montserrat",
        fontSize: 54,
        color: "#fbbf24",
        strokeWidth: 3,
        strokeColor: "#000050",
        bgOpacity: 0,
        fontWeight: 850,
        karaoke: true,
        animation: "pop" as const,
      };

    case "tiktok_style":
      return {
        ...base,
        fontFamily: "Montserrat",
        fontSize: 56,
        color: "#FFFFFF",
        strokeWidth: 4,
        strokeColor: "#000000",
        bgOpacity: 0,
        fontWeight: 900,
        bold: true,
        uppercase: true,
        karaoke: true,
        animation: "pop" as const,
      };

    case "neon_glow":
      return {
        ...base,
        fontFamily: "Montserrat",
        fontSize: 54,
        color: "#ff5c3a",
        strokeWidth: 2,
        strokeColor: "#ff3a1a",
        bgOpacity: 0,
        fontWeight: 850,
        karaoke: true,
        animation: "pop" as const,
      };

    case "classic_srt":
      return {
        ...base,
        fontFamily: "Inter",
        fontSize: 40,
        color: "#FFFFFF",
        bgColor: "#000000",
        bgOpacity: 0.75,
        strokeWidth: 0,
        fontWeight: 500,
        karaoke: false,
        animation: "none" as const,
      };

    case "cinematic_gold":
      return {
        ...base,
        fontFamily: "Playfair Display",
        fontSize: 50,
        color: "#FFFFFF",
        strokeWidth: 1,
        strokeColor: "#fbbf24",
        bgOpacity: 0,
        fontWeight: 800,
        karaoke: false,
        animation: "fade" as const,
        isCinematicStacked: true,
      };

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
        color: t.accent,
        fontWeight: 800,
        animation: "pop" as const,
      };

    case "glow":
      return {
        ...base,
        fontFamily: "Inter",
        fontSize: 50,
        color: "#FFFFFF",
        strokeWidth: 2,
        strokeColor: t.accent,
        animation: "fade" as const,
      };

    case "karaoke":
      return {
        ...base,
        fontFamily: "Poppins",
        fontSize: 48,
        color: "#FFFFFF",
        karaoke: true,
        highlightColor: t.accent,
        animation: "pop" as const,
      };

    case "outline":
      return {
        ...base,
        fontFamily: "Bebas Neue",
        fontSize: 64,
        color: "transparent",
        strokeWidth: 3,
        strokeColor: t.accent,
        uppercase: true,
        animation: "zoom-in" as const,
      };

    case "serif":
      return {
        ...base,
        fontFamily: "Playfair Display",
        fontSize: 44,
        color: t.accent,
        fontWeight: 600,
        animation: "fade" as const,
      };

    case "stacked":
      return {
        ...base,
        fontFamily: "Montserrat",
        fontSize: 48,
        color: "#FFFFFF",
        bgColor: "#000000",
        bgOpacity: 0.6,
        animation: "slide-up" as const,
      };

    default:
      return base;
  }
};
