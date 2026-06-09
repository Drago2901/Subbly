/** Dynamically loads Google Fonts at runtime for imported custom fonts. */
const loaded = new Set<string>();

export function loadGoogleFont(family: string) {
  const name = family.trim();
  if (!name || loaded.has(name)) return;
  loaded.add(name);
  const param = name.replace(/\s+/g, "+");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${param}:wght@400;500;600;700;900&display=swap`;
  link.dataset.customFont = name;
  document.head.appendChild(link);
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
