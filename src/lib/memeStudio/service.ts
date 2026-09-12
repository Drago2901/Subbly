import { CURATED_MEMES, CURATED_GIFS, CURATED_STICKERS } from "./data";
import type { MemeItem, MemeType } from "./types";

export const memeStudioService = {
  /**
   * Search and filter media items by type, keyword, and category.
   * Pure client-side keyword and tag matching (Strictly NO AI).
   */
  getItems(type: MemeType | "all" = "all", query: string = "", category: string = "All"): MemeItem[] {
    let pool: MemeItem[] = [];

    if (type === "meme") {
      pool = CURATED_MEMES;
    } else if (type === "gif") {
      pool = CURATED_GIFS;
    } else if (type === "sticker") {
      pool = CURATED_STICKERS;
    } else {
      pool = [...CURATED_MEMES, ...CURATED_GIFS, ...CURATED_STICKERS];
    }

    // Filter by category
    if (category && category !== "All") {
      pool = pool.filter(
        (item) => item.category?.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by keyword query
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return pool;

    const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);

    return pool.filter((item) => {
      const titleLower = item.title.toLowerCase();
      const tags = item.tags || [];

      return queryTokens.every(
        (token) =>
          titleLower.includes(token) ||
          tags.some((tag) => tag.toLowerCase().includes(token)) ||
          item.category?.toLowerCase().includes(token)
      );
    });
  },

  getMemes(query: string = "", category: string = "All"): MemeItem[] {
    return this.getItems("meme", query, category);
  },

  getGifs(query: string = "", category: string = "All"): MemeItem[] {
    return this.getItems("gif", query, category);
  },

  getStickers(query: string = "", category: string = "All"): MemeItem[] {
    return this.getItems("sticker", query, category);
  },
};
