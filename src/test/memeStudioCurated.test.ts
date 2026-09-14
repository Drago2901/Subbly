import { describe, it, expect } from "vitest";
import { memeStudioService } from "@/lib/memeStudio/service";
import { CURATED_MEMES, CURATED_GIFS, CURATED_STICKERS, MEME_CATEGORIES } from "@/lib/memeStudio/data";

describe("Meme Studio Curated Content & Search Service (NO AI)", () => {
  it("should provide curated GIFs and stickers, with empty memes catalog", () => {
    const memes = memeStudioService.getMemes();
    const gifs = memeStudioService.getGifs();
    const stickers = memeStudioService.getStickers();

    expect(memes.length).toBe(0);
    expect(gifs.length).toBeGreaterThan(5);
    expect(stickers.length).toBeGreaterThan(5);

    // Verify all GIFs have valid properties
    for (const g of gifs) {
      expect(g.type).toBe("gif");
      expect(g.url).toMatch(/\.gif/i);
      expect(g.title).toBeTruthy();
    }

    // Verify all stickers have valid properties
    for (const s of stickers) {
      expect(s.type).toBe("sticker");
      expect(s.url).toMatch(/^https?:\/\//);
      expect(s.title).toBeTruthy();
    }
  });

  it("should handle empty memes catalog queries gracefully", () => {
    const drakeResults = memeStudioService.getMemes("drake");
    expect(drakeResults.length).toBe(0);

    const dogeResults = memeStudioService.getMemes("doge");
    expect(dogeResults.length).toBe(0);
  });

  it("should filter GIFs accurately by keyword query", () => {
    const fireResults = memeStudioService.getGifs("fire");
    expect(fireResults.length).toBeGreaterThan(0);
    expect(fireResults.some((item) => item.id === "gif-this-is-fine")).toBe(true);

    const cheersResults = memeStudioService.getGifs("cheers");
    expect(cheersResults.length).toBeGreaterThan(0);
    expect(cheersResults.some((item) => item.id === "gif-leonardo-cheers")).toBe(true);
  });

  it("should filter by categories", () => {
    const workGifs = memeStudioService.getGifs("", "Work");
    expect(workGifs.length).toBeGreaterThan(0);
    for (const item of workGifs) {
      expect(item.category).toBe("Work");
    }

    const successMemes = memeStudioService.getMemes("", "Success");
    expect(successMemes.length).toBe(0);
  });

  it("should support category listings", () => {
    expect(MEME_CATEGORIES).toContain("All");
    expect(MEME_CATEGORIES).toContain("Trending");
    expect(MEME_CATEGORIES).toContain("Reaction");
    expect(MEME_CATEGORIES).toContain("Work");
  });
});
