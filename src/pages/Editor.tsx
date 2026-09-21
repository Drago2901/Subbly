import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Cloud,
  Download,
  Globe,
  FileText,
  Info,
  Loader2,
  Save,
  Sparkles,
  Upload,
  Wand2,
  Sun,
  Moon,
  Plus,
  Type,
  Layers,
  Palette,
  ChevronsUpDown,
  MoreVertical,
  Undo2,
  Redo2,
  FolderClosed,
  Flame,
  Video,
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Smile,
  Monitor,
  X,
} from "lucide-react";
import { MediaAddDropdown } from "@/components/captionly/MemeStudio/MediaAddDropdown";
import { TextStylesPanel } from "@/components/captionly/TextStylesPanel";
import { CustomizeTextPanel } from "@/components/captionly/CustomizeTextPanel";
import { MemeStudioPanel } from "@/components/captionly/MemeStudio/MemeStudioPanel";
import { useEditorHistory } from "@/components/captionly/Editor/useEditorHistory";
import { useEditorKeyboard } from "@/components/captionly/Editor/useEditorKeyboard";
import type { MemeItem, MemeStudioTab, MemeType } from "@/lib/memeStudio/types";
import { useTheme } from "@/hooks/useTheme";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VideoDropzone } from "@/components/captionly/VideoDropzone";
import { VideoPreview } from "@/components/captionly/VideoPreview";
import { CaptionList } from "@/components/captionly/CaptionList";
import { StylePanel } from "@/components/captionly/StylePanel";
import { Timeline } from "@/components/captionly/Timeline";
import { ExportProgressDialog } from "@/components/captionly/ExportProgressDialog";
import { AudioControlsPanel } from "@/components/captionly/Editor/AudioControlsPanel";
import { useAudioPreviewEngine } from "@/lib/captions/useAudioPreviewEngine";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";


import { AvatarDropdown } from "@/components/AvatarDropdown";
import { wordsToCaptions } from "@/lib/captions/segment";
import { burnCaptions, ExportCancelledError } from "@/lib/captions/render";
import { transcodeWebmToMp4, validateMp4Export, validateExportDuration } from "@/lib/captions/transcode";
import { mixProjectAudio } from "@/lib/captions/audioMixer";
import type { ExportStage } from "@/components/captionly/ExportProgressDialog";
import {
  extractAudioNative,
  splitWavIntoChunks,
  TranscriptionError,
  type AudioExtractionProgress,
} from "@/lib/captions/audio";
import { alignEmojisWithWords, stripEmojis } from "@/lib/captions/emoji";
import {
  DEFAULT_STYLE,
  type Caption,
  type CaptionStyle,
  type Word,
  type TimelineEffect,
  type TimelineAudioClip,
} from "@/lib/captions/types";
import { useAuth } from "@/hooks/useAuth";
import { captionsToSrt, srtToCaptions } from "@/lib/captions/srt";
import { Seo } from "@/components/Seo";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ProjectMeta = {
  width: number;
  height: number;
  duration: number;
};

const LANGUAGES: { code: string; label: string }[] = [
  { code: "auto", label: "Auto-detect" },
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "ru", label: "Russian" },
  { code: "hi", label: "Hindi" },
  { code: "hinglish", label: "Hinglish" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "mr", label: "Marathi" },
  { code: "ml", label: "Malayalam" },
  { code: "pa", label: "Punjabi" },
  { code: "gu", label: "Gujarati" },
  { code: "bn", label: "Bengali" },
  { code: "kn", label: "Kannada" },
  { code: "ur", label: "Urdu" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
  { code: "tr", label: "Turkish" },
  { code: "pl", label: "Polish" },
  { code: "id", label: "Indonesian" },
];

type FramePreset = {
  id: "original" | "tiktok" | "square" | "landscape" | "portrait";
  label: string;
  width: number;
  height: number;
  fit: "cover" | "contain";
};

const FRAME_PRESETS: FramePreset[] = [
  { id: "original", label: "Original", width: 0, height: 0, fit: "contain" },
  { id: "tiktok", label: "TikTok / Reels", width: 9, height: 16, fit: "contain" },
  { id: "square", label: "Square", width: 1, height: 1, fit: "contain" },
  { id: "landscape", label: "Landscape", width: 16, height: 9, fit: "contain" },
  { id: "portrait", label: "Portrait", width: 3, height: 4, fit: "contain" },
];

const DEMO_VIDEO_URL = "/test-video.mp4";

const invokeEdgeFunction = async (
  name: string,
  options?: Parameters<typeof supabase.functions.invoke>[1],
) => {
  const directUrl = `${SUPABASE_URL}/functions/v1/${name}`;

  let authToken = SUPABASE_PUBLISHABLE_KEY;
  try {
    const raw = localStorage.getItem("sb-polshaqgsqhzcvtipssx-auth-token");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.access_token) authToken = parsed.access_token;
    }
  } catch {
    // fallback
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const directRes = await fetch(directUrl, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_PUBLISHABLE_KEY,
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      body: typeof options?.body === "string" ? options.body : JSON.stringify(options?.body || {}),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!directRes.ok) {
      const text = await directRes.text();
      let msg = `Function error (${directRes.status})`;
      try {
        const parsed = JSON.parse(text);
        if (parsed.error || parsed.message) msg = parsed.error || parsed.message;
      } catch {
        if (text && text.length < 200) msg = text;
      }
      throw new Error(msg);
    }

    const json = await directRes.json();
    return json;
  } catch (err: any) {
    clearTimeout(timeoutId);
    // If direct fetch fails with network issue, attempt standard invoke as fallback
    try {
      const { data, error } = await supabase.functions.invoke(name, options);
      if (!error && data) return data;
      if (error) throw error;
    } catch {
      // rethrow direct fetch error
    }
    throw err;
  }
};

export const tokenizeCaptionText = (text: string, lang?: string): string[] => {
  const clean = text.trim();
  if (!clean) return [];

  // For Latin / space-delimited text without CJK characters, regular whitespace splitting preserves attached punctuation
  const hasCJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(clean);
  if (!hasCJK) {
    return clean.split(/\s+/).filter(Boolean);
  }

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const targetLocale = lang && lang !== "auto" && lang !== "hinglish" ? lang : "ja";
      const segmenter = new Intl.Segmenter(targetLocale, { granularity: "word" });
      const tokens: string[] = [];
      for (const seg of segmenter.segment(clean)) {
        const t = seg.segment.trim();
        if (t) tokens.push(t);
      }
      if (tokens.length > 0) return tokens;
    } catch {
      // Fallback
    }
  }

  return clean.split(/\s+/).filter(Boolean);
};

export const buildProportionalWords = (text: string, start: number, end: number, lang?: string): Word[] => {
  const tokens = tokenizeCaptionText(text, lang);
  if (tokens.length === 0) return [];
  const duration = Math.max(0.1, end - start);
  const wordDur = duration / tokens.length;
  return tokens.map((token, idx) => ({
    text: token,
    start: Number((start + idx * wordDur).toFixed(2)),
    end: Number((start + (idx + 1) * wordDur).toFixed(2)),
  }));
};

const formatTime = (secs: number) => {
  if (isNaN(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const CondensedTimeline = ({
  duration,
  currentTime,
  onSeek,
}: {
  duration: number;
  currentTime: number;
  onSeek: (t: number) => void;
}) => {
  const { theme } = useTheme();
  const bars = useMemo(() => {
    let seed = 123;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
      return Math.abs(seed) / 0x7fffffff;
    };
    return Array.from({ length: 60 }, (_, i) => 0.25 + rand() * 0.75);
  }, []);

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const update = (clientX: number) => {
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(pct * duration);
    };
    update(e.clientX);

    const onMouseMove = (ev: PointerEvent) => update(ev.clientX);
    const onMouseUp = () => {
      window.removeEventListener("pointermove", onMouseMove);
      window.removeEventListener("pointerup", onMouseUp);
    };
    window.addEventListener("pointermove", onMouseMove);
    window.addEventListener("pointerup", onMouseUp);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      className="relative flex-1 h-8 bg-secondary rounded-lg flex items-center gap-0.5 px-2 cursor-pointer overflow-hidden border border-border"
    >
      {bars.map((h, i) => {
        const barProgress = (i / bars.length) * 100;
        const active = barProgress <= progressPct;
        return (
          <div
            key={i}
            className={`flex-grow rounded-[1px] ${active ? "bg-primary" : "bg-muted-foreground/30"}`}
            style={{
              height: `${h * 70}%`,
              minHeight: "4px",
            }}
          />
        );
      })}
      {/* Playhead */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-primary z-10 shadow-glow"
        style={{ left: `${progressPct}%` }}
      />
    </div>
  );
};

// Left panel tool IDs for the desktop dynamic panel system
type LeftTool = "captions" | "style" | "text" | "templates" | "brand" | "media" | null;

const Editor = () => {
  const { user, session, signOut, isAdmin } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeMobileTab, setActiveMobileTab] = useState<"captions" | "style" | "anim" | "meme" | "tmpl" | "brand">("captions");
  const [activeTab, setActiveTab] = useState<"style" | "anim" | "tmpl" | "brand">("style");
  // Dynamic left-panel state for desktop
  const [activeLeftTool, setActiveLeftTool] = useState<LeftTool>("captions");

  const toggleLeftTool = (tool: Exclude<LeftTool, null>) => {
    setActiveLeftTool((prev) => (prev === tool ? null : tool));
  };
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  // Text workspace dual-panel collapse state
  const [textStylesCollapsed, setTextStylesCollapsed] = useState(false);
  const [customizeTextCollapsed, setCustomizeTextCollapsed] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerVolume, setPlayerVolume] = useState(1);
  const [isPlayerMuted, setIsPlayerMuted] = useState(false);
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<ProjectMeta | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const captionsRef = useRef<Caption[]>(captions);
  captionsRef.current = captions;
  const [style, setStyle] = useState<CaptionStyle>(DEFAULT_STYLE);
  const [track2Style, setTrack2Style] = useState<CaptionStyle>(() => ({ ...DEFAULT_STYLE, position: "top", posY: 0.18 }));
  const [title, setTitle] = useState("Untitled project");
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeStage, setTranscribeStage] = useState("");
  const [framePreset, setFramePreset] = useState<FramePreset>(FRAME_PRESETS[0]);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [loadingProject, setLoadingProject] = useState(false);
  const [storedSourcePath, setStoredSourcePath] = useState<string | null>(null);
  const [storedSourceMime, setStoredSourceMime] = useState<string | null>(null);
  const [storedSourceName, setStoredSourceName] = useState<string | null>(null);
  const [storedExportPath, setStoredExportPath] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [language, setLanguage] = useState<string>("auto");
  const [translating, setTranslating] = useState(false);
  const [translatingLang, setTranslatingLang] = useState<string | null>(null);
  const translationCacheRef = useRef<Record<string, string[]>>({});

  const [quality, setQuality] = useState<"standard" | "high">("standard");
  const [exportStage, setExportStage] = useState<ExportStage>("prepare");
  const [exportStageMessage, setExportStageMessage] = useState<string>("");
  const [vocalVolume, setVocalVolume] = useState<number>(1.0);
  const [vocalMuted, setVocalMuted] = useState<boolean>(false);
  const [audioSfxVolume, setAudioSfxVolume] = useState<number>(0.7);
  const [audioSfxMuted, setAudioSfxMuted] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const videoRefCallback = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    setVideoElement(node);
  }, []);
  const exportAbortRef = useRef<AbortController | null>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);

  const lastSavedRef = useRef<string>("");
  const isAutoSavingRef = useRef<boolean>(false);
  const latestAlignRequestIdRef = useRef<number>(0);
  const prevEmojiEnabledRef = useRef<boolean | undefined>(undefined);
  const prevEmojiDensityRef = useRef<string | undefined>(undefined);

  const [selectedCaptionId, setSelectedCaptionId] = useState<string | null>(null);
  const [lockedTracks, setLockedTracks] = useState<number[]>([]);
  const [effects, setEffects] = useState<TimelineEffect[]>([]);
  const [audioClips, setAudioClips] = useState<TimelineAudioClip[]>([]);

  const selectedAudioClip = useMemo(
    () => audioClips.find((c) => c.id === selectedCaptionId) || null,
    [audioClips, selectedCaptionId]
  );

  const { liveAudioLevel } = useAudioPreviewEngine({
    isPlaying,
    currentTime,
    audioClips,
    vocalVolume,
    vocalMuted,
    audioSfxVolume,
    audioSfxMuted,
    selectedClipId: selectedAudioClip?.id,
  });

  const handleUpdateAudioClip = useCallback((id: string, patch: Partial<TimelineAudioClip>) => {
    setAudioClips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  }, []);

  const handleDeleteAudioClip = useCallback((id: string) => {
    setAudioClips((prev) => prev.filter((c) => c.id !== id));
    setSelectedCaptionId((cur) => (cur === id ? null : cur));
    toast.info("Removed audio clip");
  }, []);

  const [timelineZoom, setTimelineZoom] = useState<number>(35);
  const { canUndo, canRedo, handleUndo, handleRedo, resetHistory } = useEditorHistory(captions, setCaptions);

  // F11 Experience suggestion notification state
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(() => {
    return typeof document !== "undefined" && Boolean(document.fullscreenElement);
  });
  const [f11Dismissed, setF11Dismissed] = useState(() => {
    try {
      return localStorage.getItem("subbly_hide_f11_hint") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleFsChange = () => {
      setIsBrowserFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleBrowserFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const dismissF11Hint = useCallback(() => {
    setF11Dismissed(true);
    try {
      localStorage.setItem("subbly_hide_f11_hint", "true");
    } catch {
      /* ignore */
    }
  }, []);

  const frame = useMemo(() => {
    return framePreset.id !== "original"
      ? { width: framePreset.width, height: framePreset.height, fit: framePreset.fit }
      : null;
  }, [framePreset]);

  const [isMemeStudioOpen, setIsMemeStudioOpen] = useState(false);
  const [memeStudioTab, setMemeStudioTab] = useState<MemeStudioTab>("gifs");
  const [memeStudioFilter, setMemeStudioFilter] = useState<MemeType | "all">("all");
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

  const handleOpenMemeStudio = useCallback((options?: {
    tab?: MemeStudioTab;
    filter?: MemeType | "all";
    replaceTargetId?: string;
  }) => {
    if (options?.tab) setMemeStudioTab(options.tab);
    if (options?.filter) setMemeStudioFilter(options.filter);
    setReplaceTargetId(options?.replaceTargetId || null);
    setIsMemeStudioOpen(true);
  }, []);

  const handleInsertMedia = useCallback((item: MemeItem) => {
    if (replaceTargetId) {
      setCaptions((prev) =>
        prev.map((c) =>
          c.id === replaceTargetId
            ? {
                ...c,
                mediaType: item.type,
                mediaUrl: item.url,
                mediaTitle: item.title,
                text: item.title,
              }
            : c
        )
      );
      setSelectedCaptionId(replaceTargetId);
      setReplaceTargetId(null);
      setIsMemeStudioOpen(false);
      toast.success(`Replaced with ${item.title}`);
      return;
    }

    // Pick an available track (default to track 2 for overlay media)
    let targetTrack = 2;
    if (lockedTracks.includes(targetTrack)) {
      for (let t = 1; t <= 6; t++) {
        if (!lockedTracks.includes(t)) {
          targetTrack = t;
          break;
        }
      }
    }

    const durationSec = 3.0;
    const start = currentTime;
    const end = meta ? Math.min(meta.duration, start + durationSec) : start + durationSec;

    const newElement: Caption = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      start,
      end,
      text: item.title,
      track: targetTrack,
      mediaType: item.type,
      mediaUrl: item.url,
      mediaTitle: item.title,
      x: 0.5,
      y: 0.5,
      width: item.type === "sticker" ? 22 : 36,
      height: item.type === "sticker" ? 22 : 36,
      style: {
        position: "free",
        animation: "pop",
      },
    };

    setCaptions((prev) => {
      const next = [...prev, newElement].sort((a, b) => a.start - b.start);
      return next;
    });
    setSelectedCaptionId(newElement.id);
    setIsMemeStudioOpen(false);
    toast.success(`Inserted ${item.title}`);
  }, [currentTime, meta, lockedTracks, replaceTargetId]);

  const handleDeleteCaption = useCallback((id: string) => {
    setCaptions((prev) => prev.filter((c) => c.id !== id));
    setSelectedCaptionId((curr) => (curr === id ? null : curr));
    toast.info("Removed media overlay");
  }, []);

  const handleReplaceMedia = useCallback((id: string) => {
    const cap = captions.find((c) => c.id === id);
    handleOpenMemeStudio({
      tab: "upload",
      filter: cap?.mediaType || "all",
      replaceTargetId: id,
    });
  }, [captions, handleOpenMemeStudio]);

  const handleAddCaptionMobile = () => {
    let targetTrack = 1;
    let found = false;
    for (let t = 1; t <= 6; t++) {
      if (!lockedTracks.includes(t)) {
        targetTrack = t;
        found = true;
        break;
      }
    }
    if (!found) return;

    const last = captions[captions.length - 1];
    const start = last ? last.end : 0;
    const refCap = captions.find((c) => (c.track || 1) === targetTrack && c.x !== undefined);
    const newCap: Caption = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      start,
      end: start + 2,
      text: "",
      track: targetTrack,
      x: refCap?.x ?? 0.5,
      y: refCap?.y ?? 0.88,
      width: refCap?.width ?? 84,
      height: refCap?.height,
      style: refCap?.style ? JSON.parse(JSON.stringify(refCap.style)) : undefined,
    };
    setCaptions([...captions, newCap]);
    toast.success("Caption added");
  };

  const handleCaptionStyleChange = useCallback((id: string, styleUpdate: Partial<CaptionStyle>) => {
    setCaptions((cur) =>
      cur.map((c) => {
        if (c.id !== id) return c;
        const baseTrack = (c.track || 1) === 2 ? track2Style : style;
        return {
          ...c,
          style: { ...(c.style || baseTrack), ...styleUpdate },
        };
      })
    );
  }, [track2Style, style]);

  const handleCaptionPositionChange = useCallback((id: string, patch: Partial<Caption>) => {
    setCaptions((cur) => {
      const target = cur.find((c) => c.id === id);
      const targetTrack = target ? (target.track || 1) : 1;
      const baseTrack = targetTrack === 2 ? track2Style : style;
      return cur.map((c) => {
        const cTrack = c.track || 1;
        if (cTrack === targetTrack) {
          return {
            ...c,
            ...patch,
            style: patch.style ? { ...(c.style || baseTrack), ...patch.style } : c.style
          };
        }
        return c;
      });
    });
  }, [track2Style, style]);

  const handleStyleChange = useCallback((nextStyle: CaptionStyle) => {
    setCaptions((cur) => {
      const selected = cur.find((c) => c.id === selectedCaptionId);
      const targetTrack = selected ? (selected.track || 1) : 1;
      const baseTrack = targetTrack === 2 ? track2Style : style;

      if (targetTrack === 2) {
        setTrack2Style(nextStyle);
      } else {
        setStyle(nextStyle);
      }

      return cur.map((c) => {
        const cTrack = c.track || 1;
        // Never touch captions from another track!
        if (cTrack !== targetTrack) {
          return c;
        }

        // When a specific caption is selected, only update that caption
        if (selectedCaptionId) {
          if (c.id === selectedCaptionId) {
            const existing = c.style || baseTrack;
            const updatedStyle = { ...nextStyle };
            if (existing.position !== undefined) updatedStyle.position = existing.position;
            if (existing.posX !== undefined) updatedStyle.posX = existing.posX;
            if (existing.posY !== undefined) updatedStyle.posY = existing.posY;
            if (existing.boxWidth !== undefined) updatedStyle.boxWidth = existing.boxWidth;
            if (existing.boxHeight !== undefined) updatedStyle.boxHeight = existing.boxHeight;

            return {
              ...c,
              style: updatedStyle,
            };
          }
          return c;
        }

        // When no specific caption is selected, update styled captions on this track
        if (!c.style) return c;
        const updatedStyle = { ...nextStyle };
        if (c.style.position !== undefined) updatedStyle.position = c.style.position;
        if (c.style.posX !== undefined) updatedStyle.posX = c.style.posX;
        if (c.style.posY !== undefined) updatedStyle.posY = c.style.posY;
        if (c.style.boxWidth !== undefined) updatedStyle.boxWidth = c.style.boxWidth;
        if (c.style.boxHeight !== undefined) updatedStyle.boxHeight = c.style.boxHeight;

        return {
          ...c,
          style: updatedStyle,
        };
      });
    });
  }, [selectedCaptionId, track2Style, style]);

  const handleApplyToAllTrack = useCallback((nextStyle: CaptionStyle) => {
    setCaptions((cur) => {
      const selected = cur.find((c) => c.id === selectedCaptionId);
      const targetTrack = selected ? (selected.track || 1) : 1;
      const baseTrack = targetTrack === 2 ? track2Style : style;

      if (targetTrack === 2) {
        setTrack2Style(nextStyle);
      } else {
        setStyle(nextStyle);
      }

      return cur.map((c) => {
        const cTrack = c.track || 1;
        if (cTrack !== targetTrack) return c;

        const existing = c.style || baseTrack;
        const updatedStyle = { ...nextStyle };
        if (existing.position !== undefined) updatedStyle.position = existing.position;
        if (existing.posX !== undefined) updatedStyle.posX = existing.posX;
        if (existing.posY !== undefined) updatedStyle.posY = existing.posY;
        if (existing.boxWidth !== undefined) updatedStyle.boxWidth = existing.boxWidth;
        if (existing.boxHeight !== undefined) updatedStyle.boxHeight = existing.boxHeight;

        return {
          ...c,
          style: updatedStyle,
        };
      });
    });
  }, [selectedCaptionId, track2Style, style]);

  // Synchronize play/pause state from video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    setIsPlaying(!video.paused);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [videoElement, videoUrl, transcribing]);

  // Synchronize player volume & mute state from video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onVol = () => {
      setPlayerVolume(video.volume);
      setIsPlayerMuted(video.muted);
    };

    video.addEventListener("volumechange", onVol);
    setPlayerVolume(video.volume);
    setIsPlayerMuted(video.muted);

    return () => {
      video.removeEventListener("volumechange", onVol);
    };
  }, [videoElement, videoUrl]);

  // Track fullscreen state for inline player
  useEffect(() => {
    const onFsChange = () => {
      setIsPlayerFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  const togglePlayerFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
      } else {
        const v = videoRef.current;
        if (!v) return;
        if ((v as any).toggleFullscreen) {
          (v as any).toggleFullscreen();
        } else {
          const container = v.closest(".group\\/preview") || v;
          if (container.requestFullscreen) await container.requestFullscreen();
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  }, []);

  const handlePlayerVolumeChange = useCallback((v: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = v;
    video.muted = v === 0;
    setPlayerVolume(v);
    setIsPlayerMuted(v === 0);
  }, []);

  const handleTogglePlayerMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsPlayerMuted(nextMuted);
  }, []);

  const seek = useCallback((timeVal: number) => {
    setCurrentTime(timeVal);
    if (videoRef.current) videoRef.current.currentTime = timeVal;
  }, []);

  const handleScrubberSeek = useCallback((clientX: number) => {
    const el = scrubberRef.current;
    const duration = meta?.duration || 0;
    if (!el || duration === 0) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = pct * duration;
    seek(newTime);
  }, [meta?.duration, seek]);

  useEffect(() => {
    if (!isScrubbing) return;
    const onMove = (e: PointerEvent) => {
      handleScrubberSeek(e.clientX);
    };
    const onUp = () => setIsScrubbing(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isScrubbing, handleScrubberSeek]);

  // Global Keyboard Shortcuts (Undo, Redo, Play/Pause, Zoom In/Out, Save)
  useEditorKeyboard({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSave: () => {
      handleManualSave();
    },
    onZoomIn: () => setTimelineZoom((z) => Math.min(100, z + 10)),
    onZoomOut: () => setTimelineZoom((z) => Math.max(5, z - 10)),
    onTogglePlay: () => {
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    },
  });

  // AI Emoji generation side effects
  useEffect(() => {
    const isFirstTime = prevEmojiEnabledRef.current === undefined;
    const emojiChanged = prevEmojiEnabledRef.current !== style.emojiEnabled;
    const densityChanged = prevEmojiDensityRef.current !== style.emojiDensity;

    prevEmojiEnabledRef.current = style.emojiEnabled;
    prevEmojiDensityRef.current = style.emojiDensity;

    if (isFirstTime) return;
    if (!emojiChanged && !densityChanged) return;

    const currentCaptions = captionsRef.current;
    if (currentCaptions.length === 0) return;

    const reqId = ++latestAlignRequestIdRef.current;

    const runEmojiAlignment = async () => {
      const stageToast = toast.loading(
        style.emojiEnabled ? "Adding context emojis to speech segments…" : "Removing emojis from captions…",
      );
      try {
        if (!style.emojiEnabled) {
          if (reqId !== latestAlignRequestIdRef.current) return;
          setCaptions((cur) =>
            cur.map((c) => ({
              ...c,
              text: stripEmojis(c.text),
              words: c.words ? c.words.map((w) => ({ ...w, text: stripEmojis(w.text) })) : undefined,
            })),
          );
          toast.success("All emojis stripped from video segments");
        } else {
          const res = await invokeEdgeFunction("align-emojis", {
            body: {
              captions: currentCaptions.map((c) => ({ id: c.id, text: c.text, words: c.words })),
              density: style.emojiDensity || "medium",
            },
          });
          if (reqId !== latestAlignRequestIdRef.current) return;
          if (res && Array.isArray(res.captions)) {
            interface ResponseCaption {
              id: string;
              text: string;
              words?: Word[];
            }
            const mapped = res.captions as ResponseCaption[];
            setCaptions((cur) =>
              cur.map((c) => {
                const match = mapped.find((x) => x.id === c.id);
                if (!match) return c;
                const newWords = match.words || (c.words ? alignEmojisWithWords(c.words, match.text) : undefined);
                return { ...c, text: match.text, words: newWords };
              }),
            );
            toast.success("AI Emojis integrated with viral context");
          }
        }
      } catch (e: unknown) {
        if (reqId !== latestAlignRequestIdRef.current) return;
        console.error("AI emoji alignment failed:", e);
        toast.error(`Emoji integration error: ${(e as Error).message}`);
      } finally {
        toast.dismiss(stageToast);
      }
    };

    runEmojiAlignment();
  }, [style.emojiEnabled, style.emojiDensity]);

  // Project Load Logic
  useEffect(() => {
    if (!projectId) return;
    const loadProject = async () => {
      setLoadingProject(true);
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (error) throw error;
        if (data) {
          setTitle(data.title || "Untitled project");
          if (data.captions) {
            const loaded = (data.captions as Caption[]).map((c) => ({
              ...c,
              originalText: c.originalText || c.text,
            }));
            translationCacheRef.current = {};
            setCaptions(loaded);
          }
          if (data.style) {
            const loadedStyle = data.style as any;
            setStyle(loadedStyle);
            if (loadedStyle.track2Style) {
              setTrack2Style(loadedStyle.track2Style);
            }
          }
          setStoredSourcePath(data.source_video_path);
          setStoredSourceMime(data.source_video_mime);
          setStoredSourceName(data.source_video_name);
          setStoredExportPath(data.exported_video_path);

          if (data.source_video_path) {
            const { data: urlData, error: urlError } = await supabase.storage
              .from("project-videos")
              .createSignedUrl(data.source_video_path, 7200);

            if (urlError) throw urlError;
            if (urlData?.signedUrl) {
              setVideoUrl(urlData.signedUrl);
              const mockFile = new File([], data.source_video_name || "project_video.mp4", {
                type: data.source_video_mime || "video/mp4",
              });
              setFile(mockFile);
            }
          }
          lastSavedRef.current = JSON.stringify({
            captions: data.captions,
            style: data.style,
            title: data.title,
          });
        }
      } catch (err: unknown) {
        console.error("Error loading project:", err);
        toast.error("Failed to load project details.");
      } finally {
        setLoadingProject(false);
      }
    };
    loadProject();
  }, [projectId]);

  // Restore pending local project after login
  useEffect(() => {
    if (!user || loadingProject) return;

    const pending = localStorage.getItem("subbly_pending_save");
    if (!pending) return;

    const restoreProject = async () => {
      try {
        const parsed = JSON.parse(pending);
        if (parsed) {
          setTitle(parsed.title || "Untitled project");
          if (parsed.captions) {
            const loaded = (parsed.captions as Caption[]).map((c: Caption) => ({
              ...c,
              originalText: c.originalText || c.text,
            }));
            translationCacheRef.current = {};
            setCaptions(loaded);
          }
          if (parsed.style) setStyle(parsed.style);
          if (parsed.language) setLanguage(parsed.language);

          // Create the database project for this user
          const { data: projData, error: dbError } = await supabase
            .from("projects")
            .insert({
              user_id: user.id,
              title: parsed.title || "Untitled project",
              captions: parsed.captions || [],
              style: parsed.style || DEFAULT_STYLE,
            })
            .select("id")
            .single();

          if (dbError) throw dbError;
          if (projData) {
            setSearchParams({ project: projData.id });
            lastSavedRef.current = JSON.stringify({
              captions: parsed.captions || [],
              style: parsed.style || DEFAULT_STYLE,
              title: parsed.title || "Untitled project",
            });
            toast.success("Restored and saved your project!");
          }
        }
      } catch (err) {
        console.warn("Failed to restore pending project:", err);
      } finally {
        localStorage.removeItem("subbly_pending_save");
      }
    };

    restoreProject();
  }, [user, loadingProject, setSearchParams]);

  // Auto-Save Loop
  useEffect(() => {
    if (!projectId || !file) return;

    const timer = setInterval(async () => {
      if (isAutoSavingRef.current) return;

      const currentSnapshot = JSON.stringify({
        captions,
        style,
        track2Style,
        title,
      });

      if (currentSnapshot === lastSavedRef.current) return;

      isAutoSavingRef.current = true;
      setAutoSaveState("saving");
      try {
        const { error } = await supabase
          .from("projects")
          .update({
            title,
            captions: JSON.parse(JSON.stringify(captions)),
            style: JSON.parse(JSON.stringify({ ...style, track2Style })),
            updated_at: new Date().toISOString(),
          })
          .eq("id", projectId);

        if (error) throw error;
        lastSavedRef.current = currentSnapshot;
        setAutoSaveState("saved");
      } catch (err) {
        console.error("Auto-save failed:", err);
        setAutoSaveState("idle");
      } finally {
        isAutoSavingRef.current = false;
      }
    }, 4500);

    return () => clearInterval(timer);
  }, [projectId, file, captions, style, title]);

  // Toggle rain background based on editing state
  useEffect(() => {
    if (file || videoUrl) {
      document.body.classList.add('hide-rain');
    } else {
      document.body.classList.remove('hide-rain');
    }
    return () => document.body.classList.remove('hide-rain');
  }, [file, videoUrl]);

  const handleManualSave = useCallback(async () => {
    if (!user) {
      const localState = {
        title,
        captions,
        style,
        language,
      };
      localStorage.setItem("subbly_pending_save", JSON.stringify(localState));
      toast.info("Please sign in to save your project. Redirecting...");
      setTimeout(() => {
        navigate("/auth");
      }, 1500);
      return;
    }

    setSaving(true);
    try {
      if (!projectId) {
        // Create new project in DB
        const { data: projData, error: dbError } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            title,
            captions: JSON.parse(JSON.stringify(captions)),
            style: JSON.parse(JSON.stringify(style)),
          })
          .select("id")
          .single();

        if (dbError) throw dbError;
        if (projData) {
          setSearchParams({ project: projData.id });
          lastSavedRef.current = JSON.stringify({ captions, style, title });
          setAutoSaveState("saved");
          toast.success("Project saved successfully to your account!");
        }
      } else {
        // Update existing project
        const { error } = await supabase
          .from("projects")
          .update({
            title,
            captions: JSON.parse(JSON.stringify(captions)),
            style: JSON.parse(JSON.stringify(style)),
            updated_at: new Date().toISOString(),
          })
          .eq("id", projectId);

        if (error) throw error;
        lastSavedRef.current = JSON.stringify({ captions, style, title });
        setAutoSaveState("saved");
        toast.success("Project saved successfully");
      }
    } catch (err: unknown) {
      console.error("Save failed:", err);
      toast.error(`Save error: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }, [projectId, title, captions, style, language, user, navigate, setSearchParams]);

  const handleFile = async (f: File) => {
    setFile(f);
    const localUrl = URL.createObjectURL(f);
    setVideoUrl(localUrl);

    if (user && !projectId) {
      // Create project record in DB silently — no storage upload needed
      // (video plays locally from the File object)
      try {
        const { data: projData, error: dbError } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            title: f.name.replace(/\.[^/.]+$/, ""),
            style: DEFAULT_STYLE,
          })
          .select("id")
          .single();

        if (!dbError && projData) {
          setSearchParams({ project: projData.id });
        }
      } catch (err: unknown) {
        // Silent — project works locally even if DB sync fails
        console.warn("Project DB sync skipped:", err);
      }
    }
  };

  const createDemoCaptions = (): Caption[] => {
    const demoItems = [
      { id: "demo-1", start: 0.5, end: 3.2, text: "Welcome to Subbly AI video captioning!" },
      { id: "demo-2", start: 3.4, end: 6.5, text: "Translate your captions into over 25 languages instantly." },
      { id: "demo-3", start: 6.8, end: 9.8, text: "Boost your engagement and reach global audiences today." },
    ];
    return demoItems.map((item) => {
      const words = buildProportionalWords(item.text, item.start, item.end, "en");
      return {
        ...item,
        originalText: item.text,
        words,
        originalWords: [...words],
      };
    });
  };

  const loadDemoProject = useCallback(async () => {
    setVideoUrl(DEMO_VIDEO_URL);
    const demoCaps = createDemoCaptions();
    setCaptions(demoCaps);
    resetHistory(demoCaps);
    translationCacheRef.current = {};
    setLanguage("auto");
    setTitle("Demo Project");
    const demoToast = toast.loading("Loading demo video stream…");

    try {
      const res = await fetch(DEMO_VIDEO_URL);
      if (res.ok) {
        const blob = await res.blob();
        const demoFile = new File([blob], "Test-video.mp4", { type: "video/mp4" });
        setFile(demoFile);
        toast.success("Demo video ready to transcribe!", { id: demoToast });
      } else {
        toast.error("Could not fetch demo video.", { id: demoToast });
      }
    } catch (e) {
      console.warn("Could not fetch demo video file for audio extraction:", e);
      toast.error("Failed to load demo video.", { id: demoToast });
    }
  }, [resetHistory]);

  useEffect(() => {
    if (searchParams.get("demo") === "true") {
      if (!file) {
        loadDemoProject();
      } else if (captions.length === 0) {
        const demoCaps = createDemoCaptions();
        setCaptions(demoCaps);
      }
    }
  }, [searchParams, file, captions.length, loadDemoProject]);

  const handleCaptionsChange = useCallback((nextCaptions: Caption[]) => {
    if (language === "auto") {
      const updated = nextCaptions.map((c) => ({
        ...c,
        originalText: c.mediaType ? c.originalText : c.text,
        originalWords: c.mediaType ? c.originalWords : (c.words || buildProportionalWords(c.text, c.start, c.end, "auto")),
      }));
      translationCacheRef.current = {};
      setCaptions(updated);
    } else {
      const speechOnly = nextCaptions.filter((c) => !c.mediaType).map((c) => c.text);
      translationCacheRef.current[language] = speechOnly;
      setCaptions(nextCaptions);
    }
  }, [language]);

  const transcribe = async () => {
    if (!user) {
      toast.error("Please login to generate captions.");
      return;
    }
    if (!file || file.size === 0) {
      toast.error("Video audio stream is still loading. Please wait 2 seconds and try again.");
      return;
    }
    setTranscribing(true);
    setTranscribeStage("Preparing video…");
    const stageToast = toast.loading("Auto-transcription: Preparing media…");

    const controller = new AbortController();
    // 180s network timeout to accommodate large / multi-chunk videos without failing
    const networkTimeoutId = setTimeout(() => controller.abort(), 180000);

    try {
      setTranscribeStage("Extracting audio…");
      toast.loading("Extracting speech tracks from video…", { id: stageToast });

      const audioBlob = await extractAudioNative(file, {
        durationSec: meta?.duration,
        onProgress: (p: AudioExtractionProgress) => {
          setTranscribeStage(p.message);
          toast.loading(p.message, { id: stageToast });
        },
        signal: controller.signal,
      });

      setTranscribeStage("Processing audio…");
      toast.loading("Optimizing audio waveforms…", { id: stageToast });

      // Split audio into chunks (<= 10 mins each) if it exceeds API limits
      const chunks = await splitWavIntoChunks(audioBlob, 600);

      const allWords: Word[] = [];
      let totalTookMs = 0;
      let usedProvider = "";

      let token = session?.access_token;
      if (!token) {
        try {
          const sessionRes = await supabase.auth.getSession();
          token = sessionRes.data.session?.access_token;
        } catch { /* ignore */ }
      }

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkLabel = chunks.length > 1 ? ` (part ${i + 1} of ${chunks.length})` : "";
        setTranscribeStage(`Transcribing speech${chunkLabel}…`);
        toast.loading(`Transcribing speech${chunkLabel}… 💀☕`, { id: stageToast });

        const isWav = chunk.blob.type.includes("wav") || file.name.toLowerCase().endsWith(".wav");
        const isMp3 = chunk.blob.type.includes("mpeg") || chunk.blob.type.includes("mp3") || file.name.toLowerCase().endsWith(".mp3");
        const ext = isWav ? "wav" : isMp3 ? "mp3" : (file.name.split(".").pop() || "wav");

        const form = new FormData();
        form.append("file", chunk.blob, `audio_${i}.${ext}`);
        if (language && language !== "auto") form.append("language", language);

        const fnUrl = `${SUPABASE_URL}/functions/v1/transcribe-video`;
        const fnRes = await fetch(fnUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token || "mock-token"}`,
            apikey: SUPABASE_PUBLISHABLE_KEY,
          },
          body: form,
          signal: controller.signal,
        });

        if (!fnRes.ok) {
          const errText = await fnRes.text();
          let errMsg = "Transcription failed. Please try again.";
          try {
            const parsed = JSON.parse(errText);
            errMsg = parsed.error || parsed.message || errMsg;
          } catch { /* not json */ }
          throw new TranscriptionError("TRANSCRIPTION_FAILURE", errMsg);
        }

        const transcriptionData = await fnRes.json();
        if (transcriptionData?.words && Array.isArray(transcriptionData.words) && transcriptionData.words.length > 0) {
          const chunkWords = (transcriptionData.words as Word[]).map((w) => ({
            ...w,
            start: Number((w.start + chunk.startSec).toFixed(2)),
            end: Number((w.end + chunk.startSec).toFixed(2)),
          }));
          allWords.push(...chunkWords);
          if (transcriptionData.tookMs) totalTookMs += transcriptionData.tookMs;
          if (transcriptionData.provider) usedProvider = transcriptionData.provider;
        }
      }

      if (allWords.length > 0) {
        setTranscribeStage("Generating captions…");
        const segments = wordsToCaptions(allWords);
        if (segments.length > 0) {
          const initialWithOrig = segments.map((s) => ({
            ...s,
            originalText: s.text,
            originalWords: s.words ? JSON.parse(JSON.stringify(s.words)) : undefined,
          }));
          translationCacheRef.current = {};
          setLanguage("auto");
          setCaptions(initialWithOrig);
          const providerInfo = usedProvider ? ` (${totalTookMs ? `${(totalTookMs / 1000).toFixed(1)}s` : "done"})` : "";
          toast.success(`AI Transcription completed successfully!${providerInfo}`, { id: stageToast });

          // If emojis are enabled, enrich captions in the background without blocking the editor UI
          if (style.emojiEnabled) {
            (async () => {
              try {
                const cleanText = allWords.map((w) => w.text.trim()).filter(Boolean).join(" ");
                const emojiRes = await invokeEdgeFunction("align-emojis", {
                  body: {
                    captions: [{ id: "temp", text: cleanText, words: allWords }],
                    density: style.emojiDensity || "medium",
                  },
                });
                let enrichedWords = allWords;
                if (emojiRes?.captions?.[0]?.words) {
                  enrichedWords = emojiRes.captions[0].words;
                } else if (emojiRes?.captions?.[0]?.text) {
                  enrichedWords = alignEmojisWithWords(allWords, emojiRes.captions[0].text);
                }
                const enrichedSegments = wordsToCaptions(enrichedWords);
                if (enrichedSegments.length > 0) {
                  const enrichedWithOrig = enrichedSegments.map((s) => ({
                    ...s,
                    originalText: s.text,
                    originalWords: s.words ? JSON.parse(JSON.stringify(s.words)) : undefined,
                  }));
                  translationCacheRef.current = {};
                  setCaptions(enrichedWithOrig);
                }
              } catch (emojiErr) {
                console.warn("Background AI Emojis alignment skipped:", emojiErr);
              }
            })();
          }
        } else {
          throw new TranscriptionError("TRANSCRIPTION_FAILURE", "Could not parse recognizable speech into subtitle segments.");
        }
      } else {
        throw new TranscriptionError("NO_AUDIO_TRACK", "No speech segments recognized in this media file.");
      }
    } catch (err: unknown) {
      console.error("Transcription pipeline issue:", err);
      if (err instanceof TranscriptionError) {
        toast.error(err.message, { id: stageToast, duration: 6000 });
      } else {
        const isAbort = (err as { name?: string })?.name === "AbortError";
        const message = isAbort
          ? "Transcription timed out. Please check your connection or try again."
          : (err as Error)?.message || "Audio processing failed.";
        toast.error(message, { id: stageToast, duration: 6000 });
      }
    } finally {
      clearTimeout(networkTimeoutId);
      setTranscribing(false);
      setTranscribeStage("");
    }
  };

  const handleLanguageChange = async (nextLang: string) => {
    if (!captions.length) {
      toast.info("No captions to translate. Click 'Auto Transcribe' or '+ Add Caption' first.");
      return;
    }

    const langLabel = LANGUAGES.find((l) => l.code === nextLang)?.label || nextLang;

    // Filter subtitle speech captions vs overlay media
    const speechIndices: number[] = [];
    const speechTexts: string[] = [];
    captions.forEach((c, idx) => {
      if (!c.mediaType) {
        speechIndices.push(idx);
        speechTexts.push((c.originalText || c.text).trim());
      }
    });

    if (speechIndices.length === 0) {
      toast.info("No speech captions to translate.");
      return;
    }

    // 1. Switching back to Auto (Original audio language) — Instant 0ms
    if (nextLang === "auto") {
      setLanguage("auto");
      setCaptions((cur) =>
        cur.map((c) => {
          if (c.mediaType) return c;
          const origText = c.originalText || c.text;
          const restoredWords = c.originalWords && c.originalWords.length > 0
            ? [...c.originalWords]
            : buildProportionalWords(origText, c.start, c.end, "auto");
          return {
            ...c,
            text: origText,
            words: restoredWords,
            originalText: origText,
            originalWords: restoredWords,
          };
        })
      );
      toast.success("Restored original captions");
      return;
    }

    // 2. Check Client-Side Cache — Instant 0ms
    const cached = translationCacheRef.current[nextLang];
    if (cached && cached.length === speechIndices.length) {
      setLanguage(nextLang);
      setCaptions((cur) => {
        let speechCounter = 0;
        return cur.map((c) => {
          if (c.mediaType) return c;
          const nextText = cached[speechCounter++] ?? c.text;
          const baseOriginalWords = c.originalWords || (c.words ? [...c.words] : undefined);
          return {
            ...c,
            originalText: c.originalText || c.text,
            originalWords: baseOriginalWords,
            text: nextText,
            words: buildProportionalWords(nextText, c.start, c.end, nextLang),
          };
        });
      });
      toast.success(`Switched to ${langLabel}`);
      return;
    }

    // 3. Fast Edge Function Translation via Groq LPU / Gemini Direct
    setTranslating(true);
    setTranslatingLang(nextLang);
    const stageToast = toast.loading(`Translating captions to ${langLabel}…`);
    try {
      const res = await invokeEdgeFunction("translate-captions", {
        body: {
          texts: speechTexts,
          language: nextLang,
        },
      });
      console.log("[handleLanguageChange] Got res:", res);

      if (res && Array.isArray(res.translations) && res.translations.length > 0) {
        const translated: string[] = res.translations;
        translationCacheRef.current[nextLang] = translated;
        setLanguage(nextLang);
        setCaptions((cur) => {
          let speechCounter = 0;
          return cur.map((c) => {
            if (c.mediaType) return c;
            const nextText = translated[speechCounter++] ?? c.text;
            const baseOriginalWords = c.originalWords || (c.words ? [...c.words] : undefined);
            return {
              ...c,
              originalText: c.originalText || c.text,
              originalWords: baseOriginalWords,
              text: nextText,
              words: buildProportionalWords(nextText, c.start, c.end, nextLang),
            };
          });
        });
        toast.success(`Captions translated to ${langLabel}`, { id: stageToast });
      } else {
        throw new Error(res?.error || "Translation engine returned an empty response.");
      }
    } catch (e: unknown) {
      console.error("Translation issue:", e);
      const rawMsg = (e as Error).message || "";
      const errMsg = rawMsg.toLowerCase().includes("timed out")
        ? "Translation request timed out. Please try again."
        : rawMsg;
      toast.error(`Translation error: ${errMsg}`, { id: stageToast });
    } finally {
      setTranslating(false);
      setTranslatingLang(null);
    }
  };

  const exportVideo = useCallback(async () => {
    if (!file || exporting) return;
    setExporting(true);
    setExportProgress(0);
    setExportStage("prepare");
    setExportStageMessage("Freezing project snapshot...");
    exportAbortRef.current = new AbortController();

    const outputQuality = quality;
    const exportFps = outputQuality === "high" ? 30 : 24;
    const expectedDuration = videoRef.current?.duration || meta?.duration || 0;
    let renderedWebmBlob: Blob | null = null;

    // Single export timeline source of truth snapshot
    const snapshot = {
      duration: expectedDuration,
      captions: JSON.parse(JSON.stringify(captions)),
      style: JSON.parse(JSON.stringify(style)),
      track2Style: JSON.parse(JSON.stringify(track2Style)),
      effects: [...effects],
      audioClips: [...audioClips],
      vocalVolume,
      vocalMuted,
      audioSfxVolume,
      audioSfxMuted,
      outputQuality,
      exportFps,
      file,
      videoUrl,
      frame,
    };

    try {
      // 1. RENDER VIDEO FRAMES & CAPTIONS
      setExportStage("render");
      setExportProgress(0);
      setExportStageMessage("Rendering video frames & captions...");

      const webmBlob = await burnCaptions({
        videoFile: snapshot.file,
        captions: snapshot.captions,
        style: snapshot.style,
        track2Style: snapshot.track2Style,
        fps: snapshot.exportFps,
        onProgress: ({ progress, message }) => {
          setExportProgress(progress);
          if (message) setExportStageMessage(message);
        },
        onLog: (msg) => console.log(msg),
        signal: exportAbortRef.current.signal,
        output: snapshot.frame || undefined,
        quality: snapshot.outputQuality,
      });

      renderedWebmBlob = webmBlob;

      // 2. MIX MULTI-TRACK AUDIO (Original audio + vocal volume/mute + added audio/SFX clips)
      setExportStage("audio");
      setExportProgress(0);
      setExportStageMessage("Mixing audio tracks & SFX...");

      const mixResult = await mixProjectAudio({
        duration: snapshot.duration,
        originalVideoFile: snapshot.file,
        originalVideoUrl: snapshot.videoUrl || undefined,
        vocalVolume: snapshot.vocalVolume,
        vocalMuted: snapshot.vocalMuted,
        audioClips: snapshot.audioClips,
        audioSfxVolume: snapshot.audioSfxVolume,
        audioSfxMuted: snapshot.audioSfxMuted,
        sampleRate: 48000,
        onProgress: (p, msg) => {
          setExportProgress(p);
          if (msg) setExportStageMessage(msg);
        },
        onLog: (msg) => console.log(msg),
        signal: exportAbortRef.current.signal,
      });

      // 3. TRANSCODE & MULTIPLEX TO MP4 (H.264 + AAC 48kHz, CFR setpts, +faststart)
      setExportStage("transcode");
      setExportProgress(0);
      setExportStageMessage("Encoding HD MP4 (H.264 + AAC)...");

      const mp4Blob = await transcodeWebmToMp4({
        webmBlob: new File([webmBlob], "rendered.webm", { type: "video/webm" }),
        mixedAudioBlob: mixResult.audioBlob,
        originalFile: snapshot.file && snapshot.file.size > 0 ? snapshot.file : undefined,
        duration: snapshot.duration > 0 ? snapshot.duration : undefined,
        quality: snapshot.outputQuality,
        fps: snapshot.exportFps,
        onProgress: (progress) => setExportProgress(progress),
        onLog: (msg) => console.log(msg),
        signal: exportAbortRef.current.signal,
      });

      // 4. VALIDATE MP4 EXPORT
      setExportStage("validate");
      setExportProgress(0.5);
      setExportStageMessage("Validating MP4 container and streams...");

      const validation = await validateMp4Export(
        mp4Blob,
        snapshot.duration,
        snapshot.exportFps,
        mixResult.hasAudio
      );
      if (!validation.valid) {
        console.warn("[Export] Validation warning:", validation.error, validation.diagnostics);
        if (validation.diagnostics.status === "invalid") {
          throw new Error(validation.error || "Exported MP4 failed validation.");
        }
      }

      setExportProgress(1);
      setExportStage("complete");
      setExportStageMessage("Export complete!");

      const blobUrl = URL.createObjectURL(mp4Blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${title || "subbly_video"}_captioned.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      toast.success("HD MP4 Export completed successfully!");

      if (projectId && user) {
        const randPath = `${user.id}/${projectId}_export.mp4`;
        const { error: uploadErr } = await supabase.storage
          .from("project-exports")
          .upload(randPath, mp4Blob, { upsert: true });

        if (!uploadErr) {
          await supabase
            .from("projects")
            .update({ exported_video_path: randPath })
            .eq("id", projectId);
          setStoredExportPath(randPath);
        }
      }
    } catch (err: unknown) {
      if (err instanceof ExportCancelledError) {
        toast.info("Export cancelled by user");
      } else {
        console.error("Video export pipeline error:", err);
        // Fallback: If WebM was rendered, ensure user can still download their captioned video
        if (renderedWebmBlob && renderedWebmBlob.size > 0) {
          toast.warning("MP4 encoding failed. Downloading WebM video with burned-in captions instead.");
          const blobUrl = URL.createObjectURL(renderedWebmBlob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = `${title || "subbly_video"}_captioned.webm`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          return;
        }
        const errMsg = err instanceof Error ? err.message : (err && typeof err === "object" && "message" in err) ? String((err as { message: unknown }).message) : String(err);
        toast.error(`Export failed: ${errMsg}`);
      }
    } finally {
      setExporting(false);
      setExportProgress(0);
      exportAbortRef.current = null;
    }
  }, [file, exporting, quality, captions, style, frame, title, projectId, user, meta?.duration, effects, audioClips, vocalVolume, vocalMuted, audioSfxVolume, audioSfxMuted, videoUrl]);

  const cancelExport = () => {
    if (exportAbortRef.current) {
      exportAbortRef.current.abort();
    }
  };

  const handleImportSrtClick = useCallback(() => {
    srtInputRef.current?.click();
  }, []);

  const handleSrtFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const srtFile = e.target.files?.[0];
    if (!srtFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const imported = srtToCaptions(text);
        if (imported.length > 0) {
          const withOrig = imported.map((c) => ({ ...c, originalText: c.text }));
          translationCacheRef.current = {};
          setLanguage("auto");
          setCaptions(withOrig);
          toast.success(`Imported ${imported.length} caption cards from SRT file`);
        } else {
          toast.error("SRT file format matches but holds no valid captions.");
        }
      } catch (err) {
        toast.error("Invalid SRT subtitle file format.");
      }
    };
    reader.readAsText(srtFile);
    e.target.value = "";
  };

  const handleExportSrt = useCallback(() => {
    if (captions.length === 0) return;
    const text = captionsToSrt(captions);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${title || "subbly_subtitles"}.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Subtitle SRT file exported successfully!");
  }, [captions, title]);


  const headerRight = useMemo(
    () => (
      <div className="flex items-center gap-2.5">
        {/* F11 Experience suggestion notification */}
        {!isBrowserFullscreen && !f11Dismissed && (
          <div
            onClick={toggleBrowserFullscreen}
            role="button"
            tabIndex={0}
            title="Click to enter Fullscreen (or press F11)"
            className="flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-full border border-amber-500/80 bg-zinc-950/95 shadow-[0_0_16px_rgba(245,158,11,0.28)] hover:shadow-[0_0_22px_rgba(245,158,11,0.45)] hover:border-amber-400 transition-all duration-200 cursor-pointer select-none group"
          >
            {/* Monitor Icon inside dark circle */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 shadow-inner flex-shrink-0">
              <Monitor className="h-3.5 w-3.5 text-zinc-100 group-hover:text-amber-400 transition-colors" strokeWidth={2.2} />
            </div>

            {/* Text labels */}
            <div className="flex flex-col text-left justify-center pr-0.5 min-w-0">
              <div className="flex items-center gap-1 leading-none">
                <span className="text-[12px] font-extrabold text-[#f59e0b] tracking-wide">Press F11</span>
                <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
              </div>
              <span className="text-[9.5px] font-medium text-zinc-400 tracking-tight leading-none mt-0.5">
                for best experience
              </span>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismissF11Hint();
              }}
              className="ml-0.5 p-0.5 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
              aria-label="Dismiss F11 notification"
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.2} />
            </button>
          </div>
        )}

        {file && (
          <div className="flex items-center gap-2 border border-border bg-secondary/80 p-1.5 rounded-lg">
            <span className="px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-muted-foreground bg-muted rounded shadow-inner uppercase select-none border border-border">
              MP4
            </span>

            <Select
              value={quality}
              onValueChange={(q) => setQuality(q as "standard" | "high")}
              disabled={exporting}
            >
              <SelectTrigger className="h-7 w-[85px] border-none bg-transparent shadow-none px-1 text-[11.5px] text-foreground font-bold focus:ring-0 focus:ring-offset-0 hover:bg-muted/60 rounded">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="min-w-[100px] bg-popover border border-border text-popover-foreground">
                <SelectItem value="standard" className="text-[12px] font-semibold cursor-pointer">720p SD</SelectItem>
                <SelectItem value="high" className="text-[12px] font-semibold cursor-pointer">1080p HD</SelectItem>
              </SelectContent>
            </Select>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer flex-shrink-0"
                  aria-label="Quality settings information"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[260px] text-xs leading-normal bg-popover text-popover-foreground border border-border p-3 shadow-2xl rounded-lg">
                <div className="space-y-1">
                  <p><span className="font-bold text-primary">Standard:</span> 720p HD (Faster Export)</p>
                  <p><span className="font-bold text-primary">High:</span> 1080p Full HD (Best Quality)</p>
                </div>
              </TooltipContent>
            </Tooltip>

            <button
              onClick={exportVideo}
              disabled={exporting}
              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-gradient-primary px-3 py-1.5 text-[12px] font-bold text-primary-foreground transition hover:opacity-95 disabled:opacity-70 shadow-glow hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="text-[10px]">
                    {exportStage === "transcode" ? "Converting" : "Rendering"}{" "}
                    {Math.round(exportProgress * 100)}%
                  </span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
                  <span>Export Video</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    ),
    [file, exporting, exportProgress, exportStage, quality, exportVideo, isBrowserFullscreen, f11Dismissed, toggleBrowserFullscreen, dismissF11Hint],
  );

  if (loadingProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground select-none font-outfit">
      <Seo
        title="Editor — Subbly"
        description="Subbly's caption editor — auto-transcribe your video, edit captions, style subtitles, and export a captioned video."
        path="/editor"
        noIndex
      />

      {/* 1. FLOATING NAVIGATION BAR */}
      {!isMobile && (
        <header className="flex flex-shrink-0 items-center justify-between gap-3 border border-border/70 bg-card/80 backdrop-blur-md px-4 py-2 mx-4 mt-3 rounded-xl shadow-elegant select-none h-14 z-50">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate(user ? "/projects" : "/");
                }
              }}
              className="flex h-8.5 w-8.5 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground transition hover:bg-muted hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <ArrowLeft className="h-4.5 w-4.5" strokeWidth={2.4} />
            </button>
            <BrandLogo size="sm" />
            <div className="hidden h-5 w-px bg-border sm:block" />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              className="h-8.5 min-w-0 flex-1 border-transparent bg-transparent px-2 text-[13px] font-bold text-foreground hover:border-border focus-visible:border-border focus-visible:ring-0 md:w-60 md:flex-none placeholder:text-muted-foreground"
            />

            {/* Auto Save Status Indicator */}
            {projectId && autoSaveState !== "idle" && (
              <span className="hidden flex-shrink-0 items-center gap-1 text-[11px] sm:inline-flex select-none">
                {autoSaveState === "saving" ? (
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    Saving…
                  </span>
                ) : (
                  <span className="text-emerald-500 flex items-center gap-1 font-bold animate-pulse">
                    <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3.5} />
                    Saved just now
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-3">
            {/* Header Undo / Redo */}
            <div className="flex items-center gap-1 border-r border-border pr-2.5">
              <button
                title="Undo edit"
                onClick={handleUndo}
                disabled={!canUndo}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed hover:bg-muted hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                title="Redo edit"
                onClick={handleRedo}
                disabled={!canRedo}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed hover:bg-muted hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </div>

            {headerRight}

            {/* Header Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted hover:scale-105 active:scale-95 transition cursor-pointer"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {user ? (
              <AvatarDropdown />
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center rounded-lg bg-gradient-primary px-[16px] py-1.5 text-[12px] font-bold text-primary-foreground shadow-glow transition hover:opacity-95 hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>
      )}

      <input
        ref={srtInputRef}
        type="file"
        accept=".srt,application/x-subrip,text/plain"
        className="hidden"
        onChange={handleSrtFile}
      />

      {/* 2. MAIN WORKSPACE / EDITOR SCENE */}
      {!file && (
        <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center justify-center gap-8 overflow-y-auto px-6 py-10">
          <div className="text-center">
            <h1 className="mb-2.5 text-[32px] font-extrabold leading-[1.1] tracking-tight md:text-[36px] text-foreground">
              Caption your videos in <span className="bg-gradient-primary bg-clip-text text-transparent">seconds</span>
            </h1>
            <p className="mx-auto max-w-[360px] text-[14px] leading-relaxed text-muted-foreground">
              Upload a video to start. We'll save your captions and styling so you can come back anytime.
            </p>
          </div>
          <div className="w-full">
            <VideoDropzone onFile={handleFile} onDemo={loadDemoProject} />
          </div>
        </main>
      )}

      {file && videoUrl && (() => {
        const captionsPanel = (
          <CaptionList
            key={`${language}_${captions.length}`}
            captions={captions}
            currentTime={currentTime}
            onChange={handleCaptionsChange}
            onSeek={seek}
            lockedTracks={lockedTracks}
            onOpenStyles={() => {
              setActiveTab("style");
              setActiveLeftTool("style");
            }}
          />
        );

        const isPortrait = framePreset.id !== "original"
          ? (framePreset.width < framePreset.height)
          : (meta && meta.height > meta.width);

        const previewPanel = (
          <div className="flex h-full flex-col overflow-hidden bg-transparent">
            <div className="flex flex-1 flex-col items-center justify-center overflow-hidden p-4">
              {/* Aspect Ratio Preset Selector */}
              <div className="mb-4.5 flex items-center justify-center flex-shrink-0">
                <div className="inline-flex items-center gap-1.5 bg-secondary p-1 rounded-full border border-border shadow-md select-none">
                  {FRAME_PRESETS.map((p) => {
                    const active = framePreset.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setFramePreset(p)}
                        className={`rounded-full px-3.5 py-1 text-[11.5px] font-bold transition cursor-pointer select-none ${active
                          ? "bg-gradient-primary text-primary-foreground shadow-glow"
                          : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className="w-full h-full flex-1 min-h-0 flex items-center justify-center overflow-hidden"
                style={{
                  maxWidth: isPortrait ? "420px" : "100%",
                  maxHeight: "100%",
                }}
              >
                <VideoPreview
                  ref={videoRefCallback}
                  src={videoUrl}
                  captions={captions}
                  style={style}
                  track2Style={track2Style}
                  selectedCaptionId={selectedCaptionId}
                  onSelect={setSelectedCaptionId}
                  onTimeUpdate={setCurrentTime}
                  onLoaded={setMeta}
                  onCaptionStyleChange={handleCaptionStyleChange}
                  onCaptionPositionChange={handleCaptionPositionChange}
                  onCaptionDelete={handleDeleteCaption}
                  onCaptionReplace={handleReplaceMedia}
                  onCaptionChange={(id, text) =>
                    setCaptions((cur) =>
                      cur.map((c) => (c.id === id ? { ...c, text, words: undefined } : c)),
                    )
                  }
                  frame={frame}
                  lockedTracks={lockedTracks}
                  quality={quality}
                  effects={effects}
                />
              </div>
            </div>
          </div>
        );

        const selectedCaption = captions.find(c => c.id === selectedCaptionId) || null;
        const targetTrack = selectedCaption ? (selectedCaption.track || 1) : 1;
        const activeTrackStyle = targetTrack === 2 ? track2Style : style;

        const commonStylePanelProps = {
          style: selectedCaption?.style ? { ...activeTrackStyle, ...selectedCaption.style } : activeTrackStyle,
          onChange: handleStyleChange,
          selectedCaption: selectedCaption,
          onCaptionChange: (id: string, patch: Partial<typeof captions[0]>) => {
            setCaptions((cur) =>
              cur.map((c) => {
                if (c.id === id) {
                  const baseTrack = (c.track || 1) === 2 ? track2Style : style;
                  return {
                    ...c,
                    ...patch,
                    style: patch.style ? { ...(c.style || baseTrack), ...patch.style } : c.style,
                  };
                }
                return c;
              })
            );
          },
          isLocked: selectedCaption ? lockedTracks.includes(selectedCaption.track || 1) : false,
          showTabsHeader: false as const,
        };

        // Style panel — caption appearance + animation (style & anim tabs only)
        const stylePanel = (
          <StylePanel
            {...commonStylePanelProps}
            activeTab={activeTab === "tmpl" || activeTab === "brand" ? "style" : activeTab}
          />
        );

        // Templates panel — preset layouts only
        const templatesPanel = (
          <StylePanel
            {...commonStylePanelProps}
            activeTab="tmpl"
          />
        );

        // Brand panel — brand kit only
        const brandPanel = (
          <StylePanel
            {...commonStylePanelProps}
            activeTab="brand"
          />
        );

        const duration = meta?.duration || 0;
        const progressPct = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
        const computedResolution = (() => {
          if (!meta) return "";
          if (framePreset.id === "original") {
            return `${meta.width}×${meta.height}`;
          }
          const targetShortDim = quality === "high" ? 1080 : 720;
          const targetAR = framePreset.width / framePreset.height;
          let w: number;
          let h: number;
          if (targetAR >= 1) {
            h = targetShortDim;
            w = Math.round(targetShortDim * targetAR);
          } else {
            w = targetShortDim;
            h = Math.round(targetShortDim / targetAR);
          }
          if (w % 2 !== 0) w += 1;
          if (h % 2 !== 0) h += 1;
          return `${w}×${h}`;
        })();

        const combinedToolbar = (
          <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3 sm:px-4 py-2 select-none min-h-[44px]">
            {/* Left: Language selector */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
              <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" strokeWidth={2} />
              <span className="text-[11.5px] font-bold text-muted-foreground whitespace-nowrap hidden sm:inline">Caption Language</span>
              <Select value={translatingLang || language} onValueChange={handleLanguageChange} disabled={translating}>
                <SelectTrigger className="h-7.5 w-[115px] sm:w-[130px] rounded-lg border border-border bg-secondary px-2 sm:px-2.5 text-[11.5px] font-bold text-foreground focus:ring-0 focus:ring-offset-0 transition hover:bg-muted cursor-pointer flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[280px] overflow-y-auto bg-popover border border-border text-popover-foreground shadow-xl">
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code} className="text-[12px] font-semibold cursor-pointer hover:bg-accent focus:bg-accent transition-colors">
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {translating && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  Translating…
                </span>
              )}
            </div>

            {/* Center: Inline Video Playback Controls */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center max-w-[560px] min-w-0 px-1 sm:px-2">
              {/* Subtle divider before player */}
              <div className="h-4 w-px bg-border/60 flex-shrink-0 hidden md:block" />

              {/* Play / Pause button */}
              <button
                type="button"
                onClick={() => {
                  const v = videoRef.current;
                  if (!v) return;
                  if (v.paused) v.play().catch(() => {});
                  else v.pause();
                }}
                className="hover:scale-110 active:scale-95 text-[#FF6B2C] hover:text-[#FF874D] transition p-1 rounded-md cursor-pointer flex-shrink-0"
                aria-label={isPlaying ? "Pause" : "Play"}
                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              >
                {isPlaying ? (
                  <Pause className="h-4.5 w-4.5 fill-current" />
                ) : (
                  <Play className="h-4.5 w-4.5 fill-current translate-x-[0.5px]" />
                )}
              </button>

              {/* Current time / Duration */}
              <span className="font-mono text-[11px] text-muted-foreground font-semibold flex-shrink-0 select-none whitespace-nowrap">
                {formatTime(currentTime)} <span className="opacity-40">/</span> {formatTime(duration)}
              </span>

              {/* Compact scrubber progress bar */}
              <div
                ref={scrubberRef}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsScrubbing(true);
                  handleScrubberSeek(e.clientX);
                }}
                className="group/scrub relative flex items-center h-4 cursor-pointer flex-1 min-w-[90px] sm:min-w-[120px] max-w-[280px]"
                title="Seek video"
              >
                <div className="w-full h-1.5 bg-white/15 rounded-full group-hover/scrub:h-2 transition-all relative overflow-hidden">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-[#FF6B2C] rounded-full transition-all duration-75"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#FF6B2C] shadow-md scale-0 group-hover/scrub:scale-100 transition-transform pointer-events-none"
                  style={{ left: `${progressPct}%` }}
                />
              </div>

              {/* Volume */}
              <div className="flex items-center gap-1 group/volume flex-shrink-0">
                <button
                  type="button"
                  onClick={handleTogglePlayerMute}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label={isPlayerMuted || playerVolume === 0 ? "Unmute" : "Mute"}
                  title={isPlayerMuted || playerVolume === 0 ? "Unmute" : "Mute"}
                >
                  {isPlayerMuted || playerVolume === 0 ? (
                    <VolumeX className="h-4 w-4 text-red-400" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
                <input
                  type="range"
                  aria-label="Volume"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isPlayerMuted ? 0 : playerVolume}
                  onChange={(e) => {
                    e.stopPropagation();
                    handlePlayerVolumeChange(Number(e.target.value));
                  }}
                  className="w-0 group-hover/volume:w-14 sm:group-hover/volume:w-16 h-1 rounded-full bg-white/20 accent-[#FF6B2C] cursor-pointer transition-all duration-200 opacity-0 group-hover/volume:opacity-100"
                />
              </div>

              {/* Fullscreen */}
              <button
                type="button"
                onClick={togglePlayerFullscreen}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer flex-shrink-0"
                aria-label={isPlayerFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={isPlayerFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isPlayerFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Right: Metadata + Add + Auto-Transcribe Button */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
              {meta && (
                <div className="text-[11px] font-bold text-muted-foreground font-mono whitespace-nowrap hidden lg:block">
                  {computedResolution} · {meta.duration.toFixed(1)}s
                </div>
              )}
              <MediaAddDropdown onOpenMemeStudio={handleOpenMemeStudio} />
              <button
                onClick={transcribe}
                disabled={transcribing}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 sm:px-3.5 text-[11.5px] font-bold text-primary hover:bg-gradient-primary hover:text-primary-foreground transition disabled:opacity-60 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap flex-shrink-0"
              >
                {transcribing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{transcribeStage || "Transcribing…"}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3.5 w-3.5" strokeWidth={2} />
                    <span>{captions.length ? "Re-transcribe" : "Auto-transcribe"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );

        const timelinePanel = meta ? (
          <Timeline
            duration={meta.duration}
            currentTime={currentTime}
            captions={captions}
            onChange={handleCaptionsChange}
            onSeek={(t) => {
              setCurrentTime(t);
              if (videoRef.current) videoRef.current.currentTime = t;
            }}
            playing={isPlaying}
            onTogglePlay={() => {
              const v = videoRef.current;
              if (!v) return;
              if (v.paused) v.play().catch(() => { });
              else v.pause();
            }}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            selectedId={selectedCaptionId}
            onSelect={setSelectedCaptionId}
            lockedTracks={lockedTracks}
            onToggleLockTrack={(trackNum) =>
              setLockedTracks((prev) =>
                prev.includes(trackNum)
                  ? prev.filter((t) => t !== trackNum)
                  : [...prev, trackNum]
              )
            }
            videoUrl={videoUrl}
            audioSource={file}
            effects={effects}
            onEffectsChange={setEffects}
            audioClips={audioClips}
            onAudioClipsChange={setAudioClips}
            vocalVolume={vocalVolume}
            onVocalVolumeChange={setVocalVolume}
            vocalMuted={vocalMuted}
            onToggleVocalMute={() => setVocalMuted((prev) => !prev)}
            audioSfxVolume={audioSfxVolume}
            onAudioSfxVolumeChange={setAudioSfxVolume}
            audioSfxMuted={audioSfxMuted}
            onToggleAudioSfxMute={() => setAudioSfxMuted((prev) => !prev)}
            onOpenMemeStudio={() => handleOpenMemeStudio({ tab: "gifs" })}
            zoomPct={timelineZoom}
            onZoomChange={setTimelineZoom}
          />
        ) : null;

        return (
          <div className="flex flex-1 overflow-hidden select-none">

            {/* Desktop Layout - Slim Sidebar + Dynamic Panels + Preview */}
            {!isMobile && (
              <div className="flex flex-1 overflow-hidden">
                {/* 2.1 SLIM NAVIGATION SIDEBAR */}
                <aside className="w-16 flex-shrink-0 bg-card border-r border-border flex flex-col items-center justify-between py-4 select-none z-30">
                  <div className="flex flex-col gap-4.5 w-full items-center">
                    {/* Captions Panel Toggle */}
                    <SidebarIcon
                      title="Captions"
                      icon={Type}
                      active={activeLeftTool === "captions"}
                      onClick={() => toggleLeftTool("captions")}
                    />
                    {/* Text Workspace (dual-panel: Text Styles + Customize Text) */}
                    <SidebarIcon
                      title="Text"
                      icon={Sparkles}
                      active={activeLeftTool === "text"}
                      onClick={() => toggleLeftTool("text")}
                    />
                    {/* Templates Panel Toggle */}
                    <SidebarIcon
                      title="Templates"
                      icon={Layers}
                      active={activeLeftTool === "templates"}
                      onClick={() => toggleLeftTool("templates")}
                    />
                    {/* Brand Kit Panel Toggle */}
                    <SidebarIcon
                      title="Brand Kit"
                      icon={Palette}
                      active={activeLeftTool === "brand"}
                      onClick={() => toggleLeftTool("brand")}
                    />

                    {/* Media Panel Toggle (Meme Studio) — opens as full-screen overlay */}
                    <div className="relative group flex items-center justify-center w-full select-none px-1">
                      {isMemeStudioOpen && (
                        <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-primary rounded-r-md" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (isMemeStudioOpen) {
                            setIsMemeStudioOpen(false);
                          } else {
                            handleOpenMemeStudio({ tab: memeStudioTab });
                          }
                        }}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl transition duration-300 hover:scale-[1.05] active:scale-95 cursor-pointer relative ${isMemeStudioOpen
                          ? "bg-gradient-primary text-primary-foreground shadow-glow"
                          : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        title="Media & Stickers"
                      >
                        <Smile className="h-[21px] w-[21px]" />
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] font-bold px-1 rounded-full uppercase tracking-wider scale-90">
                          Beta
                        </span>
                      </button>
                      <span className="absolute left-16 rounded bg-popover border border-border px-2 py-1 text-[10px] font-bold text-popover-foreground opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 z-50 whitespace-nowrap shadow-md">
                        Media & Stickers
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="w-8 h-px bg-border rounded-full" />

                    {/* Import SRT */}
                    <SidebarIcon title="Import SRT" icon={Upload} onClick={handleImportSrtClick} />
                    {/* Save Workspace */}
                    {file && (
                      <SidebarIcon
                        title={saving ? "Saving…" : "Save Workspace"}
                        icon={saving ? Loader2 : Save}
                        onClick={handleManualSave}
                      />
                    )}
                    {/* Export Video */}
                    {file && (
                      <div className="relative group flex items-center justify-center w-full select-none px-1">
                        <button
                          type="button"
                          onClick={exportVideo}
                          disabled={exporting}
                          className="flex h-11 w-11 items-center justify-center rounded-xl transition duration-300 hover:scale-[1.05] active:scale-95 cursor-pointer bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-70"
                          title="Export Video"
                        >
                          {exporting ? (
                            <Loader2 className="h-[19px] w-[19px] animate-spin" />
                          ) : (
                            <Download className="h-[19px] w-[19px]" />
                          )}
                        </button>
                        <span className="absolute left-16 rounded bg-popover border border-border px-2 py-1 text-[10px] font-bold text-popover-foreground opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 z-50 whitespace-nowrap shadow-md">
                          {exporting ? `Exporting ${Math.round(exportProgress * 100)}%` : "Export Video"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom: Theme Toggle */}
                  <div className="flex flex-col gap-4 w-full items-center">
                    <SidebarIcon title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"} icon={theme === "dark" ? Sun : Moon} onClick={toggleTheme} />
                  </div>
                </aside>

                {/* 2.2 DYNAMIC HORIZONTAL WORKSPACE */}
                <div className="flex-1 flex flex-col overflow-hidden bg-background bg-grid-dark-pattern dark:bg-grid-white-pattern relative">
                  {/* Soft ambient background glows */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-40" />

                  {/* Desktop Resizable NLE Workspace (Top Panels/Preview vs Bottom Timeline) */}
                  <ResizablePanelGroup
                    direction="vertical"
                    autoSaveId="subbly-main-vertical-layout"
                    className="flex-1 min-h-0 z-10"
                  >
                    {/* Top Workspace — Panels + Preview */}
                    <ResizablePanel defaultSize={62} minSize={25} maxSize={82} className="flex flex-col min-h-0">
                      <div className="flex-1 min-h-0 overflow-hidden px-4 pt-3 pb-1 flex">
                        {(selectedAudioClip || activeLeftTool) ? (
                          <ResizablePanelGroup
                            direction="horizontal"
                            autoSaveId="subbly-top-horizontal-layout"
                            className="flex-1 min-h-0 w-full"
                          >
                            <ResizablePanel
                              defaultSize={selectedAudioClip ? 26 : activeLeftTool === "text" ? 40 : 26}
                              minSize={selectedAudioClip ? 18 : activeLeftTool === "text" ? 22 : 18}
                              maxSize={55}
                              className="flex min-w-0"
                            >
                              <div className="w-full h-full flex flex-col overflow-hidden pr-2">
                                {selectedAudioClip ? (
                                  <div className="w-full h-full rounded-2xl border border-border bg-card overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-left-2 duration-200">
                                    <AudioControlsPanel
                                      clip={selectedAudioClip}
                                      onUpdateClip={(patch) => handleUpdateAudioClip(selectedAudioClip.id, patch)}
                                      onDeleteClip={handleDeleteAudioClip}
                                      onClose={() => setSelectedCaptionId(null)}
                                      liveAudioLevel={liveAudioLevel}
                                      isPlaying={isPlaying}
                                    />
                                  </div>
                                ) : (
                                  <>
                                    {/* PANEL A: Captions List */}
                                    {activeLeftTool === "captions" && (
                                      <div className="w-full h-full rounded-2xl border border-border bg-card overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-left-2 duration-200">
                                        {/* Panel header with close button */}
                                        <div className="flex items-center justify-between h-10 px-3 border-b border-border bg-card/80 flex-shrink-0">
                                          <div className="flex items-center gap-2">
                                            <div className="h-5 w-5 flex items-center justify-center rounded bg-primary/10 text-primary">
                                              <Type className="h-3 w-3" />
                                            </div>
                                            <span className="text-[12px] font-extrabold text-foreground tracking-tight">Captions</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => setActiveLeftTool(null)}
                                            className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition cursor-pointer"
                                            title="Close panel"
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                          {captionsPanel}
                                        </div>
                                      </div>
                                    )}

                                    {/* PANEL B: Caption Style (appearance + animation) */}
                                    {activeLeftTool === "style" && (
                                      <div className="w-full h-full rounded-2xl border border-border bg-card overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-left-2 duration-200">
                                        <div className="flex items-center justify-between h-10 px-3 border-b border-border bg-card/80 flex-shrink-0">
                                          <div className="flex items-center gap-2">
                                            <div className="h-5 w-5 flex items-center justify-center rounded bg-primary/10 text-primary">
                                              <Sparkles className="h-3 w-3" />
                                            </div>
                                            <span className="text-[12px] font-extrabold text-foreground tracking-tight">Caption Style</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => setActiveLeftTool(null)}
                                            className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition cursor-pointer"
                                            title="Close panel"
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                        {/* Style / Animation sub-tab switcher */}
                                        <div className="flex items-center gap-1 px-2 pt-2 pb-1.5 border-b border-border flex-shrink-0">
                                          {(["style", "anim"] as const).map((tab) => (
                                            <button
                                              key={tab}
                                              type="button"
                                              onClick={() => setActiveTab(tab)}
                                              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                                                activeTab === tab
                                                  ? "bg-primary/10 text-primary"
                                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                              }`}
                                            >
                                              {tab === "style" ? "Style" : "Animation"}
                                            </button>
                                          ))}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                          {stylePanel}
                                        </div>
                                      </div>
                                    )}

                                    {/* PANEL C: Templates */}
                                    {activeLeftTool === "templates" && (
                                      <div className="w-full h-full rounded-2xl border border-border bg-card overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-left-2 duration-200">
                                        <div className="flex items-center justify-between h-10 px-3 border-b border-border bg-card/80 flex-shrink-0">
                                          <div className="flex items-center gap-2">
                                            <div className="h-5 w-5 flex items-center justify-center rounded bg-primary/10 text-primary">
                                              <Layers className="h-3 w-3" />
                                            </div>
                                            <span className="text-[12px] font-extrabold text-foreground tracking-tight">Caption Templates</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => setActiveLeftTool(null)}
                                            className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition cursor-pointer"
                                            title="Close panel"
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                          {templatesPanel}
                                        </div>
                                      </div>
                                    )}

                                    {/* PANEL D: Brand Kit */}
                                    {activeLeftTool === "brand" && (
                                      <div className="w-full h-full rounded-2xl border border-border bg-card overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-left-2 duration-200">
                                        <div className="flex items-center justify-between h-10 px-3 border-b border-border bg-card/80 flex-shrink-0">
                                          <div className="flex items-center gap-2">
                                            <div className="h-5 w-5 flex items-center justify-center rounded bg-primary/10 text-primary">
                                              <Palette className="h-3 w-3" />
                                            </div>
                                            <span className="text-[12px] font-extrabold text-foreground tracking-tight">Brand Kit</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => setActiveLeftTool(null)}
                                            className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition cursor-pointer"
                                            title="Close panel"
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                          {brandPanel}
                                        </div>
                                      </div>
                                    )}

                                    {/* PANEL E: Text Workspace — dual panel (Text Styles + Customize Text) */}
                                    {activeLeftTool === "text" && (
                                      <div className="w-full h-full flex gap-2 overflow-hidden">
                                        {/* Text Styles Panel — collapsed shows expand button only */}
                                        {textStylesCollapsed ? (
                                          <div className="flex-shrink-0 w-8 flex flex-col items-center py-2 border border-border bg-card/80 rounded-2xl shadow-sm">
                                            <button
                                              type="button"
                                              onClick={() => setTextStylesCollapsed(false)}
                                              title="Expand Text Styles"
                                              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                                            >
                                              <ChevronRight className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex-1 min-w-[200px] rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-left-2 duration-200 border border-border/40">
                                            <TextStylesPanel
                                              style={commonStylePanelProps.style}
                                              onChange={commonStylePanelProps.onChange}
                                              selectedCaptionId={selectedCaptionId}
                                              onCollapse={() => setTextStylesCollapsed(true)}
                                            />
                                          </div>
                                        )}

                                        {/* Customize Text Panel */}
                                        {customizeTextCollapsed ? (
                                          <div className="flex-shrink-0 w-8 flex flex-col items-center py-2 border border-border bg-card/80 rounded-2xl shadow-sm">
                                            <button
                                              type="button"
                                              onClick={() => setCustomizeTextCollapsed(false)}
                                              title="Expand Customize Text"
                                              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                                            >
                                              <ChevronRight className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex-1 min-w-[200px] rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-left-2 duration-200 border border-border/40">
                                            <CustomizeTextPanel
                                              style={commonStylePanelProps.style}
                                              onChange={commonStylePanelProps.onChange}
                                              selectedCaption={selectedCaption}
                                              onCaptionChange={commonStylePanelProps.onCaptionChange}
                                              onApplyToAll={handleApplyToAllTrack}
                                              onCollapse={() => setCustomizeTextCollapsed(true)}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </ResizablePanel>

                            <ResizableHandle className="mx-1" />

                            <ResizablePanel
                              defaultSize={selectedAudioClip ? 74 : activeLeftTool === "text" ? 60 : 74}
                              minSize={45}
                              className="flex min-w-0"
                            >
                              <div className="w-full h-full min-w-0 bg-transparent overflow-hidden pl-1">
                                {previewPanel}
                              </div>
                            </ResizablePanel>
                          </ResizablePanelGroup>
                        ) : (
                          <div className="w-full h-full min-w-0 bg-transparent overflow-hidden">
                            {previewPanel}
                          </div>
                        )}
                      </div>
                    </ResizablePanel>

                    <ResizableHandle className="my-1 mx-4" />

                    {/* Bottom Timeline Panel Container */}
                    <ResizablePanel defaultSize={38} minSize={18} maxSize={75} className="flex flex-col min-h-0">
                      <div className="flex-1 flex flex-col overflow-hidden bg-card border border-border mx-4 mb-3 rounded-2xl shadow-2xl select-none min-h-0">
                        {combinedToolbar}
                        <div className="flex-1 overflow-hidden">
                          {timelinePanel}
                        </div>
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </div>
              </div>
            )}

            {/* Mobile Layout */}
            {isMobile && (
              <div className="flex flex-1 flex-col overflow-hidden bg-background h-full relative">
                {/* 1. Top Nav Bar */}
                <div className="h-11 flex-shrink-0 flex items-center justify-between px-2.5 border-b border-border bg-card gap-1">
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => {
                        if (window.history.length > 1) {
                          navigate(-1);
                        } else {
                          navigate(user ? "/projects" : "/");
                        }
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground min-h-[40px] min-w-[40px] cursor-pointer"
                      aria-label="Back"
                    >
                      <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
                    </button>

                    {/* Mobile Undo / Redo controls */}
                    <div className="flex items-center gap-0.5 bg-secondary/70 border border-border rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={handleUndo}
                        disabled={!canUndo}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                        title="Undo"
                        aria-label="Undo"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRedo}
                        disabled={!canRedo}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                        title="Redo"
                        aria-label="Redo"
                      >
                        <Redo2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title and Auto-save indicator */}
                  <div className="flex items-center justify-center min-w-0 flex-1 px-1">
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Project title"
                      className="h-8 border-transparent bg-transparent px-1 text-center text-xs font-bold text-foreground hover:border-border focus-visible:border-border focus-visible:ring-0 placeholder:text-muted-foreground max-w-[130px] truncate"
                    />
                    {file && (
                      <div className="flex-shrink-0 ml-0.5" title={autoSaveState === "saving" ? "Saving..." : "All changes saved"}>
                        {autoSaveState === "saving" ? (
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        ) : autoSaveState === "saved" ? (
                          <Cloud className="h-3 w-3 text-emerald-500" />
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <MediaAddDropdown onOpenMemeStudio={handleOpenMemeStudio} />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground min-h-[40px] min-w-[40px] cursor-pointer"
                          aria-label="Project actions menu"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 bg-popover border border-border text-popover-foreground shadow-xl rounded-xl">
                        <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={handleUndo} disabled={!canUndo} className="text-xs cursor-pointer py-2 hover:bg-accent rounded-lg flex items-center justify-between">
                          <span className="flex items-center gap-2"><Undo2 className="h-3.5 w-3.5" /> Undo</span>
                          <span className="text-[10px] text-muted-foreground">Ctrl+Z</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleRedo} disabled={!canRedo} className="text-xs cursor-pointer py-2 hover:bg-accent rounded-lg flex items-center justify-between">
                          <span className="flex items-center gap-2"><Redo2 className="h-3.5 w-3.5" /> Redo</span>
                          <span className="text-[10px] text-muted-foreground">Ctrl+Y</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem onClick={toggleTheme} className="text-xs cursor-pointer py-2 hover:bg-accent rounded-lg flex items-center gap-2">
                          {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-indigo-500" />}
                          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem
                          onClick={() => handleOpenMemeStudio({ tab: "gifs" })}
                          className="text-xs cursor-pointer py-2 hover:bg-accent rounded-lg flex items-center justify-between text-primary font-bold"
                        >
                          <span className="flex items-center gap-2"><Smile className="h-3.5 w-3.5" /> Meme Studio</span>
                          <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-extrabold uppercase scale-90">Beta</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem onClick={handleImportSrtClick} className="text-xs cursor-pointer py-2 hover:bg-accent rounded-lg">Import SRT</DropdownMenuItem>
                        {captions.length > 0 && (
                          <DropdownMenuItem onClick={handleExportSrt} className="text-xs cursor-pointer py-2 hover:bg-accent rounded-lg">Export SRT</DropdownMenuItem>
                        )}
                        {file && (
                          <DropdownMenuItem onClick={handleManualSave} className="text-xs cursor-pointer py-2 hover:bg-accent rounded-lg">Save Project</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">Export Quality</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => setQuality("standard")}
                          className="text-xs cursor-pointer py-2 hover:bg-accent rounded-lg flex items-center justify-between"
                        >
                          <span>Standard (720p)</span>
                          {quality === "standard" && <Check className="h-3.5 w-3.5 text-primary" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setQuality("high")}
                          className="text-xs cursor-pointer py-2 hover:bg-accent rounded-lg flex items-center justify-between"
                        >
                          <span>High (1080p)</span>
                          {quality === "high" && <Check className="h-3.5 w-3.5 text-primary" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {file && (
                      <button
                        onClick={exportVideo}
                        disabled={exporting}
                        className="flex h-9 px-3 items-center justify-center gap-1.5 rounded-lg bg-gradient-primary text-xs font-bold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:opacity-75 min-h-[40px] cursor-pointer"
                      >
                        {exporting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" strokeWidth={2} />
                        )}
                        <span>Export</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Scroll Container (Contains Video Preview, Timeline, Aspect Ratio, and Active tab panels) */}
                <div className="flex-1 overflow-y-auto flex flex-col pb-24 scrollbar-thin">
                  {/* 2. Video Preview (Sticky width & aspect-ratio centering) */}
                  <div className="flex-shrink-0 bg-muted/30 flex items-center justify-center p-3.5 relative border-b border-border w-full">
                    <div
                      className="flex items-center justify-center overflow-hidden"
                      style={{
                        width: "75vw",
                        maxWidth: "320px",
                        aspectRatio: framePreset.id !== "original"
                          ? `${framePreset.width}/${framePreset.height}`
                          : (meta ? `${meta.width}/${meta.height}` : "9/16"),
                      }}
                    >
                      <VideoPreview
                        ref={videoRefCallback}
                        src={videoUrl}
                        captions={captions}
                        style={style}
                        track2Style={track2Style}
                        selectedCaptionId={selectedCaptionId}
                        onSelect={setSelectedCaptionId}
                        onTimeUpdate={setCurrentTime}
                        onLoaded={setMeta}
                        onCaptionStyleChange={handleCaptionStyleChange}
                        onCaptionPositionChange={handleCaptionPositionChange}
                        onCaptionDelete={handleDeleteCaption}
                        onCaptionReplace={handleReplaceMedia}
                        onCaptionChange={(id, text) =>
                          setCaptions((cur) =>
                            cur.map((c) => (c.id === id ? { ...c, text, words: undefined } : c)),
                          )
                        }
                        frame={frame}
                        lockedTracks={lockedTracks}
                        quality={quality}
                        effects={effects}
                      />
                    </div>
                  </div>

                  {/* 3. Playback and Timeline Toolbar */}
                  {timelineExpanded ? (
                    <div className="flex-shrink-0 bg-card p-2 border-b border-border select-none flex flex-col">
                      <div className="flex justify-between items-center px-2 pb-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Multi-track Editor</span>
                        <button
                          onClick={() => setTimelineExpanded(false)}
                          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          Collapse
                        </button>
                      </div>
                      <div className="overflow-hidden rounded-lg border border-border">
                        {timelinePanel}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2 bg-card border-b border-border w-full select-none">
                      <span className="text-[10px] font-mono text-muted-foreground font-semibold select-none flex-shrink-0">
                        {formatTime(currentTime)}
                      </span>
                      <button
                        onClick={() => {
                          const v = videoRef.current;
                          if (!v) return;
                          if (v.paused) v.play().catch(() => { });
                          else v.pause();
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95 transition cursor-pointer flex-shrink-0"
                        aria-label={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? (
                          <Pause className="h-3.5 w-3.5 fill-current" />
                        ) : (
                          <Play className="h-3.5 w-3.5 fill-current translate-x-[0.5px]" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <CondensedTimeline
                          duration={meta?.duration ?? 0}
                          currentTime={currentTime}
                          onSeek={seek}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground font-semibold select-none flex-shrink-0">
                        {formatTime(meta?.duration ?? 0)}
                      </span>
                      <button
                        onClick={() => setTimelineExpanded(true)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0"
                        title="Expand Timeline"
                        aria-label="Expand Timeline"
                      >
                        <ChevronsUpDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* 4. Aspect Ratio Selector Buttons */}
                  <div className="flex-shrink-0 bg-card border-b border-border">
                    <div className="flex overflow-x-auto scrollbar-none gap-2.5 px-4 py-3 bg-secondary/40">
                      {FRAME_PRESETS.map((p) => {
                        const active = framePreset.id === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => setFramePreset(p)}
                            className={`flex flex-col items-center justify-center whitespace-nowrap px-4 py-2.5 rounded-xl text-center select-none transition cursor-pointer flex-shrink-0 min-w-[90px] ${active
                              ? "bg-gradient-primary text-primary-foreground shadow-glow"
                              : "bg-secondary text-muted-foreground border border-border hover:text-foreground"
                              }`}
                          >
                            <span className="text-[11px] font-bold">{p.label}</span>
                            {p.id !== "original" ? (
                              <span className="text-[9px] font-semibold opacity-75 mt-0.5">{p.width}:{p.height}</span>
                            ) : (
                              <span className="text-[9px] font-semibold opacity-75 mt-0.5">Auto</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. Active Editing Controls Tab Panel */}
                  {selectedAudioClip ? (
                    <div className="flex-1 overflow-hidden bg-[#0e1015] border-b border-border min-h-[300px]">
                      <AudioControlsPanel
                        clip={selectedAudioClip}
                        onUpdateClip={(patch) => handleUpdateAudioClip(selectedAudioClip.id, patch)}
                        onDeleteClip={handleDeleteAudioClip}
                        onClose={() => setSelectedCaptionId(null)}
                        liveAudioLevel={liveAudioLevel}
                        isPlaying={isPlaying}
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 bg-card flex flex-col">
                    {activeMobileTab === "captions" ? (
                      <div className="flex flex-col overflow-hidden">
                        {/* Mobile Caption Language Bar */}
                        <div className="flex items-center justify-between px-3 py-2 bg-secondary border-b border-border select-none flex-shrink-0">
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                            <span className="text-[11px] font-bold text-foreground">Caption Language</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select value={translatingLang || language} onValueChange={handleLanguageChange} disabled={translating}>
                              <SelectTrigger className="h-7.5 w-[120px] rounded-lg border border-border bg-card px-2 text-[10.5px] font-bold text-foreground focus:ring-0 cursor-pointer">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px] overflow-y-auto bg-popover border border-border text-popover-foreground z-50 shadow-xl">
                                {LANGUAGES.map((l) => (
                                  <SelectItem key={l.code} value={l.code} className="text-xs font-semibold cursor-pointer hover:bg-accent focus:bg-accent">
                                    {l.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {translating && (
                              <Loader2 className="h-3 w-3 animate-spin text-primary" />
                            )}
                          </div>
                        </div>

                        {/* Captions List Content Area */}
                        <div>
                          {captions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-8 px-6 bg-secondary border border-border rounded-xl my-4 mx-4 shadow-md">
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary mb-3.5">
                                <FileText className="h-5.5 w-5.5" strokeWidth={2} />
                              </div>
                              <h3 className="text-[13px] font-bold text-foreground mb-0.5">No captions yet</h3>
                              <p className="text-[11.5px] text-muted-foreground mb-4.5 max-w-[260px] leading-relaxed">
                                Auto-transcribe your speech or manually add captions to this video.
                              </p>
                              <div className="flex flex-col w-full gap-2">
                                <button
                                  onClick={transcribe}
                                  disabled={transcribing}
                                  className="w-full flex h-10 items-center justify-center gap-1.5 rounded-lg bg-gradient-primary text-[11px] font-bold text-primary-foreground shadow-glow hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
                                >
                                  {transcribing ? (
                                    <>
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      <span>{transcribeStage || "Transcribing..."}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Wand2 className="h-3 w-3" />
                                      <span>Auto-transcribe</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={handleAddCaptionMobile}
                                  className="w-full flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Add caption</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveMobileTab("meme");
                                    handleOpenMemeStudio({ tab: "gifs" });
                                  }}
                                  className="w-full flex h-10 items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 text-[11px] font-bold text-primary hover:bg-primary/20 transition cursor-pointer shadow-sm"
                                >
                                  <Smile className="h-3.5 w-3.5" />
                                  <span>Open Meme Studio (Add GIFs & Memes)</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            captionsPanel
                          )}
                        </div>
                      </div>
                    ) : activeMobileTab === "meme" ? (
                      <div className="flex flex-col items-center justify-center text-center p-6 bg-card border-b border-border my-2 mx-3 rounded-2xl bg-secondary/40 border border-border shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground mb-3 shadow-glow">
                          <Smile className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-extrabold text-foreground mb-1">Meme Studio (Beta)</h3>
                        <p className="text-xs text-muted-foreground mb-4 max-w-[280px] leading-relaxed">
                          Search and overlay trending memes, reaction GIFs, stickers, and sound bites onto your video.
                        </p>
                        <button
                          onClick={() => handleOpenMemeStudio({ tab: "gifs" })}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-bold text-xs shadow-glow hover:scale-105 active:scale-95 transition cursor-pointer"
                        >
                          <Smile className="h-4 w-4" />
                          <span>Open Meme Studio</span>
                        </button>
                      </div>
                    ) : (
                      /* Renders the style panels corresponding to Style, Anim, Templates, and Brand settings tabs */
                      <div>
                        <StylePanel
                          style={selectedCaption?.style ? { ...activeTrackStyle, ...selectedCaption.style } : activeTrackStyle}
                          onChange={handleStyleChange}
                          selectedCaption={selectedCaption}
                          onCaptionChange={(id, patch) => {
                            setCaptions((cur) =>
                              cur.map((c) => {
                                if (c.id === id) {
                                  const baseTrack = (c.track || 1) === 2 ? track2Style : style;
                                  return {
                                    ...c,
                                    ...patch,
                                    style: patch.style ? { ...(c.style || baseTrack), ...patch.style } : c.style,
                                  };
                                }
                                return c;
                              })
                            );
                          }}
                          isLocked={selectedCaption ? lockedTracks.includes(selectedCaption.track || 1) : false}
                          activeTab={activeMobileTab === "tmpl" ? "tmpl" : activeMobileTab === "brand" ? "brand" : activeMobileTab === "anim" ? "anim" : "style"}
                          showTabsHeader={false}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

                {/* 6. Fixed Bottom Navigation Tab Bar (Mobile) */}
                <div className="absolute bottom-0 left-0 right-0 z-50 h-16 bg-card border-t border-border flex items-center justify-around px-2 pb-safe shadow-lg select-none">
                  {([
                    { id: "captions", label: "Captions", icon: FileText },
                    { id: "style", label: "Style", icon: Type },
                    { id: "anim", label: "Anim", icon: Sparkles },
                    { id: "meme", label: "Memes", icon: Smile, badge: "Beta" },
                    { id: "tmpl", label: "Templates", icon: Layers },
                    { id: "brand", label: "Brand", icon: Palette },
                  ] as const).map((tabItem) => {
                    const Icon = tabItem.icon;
                    const active = tabItem.id === "meme" ? (isMemeStudioOpen || activeMobileTab === "meme") : activeMobileTab === tabItem.id;
                    return (
                      <button
                        key={tabItem.id}
                        onClick={() => {
                          if (tabItem.id === "meme") {
                            setActiveMobileTab("meme");
                            handleOpenMemeStudio({ tab: "gifs" });
                          } else {
                            setActiveMobileTab(tabItem.id);
                          }
                        }}
                        className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] gap-1 transition cursor-pointer ${
                          active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="relative flex items-center justify-center">
                          <Icon className="h-5 w-5" strokeWidth={2} />
                          {"badge" in tabItem && (
                            <span className="absolute -top-1 -right-2.5 bg-primary text-primary-foreground text-[7px] font-black px-1 py-0.2 rounded-full uppercase tracking-tight scale-75">
                              {tabItem.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold tracking-wide select-none">{tabItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      <ExportProgressDialog
        open={exporting}
        stage={exportStage}
        progress={exportProgress}
        format="mp4"
        stageMessage={exportStageMessage}
        onCancel={cancelExport}
      />

      <MemeStudioPanel
        isOpen={isMemeStudioOpen}
        onClose={() => {
          setIsMemeStudioOpen(false);
          setReplaceTargetId(null);
        }}
        onInsertMedia={handleInsertMedia}
        initialTab={memeStudioTab}
        initialFilter={memeStudioFilter}
        replaceTargetId={replaceTargetId}
      />
    </div>
  );
};

/* Slim Sidebar Left icon component */
function SidebarIcon({
  icon: Icon, title, active, onClick,
}: {
  icon: React.ComponentType<{ className?: string }>; title: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <div className="relative group flex items-center justify-center w-full select-none px-1">
      {active && (
        <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-primary rounded-r-md" />
      )}
      <button
        type="button"
        onClick={onClick}
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition duration-300 hover:scale-[1.05] active:scale-95 cursor-pointer relative ${active
          ? "bg-gradient-primary text-primary-foreground shadow-glow"
          : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        title={title}
      >
        <Icon className="h-[21px] w-[21px]" />
      </button>

      {/* Floating tooltip on hover */}
      <span className="absolute left-16 rounded bg-popover border border-border px-2 py-1 text-[10px] font-bold text-popover-foreground opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 z-50 whitespace-nowrap shadow-md">
        {title}
      </span>
    </div>
  );
}

export default Editor;

