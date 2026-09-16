import { describe, it, expect } from "vitest";
import { wordsToCaptions } from "../lib/captions/segment";
import type { Word } from "../lib/captions/types";

describe("Caption Pipeline & Word Segmentation Tests", () => {
  it("joins words with spaces properly and never squishes words together", () => {
    const rawWords: Word[] = [
      { text: "Hello", start: 0.1, end: 0.5, type: "word" },
      { text: "world", start: 0.6, end: 0.9, type: "word" },
      { text: "this", start: 1.0, end: 1.2, type: "word" },
      { text: "is", start: 1.3, end: 1.5, type: "word" },
      { text: "a", start: 1.6, end: 1.7, type: "word" },
      { text: "test.", start: 1.8, end: 2.2, type: "word" },
    ];

    const captions = wordsToCaptions(rawWords);
    expect(captions.length).toBeGreaterThan(0);

    // Verify all caption texts have spaces between words
    for (const cap of captions) {
      expect(cap.text).not.toContain("Helloworld");
      expect(cap.text).not.toContain("thisis");
      expect(cap.text).not.toContain("atest");
      expect(cap.text.split(" ").length).toBeGreaterThanOrEqual(1);
    }

    const fullText = captions.map((c) => c.text).join(" ");
    expect(fullText).toBe("Hello world this is a test.");
  });

  it("filters out ElevenLabs spacing tokens and audio events", () => {
    const rawWords: Word[] = [
      { text: "Welcome", start: 0.0, end: 0.4, type: "word" },
      { text: " ", start: 0.4, end: 0.5, type: "spacing" },
      { text: "[laughter]", start: 0.5, end: 0.8, type: "audio_event" },
      { text: "to", start: 0.9, end: 1.1, type: "word" },
      { text: " ", start: 1.1, end: 1.2, type: "spacing" },
      { text: "Subbly!", start: 1.3, end: 1.8, type: "word" },
    ];

    const captions = wordsToCaptions(rawWords);
    expect(captions.length).toBe(1);
    expect(captions[0].text).toBe("Welcome to Subbly!");

    // Verify caption.words contains only clean real words without spacing or audio events
    expect(captions[0].words).toBeDefined();
    expect(captions[0].words!.length).toBe(3);
    expect(captions[0].words!.map((w) => w.text)).toEqual(["Welcome", "to", "Subbly!"]);
    expect(captions[0].words!.some((w) => w.type === "spacing")).toBe(false);
  });

  it("breaks clauses on sentence punctuation and natural pauses", () => {
    const rawWords: Word[] = [
      { text: "First", start: 0.0, end: 0.3, type: "word" },
      { text: "sentence.", start: 0.4, end: 0.8, type: "word" },
      // Long gap of 0.8s
      { text: "Second", start: 1.6, end: 2.0, type: "word" },
      { text: "sentence", start: 2.1, end: 2.5, type: "word" },
      { text: "here!", start: 2.6, end: 3.0, type: "word" },
    ];

    const captions = wordsToCaptions(rawWords);
    expect(captions.length).toBe(2);
    expect(captions[0].text).toBe("First sentence.");
    expect(captions[1].text).toBe("Second sentence here!");
  });

  it("enforces monotonic timestamps and minimum duration per caption", () => {
    const rawWords: Word[] = [
      { text: "Quick", start: 1.0, end: 1.05, type: "word" },
      { text: "word", start: 1.06, end: 1.1, type: "word" },
    ];

    const captions = wordsToCaptions(rawWords);
    expect(captions.length).toBe(1);
    // Even if words lasted only 0.1s, caption duration must be at least 0.3s for visual legibility
    expect(captions[0].end - captions[0].start).toBeGreaterThanOrEqual(0.3);
    expect(captions[0].end).toBeGreaterThan(captions[0].start);
  });

  it("handles empty and malformed word arrays gracefully without throwing", () => {
    expect(wordsToCaptions([])).toEqual([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(wordsToCaptions(null as any)).toEqual([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(wordsToCaptions([{ text: "", start: 0, end: 0 } as any])).toEqual([]);
  });
});
