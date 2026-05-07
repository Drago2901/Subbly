export type Word = {
  text: string;
  start: number;
  end: number;
  type?: string;
};

export type Caption = {
  id: string;
  start: number;
  end: number;
  text: string;
  words?: Word[];
};

export type CaptionAnimation =
  | "none"
  | "zoom-in"
  | "zoom-out"
  | "pop"
  | "fade"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "bounce"
  | "typewriter"
  | "wave"
  | "glitch"
  | "shake";

export type CaptionStyle = {
  fontFamily: string;
  fontSize: number; // px relative to 1080p height
  fontWeight: number; // 400..900
  color: string; // hex
  bgOpacity: number; // 0..1
  bgColor: string; // hex
  position: "top" | "middle" | "bottom" | "free";
  /** Free position center, normalized 0..1 (only when position === "free") */
  posX: number;
  posY: number;
  bold: boolean;
  uppercase: boolean;
  karaoke: boolean;
  highlightColor: string;
  animation: CaptionAnimation;
  /** Text outline / stroke */
  strokeWidth: number; // px @ 1080p
  strokeColor: string; // hex
};

export const DEFAULT_STYLE: CaptionStyle = {
  fontFamily: "Inter",
  fontSize: 56,
  fontWeight: 700,
  color: "#FFFFFF",
  bgOpacity: 0.55,
  bgColor: "#000000",
  position: "bottom",
  posX: 0.5,
  posY: 0.88,
  bold: true,
  uppercase: false,
  karaoke: true,
  highlightColor: "#FACC15",
  animation: "pop",
  strokeWidth: 0,
  strokeColor: "#000000",
};

export const FONT_OPTIONS = [
  "Inter",
  "Poppins",
  "Bebas Neue",
  "Montserrat",
  "Anton",
  "Roboto",
  "Georgia",
  "Impact",
  "Oswald",
  "Raleway",
  "Playfair Display",
  "Lobster",
  "Pacifico",
  "Permanent Marker",
  "Caveat",
  "Archivo Black",
  "Bangers",
  "Righteous",
  "Fjalla One",
  "Teko",
  "Russo One",
  "Press Start 2P",
  "Shrikhand",
  "Abril Fatface",
];

export const ANIMATION_OPTIONS: { value: CaptionAnimation; label: string }[] = [
  { value: "none", label: "None" },
  { value: "fade", label: "Fade In" },
  { value: "pop", label: "Pop Up" },
  { value: "bounce", label: "Bounce" },
  { value: "zoom-in", label: "Zoom In" },
  { value: "zoom-out", label: "Zoom Out" },
  { value: "slide-up", label: "Slide Up" },
  { value: "slide-down", label: "Slide Down" },
  { value: "slide-left", label: "Slide Left" },
  { value: "slide-right", label: "Slide Right" },
  { value: "typewriter", label: "Typewriter" },
  { value: "wave", label: "Wave" },
  { value: "glitch", label: "Glitch" },
  { value: "shake", label: "Shake" },
];

export type CaptionTemplate = {
  id: string;
  name: string;
  description: string;
  style: Partial<CaptionStyle>;
};

export const CAPTION_TEMPLATES: CaptionTemplate[] = [
  {
    id: "tiktok-bold",
    name: "TikTok Bold",
    description: "Big white text, yellow karaoke pop",
    style: {
      fontFamily: "Bebas Neue",
      fontSize: 72,
      fontWeight: 700,
      color: "#FFFFFF",
      bgOpacity: 0,
      uppercase: true,
      karaoke: true,
      highlightColor: "#FACC15",
      animation: "pop",
      strokeWidth: 4,
      strokeColor: "#000000",
      position: "bottom",
    },
  },
  {
    id: "youtube-classic",
    name: "YouTube Classic",
    description: "Subtle dark backdrop, clean sans",
    style: {
      fontFamily: "Inter",
      fontSize: 48,
      fontWeight: 600,
      color: "#FFFFFF",
      bgColor: "#000000",
      bgOpacity: 0.65,
      uppercase: false,
      karaoke: false,
      animation: "fade",
      strokeWidth: 0,
      position: "bottom",
    },
  },
  {
    id: "reels-pop",
    name: "Reels Pop",
    description: "Vibrant pop with bouncy entrance",
    style: {
      fontFamily: "Anton",
      fontSize: 64,
      fontWeight: 700,
      color: "#FFFFFF",
      bgOpacity: 0,
      uppercase: true,
      karaoke: true,
      highlightColor: "#22D3EE",
      animation: "bounce",
      strokeWidth: 5,
      strokeColor: "#0F172A",
      position: "middle",
    },
  },
  {
    id: "podcast-card",
    name: "Podcast Card",
    description: "Dark rounded card, magazine vibes",
    style: {
      fontFamily: "Playfair Display",
      fontSize: 44,
      fontWeight: 700,
      color: "#F8FAFC",
      bgColor: "#0F172A",
      bgOpacity: 0.85,
      karaoke: false,
      animation: "slide-up",
      strokeWidth: 0,
      position: "bottom",
    },
  },
  {
    id: "neon",
    name: "Neon Glow",
    description: "Hot pink glow, retro arcade",
    style: {
      fontFamily: "Press Start 2P",
      fontSize: 36,
      fontWeight: 700,
      color: "#F0ABFC",
      bgOpacity: 0,
      karaoke: true,
      highlightColor: "#F472B6",
      animation: "wave",
      strokeWidth: 3,
      strokeColor: "#4C1D95",
      position: "middle",
    },
  },
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    description: "Clean uppercase, no background",
    style: {
      fontFamily: "Archivo Black",
      fontSize: 52,
      fontWeight: 700,
      color: "#FFFFFF",
      bgOpacity: 0,
      uppercase: true,
      karaoke: false,
      animation: "fade",
      strokeWidth: 2,
      strokeColor: "#000000",
      position: "bottom",
    },
  },
  {
    id: "handwritten",
    name: "Handwritten",
    description: "Casual marker script",
    style: {
      fontFamily: "Permanent Marker",
      fontSize: 56,
      fontWeight: 400,
      color: "#FDE68A",
      bgOpacity: 0,
      karaoke: true,
      highlightColor: "#FB923C",
      animation: "typewriter",
      strokeWidth: 3,
      strokeColor: "#451A03",
      position: "bottom",
    },
  },
  {
    id: "elegant-serif",
    name: "Elegant Serif",
    description: "Cinematic lower-third",
    style: {
      fontFamily: "Abril Fatface",
      fontSize: 50,
      fontWeight: 400,
      color: "#FFFFFF",
      bgColor: "#000000",
      bgOpacity: 0.4,
      karaoke: false,
      animation: "slide-up",
      strokeWidth: 0,
      position: "bottom",
    },
  },
  {
    id: "bold-yellow-highlight",
    name: "Bold Yellow Highlight",
    description: "Hormozi-style yellow word highlight",
    style: {
      fontFamily: "Montserrat",
      fontSize: 64,
      fontWeight: 900,
      color: "#FFFFFF",
      bgOpacity: 0,
      uppercase: true,
      karaoke: true,
      highlightColor: "#FACC15",
      animation: "pop",
      strokeWidth: 6,
      strokeColor: "#000000",
      position: "middle",
    },
  },
  {
    id: "white-cinematic",
    name: "White Cinematic",
    description: "Wide letter-spacing, premium feel",
    style: {
      fontFamily: "Montserrat",
      fontSize: 42,
      fontWeight: 500,
      color: "#FFFFFF",
      bgOpacity: 0,
      karaoke: false,
      animation: "fade",
      strokeWidth: 0,
      position: "bottom",
    },
  },
  {
    id: "viral-reel",
    name: "Viral Reel",
    description: "Fat bouncy uppercase, lime accent",
    style: {
      fontFamily: "Anton",
      fontSize: 70,
      fontWeight: 900,
      color: "#FFFFFF",
      bgOpacity: 0,
      uppercase: true,
      karaoke: true,
      highlightColor: "#A3E635",
      animation: "bounce",
      strokeWidth: 6,
      strokeColor: "#0F172A",
      position: "middle",
    },
  },
  {
    id: "gaming-stream",
    name: "Gaming Stream",
    description: "Twitch-style purple punch",
    style: {
      fontFamily: "Russo One",
      fontSize: 56,
      fontWeight: 700,
      color: "#FFFFFF",
      bgOpacity: 0,
      uppercase: true,
      karaoke: true,
      highlightColor: "#A855F7",
      animation: "shake",
      strokeWidth: 5,
      strokeColor: "#1E1B4B",
      position: "bottom",
    },
  },
  {
    id: "ai-futuristic",
    name: "AI Futuristic",
    description: "Glitchy cyan techno vibe",
    style: {
      fontFamily: "Teko",
      fontSize: 60,
      fontWeight: 700,
      color: "#67E8F9",
      bgOpacity: 0,
      uppercase: true,
      karaoke: true,
      highlightColor: "#FFFFFF",
      animation: "glitch",
      strokeWidth: 2,
      strokeColor: "#0E7490",
      position: "middle",
    },
  },
  {
    id: "luxury-gold",
    name: "Luxury Gold",
    description: "Serif gold elegance",
    style: {
      fontFamily: "Playfair Display",
      fontSize: 50,
      fontWeight: 700,
      color: "#FCD34D",
      bgColor: "#000000",
      bgOpacity: 0.6,
      karaoke: false,
      animation: "fade",
      strokeWidth: 0,
      position: "bottom",
    },
  },
  {
    id: "instagram-reel",
    name: "Instagram Reel",
    description: "Center pop with peach highlight",
    style: {
      fontFamily: "Poppins",
      fontSize: 58,
      fontWeight: 800,
      color: "#FFFFFF",
      bgOpacity: 0,
      karaoke: true,
      highlightColor: "#F472B6",
      animation: "pop",
      strokeWidth: 4,
      strokeColor: "#000000",
      position: "middle",
    },
  },
  {
    id: "youtube-shorts",
    name: "YouTube Shorts",
    description: "Red brand pop, super readable",
    style: {
      fontFamily: "Inter",
      fontSize: 54,
      fontWeight: 800,
      color: "#FFFFFF",
      bgOpacity: 0,
      uppercase: true,
      karaoke: true,
      highlightColor: "#EF4444",
      animation: "slide-up",
      strokeWidth: 5,
      strokeColor: "#000000",
      position: "bottom",
    },
  },
  {
    id: "tiktok-dynamic",
    name: "TikTok Dynamic",
    description: "Sliding cyan word emphasis",
    style: {
      fontFamily: "Bebas Neue",
      fontSize: 68,
      fontWeight: 700,
      color: "#FFFFFF",
      bgOpacity: 0,
      uppercase: true,
      karaoke: true,
      highlightColor: "#22D3EE",
      animation: "slide-left",
      strokeWidth: 4,
      strokeColor: "#000000",
      position: "middle",
    },
  },
  {
    id: "motivational-quote",
    name: "Motivational Quote",
    description: "Center serif, breathing fade",
    style: {
      fontFamily: "Abril Fatface",
      fontSize: 48,
      fontWeight: 400,
      color: "#FFFFFF",
      bgColor: "#000000",
      bgOpacity: 0.5,
      karaoke: false,
      animation: "zoom-in",
      strokeWidth: 0,
      position: "middle",
    },
  },
  {
    id: "meme-pop",
    name: "Meme Pop",
    description: "Impact white-on-black classic",
    style: {
      fontFamily: "Impact",
      fontSize: 64,
      fontWeight: 900,
      color: "#FFFFFF",
      bgOpacity: 0,
      uppercase: true,
      karaoke: false,
      animation: "pop",
      strokeWidth: 6,
      strokeColor: "#000000",
      position: "top",
    },
  },
];
