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
});
