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
  Eye,
} from "lucide-react";
import {
  FONT_OPTIONS,
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

const TEMPLATES = [
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

const CATEGORY_ORDER = ["Cinematic", "Phrase", "Karaoke", "Build", "Boxed", "Editorial", "Aesthetic", "One word"];

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

const ANIM_STYLES: AnimPreset[] = [
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
    id: "youtube_shorts",
    title: "YouTube Shorts",
    description: "Punch words with slight scale effect",
    category: "Social Media",
    iconText: "🎥",
    badge: "POPULAR",
    filterTags: ["popular"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "pop" as const, karaoke: false, uppercase: true }),
    isActive: (style: CaptionStyle) => style.animation === "pop" && !style.karaoke && style.uppercase,
  },
  {
    id: "podcast",
    title: "Podcast",
    description: "Minimal captions with subtle fade",
    category: "Social Media",
    iconText: "🎙️",
    filterTags: [],
    apply: (style: CaptionStyle) => ({ ...style, animation: "fade" as const, karaoke: true, fontSize: 32 }),
    isActive: (style: CaptionStyle) => style.animation === "fade" && style.karaoke && style.fontSize === 32,
  },
  {
    id: "documentary",
    title: "Documentary",
    description: "Elegant bottom fade subtitle style",
    category: "Social Media",
    iconText: "🎬",
    filterTags: [],
    apply: (style: CaptionStyle) => ({ ...style, animation: "fade" as const, position: "bottom" as const, bgOpacity: 0.5 }),
    isActive: (style: CaptionStyle) => style.animation === "fade" && style.position === "bottom" && style.bgOpacity === 0.5,
  },
  {
    id: "meme",
    title: "Meme",
    description: "Random pop animation for comedic timing",
    category: "Social Media",
    iconText: "😂",
    badge: "TRENDING",
    filterTags: ["trending"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "bounce" as const, bold: true, uppercase: true, highlightColor: "#ff5c3a" }),
    isActive: (style: CaptionStyle) => style.animation === "bounce" && style.bold && style.uppercase,
  },
  {
    id: "news",
    title: "News",
    description: "Professional ticker/news broadcast style",
    category: "Social Media",
    iconText: "📰",
    isPro: true,
    filterTags: ["pro"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "slide-left" as const, alignment: "left" as const, bgOpacity: 0.8 }),
    isActive: (style: CaptionStyle) => style.animation === "slide-left" && style.alignment === "left",
  },
  {
    id: "gaming",
    title: "Gaming",
    description: "RGB glow and neon-inspired animation",
    category: "Social Media",
    iconText: "🎮",
    badge: "NEW",
    isPro: true,
    filterTags: ["pro", "new"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "glitch" as const, color: "#39ff14", strokeWidth: 2, strokeColor: "#ff007f" }),
    isActive: (style: CaptionStyle) => style.animation === "glitch" && style.color === "#39ff14",
  },

  // 🎬 Cinematic
  {
    id: "cinematic_fade",
    title: "Cinematic Fade",
    description: "Movie subtitle style with smooth fade",
    category: "Cinematic",
    iconText: "🎞️",
    badge: "POPULAR",
    filterTags: ["popular"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "fade" as const, fontFamily: "Playfair Display", fontSize: 40 }),
    isActive: (style: CaptionStyle) => style.animation === "fade" && style.fontFamily === "Playfair Display",
  },
  {
    id: "blur_reveal",
    title: "Blur Reveal",
    description: "Text sharpens into focus",
    category: "Cinematic",
    iconText: "🔍",
    badge: "NEW",
    filterTags: ["new"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "fade" as const, typewriterSpeed: 60 }),
    isActive: (style: CaptionStyle) => style.animation === "fade" && style.typewriterSpeed === 60,
  },
  {
    id: "letterbox_reveal",
    title: "Letterbox Reveal",
    description: "Appears between cinematic black bars",
    category: "Cinematic",
    iconText: "↕️",
    isPro: true,
    filterTags: ["pro"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "slide-up" as const, position: "bottom" as const, posY: 0.9 }),
    isActive: (style: CaptionStyle) => style.animation === "slide-up" && style.posY === 0.9,
  },
  {
    id: "opacity_drift",
    title: "Opacity Drift",
    description: "Slowly fades while moving upward",
    category: "Cinematic",
    iconText: "☁️",
    filterTags: [],
    apply: (style: CaptionStyle) => ({ ...style, animation: "slide-up" as const, bgOpacity: 0 }),
    isActive: (style: CaptionStyle) => style.animation === "slide-up" && style.bgOpacity === 0,
  },
  {
    id: "soft_lift",
    title: "Soft Lift",
    description: "Elegant upward motion",
    category: "Cinematic",
    iconText: "↗️",
    filterTags: [],
    apply: (style: CaptionStyle) => ({ ...style, animation: "slide-up" as const, posY: 0.8 }),
    isActive: (style: CaptionStyle) => style.animation === "slide-up" && style.posY === 0.8,
  },
  {
    id: "whisper",
    title: "Whisper",
    description: "Extremely subtle fade animation",
    category: "Cinematic",
    iconText: "🤫",
    filterTags: [],
    apply: (style: CaptionStyle) => ({ ...style, animation: "fade" as const, bgOpacity: 0, fontSize: 28 }),
    isActive: (style: CaptionStyle) => style.animation === "fade" && style.bgOpacity === 0 && style.fontSize === 28,
  },
  {
    id: "focus_pull",
    title: "Focus Pull",
    description: "Blur to focus transition",
    category: "Cinematic",
    iconText: "🎯",
    isPro: true,
    filterTags: ["pro"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "zoom-in" as const, fontWeight: 900 }),
    isActive: (style: CaptionStyle) => style.animation === "zoom-in" && style.fontWeight === 900,
  },
  {
    id: "glow_fade",
    title: "Glow Fade",
    description: "Soft glow appears while fading in",
    category: "Cinematic",
    iconText: "✨",
    badge: "TRENDING",
    filterTags: ["trending"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "fade" as const, strokeWidth: 1, strokeColor: "#fde68a" }),
    isActive: (style: CaptionStyle) => style.animation === "fade" && style.strokeColor === "#fde68a",
  },

  // ✍️ Handwritten
  {
    id: "marker",
    title: "Marker",
    description: "Text draws like a marker",
    category: "Handwritten",
    iconText: "🖍️",
    badge: "POPULAR",
    filterTags: ["popular"],
    apply: (style: CaptionStyle) => ({ ...style, animation: "typewriter" as const, typewriterSpeed: 100 }),
    isActive: (style: CaptionStyle) => style.animation === "typewriter" && style.typewriterSpeed === 100,
  },
  {
    id: "pen_write",
    title: "Pen Write",
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

function CaptionPreview({ t }: { t: typeof TEMPLATES[number] }) {
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCycle((prev) => prev + 1);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const tempStyle = useMemo(() => {
    return { ...DEFAULT_STYLE, ...mapTemplateToStyle(t) };
  }, [t]);

  return (
    <div className="w-full text-center">
      <span
        key={cycle}
        className={`cap-anim cap-anim-${tempStyle.animation}`}
        style={{
          fontFamily: `"${tempStyle.fontFamily}", sans-serif`,
          fontWeight: tempStyle.fontWeight,
          fontSize: "14px",
          color: tempStyle.color,
          backgroundColor: tempStyle.bgOpacity > 0 ? hexToRgba(tempStyle.bgColor, tempStyle.bgOpacity) : "transparent",
          borderRadius: tempStyle.bgOpacity > 0 ? "4px" : 0,
          padding: tempStyle.bgOpacity > 0 ? "2px 6px" : 0,
          WebkitTextStroke: tempStyle.strokeWidth > 0 ? `0.5px ${tempStyle.strokeColor}` : "none",
        }}
      >
        {t.text} <span style={{ color: tempStyle.karaoke ? tempStyle.highlightColor : tempStyle.color }}>{t.highlight}</span>
      </span>
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>(activeTab || "style");

  const [customFonts, setCustomFonts] = useState<string[]>([]);
  const [fontInput, setFontInput] = useState("");

  const [customTemplates, setCustomTemplates] = useState<CaptionTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [animSearchQuery, setAnimSearchQuery] = useState("");
  const [animFilter, setAnimFilter] = useState<"all" | "popular" | "trending" | "new" | "pro">("all");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    "Social Media": false,
    "Cinematic": false,
    "Handwritten": false,
    "Creative Effects": false,
  });
  const [activeCategory, setActiveCategory] = useState("All");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loadMoreCount, setLoadMoreCount] = useState(8);

  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState("");

  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [brandOpen, setBrandOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [templateJson, setTemplateJson] = useState("");

  // Accordion Toggles for Desktop
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    caption: true,
    typography: true,
    background: false,
    strokePos: false,
    animations: false,
    templates: false,
    brand: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (activeTab) setTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    setCustomFonts(getCustomFonts());
    setCustomTemplates(getCustomTemplates());
    const favs = localStorage.getItem("subbly-template-favorites");
    if (favs) setFavorites(JSON.parse(favs));
  }, []);

  useEffect(() => {
    const fetchPresets = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("style_presets")
        .select("id,name,style")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setPresets(data as Preset[]);
      }
    };

    const fetchBrandKit = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("brand_kits")
        .select("*")
        .maybeSingle();
      if (!error && data) {
        setBrandKit(data as BrandKit);
      }
    };

    fetchPresets();
    fetchBrandKit();
  }, [user]);

  const set = <K extends keyof CaptionStyle>(key: K, val: CaptionStyle[K]) => {
    onChange({ ...style, [key]: val });
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = favorites.includes(id)
      ? favorites.filter((x) => x !== id)
      : [...favorites, id];
    setFavorites(next);
    localStorage.setItem("subbly-template-favorites", JSON.stringify(next));
  };

  const isTemplateActive = (t: typeof TEMPLATES[number]) => {
    const target = mapTemplateToStyle(t);
    return Object.keys(target).every((key) => {
      const k = key as keyof CaptionStyle;
      return style[k] === target[k];
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

  const deletePreset = async (id: string) => {
    const { error } = await supabase.from("style_presets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPresets((p) => p.filter((x) => x.id !== id));
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

  const applyBrand = () => {
    if (!brandKit) return;
    const next = { ...style };
    if (brandKit.primary_color) next.highlightColor = brandKit.primary_color;
    if (brandKit.secondary_color) next.color = brandKit.secondary_color;
    if (brandKit.heading_font) next.fontFamily = brandKit.heading_font;
    onChange(next);
    toast.success("Brand kit applied");
  };

  const styleTabContent = (
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
                className={`px-3.5 py-1.5 text-[11.5px] font-bold rounded-md transition-all cursor-pointer ${style.emojiEnabled
                    ? "bg-[#FF6B2C] text-white shadow-sm"
                    : "text-[#888] dark:text-[#A1A8B5] hover:text-[#1a1a1a] dark:hover:text-white bg-transparent"
                  }`}
              >
                On
              </button>
              <button
                type="button"
                onClick={() => set("emojiEnabled", false)}
                className={`px-3.5 py-1.5 text-[11.5px] font-bold rounded-md transition-all cursor-pointer ${!style.emojiEnabled
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
            <select
              aria-label="Caption font"
              value={style.fontFamily}
              onChange={(e) => set("fontFamily", e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#181B22] px-3 py-2 text-[12.5px] text-[#1a1a1a] dark:text-white outline-none focus:border-[#FF6B2C]"
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

          <div className="grid grid-cols-2 gap-4">
            <SliderRow label="Size" value={style.fontSize} min={20} max={140} step={2}
              onChange={(v) => set("fontSize", v)} suffix="px" />
            <SliderRow label="Weight" value={style.fontWeight} min={300} max={900} step={100}
              onChange={(v) => set("fontWeight", v)} />
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

      {/* Accordion Card 3: Background & Spacing */}
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
            <SliderRow label="BG Opacity" value={Math.round(style.bgOpacity * 100)} min={0} max={100} step={5}
              onChange={(v) => set("bgOpacity", v / 100)} suffix="%" />
          </div>

          <SliderRow label="Box Width Limit" value={style.boxWidth ?? 84} min={10} max={100} step={1}
            onChange={(v) => set("boxWidth", v)} suffix="%" />

          <SliderRow label="Box Height Limit" value={style.boxHeight ?? 0} min={0} max={100} step={1}
            onChange={(v) => set("boxHeight", v === 0 ? undefined as unknown as number : v)} suffix="%" />
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
            <SliderRow label="Stroke Width" value={style.strokeWidth} min={0} max={12} step={1}
              onChange={(v) => set("strokeWidth", v)} compact />
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
                    className={`flex items-center justify-center gap-1 py-1.5 rounded text-[11.5px] font-bold transition cursor-pointer ${active
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
                            style: { position: "free" }
                          });
                        }
                      }
                    }}
                    className={`flex flex-col items-center justify-center gap-1 rounded-lg border py-2 text-[10.5px] font-bold transition min-h-[44px] cursor-pointer ${active
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

  const animCategories = [
    { name: "Social Media", icon: "✨" },
    { name: "Cinematic", icon: "🎬" },
    { name: "Handwritten", icon: "✍️" },
    { name: "Creative Effects", icon: "🔥" }
  ] as const;

  const filteredAnimations = useMemo(() => {
    return ANIM_STYLES.filter((anim) => {
      const matchSearch = anim.title.toLowerCase().includes(animSearchQuery.toLowerCase()) ||
                          anim.description.toLowerCase().includes(animSearchQuery.toLowerCase());
      const matchFilter = animFilter === "all" || anim.filterTags.includes(animFilter);
      return matchSearch && matchFilter;
    });
  }, [animSearchQuery, animFilter]);

  const animTabContent = (
    <AccordionCard
      title="Animation Styles"
      isOpen={!showTabsHeader || openSections.animations}
      onToggle={() => toggleSection("animations")}
      icon="✨"
      isCollapsible={showTabsHeader}
    >
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search animations..."
            value={animSearchQuery}
            onChange={(e) => setAnimSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#E8E8E8] dark:border-[#2C313C] bg-white dark:bg-[#181B22] pl-10 pr-4 py-2 text-xs text-[#111827] dark:text-white placeholder-[#999] focus:border-[#FF6B2C] focus:outline-none transition-colors"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 text-[11px]">
            🔍
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-1.5 pb-1">
          {([
            { id: "all", label: "All" },
            { id: "popular", label: "Popular" },
            { id: "trending", label: "Trending" },
            { id: "new", label: "New" },
            { id: "pro", label: "Pro" }
          ] as const).map((chip) => {
            const active = animFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setAnimFilter(chip.id)}
                className={`rounded-full px-3 py-1 text-[10px] font-bold border transition-all cursor-pointer ${
                  active
                    ? "bg-[#FF6B2C] text-white border-[#FF6B2C] shadow-sm"
                    : "bg-white dark:bg-[#181B22] text-[#6B7280] dark:text-[#A1A8B5] border-[#E8E8E8] dark:border-[#2C313C] hover:border-[#FF6B2C]/40 hover:text-[#111827] dark:hover:text-white"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Collapsible Categories list */}
        <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin select-none">
          {animCategories.map((cat) => {
            const catAnims = filteredAnimations.filter((a) => a.category === cat.name);
            if (catAnims.length === 0) return null;

            const isCollapsed = collapsedCategories[cat.name] || false;

            return (
              <div key={cat.name} className="space-y-2 border-b border-neutral-100 dark:border-neutral-900/60 pb-3 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setCollapsedCategories(prev => ({ ...prev, [cat.name]: !isCollapsed }))}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-neutral-500 dark:text-[#A1A8B5] hover:text-[#FF6B2C] py-1 focus:outline-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                    <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 ml-1">({catAnims.length})</span>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isCollapsed ? "-rotate-90 text-neutral-400" : "text-[#FF6B2C]"}`} />
                </button>

                <div className={`space-y-2 transition-all duration-300 ease-in-out ${isCollapsed ? "h-0 overflow-hidden opacity-0" : "opacity-100"}`}>
                  {catAnims.map((opt) => {
                    const active = opt.isActive(style);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange(opt.apply(style))}
                        className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all duration-200 hover:-translate-y-[1px] hover:shadow-sm cursor-pointer ${
                          active
                            ? "border-[#FF6B2C] bg-[#FF6B2C]/5 shadow-[0_0_12px_rgba(255,107,44,0.06)]"
                            : "border-[#E8E8E8] dark:border-[#2C313C] bg-white dark:bg-[#1F232D] hover:border-[#FF6B2C]/40"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-base font-bold ${
                            active
                              ? "bg-[#FF6B2C] text-white"
                              : "bg-[#F5F5F5] dark:bg-[#181B22] text-[#6B7280] dark:text-[#A1A8B5]"
                          }`}
                        >
                          {opt.iconText}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[12px] font-bold truncate ${active ? "text-[#FF6B2C]" : "text-[#111827] dark:text-white"}`}>
                              {opt.title}
                            </span>
                            {opt.badge && (
                              <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded leading-none ${
                                opt.badge === "NEW" 
                                  ? "bg-green-500/10 text-green-500 dark:bg-green-500/20" 
                                  : "bg-[#FF6B2C]/10 text-[#FF6B2C] dark:bg-[#FF6B2C]/20"
                              }`}>
                                {opt.badge}
                              </span>
                            )}
                            {opt.isPro && (
                              <span className="text-[8px] font-extrabold bg-[#FF6B2C]/15 text-[#FF6B2C] px-1.5 py-0.5 rounded leading-none">
                                PRO
                              </span>
                            )}
                          </div>
                          <div className="text-[10.5px] text-[#6B7280] dark:text-[#A1A8B5] truncate mt-0.5">
                            {opt.description}
                          </div>
                        </div>

                        {active && (
                          <div className="flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded-full bg-[#FF6B2C] text-white">
                            <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {style.animation === "typewriter" && (
          <div className="mt-4 space-y-4 border-t border-[#E8E8E8] dark:border-[#2C313C] pt-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A1A8B5] mb-1">
              Typewriter Settings
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

            <ColorField
              label="Cursor Color"
              value={style.typewriterCursorColor || "#FF6B2C"}
              onChange={(v) => set("typewriterCursorColor", v)}
            />

            <div className="rounded-lg border border-[#E8E8E8] dark:border-[#2C313C] bg-white dark:bg-[#181B22] overflow-hidden">
              <ToggleRow
                icon="🔁"
                label="Loop Mode"
                checked={style.typewriterLoop !== false}
                onChange={(v) => set("typewriterLoop", v)}
                last
              />
            </div>
          </div>
        )}
      </div>
    </AccordionCard>
  );

  const tmplTabContent = (
    <AccordionCard
      title="Caption Templates"
      isOpen={!showTabsHeader || openSections.templates}
      onToggle={() => toggleSection("templates")}
      icon="🎨"
      isCollapsible={showTabsHeader}
    >
      <div className="space-y-4">
        {/* Filter categories */}
        <div className="flex flex-wrap gap-1.5">
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
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${active
                    ? "bg-[#FF6B2C] text-white border-[#FF6B2C] shadow-sm"
                    : "bg-white dark:bg-[#181B22] text-[#6B7280] dark:text-[#A1A8B5] border-[#E8E8E8] dark:border-[#2C313C] hover:border-[#FF6B2C]/40 hover:text-[#111827] dark:hover:text-white"
                  }`}
              >
                {c.name}
                <span className={`text-[9.5px] ${active ? "text-white/80" : "text-[#999] dark:text-[#A1A8B5]/65"}`}>
                  {c.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search templates */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#999] dark:text-[#A1A8B5]" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#E8E8E8] dark:border-[#2C313C] bg-white dark:bg-[#181B22] pl-9 pr-3 py-2 text-[12.5px] text-[#111827] dark:text-white placeholder-[#999] dark:placeholder-[#A1A8B5] outline-none transition focus:border-[#FF6B2C]"
          />
        </div>

        {/* Template card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
          {displayedTemplates.map((t) => {
            const active = isTemplateActive(t);
            const isFav = favorites.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className={`group relative flex flex-col rounded-xl border overflow-hidden text-left transition-all cursor-pointer ${active
                    ? "border-[#FF6B2C] ring-1 ring-[#FF6B2C]/30 shadow-md shadow-orange-500/5"
                    : "border-[#E8E8E8] dark:border-[#2C313C] bg-white dark:bg-[#181B22] hover:border-[#FF6B2C]/40 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                  }`}
                type="button"
              >
                {/* Visual Treatment Preview */}
                <div className="h-20 w-full flex items-center justify-center px-4 bg-[#111] dark:bg-[#0a0a0a] relative">
                  <CaptionPreview t={t} />

                  {active && (
                    <div className="absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B2C] text-white shadow-md">
                      <Check className="h-3 w-3" strokeWidth={3.5} />
                    </div>
                  )}

                  <button
                    onClick={(e) => toggleFavorite(t.id, e)}
                    className="absolute top-2 right-2 text-zinc-550 hover:text-amber-500 transition-colors p-1 bg-black/45 hover:bg-black/60 rounded-full"
                  >
                    <Star className={`h-3.5 w-3.5 ${isFav ? "fill-amber-500 text-amber-500" : "text-white/70"}`} />
                  </button>
                </div>

                {/* Details Bottom Bar */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-[#E8E8E8] dark:border-[#2C313C] bg-[#F8F9FB] dark:bg-[#1F232D] w-full text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-[#111827] dark:text-white truncate">{t.name}</span>
                    {t.badge && (
                      <span className="text-[8px] font-extrabold tracking-wide px-1 py-0.5 rounded bg-[#FF6B2C]/10 text-[#FF6B2C] border border-[#FF6B2C]/20 uppercase">
                        {t.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[9.5px] text-[#6B7280] dark:text-[#A1A8B5] flex-shrink-0">{t.category}</span>
                </div>
              </button>
            );
          })}
        </div>

        {filteredTemplates.length > loadMoreCount && (
          <div className="flex justify-center pt-1.5">
            <button
              type="button"
              onClick={() => setLoadMoreCount((prev) => prev + 6)}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E8E8E8] dark:border-[#2C313C] bg-white dark:bg-[#1F232D] px-3.5 text-[11.5px] font-bold text-[#6B7280] dark:text-[#A1A8B5] hover:text-[#111827] dark:hover:text-white hover:border-[#FF6B2C] transition-all cursor-pointer"
            >
              Load More
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Saved Presets */}
        <div className="border-t border-[#E8E8E8] dark:border-[#2C313C] pt-4.5">
          <div className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A1A8B5]">
            My Saved Presets
          </div>
          <div className="mb-3 flex gap-2">
            <input
              aria-label="Preset name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Enter preset name..."
              className="flex-1 rounded-lg border border-[#E8E8E8] dark:border-[#2C313C] bg-white dark:bg-[#181B22] px-3 py-2 text-[12.5px] text-[#111827] dark:text-white placeholder-[#999] dark:placeholder-[#A1A8B5] outline-none focus:border-[#FF6B2C] transition"
            />
            <button
              onClick={savePreset}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#FF6B2C] px-3.5 py-2 text-[12.5px] font-bold text-white transition-all hover:bg-[#FF874D] cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
          </div>

          {presets.length === 0 ? (
            <div className="text-[11.5px] text-[#A1A8B5]">No saved presets yet.</div>
          ) : (
            <div className="space-y-1.5">
              {presets.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-[#F9F8F5] dark:bg-[#181B22] px-3 py-2 text-xs"
                >
                  <button
                    onClick={() => { onChange({ ...style, ...p.style }); toast.success(`Applied "${p.name}"`); }}
                    className="flex-1 truncate text-left font-semibold text-[#555] dark:text-[#A1A8B5] hover:text-[#FF6B2C] transition-colors"
                  >
                    {p.name}
                  </button>
                  <button
                    onClick={() => deletePreset(p.id)}
                    aria-label={`Delete preset ${p.name}`}
                    className="text-[#A1A8B5]/60 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AccordionCard>
  );

  const brandTabContent = (
    <AccordionCard
      title="Brand Kit Settings"
      isOpen={!showTabsHeader || openSections.brand}
      onToggle={() => toggleSection("brand")}
      icon="💼"
      isCollapsible={showTabsHeader}
    >
      <div className="space-y-4">
        {brandKit ? (
          <div className="overflow-hidden rounded-xl border border-[#E8E4DE] dark:border-[#2C313C] bg-[#F9F8F5] dark:bg-[#181B22]">
            <div className="flex items-center justify-between p-3.5 border-b border-[#E8E4DE] dark:border-[#2C313C]">
              <div className="flex gap-1.5">
                {brandKit.primary_color && (
                  <div className="h-6 w-6 rounded border border-black/10 dark:border-white/10" style={{ background: brandKit.primary_color }} />
                )}
                {brandKit.secondary_color && (
                  <div className="h-6 w-6 rounded border border-black/10 dark:border-white/10" style={{ background: brandKit.secondary_color }} />
                )}
              </div>
              <span className="text-[11.5px] font-bold text-[#1a1a1a] dark:text-white truncate max-w-[120px]">
                {brandKit.heading_font || "—"}
              </span>
            </div>
            {brandKit.logo_url && (
              <div className="p-3 bg-[#F0EDE8] dark:bg-[#0a0a0a] flex items-center justify-center">
                <img
                  src={brandKit.logo_url}
                  alt={`${brandKit.heading_font || "Your"} logo`}
                  className="max-h-12 w-auto object-contain rounded p-1 bg-black/5"
                />
              </div>
            )}
            <div className="flex">
              <button
                onClick={applyBrand}
                className="flex flex-1 items-center justify-center gap-1.5 bg-[#FF6B2C] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#FF874D]"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                Apply Kit
              </button>
              <button
                onClick={() => setBrandOpen(true)}
                className="flex items-center gap-1.5 border-l border-[#E8E4DE] dark:border-[#2C313C] bg-[#F0EDE8] dark:bg-[#1F232D] px-4 py-2.5 text-xs font-bold text-[#666] dark:text-[#A1A8B5] hover:text-[#1a1a1a] dark:hover:text-white transition"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-[#E8E4DE] dark:border-[#2C313C] bg-[#F9F8F5] dark:bg-[#181B22] p-6 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#1F232D]">
              <Palette className="h-5 w-5 text-[#999] dark:text-[#A1A8B5]" strokeWidth={1.8} />
            </div>
            <div className="text-[13px] font-bold text-[#1a1a1a] dark:text-white">No brand kit created</div>
            <div className="text-[11.5px] leading-relaxed text-[#666] dark:text-[#A1A8B5] max-w-[180px]">
              Store colors and custom typography for fast unified formatting.
            </div>
            <button
              onClick={() => setBrandOpen(true)}
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#1F232D] px-4 py-2 text-[12px] font-bold text-[#666] dark:text-[#A1A8B5] hover:text-[#1a1a1a] dark:hover:text-white hover:border-[#FF6B2C] transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.8} />
              New Brand Kit
            </button>
          </div>
        )}
      </div>
    </AccordionCard>
  );

  return (
    <div className="flex h-full flex-col bg-[#F8F9FB] dark:bg-[#181B22]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Desktop / Accordions Wrapper */}
      {showTabsHeader ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin select-none">
          {styleTabContent}
          {animTabContent}
          {tmplTabContent}
          {brandTabContent}
        </div>
      ) : (
        /* Mobile tab filter view */
        <div className={`scrollbar-thin flex-1 overflow-y-auto p-4 ${isLocked ? "pointer-events-none opacity-50 select-none" : ""}`}>
          {tab === "style" && styleTabContent}
          {tab === "anim" && animTabContent}
          {tab === "tmpl" && tmplTabContent}
          {tab === "brand" && brandTabContent}
        </div>
      )}

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
    </div>
  );
}

/* Accordion helper wrapper card */
function AccordionCard({
  title, isOpen, onToggle, icon, children, isCollapsible = true,
}: {
  title: string; isOpen: boolean; onToggle: () => void; icon: string; children: React.ReactNode; isCollapsible?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E8E4DE] bg-white dark:border-[#2C313C] dark:bg-[#1F232D] overflow-hidden shadow-sm transition-all duration-300">
      <button
        type="button"
        disabled={!isCollapsible}
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1F232D] text-left hover:bg-neutral-50/50 dark:hover:bg-[#1F232D]/90 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px]">{icon}</span>
          <span className="text-[13px] font-bold text-[#1A1A1A] dark:text-white tracking-wide">{title}</span>
        </div>
        {isCollapsible && (
          <ChevronDown className={`h-4 w-4 text-[#666] dark:text-[#A1A8B5] transition-transform duration-300 ${isOpen ? "rotate-180 text-[#1A1A1A] dark:text-white" : ""}`} />
        )}
      </button>

      {/* Accordion inner expansion body */}
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 h-0 overflow-hidden"}`}>
        <div className="overflow-hidden">
          <div className="p-4 border-t border-[#E8E4DE] bg-[#FAF9F7]/60 dark:border-[#2C313C] dark:bg-[#1F232D]/50">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#666]/75 dark:text-[#A1A8B5]/75">
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
        <label className={`block font-bold uppercase tracking-wider text-[#666]/75 dark:text-[#A1A8B5]/75 ${compact ? "text-[9.5px]" : "text-[10px]"}`}>
          {label}
        </label>
        <span className="text-[11px] text-[#1A1A1A] dark:text-white font-mono">{value}{suffix ?? ""}</span>
      </div>
      <div className="relative">
        <div className="h-1 w-full rounded-full bg-[#E8E4DE] dark:bg-[#2C313C]" />
        <div
          className="absolute left-0 top-0 h-1 rounded-full bg-[#FF6B2C]"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FF6B2C] bg-white shadow-md cursor-pointer"
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
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#666]/75 dark:text-[#A1A8B5]/75">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-[#E8E4DE] bg-[#F9F8F5] px-2.5 py-1.5 transition hover:border-[#FF6B2C]/40 dark:border-[#2C313C] dark:bg-[#181B22]">
        <label className="relative flex-shrink-0">
          <div
            className="h-5 w-5 cursor-pointer rounded border border-black/10 dark:border-white/10"
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
          className="w-full bg-transparent font-mono text-[11.5px] text-[#1A1A1A] dark:text-white outline-none"
        />
      </div>
    </div>
  );
}

function ToggleRow({
  icon, label, checked, onChange, last,
}: {
  icon: string; label: string; checked: boolean;
  onChange: (v: boolean) => void; last?: boolean;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between px-3.5 py-3.5 cursor-pointer select-none min-h-[44px] hover:bg-neutral-50 dark:hover:bg-[#1F232D]/40 transition ${last ? "" : "border-b border-[#E8E4DE] dark:border-[#2C313C]"}`}
    >
      <span className="flex items-center gap-2.5 text-[12.5px] font-semibold text-[#666] dark:text-[#A1A8B5]">
        <span className="flex h-5 min-w-[20px] items-center justify-center text-[12px] font-bold text-[#1A1A1A] dark:text-white/90 bg-[#F9F8F5] dark:bg-[#2C313C] rounded">
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
        className={`relative h-[22px] w-[38px] flex-shrink-0 rounded-full transition duration-200 cursor-pointer ${checked ? "bg-[#FF6B2C]" : "bg-[#E8E4DE] dark:bg-[#2C313C]"
          }`}
      >
        <span
          className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all duration-200 ${checked ? "left-[18px]" : "left-0.5"
            }`}
        />
      </button>
    </div>
  );
}
