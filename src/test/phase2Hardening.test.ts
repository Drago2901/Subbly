import { describe, it, expect } from "vitest";
import { escapeAss } from "@/lib/captions/ass";
import { validateMediaFile } from "@/lib/memeStudio/types";
import { MEME_CATEGORIES } from "@/lib/memeStudio/data";

describe("Phase 2 Bug Fixes & Security Hardening Tests", () => {
  describe("ASS subtitle escaping", () => {
    it("escapes backslashes in user caption text", () => {
      const input = "Path: C:\\Users\\Admin\\video.mp4";
      const escaped = escapeAss(input);
      expect(escaped).toBe("Path: C:\\\\Users\\\\Admin\\\\video.mp4");
    });

    it("escapes curly braces to parentheses to protect ASS override tags", () => {
      const input = "{b1}Hello{/b1}";
      const escaped = escapeAss(input);
      expect(escaped).toBe("(b1)Hello(/b1)");
    });

    it("converts newlines to ASS newline tags (\\N)", () => {
      const input = "Line 1\nLine 2";
      const escaped = escapeAss(input);
      expect(escaped).toBe("Line 1\\NLine 2");
    });

    it("handles combined backslashes, braces, and newlines safely", () => {
      const input = "{\\pos(100,100)}Test\\Note\nSecond Line";
      const escaped = escapeAss(input);
      expect(escaped).toBe("(\\\\pos(100,100))Test\\\\Note\\NSecond Line");
    });
  });

  describe("Meme Studio validation and categories", () => {
    it("classifies .svg files as sticker rather than image", () => {
      const svgFile = new File(["<svg></svg>"], "sticker_badge.svg", {
        type: "image/svg+xml",
      });
      const result = validateMediaFile(svgFile);
      expect(result.valid).toBe(true);
      expect(result.mediaType).toBe("sticker");
    });

    it("still classifies .png/.jpg as image", () => {
      const pngFile = new File(["dummy"], "photo.png", { type: "image/png" });
      const result = validateMediaFile(pngFile);
      expect(result.valid).toBe(true);
      expect(result.mediaType).toBe("image");
    });

    it("still classifies .gif as gif", () => {
      const gifFile = new File(["dummy"], "anim.gif", { type: "image/gif" });
      const result = validateMediaFile(gifFile);
      expect(result.valid).toBe(true);
      expect(result.mediaType).toBe("gif");
    });

    it("includes Emoji in MEME_CATEGORIES", () => {
      expect(MEME_CATEGORIES).toContain("Emoji");
    });
  });
});
