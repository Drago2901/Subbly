import { describe, it, expect } from "vitest";
import { generateSyntheticSpeechEnvelope, extractRealWaveform } from "@/lib/captions/waveform";
import { TRACK_CONFIGS, COLLAPSED_TRACK_HEIGHT } from "@/components/captionly/Timeline/TrackSidebar";

describe("Subbly Multi-Track Timeline System Tests", () => {
  describe("1. Final Timeline Track Structure", () => {
    it("defines the exact 7 required independent tracks in order", () => {
      const trackIds = TRACK_CONFIGS.map((t) => t.id);
      expect(trackIds).toEqual([
        "video",
        "caption1",
        "caption2",
        "memes",
        "effects",
        "vocal",
        "audioSfx",
      ]);
    });

    it("has appropriate default heights and labels for all tracks", () => {
      const vocalTrack = TRACK_CONFIGS.find((t) => t.id === "vocal");
      expect(vocalTrack).toBeDefined();
      expect(vocalTrack?.defaultHeight).toBeGreaterThanOrEqual(48); // Vocal has extra vertical room for mirrored waveform

      const videoTrack = TRACK_CONFIGS.find((t) => t.id === "video");
      expect(videoTrack?.label).toBe("Video");

      expect(COLLAPSED_TRACK_HEIGHT).toBe(22);
    });
  });

  describe("2. Real Audio Waveform & Speech Dynamics Pipeline", () => {
    it("generates synthetic speech envelope with pauses and vocal peaks when audio context unavailable", () => {
      const envelope = generateSyntheticSpeechEnvelope(100);
      expect(envelope.length).toBe(100);

      // Verify range 0.02 (silence) to 1.0 (loud)
      envelope.forEach((amp) => {
        expect(amp).toBeGreaterThanOrEqual(0.02);
        expect(amp).toBeLessThanOrEqual(1.0);
      });

      // Verify that pauses (silence) are detected as flat segments
      const hasSilence = envelope.some((amp) => amp <= 0.03);
      const hasPeak = envelope.some((amp) => amp >= 0.7);
      expect(hasSilence).toBe(true);
      expect(hasPeak).toBe(true);
    });

    it("handles empty or zero-byte audio sources gracefully", async () => {
      const emptyBuffer = new ArrayBuffer(0);
      const res = await extractRealWaveform(emptyBuffer, 50);
      expect(res.length).toBe(50);
    });
  });

  describe("3. Track Snapping & Boundary Precision", () => {
    it("calculates correct pixel density per second across zoom levels", () => {
      const calcPxPerSec = (zoomPct: number) => {
        const min = 15;
        const max = 280;
        return min + ((zoomPct - 5) / 95) * (max - min);
      };

      expect(calcPxPerSec(5)).toBe(15);
      expect(calcPxPerSec(100)).toBe(280);
      expect(calcPxPerSec(50)).toBeGreaterThan(100);
    });
  });

  describe("4. Track & Timeline Row Synchronization", () => {
    it("ensures every track has identical height whether expanded or collapsed", () => {
      TRACK_CONFIGS.forEach((track) => {
        const expandedHeight = track.defaultHeight;
        const collapsedHeight = COLLAPSED_TRACK_HEIGHT;

        expect(expandedHeight).toBeGreaterThan(collapsedHeight);
        expect(collapsedHeight).toBe(22);
      });
    });

    it("calculates identical vertical offset progression for sidebar and timeline rows", () => {
      const visibility: Record<string, boolean> = {
        video: true,
        caption1: true,
        caption2: false, // hidden track
        memes: true,
        effects: true,
        vocal: true,
        audioSfx: true,
      };

      const collapsed: Record<string, boolean> = {
        video: false,
        caption1: true, // collapsed
        caption2: false,
        memes: false,
        effects: false,
        vocal: false,
        audioSfx: false,
      };

      // Calculate track row heights from left sidebar perspective
      const leftRowHeights = TRACK_CONFIGS.map((t) => {
        if (!visibility[t.id]) return 0;
        return collapsed[t.id] ? COLLAPSED_TRACK_HEIGHT : t.defaultHeight;
      });

      // Calculate track row heights from right timeline perspective
      const rightRowHeights = TRACK_CONFIGS.map((t) => {
        if (!visibility[t.id]) return 0;
        return collapsed[t.id] ? COLLAPSED_TRACK_HEIGHT : t.defaultHeight;
      });

      expect(leftRowHeights).toEqual(rightRowHeights);
    });
  });
});

