import { useEffect, useRef, useState } from "react";
import type { TimelineAudioClip } from "./types";

interface UseAudioPreviewEngineOptions {
  isPlaying: boolean;
  currentTime: number;
  audioClips: TimelineAudioClip[];
  vocalVolume?: number;
  vocalMuted?: boolean;
  audioSfxVolume?: number;
  audioSfxMuted?: boolean;
  selectedClipId?: string | null;
}

interface AudioElementEntry {
  audio: HTMLAudioElement;
  clipId: string;
  url: string;
}

/**
 * Calculates current instantaneous gain for an audio clip at a given timeline time,
 * factoring in track volume, mute, clip volume, clip mute, fade in, and fade out.
 */
export function calculateClipInstantGain(
  clip: TimelineAudioClip,
  time: number,
  trackVolume = 1.0,
  trackMuted = false
): number {
  if (clip.muted || trackMuted) return 0;
  if (time < clip.start || time > clip.end) return 0;

  const baseGain = Math.max(0, (clip.volume ?? 1.0) * trackVolume);
  const clipDuration = Math.max(0.01, clip.end - clip.start);
  const timeIntoClip = time - clip.start;
  const timeUntilEnd = clip.end - time;

  const fadeIn = Math.min(clip.fadeIn ?? 0, clipDuration);
  const fadeOut = Math.min(clip.fadeOut ?? 0, clipDuration);

  let fadeMultiplier = 1.0;

  if (fadeIn > 0 && timeIntoClip < fadeIn) {
    fadeMultiplier = Math.max(0, timeIntoClip / fadeIn);
  } else if (fadeOut > 0 && timeUntilEnd < fadeOut) {
    fadeMultiplier = Math.max(0, timeUntilEnd / fadeOut);
  }

  return baseGain * fadeMultiplier;
}

export function useAudioPreviewEngine({
  isPlaying,
  currentTime,
  audioClips,
  audioSfxVolume = 1.0,
  audioSfxMuted = false,
  selectedClipId,
}: UseAudioPreviewEngineOptions) {
  const elementsRef = useRef<Map<string, AudioElementEntry>>(new Map());
  const [liveAudioLevel, setLiveAudioLevel] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Synchronize audio elements with audioClips list
  useEffect(() => {
    const currentMap = elementsRef.current;
    const clipIds = new Set(audioClips.map((c) => c.id));

    // Remove obsolete audio elements
    for (const [id, entry] of currentMap.entries()) {
      if (!clipIds.has(id)) {
        entry.audio.pause();
        entry.audio.src = "";
        entry.audio.load();
        currentMap.delete(id);
      }
    }

    // Add or update audio elements
    for (const clip of audioClips) {
      if (!clip.url) continue;
      const existing = currentMap.get(clip.id);
      if (!existing || existing.url !== clip.url) {
        if (existing) {
          existing.audio.pause();
          existing.audio.src = "";
        }
        const audio = new Audio();
        audio.preload = "auto";
        audio.src = clip.url;
        audio.loop = false;
        currentMap.set(clip.id, { audio, clipId: clip.id, url: clip.url });
      }
    }
  }, [audioClips]);

  // Clean up all audio elements on unmount
  useEffect(() => {
    const map = elementsRef.current;
    return () => {
      for (const entry of map.values()) {
        entry.audio.pause();
        entry.audio.src = "";
      }
      map.clear();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Update volume and playback timing whenever playing, currentTime, or audio parameters change
  useEffect(() => {
    const currentMap = elementsRef.current;

    audioClips.forEach((clip) => {
      const entry = currentMap.get(clip.id);
      if (!entry) return;
      const audio = entry.audio;

      const inWindow = currentTime >= clip.start && currentTime < clip.end;
      const targetGain = calculateClipInstantGain(clip, currentTime, audioSfxVolume, audioSfxMuted);
      // HTMLAudioElement volume is clamped 0..1; gain > 1 is represented as 1 in preview element
      audio.volume = Math.max(0, Math.min(1, targetGain));

      if (isPlaying && inWindow) {
        const targetClipTime = currentTime - clip.start;
        // Resync if time drifts by more than 0.15s
        if (Math.abs(audio.currentTime - targetClipTime) > 0.15) {
          audio.currentTime = Math.max(0, targetClipTime);
        }
        if (audio.paused) {
          audio.play().catch(() => {
            // Autoplay policies might silently fail if no gesture yet
          });
        }
      } else {
        if (!audio.paused) {
          audio.pause();
        }
        if (!inWindow) {
          audio.currentTime = 0;
        } else {
          audio.currentTime = Math.max(0, currentTime - clip.start);
        }
      }
    });
  }, [isPlaying, currentTime, audioClips, audioSfxVolume, audioSfxMuted]);

  // Live audio level simulation loop for responsive visual monitor
  useEffect(() => {
    if (!isPlaying) {
      setLiveAudioLevel(0);
      return;
    }

    let active = true;
    const updateLevel = () => {
      if (!active) return;

      // Find active clips or selected clip
      const targetClip = selectedClipId
        ? audioClips.find((c) => c.id === selectedClipId)
        : audioClips.find((c) => currentTime >= c.start && currentTime < c.end);

      if (targetClip && currentTime >= targetClip.start && currentTime < targetClip.end) {
        const gain = calculateClipInstantGain(targetClip, currentTime, audioSfxVolume, audioSfxMuted);
        if (gain <= 0.001) {
          setLiveAudioLevel(0);
        } else {
          // Dynamic organic fluctuation based on gain and time
          const t = performance.now() / 150;
          const jitter = Math.sin(t) * 0.2 + Math.cos(t * 1.7) * 0.15 + 0.65;
          const normalized = Math.min(1, Math.max(0.1, (gain / 1.5) * jitter));
          setLiveAudioLevel(normalized);
        }
      } else {
        setLiveAudioLevel(0);
      }

      animFrameRef.current = requestAnimationFrame(updateLevel);
    };

    animFrameRef.current = requestAnimationFrame(updateLevel);

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, currentTime, audioClips, selectedClipId, audioSfxVolume, audioSfxMuted]);

  return {
    liveAudioLevel,
  };
}
