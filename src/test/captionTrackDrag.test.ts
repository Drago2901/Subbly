import { describe, it, expect } from "vitest";
import type { Caption } from "@/lib/captions/types";

describe("Caption Cross-Track Drag & Drop Logic", () => {
  const sampleCaptions: Caption[] = [
    {
      id: "cap-1",
      start: 1.0,
      end: 3.5,
      text: "Hello world this is caption 1",
      track: 1,
      words: [
        { text: "Hello", start: 1.0, end: 1.5 },
        { text: "world", start: 1.6, end: 2.2 },
        { text: "this", start: 2.3, end: 2.6 },
        { text: "is", start: 2.7, end: 2.9 },
        { text: "caption", start: 3.0, end: 3.3 },
        { text: "1", start: 3.3, end: 3.5 },
      ],
    },
    {
      id: "cap-2",
      start: 4.0,
      end: 6.0,
      text: "Hola mundo subtitulo 2",
      track: 2,
    },
  ];

  it("moves a caption from Caption 1 to Caption 2 while preserving timing", () => {
    const activeId = "cap-1";
    const targetTrack = 2;
    const dt = 0.5; // dragged 0.5s forward in time

    const updated = sampleCaptions.map((c) => {
      if (c.id !== activeId) return c;
      const len = c.end - c.start;
      const nextStart = c.start + dt;
      const words = c.words?.map((w) => ({
        ...w,
        start: w.start + dt,
        end: w.end + dt,
      }));
      return {
        ...c,
        start: nextStart,
        end: nextStart + len,
        words,
        track: targetTrack,
      };
    });

    const moved = updated.find((c) => c.id === "cap-1");
    expect(moved).toBeDefined();
    expect(moved?.track).toBe(2);
    expect(moved?.start).toBe(1.5);
    expect(moved?.end).toBe(4.0);
    expect(moved?.words?.[0].start).toBe(1.5);
    expect(moved?.words?.[0].end).toBe(2.0);
  });

  it("moves a caption from Caption 2 to Caption 1", () => {
    const activeId = "cap-2";
    const targetTrack = 1;

    const updated = sampleCaptions.map((c) => {
      if (c.id !== activeId) return c;
      return {
        ...c,
        track: targetTrack,
      };
    });

    const moved = updated.find((c) => c.id === "cap-2");
    expect(moved).toBeDefined();
    expect(moved?.track).toBe(1);
    expect(moved?.text).toBe("Hola mundo subtitulo 2");
  });

  it("prevents move if destination track is locked", () => {
    const lockedTracks = { caption1: false, caption2: true };
    const activeId = "cap-1";
    let targetTrack: number | undefined = undefined;

    // Simulate pointer move into Caption 2 zone
    const pointerInCap2Zone = true;
    if (pointerInCap2Zone) {
      if (!lockedTracks.caption2) {
        targetTrack = 2;
      }
    }

    // Since caption2 is locked, targetTrack remains undefined
    expect(targetTrack).toBeUndefined();

    const updated = sampleCaptions.map((c) => {
      if (c.id !== activeId) return c;
      const nextTrack = targetTrack !== undefined ? targetTrack : (c.track || 1);
      return { ...c, track: nextTrack };
    });

    expect(updated.find((c) => c.id === "cap-1")?.track).toBe(1);
  });

  it("duplicates caption to other track correctly", () => {
    const source = sampleCaptions[0];
    const dup: Caption = {
      ...source,
      id: "cap-1-dup",
      track: 2,
    };

    const nextCaptions = [...sampleCaptions, dup];
    expect(nextCaptions.length).toBe(3);
    expect(nextCaptions[2].id).toBe("cap-1-dup");
    expect(nextCaptions[2].track).toBe(2);
    expect(nextCaptions[2].text).toBe(source.text);
  });
});
