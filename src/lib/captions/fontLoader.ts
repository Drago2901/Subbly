export const FONT_CATEGORIES = ["All", "Sans", "Serif", "Display", "Handwriting"] as const;
export type FontCategory = typeof FONT_CATEGORIES[number];

export const FONT_METADATA: Record<string, { category: "Sans" | "Serif" | "Display" | "Handwriting"; fallback: string }> = {
  "Inter": { category: "Sans", fallback: "sans-serif" },
  "Poppins": { category: "Sans", fallback: "sans-serif" },
  "Bebas Neue": { category: "Display", fallback: "sans-serif" },
  "Montserrat": { category: "Sans", fallback: "sans-serif" },
  "Anton": { category: "Display", fallback: "sans-serif" },
  "Roboto": { category: "Sans", fallback: "sans-serif" },
  "Georgia": { category: "Serif", fallback: "serif" },
  "Impact": { category: "Display", fallback: "sans-serif" },
  "Oswald": { category: "Display", fallback: "sans-serif" },
  "Raleway": { category: "Sans", fallback: "sans-serif" },
  "Playfair Display": { category: "Serif", fallback: "serif" },
  "Lobster": { category: "Handwriting", fallback: "cursive, sans-serif" },
  "Pacifico": { category: "Handwriting", fallback: "cursive, sans-serif" },
  "Permanent Marker": { category: "Handwriting", fallback: "cursive, sans-serif" },
  "Caveat": { category: "Handwriting", fallback: "cursive, sans-serif" },
  "Archivo Black": { category: "Display", fallback: "sans-serif" },
  "Bangers": { category: "Display", fallback: "fantasy, sans-serif" },
  "Righteous": { category: "Display", fallback: "sans-serif" },
  "Fjalla One": { category: "Display", fallback: "sans-serif" },
  "Teko": { category: "Display", fallback: "sans-serif" },
  "Russo One": { category: "Display", fallback: "sans-serif" },
  "Press Start 2P": { category: "Display", fallback: "monospace" },
  "Shrikhand": { category: "Display", fallback: "serif, cursive" },
  "Abril Fatface": { category: "Display", fallback: "serif" },
  "Dancing Script": { category: "Handwriting", fallback: "cursive, sans-serif" },
  "Satisfy": { category: "Handwriting", fallback: "cursive, sans-serif" },
  "Kalam": { category: "Handwriting", fallback: "cursive, sans-serif" },
  "Outfit": { category: "Sans", fallback: "sans-serif" },
  "JetBrains Mono": { category: "Sans", fallback: "monospace" },
  "Instrument Serif": { category: "Serif", fallback: "serif" },
  "Cinzel": { category: "Serif", fallback: "serif" },
};

export function getFontFallback(family: string): string {
  return FONT_METADATA[family]?.fallback || "sans-serif";
}

export function getFontCategory(family: string): "Sans" | "Serif" | "Display" | "Handwriting" {
  return FONT_METADATA[family]?.category || "Sans";
}

/** Dynamically loads Google Fonts at runtime for imported custom fonts. */
const loaded = new Set<string>();

export function loadGoogleFont(family: string) {
  const name = family.trim();
  if (!name || loaded.has(name) || name === "Impact" || name === "Georgia") return;
  loaded.add(name);
  if (typeof document === "undefined") return;
  const param = name.replace(/\s+/g, "+");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${param}:wght@400;500;600;700;900&display=swap`;
  link.dataset.customFont = name;
  link.onerror = () => {
    // If specific weights request fails on some fonts, fallback to standard request
    const retry = document.createElement("link");
    retry.rel = "stylesheet";
    retry.href = `https://fonts.googleapis.com/css2?family=${param}&display=swap`;
    retry.dataset.customFont = name;
    document.head.appendChild(retry);
  };
  document.head.appendChild(link);
}

export function ensureFontsLoaded(fonts: string[]) {
  fonts.forEach((f) => loadGoogleFont(f));
}

const FONTS_KEY = "subbly.customFonts";
const TEMPLATES_KEY = "subbly.customTemplates";

export function getCustomFonts(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FONTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCustomFonts(fonts: string[]) {
  localStorage.setItem(FONTS_KEY, JSON.stringify(fonts));
}

export function getCustomTemplates() {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCustomTemplates(templates: unknown[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}
