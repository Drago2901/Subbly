import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";

import {
  ArrowLeft,
  Check,
  ChevronDown,
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
  Smile,
} from "lucide-react";
import { MediaAddDropdown } from "@/components/captionly/MemeStudio/MediaAddDropdown";
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
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { AvatarDropdown } from "@/components/AvatarDropdown";
import { wordsToCaptions } from "@/lib/captions/segment";
import { burnCaptions, ExportCancelledError } from "@/lib/captions/render";
import { transcodeWebmToMp4, validateExportDuration } from "@/lib/captions/transcode";
import { extractAudioNative } from "@/lib/captions/audio";
import { alignEmojisWithWords, stripEmojis } from "@/lib/captions/emoji";
import {
  DEFAULT_STYLE,
  type Caption,
  type CaptionStyle,
  type Word,
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
  const { data, error } = await supabase.functions.invoke(name, options);
  if (error) {
    let message = error.message || "An error occurred calling the edge function";
    try {
      const errWithContext = error as { context?: Response };
      if (errWithContext.context && typeof errWithContext.context.text === "function") {
        const text = await errWithContext.context.text();
        try {
          const parsed = JSON.parse(text);
          if (parsed && (parsed.error || parsed.message)) {
            message = parsed.error || parsed.message;
          }
        } catch {
          if (text && text.length < 250) {
            message = text;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to extract edge function error response:", e);
    }
    throw new Error(message);
  }
  return data;
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

const Editor = () => {
  const { user, session, signOut, isAdmin } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeMobileTab, setActiveMobileTab] = useState<"captions" | "style" | "anim" | "tmpl" | "brand">("style");
  const [activeTab, setActiveTab] = useState<"style" | "anim" | "tmpl" | "brand">("style");
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  const [isPlaying, setIsPlaying] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<ProjectMeta | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const captionsRef = useRef<Caption[]>(captions);
  captionsRef.current = captions;
  const [style, setStyle] = useState<CaptionStyle>(DEFAULT_STYLE);
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

  const [quality, setQuality] = useState<"standard" | "high">("standard");
  const [exportStage, setExportStage] = useState<"render" | "transcode">("render");
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

  const { canUndo, canRedo, handleUndo, handleRedo, resetHistory } = useEditorHistory(captions, setCaptions);

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
    const refCap = captions.find((c) => c.x !== undefined);
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
      cur.map((c) =>
        c.id === id
          ? { ...c, style: { ...c.style, ...styleUpdate } }
          : c
      )
    );
  }, []);

  const handleCaptionPositionChange = useCallback((id: string, patch: Partial<Caption>) => {
    setCaptions((cur) => {
      const target = cur.find((c) => c.id === id);
      const targetTrack = target ? (target.track || 1) : 1;
      return cur.map((c) => {
        const cTrack = c.track || 1;
        if (cTrack === targetTrack) {
          return {
            ...c,
            ...patch,
            style: patch.style ? { ...c.style, ...patch.style } : c.style
          };
        }
        return c;
      });
    });
  }, []);

  const handleStyleChange = useCallback((nextStyle: CaptionStyle) => {
    setStyle(nextStyle);
    setCaptions((cur) =>
      cur.map((c) => {
        if (!c.style) {
          if (selectedCaptionId && c.id === selectedCaptionId) {
            return {
              ...c,
              style: nextStyle,
            };
          }
          return c;
        }

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
      })
    );
  }, [selectedCaptionId]);

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

  // Global Keyboard Shortcuts (Undo, Redo, Play/Pause)
  useEditorKeyboard({
    onUndo: handleUndo,
    onRedo: handleRedo,
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
          if (data.captions) setCaptions(data.captions as Caption[]);
          if (data.style) setStyle(data.style as CaptionStyle);
          setStoredSourcePath(data.source_video_path);
          setStoredSourceMime(data.source_video_mime);
          setStoredSourceName(data.source_video_name);
          setStoredExportPath(data.exported_video_path);

          if (data.source_video_path) {
            const { data: urlData, error: urlError } = await supabase.storage
              .from("videos")
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
          if (parsed.captions) setCaptions(parsed.captions);
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
            style: JSON.parse(JSON.stringify(style)),
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

  const loadDemoProject = useCallback(async () => {
    setVideoUrl(DEMO_VIDEO_URL);
    setCaptions([]);
    resetHistory([]);
    setTitle("Test Video Project");
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
    if (searchParams.get("demo") === "true" && !file) {
      loadDemoProject();
    }
  }, [searchParams, file, loadDemoProject]);

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
    setTranscribeStage("Preparing audio…");
    const stageToast = toast.loading("Auto-transcription: Preparing audio stream…");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000); // 40s safety timeout

    try {
      setTranscribeStage("Optimizing audio…");
      toast.loading("Extracting and optimizing speech tracks…", { id: stageToast });
      const audioBlob = await extractAudioNative(file);

      setTranscribeStage("Transcribing…");
      toast.loading("AI speech engine generating captions…", { id: stageToast });

      const isWav = audioBlob.type.includes("wav") || file.name.toLowerCase().endsWith(".wav");
      const isMp3 = audioBlob.type.includes("mpeg") || audioBlob.type.includes("mp3") || file.name.toLowerCase().endsWith(".mp3");
      const ext = isWav ? "wav" : isMp3 ? "mp3" : (file.name.split(".").pop() || "wav");

      const form = new FormData();
      form.append("file", audioBlob, `audio.${ext}`);
      if (language && language !== "auto") form.append("language", language);

      // Direct fetch so browser configures correct multipart boundary
      let token = session?.access_token;
      if (!token) {
        try {
          const sessionRes = await supabase.auth.getSession();
          token = sessionRes.data.session?.access_token;
        } catch { /* ignore */ }
      }

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
        throw new Error(errMsg);
      }
      const transcriptionData = await fnRes.json();

      if (transcriptionData?.words && Array.isArray(transcriptionData.words) && transcriptionData.words.length > 0) {
        const rawWords = transcriptionData.words as Word[];
        const segments = wordsToCaptions(rawWords);
        if (segments.length > 0) {
          setCaptions(segments);
          const providerInfo = transcriptionData.provider ? ` (${transcriptionData.tookMs ? `${(transcriptionData.tookMs / 1000).toFixed(1)}s` : "done"})` : "";
          toast.success(`AI Transcription completed successfully!${providerInfo}`, { id: stageToast });

          // If emojis are enabled, enrich captions in the background without blocking the editor UI
          if (style.emojiEnabled) {
            (async () => {
              try {
                const cleanText = rawWords.map((w) => w.text.trim()).filter(Boolean).join(" ");
                const emojiRes = await invokeEdgeFunction("align-emojis", {
                  body: {
                    captions: [{ id: "temp", text: cleanText, words: rawWords }],
                    density: style.emojiDensity || "medium",
                  },
                });
                let enrichedWords = rawWords;
                if (emojiRes?.captions?.[0]?.words) {
                  enrichedWords = emojiRes.captions[0].words;
                } else if (emojiRes?.captions?.[0]?.text) {
                  enrichedWords = alignEmojisWithWords(rawWords, emojiRes.captions[0].text);
                }
                const enrichedSegments = wordsToCaptions(enrichedWords);
                if (enrichedSegments.length > 0) {
                  setCaptions(enrichedSegments);
                }
              } catch (emojiErr) {
                console.warn("Background AI Emojis alignment skipped:", emojiErr);
              }
            })();
          }
        } else {
          throw new Error("Could not parse recognizable speech into subtitle segments.");
        }
      } else {
        throw new Error("No speech segments recognized in this video file.");
      }
    } catch (err: unknown) {
      console.error("Transcription pipeline issue:", err);
      const isAbort = (err as { name?: string })?.name === "AbortError";
      const message = isAbort
        ? "Transcription timed out. Please try with a shorter clip or faster connection."
        : (err as Error).message;
      toast.error(`Transcription Failed: ${message}`, { id: stageToast });
    } finally {
      clearTimeout(timeoutId);
      setTranscribing(false);
      setTranscribeStage("");
    }
  };

  const handleLanguageChange = async (nextLang: string) => {
    const prevLang = language;
    setLanguage(nextLang);
    if (!captions.length || nextLang === "auto") return;

    setTranslating(true);
    const stageToast = toast.loading(`Translating all captions to ${LANGUAGES.find(l => l.code === nextLang)?.label || nextLang}…`);
    try {
      const texts = captions.map(c => c.text);
      const res = await invokeEdgeFunction("translate-captions", {
        body: {
          texts,
          language: nextLang,
        }
      });
      if (res && Array.isArray(res.translations)) {
        const translated: string[] = res.translations;
        setCaptions(cur =>
          cur.map((c, i) => ({
            ...c,
            text: translated[i] ?? c.text,
            words: undefined,
          }))
        );
        toast.success(`Captions translated to ${LANGUAGES.find(l => l.code === nextLang)?.label || nextLang}`);
      }
    } catch (e: unknown) {
      console.error("Translation issue:", e);
      setLanguage(prevLang);
      const rawMsg = (e as Error).message || "";
      const errMsg = rawMsg.toLowerCase().includes("timed out")
        ? "Translation request timed out. Please try again."
        : rawMsg;
      toast.error(`Translation error: ${errMsg}`);
    } finally {
      setTranslating(false);
      toast.dismiss(stageToast);
    }
  };

  const exportVideo = useCallback(async () => {
    if (!file || exporting) return;
    setExporting(true);
    setExportProgress(0);
    setExportStage("render");
    exportAbortRef.current = new AbortController();

    const outputQuality = quality;

    try {
      const webmBlob = await burnCaptions({
        videoFile: file,
        captions,
        style,
        onProgress: (info) => {
          setExportProgress(info.progress);
        },
        onLog: (msg) => console.log(msg),
        signal: exportAbortRef.current.signal,
        output: frame || undefined,
        quality: outputQuality,
      });

      setExportStage("transcode");
      setExportProgress(0);

      const mp4Blob = await transcodeWebmToMp4({
        webmBlob: new File([webmBlob], "rendered.webm", { type: "video/webm" }),
        originalFile: file,
        quality: outputQuality,
        onProgress: (progress) => setExportProgress(progress),
        onLog: (msg) => console.log(msg),
        signal: exportAbortRef.current.signal,
      });

      const expectedDuration = videoRef.current?.duration || 0;
      if (expectedDuration > 0) {
        const durationCheck = await validateExportDuration(mp4Blob, expectedDuration);
        if (!durationCheck.valid && durationCheck.error) {
          console.warn("[Export] Duration check warning:", durationCheck.error);
        }
      }

      const blobUrl = URL.createObjectURL(mp4Blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${title || "subbly_video"}_captioned.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("HD MP4 Export completed successfully!");

      if (projectId && user) {
        const randPath = `${user.id}/${projectId}_export.mp4`;
        const { error: uploadErr } = await supabase.storage
          .from("exports")
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
        const errMsg = err instanceof Error ? err.message : (err && typeof err === "object" && "message" in err) ? String((err as { message: unknown }).message) : String(err);
        toast.error(`Export failed: ${errMsg}`);
      }
    } finally {
      setExporting(false);
      setExportProgress(0);
      exportAbortRef.current = null;
    }
  }, [file, exporting, quality, captions, style, frame, title, projectId, user]);

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
          setCaptions(imported);
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

  const seek = (timeVal: number) => {
    setCurrentTime(timeVal);
    if (videoRef.current) videoRef.current.currentTime = timeVal;
  };

  const headerRight = useMemo(
    () => (
      <div className="flex items-center gap-2">


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
    [file, exporting, exportProgress, exportStage, quality, exportVideo],
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
            onChange={setCaptions}
            onSeek={seek}
            lockedTracks={lockedTracks}
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
                className="w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden"
                style={{
                  maxWidth: isPortrait ? "320px" : "720px"
                }}
              >
                <VideoPreview
                  ref={videoRefCallback}
                  src={videoUrl}
                  captions={captions}
                  style={style}
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
                />
              </div>
            </div>
          </div>
        );

        const selectedCaption = captions.find(c => c.id === selectedCaptionId) || null;

        const stylePanel = (
          <StylePanel
            style={selectedCaption?.style ? { ...style, ...selectedCaption.style } : style}
            onChange={handleStyleChange}
            selectedCaption={selectedCaption}
            onCaptionChange={(id, patch) => {
              setCaptions((cur) => {
                const target = cur.find((c) => c.id === id);
                const targetTrack = target ? (target.track || 1) : 1;
                return cur.map((c) => {
                  const cTrack = c.track || 1;
                  if (cTrack === targetTrack) {
                    return {
                      ...c,
                      ...patch,
                      style: patch.style ? { ...c.style, ...patch.style } : c.style
                    };
                  }
                  return c;
                });
              });
            }}
            isLocked={selectedCaption ? lockedTracks.includes(selectedCaption.track || 1) : false}
            activeTab={activeTab}
            showTabsHeader={false}
          />
        );

        const combinedToolbar = (
          <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5">
            {/* Left: Language selector */}
            <div className="flex items-center gap-3">
              {meta && (
                <div className="flex items-center gap-2.5">
                  <Globe className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                  <span className="text-[11.5px] font-bold text-muted-foreground">Caption Language</span>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="h-7.5 w-[130px] rounded-lg border border-border bg-secondary px-2.5 text-[11.5px] font-bold text-foreground focus:ring-0 focus:ring-offset-0 transition hover:bg-muted cursor-pointer">
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
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      Translating…
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right: Metadata + Auto-Transcribe Button */}
            <div className="flex items-center gap-4">
              {meta && (
                <div className="text-[11px] font-bold text-muted-foreground font-mono">
                  {(() => {
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
                  })()} · {meta.duration.toFixed(1)}s
                </div>
              )}
              <MediaAddDropdown onOpenMemeStudio={handleOpenMemeStudio} />
              <button
                onClick={transcribe}
                disabled={transcribing}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3.5 text-[11.5px] font-bold text-primary hover:bg-gradient-primary hover:text-primary-foreground transition disabled:opacity-60 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
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
            onChange={setCaptions}
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
          />
        ) : null;

        return (
          <div className="flex flex-1 overflow-hidden select-none">

            {/* Desktop Layout - Slim Sidebar Left + Resizable Horizontal Panels */}
            {!isMobile && (
              <div className="flex flex-1 overflow-hidden">
                {/* 2.1 SLIM NAVIGATION SIDEBAR */}
                <aside className="w-16 flex-shrink-0 bg-card border-r border-border flex flex-col items-center justify-between py-4 select-none">
                  <div className="flex flex-col gap-4.5 w-full items-center">
                    {/* Captions */}
                    <SidebarIcon title="Captions" icon={Type} active={activeTab === "style"} onClick={() => setActiveTab("style")} />
                    {/* Animation Styles */}
                    <SidebarIcon title="Animation Styles" icon={Sparkles} active={activeTab === "anim"} onClick={() => setActiveTab("anim")} />
                    {/* Caption Templates */}
                    <SidebarIcon title="Caption Templates" icon={Layers} active={activeTab === "tmpl"} onClick={() => setActiveTab("tmpl")} />
                    {/* Brand Kit */}
                    <SidebarIcon title="Brand Kit" icon={Palette} active={activeTab === "brand"} onClick={() => setActiveTab("brand")} />

                    {/* Meme Studio (Beta) */}
                    <div className="relative group flex items-center justify-center w-full select-none px-1">
                      {isMemeStudioOpen && (
                        <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-primary rounded-r-md" />
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenMemeStudio({ tab: "gifs" })}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl transition duration-300 hover:scale-[1.05] active:scale-95 cursor-pointer relative ${isMemeStudioOpen
                          ? "bg-gradient-primary text-primary-foreground shadow-glow"
                          : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        title="Meme Studio (Beta)"
                      >
                        <Smile className="h-[21px] w-[21px]" />
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] font-bold px-1 rounded-full uppercase tracking-wider scale-90">
                          Beta
                        </span>
                      </button>
                      <span className="absolute left-16 rounded bg-popover border border-border px-2 py-1 text-[10px] font-bold text-popover-foreground opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 z-50 whitespace-nowrap shadow-md">
                        Meme Studio (Beta)
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


                {/* 2.2 HORIZONTAL WORKSPACE ROW */}
                <div className="flex-1 flex flex-col overflow-hidden bg-background bg-grid-dark-pattern dark:bg-grid-white-pattern relative">
                  {/* Soft ambient background glows */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-40" />

                  {/* Top Workspace Panels */}
                  <div className="flex-1 min-h-0 overflow-hidden px-4 py-3 z-10">
                    <ResizablePanelGroup direction="horizontal" className="h-full w-full gap-3">
                      {/* Left: captionsPanel */}
                      <ResizablePanel defaultSize={26} minSize={15} maxSize={40} className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xl">
                        {captionsPanel}
                      </ResizablePanel>

                      <ResizableHandle className="bg-transparent hover:bg-primary/20 transition w-1 cursor-col-resize" />

                      {/* Middle: previewPanel */}
                      <ResizablePanel defaultSize={48} minSize={35} className="bg-transparent overflow-hidden">
                        {previewPanel}
                      </ResizablePanel>

                      <ResizableHandle className="bg-transparent hover:bg-primary/20 transition w-1 cursor-col-resize" />

                      {/* Right: stylePanel */}
                      <ResizablePanel defaultSize={26} minSize={15} maxSize={40} className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xl">
                        {stylePanel}
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </div>

                  {/* Bottom Timeline Panel Container */}
                  <div className="flex-shrink-0 h-[260px] flex flex-col overflow-hidden bg-card border border-border mx-4 mb-3 rounded-2xl shadow-2xl select-none">
                    {combinedToolbar}
                    <div className="flex-1 overflow-hidden">
                      {timelinePanel}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Layout */}
            {isMobile && (
              <div className="flex flex-1 flex-col overflow-hidden bg-background h-full relative">
                {/* 1. Top Nav Bar */}
                <div className="h-11 flex-shrink-0 flex items-center justify-between px-3 border-b border-border bg-card">
                  <button
                    onClick={() => {
                      if (window.history.length > 1) {
                        navigate(-1);
                      } else {
                        navigate(user ? "/projects" : "/");
                      }
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] cursor-pointer"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
                  </button>

                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Project title"
                    className="h-8 flex-1 border-transparent bg-transparent px-1 text-center text-xs font-bold text-foreground hover:border-border focus-visible:border-border focus-visible:ring-0 placeholder:text-muted-foreground max-w-[150px] mx-1"
                  />

                  <div className="flex items-center gap-1">
                    <MediaAddDropdown onOpenMemeStudio={handleOpenMemeStudio} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] cursor-pointer"
                          aria-label="Project actions menu"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 bg-popover border border-border text-popover-foreground shadow-xl rounded-xl">
                        <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">Actions</DropdownMenuLabel>
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
                        className="flex h-9 px-3 items-center justify-center gap-1.5 rounded-lg bg-gradient-primary text-xs font-bold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:opacity-75 min-h-[44px] cursor-pointer"
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
                            <Select value={language} onValueChange={handleLanguageChange}>
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
                              </div>
                            </div>
                          ) : (
                            captionsPanel
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Renders the style panels corresponding to Style, Anim, Templates, and Brand settings tabs */
                      <div>
                        <StylePanel
                          style={selectedCaption?.style ? { ...style, ...selectedCaption.style } : style}
                          onChange={handleStyleChange}
                          selectedCaption={selectedCaption}
                          onCaptionChange={(id, patch) => {
                            setCaptions((cur) => {
                              const target = cur.find((c) => c.id === id);
                              const targetTrack = target ? (target.track || 1) : 1;
                              return cur.map((c) => {
                                const cTrack = c.track || 1;
                                if (cTrack === targetTrack) {
                                  return {
                                    ...c,
                                    ...patch,
                                    style: patch.style ? { ...c.style, ...patch.style } : c.style
                                  };
                                }
                                return c;
                              });
                            });
                          }}
                          isLocked={selectedCaption ? lockedTracks.includes(selectedCaption.track || 1) : false}
                          activeTab={activeMobileTab === "tmpl" ? "tmpl" : activeMobileTab === "brand" ? "brand" : activeMobileTab === "anim" ? "anim" : "style"}
                          showTabsHeader={false}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Fixed Bottom Navigation Tab Bar (Mobile) */}
                <div className="absolute bottom-0 left-0 right-0 z-50 h-16 bg-card border-t border-border flex items-center justify-around px-2 pb-safe shadow-lg select-none">
                  {([
                    { id: "captions", label: "Captions", icon: FileText },
                    { id: "style", label: "Style", icon: Type },
                    { id: "anim", label: "Anim", icon: Sparkles },
                    { id: "tmpl", label: "Templates", icon: Layers },
                    { id: "brand", label: "Brand", icon: Palette },
                  ] as const).map((tabItem) => {
                    const Icon = tabItem.icon;
                    const active = activeMobileTab === tabItem.id;
                    return (
                      <button
                        key={tabItem.id}
                        onClick={() => setActiveMobileTab(tabItem.id)}
                        className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] gap-1 transition cursor-pointer ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2} />
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

