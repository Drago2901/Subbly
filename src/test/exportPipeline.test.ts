import { describe, it, expect, vi, afterEach } from "vitest";
import {
  computeExportResolution,
  computeDrawRect,
  computeTimelineFrames,
  getExportMimeType,
  ExportCancelledError,
} from "@/lib/captions/render";
import { validateExportDuration } from "@/lib/captions/transcode";

describe("Video Export Pipeline Hardening Tests", () => {
  describe("Resolution calculations (computeExportResolution)", () => {
    it("computes 720p portrait correctly", () => {
      const res = computeExportResolution(1080, 1920, "standard");
      expect(res.width).toBe(720);
      expect(res.height).toBe(1280);
      expect(res.width % 2).toBe(0);
      expect(res.height % 2).toBe(0);
    });

    it("computes 1080p portrait correctly", () => {
      const res = computeExportResolution(1080, 1920, "high");
      expect(res.width).toBe(1080);
      expect(res.height).toBe(1920);
      expect(res.width % 2).toBe(0);
      expect(res.height % 2).toBe(0);
    });

    it("computes 720p landscape correctly", () => {
      const res = computeExportResolution(1920, 1080, "standard");
      expect(res.width).toBe(1280);
      expect(res.height).toBe(720);
      expect(res.width % 2).toBe(0);
      expect(res.height % 2).toBe(0);
    });

    it("computes 1080p landscape correctly", () => {
      const res = computeExportResolution(1920, 1080, "high");
      expect(res.width).toBe(1920);
      expect(res.height).toBe(1080);
      expect(res.width % 2).toBe(0);
      expect(res.height % 2).toBe(0);
    });

    it("computes square dimensions correctly", () => {
      const res = computeExportResolution(1000, 1000, "high");
      expect(res.width).toBe(1080);
      expect(res.height).toBe(1080);
      expect(res.width % 2).toBe(0);
      expect(res.height % 2).toBe(0);
    });

    it("handles odd source dimensions by ensuring even dimensions for encoding", () => {
      // 853x481 is an odd aspect ratio
      const res = computeExportResolution(853, 481, "standard");
      expect(res.width % 2).toBe(0);
      expect(res.height % 2).toBe(0);
    });

    it("respects custom output override dimensions", () => {
      const res = computeExportResolution(1920, 1080, undefined, { width: 640, height: 360 });
      expect(res.width).toBe(640);
      expect(res.height).toBe(360);
    });
  });

  describe("Draw rectangle math (computeDrawRect)", () => {
    it("handles cover mode: landscape source to portrait destination (crops sides)", () => {
      // 1920x1080 into 1080x1920
      const rect = computeDrawRect(1920, 1080, 1080, 1920, "cover");
      expect(rect.h).toBe(1920);
      expect(rect.w).toBeCloseTo(1920 * (1920 / 1080), 1);
      // Centered horizontally: x should be negative
      expect(rect.x).toBeLessThan(0);
      expect(rect.y).toBe(0);
    });

    it("handles cover mode: portrait source to landscape destination (crops top/bottom)", () => {
      // 1080x1920 into 1920x1080
      const rect = computeDrawRect(1080, 1920, 1920, 1080, "cover");
      expect(rect.w).toBe(1920);
      expect(rect.h).toBeCloseTo(1920 * (1920 / 1080), 1);
      // Centered vertically: y should be negative
      expect(rect.y).toBeLessThan(0);
      expect(rect.x).toBe(0);
    });

    it("handles contain mode: landscape source to portrait destination (pillarboxes/letterboxes)", () => {
      // 1920x1080 into 1080x1920
      const rect = computeDrawRect(1920, 1080, 1080, 1920, "contain");
      expect(rect.w).toBe(1080);
      expect(rect.h).toBeCloseTo(1080 / (1920 / 1080), 1);
      expect(rect.x).toBe(0);
      // Centered vertically with black bars
      expect(rect.y).toBeGreaterThan(0);
      expect(rect.y + rect.h / 2).toBeCloseTo(1920 / 2, 1);
    });

    it("handles contain mode: portrait source to landscape destination", () => {
      // 1080x1920 into 1920x1080
      const rect = computeDrawRect(1080, 1920, 1920, 1080, "contain");
      expect(rect.h).toBe(1080);
      expect(rect.w).toBeCloseTo(1080 * (1080 / 1920), 1);
      expect(rect.y).toBe(0);
      // Centered horizontally with black bars
      expect(rect.x).toBeGreaterThan(0);
      expect(rect.x + rect.w / 2).toBeCloseTo(1920 / 2, 1);
    });

    it("handles zero or invalid source dimensions safely without dividing by zero", () => {
      const rect = computeDrawRect(0, 0, 1280, 720, "contain");
      expect(rect.x).toBe(0);
      expect(rect.y).toBe(0);
      expect(rect.w).toBe(1280);
      expect(rect.h).toBe(720);
    });
  });

  describe("MIME selection (getExportMimeType)", () => {
    const originalMediaRecorder = window.MediaRecorder;

    afterEach(() => {
      window.MediaRecorder = originalMediaRecorder;
    });

    it("prioritizes video/webm;codecs=vp9,opus when supported", () => {
      window.MediaRecorder = {
        isTypeSupported: vi.fn((type: string) => type === "video/webm;codecs=vp9,opus"),
      } as unknown as typeof MediaRecorder;

      const mime = getExportMimeType();
      expect(mime).toBe("video/webm;codecs=vp9,opus");
    });

    it("falls back to video/webm;codecs=vp8,opus when vp9 is not supported", () => {
      window.MediaRecorder = {
        isTypeSupported: vi.fn((type: string) => type === "video/webm;codecs=vp8,opus"),
      } as unknown as typeof MediaRecorder;

      const mime = getExportMimeType();
      expect(mime).toBe("video/webm;codecs=vp8,opus");
    });

    it("falls back to basic video/webm when specific codecs are not reported", () => {
      window.MediaRecorder = {
        isTypeSupported: vi.fn((type: string) => type === "video/webm"),
      } as unknown as typeof MediaRecorder;

      const mime = getExportMimeType();
      expect(mime).toBe("video/webm");
    });

    it("falls back to video/mp4 when webm is unsupported (e.g. Safari legacy)", () => {
      window.MediaRecorder = {
        isTypeSupported: vi.fn((type: string) => type === "video/mp4;codecs=avc1,mp4a.40.2"),
      } as unknown as typeof MediaRecorder;

      const mime = getExportMimeType();
      expect(mime).toBe("video/mp4;codecs=avc1,mp4a.40.2");
    });

    it("returns empty string when no supported MIME type is found", () => {
      window.MediaRecorder = {
        isTypeSupported: vi.fn(() => false),
      } as unknown as typeof MediaRecorder;

      const mime = getExportMimeType();
      expect(mime).toBe("");
    });
  });

  describe("Deterministic frame calculation (computeTimelineFrames)", () => {
    it("calculates exactly 300 frames for 10s at 30 fps", () => {
      const { timestamps, totalFrames } = computeTimelineFrames(10.0, 30);
      expect(totalFrames).toBe(300);
      expect(timestamps).toHaveLength(300);
      expect(timestamps[0]).toBe(0);
      expect(timestamps[299]).toBe(10.0);

      // Verify strict monotonicity
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]);
      }
    });

    it("handles short 0.2s video at 30 fps (6 frames)", () => {
      const { timestamps, totalFrames } = computeTimelineFrames(0.2, 30);
      expect(totalFrames).toBe(6);
      expect(timestamps).toHaveLength(6);
      expect(timestamps[0]).toBe(0);
      expect(timestamps[5]).toBe(0.2);

      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]);
      }
    });

    it("handles short 0.5s video at 30 fps (15 frames)", () => {
      const { timestamps, totalFrames } = computeTimelineFrames(0.5, 30);
      expect(totalFrames).toBe(15);
      expect(timestamps[0]).toBe(0);
      expect(timestamps[14]).toBe(0.5);
    });

    it("handles short 1.0s video at 30 fps (30 frames)", () => {
      const { timestamps, totalFrames } = computeTimelineFrames(1.0, 30);
      expect(totalFrames).toBe(30);
      expect(timestamps[0]).toBe(0);
      expect(timestamps[29]).toBe(1.0);
    });

    it("handles long video 300s (5 minutes) at 30 fps (9000 frames)", () => {
      const { timestamps, totalFrames } = computeTimelineFrames(300, 30);
      expect(totalFrames).toBe(9000);
      expect(timestamps[0]).toBe(0);
      expect(timestamps[8999]).toBe(300);
    });

    it("never allows timestamps to exceed duration", () => {
      const duration = 7.33;
      const { timestamps } = computeTimelineFrames(duration, 30);
      timestamps.forEach((t) => {
        expect(t).toBeLessThanOrEqual(duration);
      });
      expect(timestamps[timestamps.length - 1]).toBe(duration);
    });
  });

  describe("Cancellation & Error Handling", () => {
    it("instantiates ExportCancelledError with correct name and inheritance", () => {
      const err = new ExportCancelledError();
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe("ExportCancelledError");
      expect(err.message).toBe("Export cancelled");
    });

    it("aborts when signal is already aborted before starting", async () => {
      const controller = new AbortController();
      controller.abort();

      const { burnCaptions } = await import("@/lib/captions/render");
      const dummyFile = new File(["dummy"], "test.mp4", { type: "video/mp4" });

      await expect(
        burnCaptions({
          videoFile: dummyFile,
          captions: [],
          style: {} as unknown as import("@/lib/captions/types").CaptionStyle,
          signal: controller.signal,
        })
      ).rejects.toThrow("Export cancelled");
    });
  });

  describe("Duration Validation (validateExportDuration)", () => {
    it("safely passes when URL.createObjectURL is unavailable in headless environments", async () => {
      const dummyBlob = new Blob(["dummy"], { type: "video/mp4" });
      const result = await validateExportDuration(dummyBlob, 10.0, 1.0);
      expect(result.valid).toBe(true);
      expect(result.actualDuration).toBe(10.0);
    });

    it("validates successfully when video duration matches expected duration within tolerance", async () => {
      const origCreate = URL.createObjectURL;
      const origRevoke = URL.revokeObjectURL;
      const origCreateElement = document.createElement.bind(document);

      try {
        URL.createObjectURL = vi.fn(() => "blob:mock-url");
        URL.revokeObjectURL = vi.fn();

        vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
          if (tag === "video") {
            const el = origCreateElement("video");
            Object.defineProperty(el, "duration", { value: 10.2, configurable: true });
            // Simulate synchronous or immediate metadata trigger
            setTimeout(() => {
              if (el.onloadedmetadata) (el.onloadedmetadata as unknown as () => void)();
            }, 5);
            return el;
          }
          return origCreateElement(tag);
        });

        const dummyBlob = new Blob(["dummy"], { type: "video/mp4" });
        const result = await validateExportDuration(dummyBlob, 10.0, 1.0);
        expect(result.valid).toBe(true);
        expect(result.actualDuration).toBe(10.2);
      } finally {
        URL.createObjectURL = origCreate;
        URL.revokeObjectURL = origRevoke;
        vi.restoreAllMocks();
      }
    });

    it("detects and flags significant duration discrepancy", async () => {
      const origCreate = URL.createObjectURL;
      const origRevoke = URL.revokeObjectURL;
      const origCreateElement = document.createElement.bind(document);

      try {
        URL.createObjectURL = vi.fn(() => "blob:mock-url");
        URL.revokeObjectURL = vi.fn();

        vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
          if (tag === "video") {
            const el = origCreateElement("video");
            // Video ended up being 3.0s instead of expected 10.0s (70% shorter)
            Object.defineProperty(el, "duration", { value: 3.0, configurable: true });
            setTimeout(() => {
              if (el.onloadedmetadata) (el.onloadedmetadata as unknown as () => void)();
            }, 5);
            return el;
          }
          return origCreateElement(tag);
        });

        const dummyBlob = new Blob(["dummy"], { type: "video/mp4" });
        const result = await validateExportDuration(dummyBlob, 10.0, 1.0);
        expect(result.valid).toBe(false);
        expect(result.actualDuration).toBe(3.0);
        expect(result.error).toContain("diverges from expected duration");
      } finally {
        URL.createObjectURL = origCreate;
        URL.revokeObjectURL = origRevoke;
        vi.restoreAllMocks();
      }
    });
  });
});
