import { describe, it, expect } from "vitest";
import { tokenizeCaptionText, buildProportionalWords } from "@/pages/Editor";
import type { Caption } from "@/lib/captions/types";

describe("Translation Pipeline & Word Alignment", () => {
  describe("Word Tokenization (tokenizeCaptionText)", () => {
    it("tokenizes English / Latin sentences with whitespace splitting", () => {
      const tokens = tokenizeCaptionText("Welcome to Subbly AI video captioning!", "en");
      expect(tokens).toEqual(["Welcome", "to", "Subbly", "AI", "video", "captioning!"]);
    });

    it("tokenizes Japanese text into meaningful segments using Intl.Segmenter", () => {
      const text = "数秒でAIキャプションを使って魅力的な動画を作成。";
      const tokens = tokenizeCaptionText(text, "ja");
      expect(tokens.length).toBeGreaterThan(1);
      expect(tokens).toContain("AI");
      expect(tokens).toContain("キャプション");
    });

    it("tokenizes Chinese text into meaningful segments using Intl.Segmenter", () => {
      const text = "用AI字幕在几秒钟内创建引人入胜的视频。";
      const tokens = tokenizeCaptionText(text, "zh");
      expect(tokens.length).toBeGreaterThan(1);
      expect(tokens).toContain("视频");
    });

    it("handles empty or whitespace strings gracefully", () => {
      expect(tokenizeCaptionText("")).toEqual([]);
      expect(tokenizeCaptionText("   ")).toEqual([]);
    });
  });

  describe("Proportional Word Timestamps (buildProportionalWords)", () => {
    it("creates proportional word timestamps across segment duration", () => {
      const words = buildProportionalWords("Create engaging videos", 1.0, 4.0, "en");
      expect(words.length).toBe(3);
      expect(words[0].text).toBe("Create");
      expect(words[0].start).toBe(1.0);
      expect(words[0].end).toBe(2.0);
      expect(words[1].text).toBe("engaging");
      expect(words[1].start).toBe(2.0);
      expect(words[1].end).toBe(3.0);
      expect(words[2].text).toBe("videos");
      expect(words[2].start).toBe(3.0);
      expect(words[2].end).toBe(4.0);
    });

    it("creates multiple segmented words for Japanese without spaces", () => {
      const words = buildProportionalWords("数秒でAIキャプションを作成", 0.0, 3.0, "ja");
      expect(words.length).toBeGreaterThan(1);
      expect(words[0].start).toBe(0.0);
      expect(words[words.length - 1].end).toBe(3.0);
    });
  });

  describe("Caption Translation State Management", () => {
    it("preserves originalWords and originalText when transitioning between languages", () => {
      const initialCaption: Caption = {
        id: "cap-1",
        start: 0.0,
        end: 2.5,
        text: "Hello world",
        originalText: "Hello world",
        words: [
          { text: "Hello", start: 0.0, end: 1.2 },
          { text: "world", start: 1.3, end: 2.5 },
        ],
        originalWords: [
          { text: "Hello", start: 0.0, end: 1.2 },
          { text: "world", start: 1.3, end: 2.5 },
        ],
      };

      // 1. User translates to Spanish
      const spanishText = "Hola mundo";
      const translatedCaption: Caption = {
        ...initialCaption,
        text: spanishText,
        words: buildProportionalWords(spanishText, initialCaption.start, initialCaption.end, "es"),
      };

      expect(translatedCaption.text).toBe("Hola mundo");
      expect(translatedCaption.words?.map((w) => w.text)).toEqual(["Hola", "mundo"]);
      expect(translatedCaption.originalWords).toEqual(initialCaption.originalWords);
      expect(translatedCaption.originalText).toBe("Hello world");

      // 2. User switches back to "auto"
      const restoredCaption: Caption = {
        ...translatedCaption,
        text: translatedCaption.originalText || translatedCaption.text,
        words: translatedCaption.originalWords ? [...translatedCaption.originalWords] : undefined,
      };

      expect(restoredCaption.text).toBe("Hello world");
      expect(restoredCaption.words).toEqual(initialCaption.originalWords);
      expect(restoredCaption.words?.[0].start).toBe(0.0);
      expect(restoredCaption.words?.[0].end).toBe(1.2);
    });

    it("does not mutate media overlays when filtering speech captions", () => {
      const items: Caption[] = [
        {
          id: "cap-1",
          start: 0.0,
          end: 2.0,
          text: "Spoken line",
        },
        {
          id: "meme-1",
          start: 1.0,
          end: 3.0,
          text: "Funny Cat Meme",
          mediaType: "meme",
          mediaUrl: "https://example.com/cat.gif",
        },
      ];

      const speechOnly = items.filter((c) => !c.mediaType);
      expect(speechOnly.length).toBe(1);
      expect(speechOnly[0].id).toBe("cap-1");
    });
  });
});
