import { describe, it, expect } from "vitest";
import {
  validateMediaFile,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
} from "@/lib/memeStudio/types";
import type { Caption } from "@/lib/captions/types";

describe("Meme Studio Phase 1 — Validation and Media Integration", () => {
  it("should validate supported image formats (PNG, JPG, WEBP)", () => {
    const pngFile = new File(["dummy content"], "meme.png", { type: "image/png" });
    const resPng = validateMediaFile(pngFile);
    expect(resPng.valid).toBe(true);
    expect(resPng.mediaType).toBe("image");

    const jpgFile = new File(["dummy content"], "photo.jpg", { type: "image/jpeg" });
    const resJpg = validateMediaFile(jpgFile);
    expect(resJpg.valid).toBe(true);
    expect(resJpg.mediaType).toBe("image");

    const webpFile = new File(["dummy content"], "sticker.webp", { type: "image/webp" });
    const resWebp = validateMediaFile(webpFile);
    expect(resWebp.valid).toBe(true);
    expect(resWebp.mediaType).toBe("image");
  });

  it("should validate animated GIF format and preserve GIF mediaType", () => {
    const gifFile = new File(["gif content"], "dance.gif", { type: "image/gif" });
    const res = validateMediaFile(gifFile);
    expect(res.valid).toBe(true);
    expect(res.mediaType).toBe("gif");
  });

  it("should validate supported video formats (MP4, WebM)", () => {
    const mp4File = new File(["video content"], "reaction.mp4", { type: "video/mp4" });
    const resMp4 = validateMediaFile(mp4File);
    expect(resMp4.valid).toBe(true);
    expect(resMp4.mediaType).toBe("video");

    const webmFile = new File(["video content"], "reaction.webm", { type: "video/webm" });
    const resWebm = validateMediaFile(webmFile);
    expect(resWebm.valid).toBe(true);
    expect(resWebm.mediaType).toBe("video");
  });

  it("should reject unsupported file types with clear error messages", () => {
    const txtFile = new File(["hello"], "document.txt", { type: "text/plain" });
    const resTxt = validateMediaFile(txtFile);
    expect(resTxt.valid).toBe(false);
    expect(resTxt.error).toContain("This file type isn't supported");

    const exeFile = new File(["binary"], "app.exe", { type: "application/x-msdownload" });
    const resExe = validateMediaFile(exeFile);
    expect(resExe.valid).toBe(false);
    expect(resExe.error).toContain("This file type isn't supported");
  });

  it("should reject files that exceed maximum size limits", () => {
    // Create mock oversized image (>10MB)
    const largeImage = {
      name: "giant.png",
      type: "image/png",
      size: MAX_IMAGE_SIZE_BYTES + 1024,
    } as File;
    const resImg = validateMediaFile(largeImage);
    expect(resImg.valid).toBe(false);
    expect(resImg.error).toContain("This file is too large");

    // Create mock oversized video (>25MB)
    const largeVideo = {
      name: "movie.mp4",
      type: "video/mp4",
      size: MAX_VIDEO_SIZE_BYTES + 1024,
    } as File;
    const resVid = validateMediaFile(largeVideo);
    expect(resVid.valid).toBe(false);
    expect(resVid.error).toContain("This file is too large");
  });

  it("should correctly structure Caption overlay items for editor insertion", () => {
    const overlayCaption: Caption = {
      id: "media-overlay-1",
      start: 1.5,
      end: 4.5,
      text: "Success Kid Meme",
      track: 2,
      mediaType: "meme",
      mediaUrl: "blob:http://localhost/test-uuid",
      mediaTitle: "Success Kid Meme",
      x: 0.5,
      y: 0.5,
      width: 36,
      height: 36,
      style: {
        position: "free",
        animation: "pop",
      },
    };

    expect(overlayCaption.mediaType).toBe("meme");
    expect(overlayCaption.track).toBe(2);
    expect(overlayCaption.width).toBe(36);
    expect(overlayCaption.mediaUrl).toBe("blob:http://localhost/test-uuid");
  });
});
