export type ExportFit = "cover" | "contain";

export type ExportPreset = {
  id: string;
  label: string;
  description: string;
  width: number;
  height: number;
  /** "cover" crops to fill, "contain" letterboxes. "source" means keep original. */
  fit: ExportFit;
};

/** Special id meaning: don't resize, use the source video resolution. */
export const SOURCE_PRESET_ID = "source";

export const EXPORT_PRESETS: ExportPreset[] = [
  {
    id: SOURCE_PRESET_ID,
    label: "Original (source size)",
    description: "Keep the video's native resolution",
    width: 0,
    height: 0,
    fit: "contain",
  },
  {
    id: "youtube-1080p",
    label: "YouTube 1080p (16:9)",
    description: "1920×1080 — standard widescreen",
    width: 1920,
    height: 1080,
    fit: "cover",
  },
  {
    id: "youtube-720p",
    label: "YouTube 720p (16:9)",
    description: "1280×720 — lighter widescreen",
    width: 1280,
    height: 720,
    fit: "cover",
  },
  {
    id: "youtube-shorts",
    label: "YouTube Shorts (9:16)",
    description: "1080×1920 — vertical",
    width: 1080,
    height: 1920,
    fit: "cover",
  },
  {
    id: "tiktok",
    label: "TikTok (9:16)",
    description: "1080×1920 — vertical",
    width: 1080,
    height: 1920,
    fit: "cover",
  },
  {
    id: "instagram-reels",
    label: "Instagram Reels (9:16)",
    description: "1080×1920 — vertical",
    width: 1080,
    height: 1920,
    fit: "cover",
  },
  {
    id: "instagram-feed",
    label: "Instagram Feed (4:5)",
    description: "1080×1350 — portrait",
    width: 1080,
    height: 1350,
    fit: "cover",
  },
  {
    id: "instagram-square",
    label: "Instagram Square (1:1)",
    description: "1080×1080 — square",
    width: 1080,
    height: 1080,
    fit: "cover",
  },
];

export function getPresetById(id: string): ExportPreset {
  return EXPORT_PRESETS.find((p) => p.id === id) ?? EXPORT_PRESETS[0];
}
