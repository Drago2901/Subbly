/**
 * Video Thumbnail Strip Extractor
 * Extracts real frame thumbnails at periodic intervals across the video duration using offscreen canvas rendering.
 * Caches results in memory for high-performance timeline scrolling.
 */

import { useState, useEffect } from "react";

export interface VideoThumbnail {
  time: number;
  dataUrl: string;
}

const thumbnailCache = new Map<string, VideoThumbnail[]>();

/**
 * Extracts a sequence of frame thumbnails across the video timeline.
 */
export async function extractVideoThumbnails(
  videoUrl: string,
  duration: number,
  count = 16,
  cacheKey?: string
): Promise<VideoThumbnail[]> {
  const key = cacheKey || `${videoUrl}-${duration}-${count}`;
  if (thumbnailCache.has(key)) {
    return thumbnailCache.get(key)!;
  }

  if (!videoUrl || duration <= 0) {
    return [];
  }

  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = videoUrl;

    const thumbnails: VideoThumbnail[] = [];
    const interval = duration / count;
    let currentIndex = 0;

    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 54;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    let timeoutId: number;

    const cleanup = () => {
      clearTimeout(timeoutId);
      video.removeAttribute("src");
      video.load();
    };

    // Safety timeout: resolve whatever thumbnails were captured within 12 seconds
    timeoutId = window.setTimeout(() => {
      cleanup();
      if (thumbnails.length > 0) {
        thumbnailCache.set(key, thumbnails);
        resolve(thumbnails);
      } else {
        resolve([]);
      }
    }, 12000);

    const captureNextFrame = () => {
      if (currentIndex >= count) {
        cleanup();
        thumbnailCache.set(key, thumbnails);
        resolve(thumbnails);
        return;
      }

      const targetTime = Math.min(duration - 0.05, Math.max(0.05, currentIndex * interval));
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      if (ctx) {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.65);
          thumbnails.push({
            time: currentIndex * interval,
            dataUrl,
          });
        } catch {
          // Canvas tainted or draw error
        }
      }
      currentIndex++;
      captureNextFrame();
    };

    video.onloadedmetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        const ar = video.videoWidth / video.videoHeight;
        canvas.height = 54;
        canvas.width = Math.round(54 * ar);
      }
      captureNextFrame();
    };

    video.onerror = () => {
      cleanup();
      resolve(thumbnails);
    };
  });
}

/**
 * React hook to load and cache video thumbnails.
 */
export function useVideoThumbnails(videoUrl: string | null, duration: number, count = 16) {
  const [thumbnails, setThumbnails] = useState<VideoThumbnail[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!videoUrl || duration <= 0) {
      setThumbnails([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    extractVideoThumbnails(videoUrl, duration, count)
      .then((thumbs) => {
        if (isMounted) {
          setThumbnails(thumbs);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [videoUrl, duration, count]);

  return { thumbnails, loading };
}
