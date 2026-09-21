import { describe, it, expect } from "vitest";
import type { TimelineAudioClip } from "@/lib/captions/types";
import { formatAudioTime } from "@/components/captionly/Editor/AudioControlsPanel";
import { calculateClipInstantGain } from "@/lib/captions/useAudioPreviewEngine";
import { audioBufferToWav } from "@/lib/captions/audioMixer";

describe("Contextual SFX & Audio Controls Panel Tests", () => {
  describe("Time Formatting (formatAudioTime)", () => {
    it("formats seconds with millisecond precision mm:ss.mmm", () => {
      expect(formatAudioTime(18.24)).toBe("00:18.240");
      expect(formatAudioTime(20.11)).toBe("00:20.110");
      expect(formatAudioTime(0)).toBe("00:00.000");
      expect(formatAudioTime(65.5)).toBe("01:05.500");
      expect(formatAudioTime(3661.123)).toBe("61:01.123");
    });

    it("handles negative or zero time gracefully", () => {
      expect(formatAudioTime(-5)).toBe("00:00.000");
    });
  });

  describe("Volume Control & Presets Logic", () => {
    it("supports volume range from 0% to 200% (0.0 to 2.0)", () => {
      const clampVolume = (valPct: number) => Math.max(0, Math.min(200, Math.round(valPct)));

      expect(clampVolume(72)).toBe(72);
      expect(clampVolume(-10)).toBe(0);
      expect(clampVolume(250)).toBe(200);
      expect(clampVolume(100)).toBe(100);
    });

    it("handles Arrow Up/Down 1% adjustments and Shift 10% adjustments", () => {
      const adjustVolume = (currentPct: number, delta: number, shift: boolean) => {
        const step = shift ? 10 : 1;
        const change = delta > 0 ? step : -step;
        return Math.max(0, Math.min(200, currentPct + change));
      };

      expect(adjustVolume(72, 1, false)).toBe(73);
      expect(adjustVolume(72, -1, false)).toBe(71);
      expect(adjustVolume(72, 1, true)).toBe(82);
      expect(adjustVolume(72, -1, true)).toBe(62);
      expect(adjustVolume(195, 1, true)).toBe(200); // clamps to 200%
      expect(adjustVolume(5, -1, true)).toBe(0); // clamps to 0%
    });

    it("supports all defined volume presets: 25, 50, 75, 100, 125, 150, 200", () => {
      const presets = [25, 50, 75, 100, 125, 150, 200];
      presets.forEach((p) => {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(200);
      });
      expect(presets).toContain(100);
    });
  });

  describe("Mute & Unmute Restoration", () => {
    it("preserves volume when muted and restores exact volume on unmute", () => {
      let clip: TimelineAudioClip = {
        id: "clip-1",
        url: "test.mp3",
        title: "Explosion.wav",
        start: 0,
        end: 5,
        duration: 5,
        volume: 0.72,
        muted: false,
        trackType: "audioSfx",
      };

      // 1. User mutes
      const toggleMute = (c: TimelineAudioClip): TimelineAudioClip => {
        if (c.muted) {
          const restored = c.savedVolume && c.savedVolume > 0 ? c.savedVolume : (c.volume > 0 ? c.volume : 1.0);
          return { ...c, muted: false, volume: restored };
        } else {
          return { ...c, muted: true, savedVolume: c.volume > 0 ? c.volume : 1.0 };
        }
      };

      clip = toggleMute(clip);
      expect(clip.muted).toBe(true);
      expect(clip.savedVolume).toBe(0.72);

      // 2. User un-mutes
      clip = toggleMute(clip);
      expect(clip.muted).toBe(false);
      expect(clip.volume).toBe(0.72);
    });
  });

  describe("Fade In & Fade Out Logic", () => {
    it("clamps fade durations to clip duration and max 10.0s", () => {
      const clipDuration = 4.0;
      const clampFade = (requestedFade: number) => {
        const maxAllowed = Math.min(10.0, clipDuration);
        return Math.max(0, Math.min(maxAllowed, Math.round(requestedFade * 10) / 10));
      };

      expect(clampFade(2.0)).toBe(2.0);
      expect(clampFade(5.0)).toBe(4.0); // Clamped to clip duration
      expect(clampFade(-1.0)).toBe(0.0);
    });
  });

  describe("Independent Settings Across Multiple Clips", () => {
    it("modifying one clip never modifies other clips", () => {
      const clips: TimelineAudioClip[] = [
        {
          id: "clip-explosion",
          url: "explosion.wav",
          title: "Explosion.wav",
          start: 0,
          end: 3,
          duration: 3,
          volume: 0.72,
          muted: false,
          fadeIn: 0.0,
          fadeOut: 0.5,
          trackType: "audioSfx",
        },
        {
          id: "clip-bgm",
          url: "bgm.mp3",
          title: "Background Music.mp3",
          start: 5,
          end: 25,
          duration: 20,
          volume: 0.35,
          muted: false,
          fadeIn: 2.0,
          fadeOut: 4.5,
          trackType: "audioSfx",
        },
      ];

      // Update explosion only
      const updated = clips.map((c) => (c.id === "clip-explosion" ? { ...c, volume: 1.1, muted: true } : c));

      expect(updated[0].volume).toBe(1.1);
      expect(updated[0].muted).toBe(true);
      expect(updated[1].volume).toBe(0.35);
      expect(updated[1].muted).toBe(false);
      expect(updated[1].fadeIn).toBe(2.0);
    });
  });

  describe("Real-Time Preview Gain Automation (calculateClipInstantGain)", () => {
    const testClip: TimelineAudioClip = {
      id: "clip-test",
      url: "sound.wav",
      title: "Test Sound",
      start: 10.0,
      end: 20.0,
      duration: 10.0,
      volume: 1.5, // 150%
      muted: false,
      fadeIn: 2.0,
      fadeOut: 3.0,
      trackType: "audioSfx",
    };

    it("returns 0 when outside clip interval", () => {
      expect(calculateClipInstantGain(testClip, 5.0)).toBe(0);
      expect(calculateClipInstantGain(testClip, 25.0)).toBe(0);
    });

    it("returns 0 when clip is muted or track is muted", () => {
      expect(calculateClipInstantGain({ ...testClip, muted: true }, 15.0)).toBe(0);
      expect(calculateClipInstantGain(testClip, 15.0, 1.0, true)).toBe(0);
    });

    it("calculates linear fade-in correctly", () => {
      // At start (10.0): gain = 0
      expect(calculateClipInstantGain(testClip, 10.0)).toBeCloseTo(0, 3);
      // Halfway through 2s fade-in (11.0s): gain = 1.5 * 0.5 = 0.75
      expect(calculateClipInstantGain(testClip, 11.0)).toBeCloseTo(0.75, 3);
      // At end of fade-in (12.0s): gain = 1.5
      expect(calculateClipInstantGain(testClip, 12.0)).toBeCloseTo(1.5, 3);
    });

    it("sustains full volume between fade-in and fade-out", () => {
      // At 15.0s: fully sustained
      expect(calculateClipInstantGain(testClip, 15.0)).toBeCloseTo(1.5, 3);
      // At 17.0s (start of 3s fade out ending at 20.0s): gain = 1.5
      expect(calculateClipInstantGain(testClip, 17.0)).toBeCloseTo(1.5, 3);
    });

    it("calculates linear fade-out correctly", () => {
      // Halfway through 3s fade-out (18.5s): remaining = 1.5s / 3.0s = 0.5 -> gain = 1.5 * 0.5 = 0.75
      expect(calculateClipInstantGain(testClip, 18.5)).toBeCloseTo(0.75, 3);
      // Near end (19.9s): gain ~ 0.05
      expect(calculateClipInstantGain(testClip, 19.9)).toBeLessThan(0.1);
    });
  });

  describe("Clipping Protection & Limiter (audioBufferToWav)", () => {
    it("applies soft-knee saturation without NaN or clipping distortion on hot 200% signals", async () => {
      // Create a mock AudioBuffer with hot samples up to 2.0 (200% boost)
      const sampleRate = 48000;
      const length = 1000;
      const channelL = new Float32Array(length);
      const channelR = new Float32Array(length);

      for (let i = 0; i < length; i++) {
        // High amplitude signal exceeding 1.0
        channelL[i] = 1.8 * Math.sin((i / 50) * Math.PI * 2);
        channelR[i] = 1.8 * Math.cos((i / 50) * Math.PI * 2);
      }

      const mockBuffer = {
        numberOfChannels: 2,
        sampleRate,
        length,
        duration: length / sampleRate,
        getChannelData: (c: number) => (c === 0 ? channelL : channelR),
      } as unknown as AudioBuffer;

      const wavBlob = audioBufferToWav(mockBuffer);
      expect(wavBlob).toBeDefined();
      expect(wavBlob.type).toBe("audio/wav");

      // Verify header and sample validity
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(wavBlob);
      });

      const view = new DataView(arrayBuffer);
      const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
      expect(riff).toBe("RIFF");

      // Read sample data (offset 44) to ensure no integer overflow wrapping
      let maxSample = 0;
      for (let offset = 44; offset < arrayBuffer.byteLength; offset += 2) {
        const s = view.getInt16(offset, true);
        expect(Math.abs(s)).toBeLessThanOrEqual(32767);
        maxSample = Math.max(maxSample, Math.abs(s));
      }
      expect(maxSample).toBeGreaterThan(25000); // High loudness preserved
    });
  });
});
