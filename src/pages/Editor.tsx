import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { transcodeWebmToMp4 } from "@/lib/captions/transcode";
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
  { id: "portrait", label: "Portrait", width: 4, height: 5, fit: "contain" },
];

// Helper to safely invoke a Supabase Edge Function and parse details from non-2xx errors
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
      className="relative flex-1 h-8 bg-neutral-100 dark:bg-neutral-900 rounded-lg flex items-center gap-0.5 px-2 cursor-pointer overflow-hidden border border-[#e8e4de] dark:border-neutral-800"
    >
      {bars.map((h, i) => {
        const barProgress = (i / bars.length) * 100;
        const active = barProgress <= progressPct;
        return (
          <div
            key={i}
            className="flex-grow rounded-[1px]"
            style={{
              height: `${h * 70}%`,
              minHeight: "4px",
              backgroundColor: active ? "#10b981" : "#d1d5db",
            }}
          />
        );
      })}
      {/* Playhead */}
      <div 
        className="absolute top-0 bottom-0 w-[2px] bg-[#ff5c3a] z-10"
        style={{ left: `${progressPct}%` }}
      />
    </div>
  );
};

const Editor = () => {

  const { user, signOut } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeMobileTab, setActiveMobileTab] = useState<"captions" | "style" | "anim" | "tmpl" | "brand">("style");
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  const [isPlaying, setIsPlaying] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<ProjectMeta | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const exportAbortRef = useRef<AbortController | null>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);
  // Snapshot of the last persisted caption/style/title, used to skip redundant auto-saves.
  const lastSavedRef = useRef<string>("");
  const prevEmojiEnabledRef = useRef<boolean | undefined>(undefined);
  const prevEmojiDensityRef = useRef<string | undefined>(undefined);

  const [selectedCaptionId, setSelectedCaptionId] = useState<string | null>(null);
  const [lockedTracks, setLockedTracks] = useState<number[]>([]);

  const [history, setHistory] = useState<Caption[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoingRef = useRef(false);

  const frame = useMemo(() => {
    return framePreset.id !== "original"
      ? { width: framePreset.width, height: framePreset.height, fit: framePreset.fit }
      : null;
  }, [framePreset]);

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
      id: crypto.randomUUID(),
      start,
      end: start + 2,
      text: "New caption",
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
    // 1. Update the base/global style so any future / generating captions use these values
    setStyle(nextStyle);

    // 2. Update ALL captions to match the new style, keeping only their custom position/box size
    setCaptions((cur) =>
      cur.map((c) => {
        // If the caption has no custom style object, it will inherit the new global style anyway.
        if (!c.style) {
          // If it is the selected caption, we give it nextStyle to make sure its style state is set
          if (selectedCaptionId && c.id === selectedCaptionId) {
            return {
              ...c,
              style: nextStyle,
            };
          }
          return c;
        }

        // If it does have a custom style object, merge the new style into it,
        // but preserve its custom position/box dimension settings.
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

  // Debounced history record
  useEffect(() => {
    if (isUndoRedoingRef.current) {
      isUndoRedoingRef.current = false;
      return;
    }
    if (captions.length === 0 && history.length <= 1 && (history[0]?.length === 0)) return;

    const timer = setTimeout(() => {
      const currentEntry = history[historyIndex];
      const nextStr = JSON.stringify(captions);
      const currentStr = currentEntry ? JSON.stringify(currentEntry) : "";

      if (nextStr !== currentStr) {
        setHistory((prev) => {
          const nextHist = prev.slice(0, historyIndex + 1);
          nextHist.push(JSON.parse(JSON.stringify(captions)));
          if (nextHist.length > 50) {
            nextHist.shift();
            setHistoryIndex(nextHist.length - 1);
          } else {
            setHistoryIndex(nextHist.length - 1);
          }
          return nextHist;
        });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [captions, history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoingRef.current = true;
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setCaptions(JSON.parse(JSON.stringify(history[nextIndex])));
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoingRef.current = true;
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCaptions(JSON.parse(JSON.stringify(history[nextIndex])));
    }
  }, [history, historyIndex]);

  const enhanceCaptionsWithEmojis = useCallback(async (currentCaptions: Caption[]) => {
    await toast.promise(
      (async () => {
        const densityText =
          style.emojiDensity === "light"
            ? "Light (1 emoji every 1-2 sentences)"
            : style.emojiDensity === "heavy"
              ? "Heavy (multiple emojis for highly engaging social media captions)"
              : "Medium (1 emoji every key phrase)";

        const customPrompt = `the exact same language, but enhanced by adding contextually relevant emojis to important words and phrases. Do NOT translate, modify, paraphrase or rewrite the original words. Maintain original casing, spelling, language, punctuation, and wording exactly as they are, but selectively insert contextually relevant emojis. Density requirement: ${densityText}.`;

        const data = await invokeEdgeFunction("translate-captions", {
          body: {
            texts: currentCaptions.map((c) => stripEmojis(c.text)),
            language: customPrompt,
          },
        });
        const enhancedTexts: string[] = data?.translations ?? [];
        if (enhancedTexts.length !== currentCaptions.length) {
          throw new Error("AI response mismatch");
        }

        const updated = currentCaptions.map((c, i) => {
          const enhancedText = enhancedTexts[i] || c.text;
          return {
            ...c,
            text: enhancedText,
            words: c.words ? alignEmojisWithWords(c.words, enhancedText) : undefined,
          };
        });
        setCaptions(updated);
      })(),
      {
        loading: "Enhancing captions with emojis...",
        success: "Emojis added to captions!",
        error: (err) => `Failed to add emojis: ${err instanceof Error ? err.message : String(err)}`,
      }
    );
  }, [style.emojiDensity]);

  useEffect(() => {
    document.title = "Editor — Subbly";
  }, []);


  // Load project from URL
  useEffect(() => {
    if (!projectId || !user) return;
    let active = true;
    (async () => {
      setLoadingProject(true);
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          toast.error("Project not found");
          navigate("/projects", { replace: true });
          return;
        }
        if (!active) return;
        const loadedCaptions = (data.captions as Caption[]) ?? [];
        const loadedStyle = { ...DEFAULT_STYLE, ...((data.style as Partial<CaptionStyle>) ?? {}) };
        const initializedCaptions = loadedCaptions.map((c) => ({
          ...c,
          x: c.x ?? (c.style?.posX ?? 0.5),
          y: c.y ?? (c.style?.posY ?? (c.track === 2 ? 0.73 : 0.88)),
          width: c.width ?? (c.style?.boxWidth ?? 84),
          height: c.height ?? c.style?.boxHeight,
        }));
        setTitle(data.title);
        setCaptions(initializedCaptions);
        setHistory([JSON.parse(JSON.stringify(initializedCaptions))]);
        setHistoryIndex(0);
        setSelectedCaptionId(null);
        setStyle(loadedStyle);
        // Mark this as the baseline so auto-save doesn't fire on the initial load.
        lastSavedRef.current = JSON.stringify({
          captions: initializedCaptions,
          style: loadedStyle,
          title: data.title,
        });
        setStoredSourcePath(data.source_video_path);
        setStoredSourceMime(data.source_video_mime);
        setStoredSourceName(data.source_video_name);
        setStoredExportPath(data.exported_video_path);
        setMeta(
          data.width && data.height && data.duration_seconds
            ? {
              width: data.width,
              height: data.height,
              duration: Number(data.duration_seconds),
            }
            : null,
        );

        if (data.source_video_path) {
          const { data: signed, error: signErr } = await supabase.storage
            .from("project-videos")
            .createSignedUrl(data.source_video_path, 60 * 60);
          if (signErr) throw signErr;
          if (!active) return;
          // Fetch and convert to File so re-export works
          const res = await fetch(signed.signedUrl);
          const blob = await res.blob();
          const fileObj = new File(
            [blob],
            data.source_video_name || "video.mp4",
            { type: data.source_video_mime || blob.type || "video/mp4" },
          );
          if (!active) return;
          setFile(fileObj);
          setVideoUrl(URL.createObjectURL(fileObj));
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not load project");
      } finally {
        if (active) setLoadingProject(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, user]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep play/pause state reactive so the timeline transport stays in sync
  // with the preview (and vice versa), regardless of which control is used.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    setIsPlaying(!v.paused);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onPause);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onPause);
    };
  }, [videoUrl, isMobile]);

  const handleFile = (f: File) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setCaptions([]);
    setHistory([[]]);
    setHistoryIndex(0);
    setSelectedCaptionId(null);
    setMeta(null);
    setStoredSourcePath(null);
    setStoredExportPath(null);
    if (title === "Untitled project") {
      setTitle(f.name.replace(/\.[^.]+$/, ""));
    }
  };

  const transcribe = async () => {
    if (!file) return;
    if (!user) {
      toast.info("You're almost there! Sign up for free to generate captions and unlock all features.", {
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth"),
        },
      });
      return;
    }
    setTranscribing(true);
    setTranscribeStage("Extracting audio...");
    console.time("Caption Generation: Total Time");
    try {
      console.time("Caption Generation: Audio Extraction (In-Browser)");
      const audioBlob = await extractAudioNative(file);
      console.timeEnd("Caption Generation: Audio Extraction (In-Browser)");

      setTranscribeStage("Uploading audio...");
      const fd = new FormData();
      fd.append("file", new File([audioBlob], "audio.wav", { type: "audio/wav" }));
      if (language && language !== "auto") fd.append("language", language);

      setTranscribeStage("Transcribing speech...");
      console.time("Caption Generation: Edge Function Call & STT API Processing");
      const data = await invokeEdgeFunction("transcribe-video", {
        body: fd,
      });
      console.timeEnd("Caption Generation: Edge Function Call & STT API Processing");
      console.timeEnd("Caption Generation: Total Time");
      const words: Word[] = data?.words ?? [];
      if (!words.length) {
        toast.error("No speech detected in this video.");
        return;
      }
      const defaultX = style.posX ?? 0.5;
      const defaultY = style.position === "top" ? 0.12 : style.position === "middle" ? 0.5 : (style.posY ?? 0.88);
      const newCaptions = wordsToCaptions(words, 42).map((c) => ({
        ...c,
        x: defaultX,
        y: c.track === 2 ? Math.max(0.05, defaultY - 0.15) : defaultY,
        width: style.boxWidth ?? 84,
        height: style.boxHeight,
      }));
      if (style.emojiEnabled) {
        setTranscribeStage("Enhancing captions...");
        await enhanceCaptionsWithEmojis(newCaptions);
      } else {
        setCaptions(newCaptions);
      }
      toast.success("Transcription complete");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Transcription failed");
    } finally {
      setTranscribing(false);
      setTranscribeStage("");
    }
  };

  const handleLanguageChange = async (next: string) => {
    const prev = language;
    setLanguage(next);
    // Only translate existing captions when switching to a concrete language.
    if (next === "auto" || next === prev || captions.length === 0) return;

    setTranslating(true);
    try {
      const data = await invokeEdgeFunction("translate-captions", {
        body: { texts: captions.map((c) => c.text), language: next },
      });
      const translations: string[] = data?.translations ?? [];
      if (translations.length !== captions.length) {
        throw new Error("Translation response did not match captions");
      }
      setCaptions((cur) =>
        cur.map((c, i) => ({ ...c, text: translations[i] ?? c.text, words: undefined })),
      );
      toast.success("Captions translated");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Translation failed");
      setLanguage(prev);
    } finally {
      setTranslating(false);
    }
  };



  const seek = (t: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = t;
      // Do NOT auto-play on seek — respect user's play/pause state.
    }
  };

  const saveProject = useCallback(
    async (opts?: { exportedBlob?: Blob }) => {
      if (!user) return null;
      setSaving(true);
      try {
        let sourcePath = storedSourcePath;
        let sourceMime = storedSourceMime;
        let sourceName = storedSourceName;

        if (file && !sourcePath) {
          const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
          const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
          const { error } = await supabase.storage
            .from("project-videos")
            .upload(path, file, { contentType: file.type, upsert: false });
          if (error) throw error;
          sourcePath = path;
          sourceMime = file.type || null;
          sourceName = file.name;
          setStoredSourcePath(path);
          setStoredSourceMime(sourceMime);
          setStoredSourceName(sourceName);
        }

        let exportedPath = storedExportPath;
        if (opts?.exportedBlob) {
          const ext = opts.exportedBlob.type.includes("mp4") ? "mp4" : "webm";
          const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
          const { error } = await supabase.storage
            .from("project-exports")
            .upload(path, opts.exportedBlob, {
              contentType: opts.exportedBlob.type,
              upsert: false,
            });
          if (error) throw error;
          exportedPath = path;
          setStoredExportPath(path);
        }

        const payload = {
          user_id: user.id,
          title: title || "Untitled project",
          captions: JSON.parse(JSON.stringify(captions)),
          style: JSON.parse(JSON.stringify(style)),
          source_video_path: sourcePath,
          source_video_mime: sourceMime,
          source_video_name: sourceName,
          exported_video_path: exportedPath,
          duration_seconds: meta?.duration ?? null,
          width: meta?.width ?? null,
          height: meta?.height ?? null,
        };

        const savedSnapshot = JSON.stringify({
          captions,
          style,
          title: title || "Untitled project",
        });

        if (projectId) {
          const { error } = await supabase
            .from("projects")
            .update(payload)
            .eq("id", projectId);
          if (error) throw error;
          lastSavedRef.current = savedSnapshot;
          return projectId;
        }

        const { data, error } = await supabase
          .from("projects")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        lastSavedRef.current = savedSnapshot;
        setSearchParams({ project: data.id }, { replace: true });
        return data.id;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save project");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [
      captions,
      file,
      meta,
      projectId,
      setSearchParams,
      storedExportPath,
      storedSourceMime,
      storedSourceName,
      storedSourcePath,
      style,
      title,
      user,
    ],
  );

  const handleManualSave = async () => {
    if (!user) {
      toast.info("Sign in to save your project to the cloud.");
      return;
    }
    const id = await saveProject();
    if (id) toast.success("Project saved");
  };

  // Debounced auto-save (1s) of caption / style / title edits for an existing
  // project. New, never-saved projects are persisted via manual Save or Export
  // first (which uploads the source video), then auto-save keeps them in sync.
  useEffect(() => {
    if (!user || !projectId) return;
    const snapshot = JSON.stringify({
      captions,
      style,
      title: title || "Untitled project",
    });
    if (snapshot === lastSavedRef.current) return;

    setAutoSaveState("saving");
    const timer = setTimeout(async () => {
      const { error } = await supabase
        .from("projects")
        .update({
          captions: JSON.parse(JSON.stringify(captions)),
          style: JSON.parse(JSON.stringify(style)),
          title: title || "Untitled project",
        })
        .eq("id", projectId);
      if (error) {
        setAutoSaveState("idle");
        return;
      }
      lastSavedRef.current = snapshot;
      setAutoSaveState("saved");
    }, 1000);

    return () => clearTimeout(timer);
  }, [captions, style, title, user, projectId]);

  // Handle emoji caption enhancement when toggle or density changes
  useEffect(() => {
    if (loadingProject || captions.length === 0) {
      prevEmojiEnabledRef.current = style.emojiEnabled;
      prevEmojiDensityRef.current = style.emojiDensity;
      return;
    }

    const prevEnabled = prevEmojiEnabledRef.current;
    const prevDensity = prevEmojiDensityRef.current;

    prevEmojiEnabledRef.current = style.emojiEnabled;
    prevEmojiDensityRef.current = style.emojiDensity;

    if (prevEnabled === style.emojiEnabled && prevDensity === style.emojiDensity) {
      return;
    }

    const handleEmojiChange = async () => {
      if (style.emojiEnabled) {
        await enhanceCaptionsWithEmojis(captions);
      } else if (prevEnabled === true && !style.emojiEnabled) {
        const updated = captions.map((c) => {
          const strippedText = stripEmojis(c.text);
          return {
            ...c,
            text: strippedText,
            words: c.words
              ? c.words.map((w) => ({ ...w, text: stripEmojis(w.text) }))
              : undefined,
          };
        });
        setCaptions(updated);
        toast.success("Emojis removed from captions");
      }
    };

    handleEmojiChange();
  }, [style.emojiEnabled, style.emojiDensity, loadingProject, captions, enhanceCaptionsWithEmojis]);

  const handleExportSrt = () => {
    if (!captions.length) {
      toast.error("No captions to export.");
      return;
    }
    const srt = captionsToSrt(captions);
    const blob = new Blob([srt], { type: "application/x-subrip;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "captions").replace(/[^a-z0-9-_]+/gi, "_")}.srt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast.success("SRT downloaded");
  };

  const handleImportSrtClick = () => srtInputRef.current?.click();

  const handleSrtFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      // Make sure SRT import never starts video playback.
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      const text = await f.text();
      const defaultX = style.posX ?? 0.5;
      const defaultY = style.position === "top" ? 0.12 : style.position === "middle" ? 0.5 : (style.posY ?? 0.88);
      const parsed = srtToCaptions(text).map((c) => ({
        ...c,
        x: defaultX,
        y: c.track === 2 ? Math.max(0.05, defaultY - 0.15) : defaultY,
        width: style.boxWidth ?? 84,
        height: style.boxHeight,
      }));
      if (!parsed.length) {
        toast.error("No captions found in SRT file.");
        return;
      }
      if (style.emojiEnabled) {
        await enhanceCaptionsWithEmojis(parsed);
      } else {
        setCaptions(parsed);
      }
      // Show the first caption immediately on the preview.
      if (videoRef.current) {
        videoRef.current.currentTime = parsed[0].start;
      }
      setCurrentTime(parsed[0].start);
      toast.success(`Imported ${parsed.length} captions`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read SRT file");
    }
  };

  const cancelExport = () => {
    if (exportAbortRef.current) {
      exportAbortRef.current.abort();
      toast.info("Cancelling export…");
    }
  };

  const exportVideo = async () => {
    if (!file) {
      toast.error("Upload a video first.");
      return;
    }
    const controller = new AbortController();
    exportAbortRef.current = controller;
    setExporting(true);
    setExportProgress(0);
    setExportStage("render");
    try {
      let outputOpts = undefined;
      if (framePreset && framePreset.id !== "original") {
        const targetShortDim = quality === "high" ? 1080 : 720;
        const targetAR = framePreset.width / framePreset.height;
        let w: number;
        let h: number;
        if (targetAR >= 1) {
          // Landscape or Square
          h = targetShortDim;
          w = Math.round(targetShortDim * targetAR);
        } else {
          // Portrait
          w = targetShortDim;
          h = Math.round(targetShortDim / targetAR);
        }
        if (w % 2 !== 0) w += 1;
        if (h % 2 !== 0) h += 1;
        outputOpts = {
          width: w,
          height: h,
          fit: framePreset.fit,
        };
      }

      let blob = await burnCaptions({
        videoFile: file,
        captions,
        style,
        output: outputOpts,
        quality,
        signal: controller.signal,
        onProgress: ({ progress }) => setExportProgress(progress),
        onLog: (m) => console.log("[export]", m),
      });

      if (controller.signal.aborted) throw new ExportCancelledError();

      if (!blob.type.includes("video/mp4")) {
        setExportStage("transcode");
        setExportProgress(0);
        blob = await transcodeWebmToMp4({
          webmBlob: blob,
          quality,
          signal: controller.signal,
          onProgress: (p) => setExportProgress(p),
          onLog: (m) => console.log("[ffmpeg]", m),
        });
      } else {
        console.log("Direct MP4 recording supported and used. Skipping transcoding.");
      }

      if (controller.signal.aborted) throw new ExportCancelledError();

      const ext = "mp4";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `captioned-${(title || "video").replace(/[^a-z0-9-_]+/gi, "_")}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success("Export ready — downloading.");

      // Auto-save the project + the exported video
      await saveProject({ exportedBlob: blob });
    } catch (e) {
      const isAbort = e instanceof ExportCancelledError || controller.signal.aborted;
      if (isAbort) {
        toast.info("Export cancelled");
      } else {
        console.error(e);
        toast.error(e instanceof Error ? e.message : "Export failed");
      }
    } finally {
      exportAbortRef.current = null;
      setExporting(false);
      setExportStage("render");
      setExportProgress(0);
    }
  };

  const headerRight = useMemo(
    () => (
      <div className="flex items-center gap-1.5 md:gap-2">
        <button
          onClick={handleImportSrtClick}
          className="inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1.5 text-[12.5px] text-[#888] transition hover:bg-[#f5f3ee] hover:text-[#555] md:px-3"
        >
          <Upload className="h-3.5 w-3.5" strokeWidth={1.8} />
          <span className="hidden md:inline">Import SRT</span>
        </button>
        {captions.length > 0 && (
          <button
            onClick={handleExportSrt}
            className="inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1.5 text-[12.5px] text-[#888] transition hover:bg-[#f5f3ee] hover:text-[#555] md:px-3"
          >
            <FileText className="h-3.5 w-3.5" strokeWidth={1.8} />
            <span className="hidden md:inline">Export SRT</span>
          </button>
        )}
        {file && (
          <button
            onClick={handleManualSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#e8e4de] bg-[#f5f3ee] px-3 py-1.5 text-[12.5px] text-[#555] transition hover:bg-[#eeeae4] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" strokeWidth={1.8} />
            )}
            <span className="hidden md:inline">Save</span>
          </button>
        )}
        {file && (
          <div className="flex items-center gap-1.5 border border-[#e8e4de] bg-[#f5f3ee] p-1 rounded-[7px]">
            {/* MP4 label (read-only) */}
            <span className="px-2 py-1 text-[11px] font-semibold tracking-wider text-[#666] bg-white rounded-[5px] shadow-sm uppercase select-none">
              MP4
            </span>

            {/* Optional Quality selector */}
            <Select
              value={quality}
              onValueChange={(q) => setQuality(q as "standard" | "high")}
              disabled={exporting}
            >
              <SelectTrigger className="h-7 w-[85px] border-none bg-transparent shadow-none px-1.5 text-[12px] text-[#555] font-medium focus:ring-0 focus:ring-offset-0 hover:bg-white/50 rounded-[5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="min-w-[100px]">
                <SelectItem value="standard" className="text-[12.5px] cursor-pointer">Standard</SelectItem>
                <SelectItem value="high" className="text-[12.5px] cursor-pointer">High</SelectItem>
              </SelectContent>
            </Select>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="p-1 rounded-[5px] hover:bg-white/50 text-[#888] transition cursor-pointer flex-shrink-0"
                  aria-label="Quality settings information"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[260px] text-xs leading-normal bg-black text-white border border-neutral-800 p-2.5 shadow-xl rounded-[6px]">
                <div className="space-y-1">
                  <p><span className="font-semibold text-white">Standard:</span> 720p HD (Faster Export)</p>
                  <p><span className="font-semibold text-white">High:</span> 1080p Full HD (Best Quality)</p>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Export MP4 button */}
            <button
              onClick={exportVideo}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#ff5c3a] px-3 py-1 text-[12.5px] font-medium text-white transition hover:bg-[#e84e2e] disabled:opacity-70 shadow-sm"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="text-[11px]">
                    {exportStage === "transcode" ? "Converting" : "Rendering"}{" "}
                    {Math.round(exportProgress * 100)}%
                  </span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" strokeWidth={2.2} />
                  <span>Export MP4</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [file, exporting, exportProgress, exportStage, quality, saving, title, captions, style, meta, framePreset],
  );

  if (loadingProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f3ee]">
        <Loader2 className="h-6 w-6 animate-spin text-[#ff5c3a]" />
      </div>
    );
  }

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-[#f5f3ee] text-[#1a1a1a]"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <Seo
        title="Editor — Subbly"
        description="Subbly's caption editor — auto-transcribe your video, edit captions, style subtitles, and export a captioned video."
        path="/editor"
        noIndex
      />
      {!isMobile && (
        <header className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#e8e4de] bg-white px-3 py-2 md:gap-3 md:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate(user ? "/projects" : "/");
                }
              }}
              className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[7px] border border-[#e8e4de] bg-white text-[#666] transition hover:bg-[#f5f3ee]"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#ff5c3a]">
                <Sparkles className="h-[15px] w-[15px] text-white" strokeWidth={2} />
              </div>
              <span className="hidden text-[14px] font-semibold sm:inline">Captionly</span>
            </div>
            <div className="hidden h-[18px] w-px bg-[#e8e4de] sm:block" />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              className="h-8 min-w-0 flex-1 border-transparent bg-transparent px-2 text-[13px] font-medium text-[#1a1a1a] hover:border-[#e8e4de] focus-visible:border-[#e8e4de] focus-visible:ring-0 md:w-60 md:flex-none"
            />
            {projectId && autoSaveState !== "idle" && (
              <span className="hidden flex-shrink-0 items-center gap-1 text-[11px] text-[#aaa] sm:inline-flex">
                {autoSaveState === "saving" ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" strokeWidth={2.5} />
                    Saved
                  </>
                )}
              </span>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5 md:gap-2">
            {headerRight}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8e4de] bg-white text-[#666] transition hover:text-[#1a1a1a]"
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            {user ? (
              <AvatarDropdown />
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center rounded-lg bg-[#ff5c3a] px-[14px] py-1 text-[12px] font-medium text-white shadow-[0_2px_6px_rgba(255,92,58,0.15)] transition hover:bg-[#ff7558]"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>
      )}

      {file && <h1 className="sr-only">Subbly caption editor</h1>}


      <input
        ref={srtInputRef}
        type="file"
        accept=".srt,application/x-subrip,text/plain"
        className="hidden"
        onChange={handleSrtFile}
      />

      {!file && (
        <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center justify-center gap-8 overflow-y-auto px-6 py-10">
          <div className="text-center">
            <h1 className="mb-2.5 text-[32px] font-medium leading-[1.1] tracking-[-1.2px] md:text-[36px]">
              Caption your videos in <span className="text-[#ff5c3a]">seconds</span>
            </h1>
            <p className="mx-auto max-w-[360px] text-[14px] leading-relaxed text-[#999]">
              Upload a video to start. We'll save your captions and styling so you can come back anytime.
            </p>
          </div>
          <div className="w-full">
            <VideoDropzone onFile={handleFile} />
          </div>
        </main>
      )}

      {file && videoUrl && (() => {
        const captionsPanel = (
          <CaptionList
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
          <div className="flex h-full flex-col overflow-hidden bg-[#f5f3ee]">

            <div className="flex flex-1 flex-col items-center justify-center overflow-hidden p-4 md:p-6">
              {/* Aspect Ratio Preset Selector */}
              <div className="mb-4 flex items-center justify-center flex-shrink-0">
                <div className="inline-flex items-center gap-1 bg-[#f5f3ee] p-1 rounded-full border border-[#e8e4de] shadow-sm">
                  {FRAME_PRESETS.map((p) => {
                    const active = framePreset.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setFramePreset(p)}
                        className={`rounded-full px-3.5 py-1 text-[11.5px] font-semibold transition cursor-pointer ${active
                            ? "bg-white text-black shadow-sm"
                            : "text-[#666] hover:text-[#1a1a1a]"
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
                  ref={videoRef}
                  src={videoUrl}
                  captions={captions}
                  style={style}
                  selectedCaptionId={selectedCaptionId}
                  onSelect={setSelectedCaptionId}
                  onTimeUpdate={setCurrentTime}
                  onLoaded={setMeta}
                  onCaptionStyleChange={handleCaptionStyleChange}
                  onCaptionPositionChange={handleCaptionPositionChange}
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
          />
        );

        const combinedToolbar = (
          <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#e8e4de] bg-white px-4 py-2">
            {/* Left: Language selector */}
            <div className="flex items-center gap-3">
              {meta && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-[#888]" strokeWidth={1.8} />
                  <span className="hidden text-[11.5px] font-medium text-[#666] sm:inline">Caption language</span>
                  <Select value={language} onValueChange={handleLanguageChange} disabled={translating}>
                    <SelectTrigger className="h-7 w-[130px] rounded-[6px] border-[#e8e4de] bg-[#f5f3ee] px-2 text-[12px] text-[#1a1a1a] focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.code} value={l.code} className="text-[13px]">
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {translating && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#aaa]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Translating…
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right: Metadata + Transcribe Button */}
            <div className="flex items-center gap-4">
              {meta && (
                <div className="text-[11.5px] font-medium text-[#888] font-mono">
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
              <button
                onClick={transcribe}
                disabled={transcribing}
                className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#e8e4de] bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[#1a1a1a] transition hover:border-[#ff5c3a] hover:bg-[#fff5f3] hover:text-[#ff5c3a] disabled:opacity-60 cursor-pointer shadow-sm"
              >
                {transcribing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {transcribeStage || "Transcribing…"}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3.5 w-3.5 text-[#ff5c3a]" strokeWidth={2} />
                    {captions.length ? "Re-transcribe" : "Auto-transcribe"}
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
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
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
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Desktop layout — mounted only on desktop so a single VideoPreview
                (and thus a single videoRef) exists at a time. */}
            {!isMobile && (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Workspace Panels */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                    {/* Left: captionsPanel */}
                    <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                      <aside className="flex h-full flex-col overflow-hidden border-r border-[#e8e4de] bg-white">
                        {captionsPanel}
                      </aside>
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Middle: previewPanel */}
                    <ResizablePanel defaultSize={50} minSize={35}>
                      <main className="flex h-full flex-col overflow-hidden">
                        {previewPanel}
                      </main>
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Right: stylePanel */}
                    <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                      <aside className="flex h-full flex-col overflow-hidden border-l border-[#e8e4de] bg-white">
                        {stylePanel}
                      </aside>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </div>

                {/* Bottom Timeline Panel */}
                <div className="flex-shrink-0 h-[260px] flex flex-col overflow-hidden bg-white border-t border-[#e8e4de]">
                  {combinedToolbar}
                  <div className="flex-1 overflow-hidden">
                    {timelinePanel}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile layout */}
            {isMobile && (
              <div className="flex flex-1 flex-col overflow-hidden bg-white pb-16">
                {/* 1. Top Nav Bar (44px tall, fixed at the top of the mobile container) */}
                <div className="h-11 flex-shrink-0 flex items-center justify-between px-3 border-b border-[#e8e4de] bg-white">
                  <button
                    onClick={() => {
                      if (window.history.length > 1) {
                        navigate(-1);
                      } else {
                        navigate(user ? "/projects" : "/");
                      }
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e4de] text-neutral-500 hover:bg-[#f5f3ee] min-h-[44px] min-w-[44px] cursor-pointer"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
                  </button>
                  
                  <span className="text-[13px] font-semibold text-neutral-800 max-w-[160px] truncate">
                    {title}
                  </span>

                  <div className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e4de] text-neutral-500 hover:bg-[#f5f3ee] min-h-[44px] min-w-[44px] cursor-pointer"
                          aria-label="Project actions menu"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 bg-white border border-[#e8e4de] shadow-lg rounded-xl">
                        <DropdownMenuLabel className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-1">Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={handleImportSrtClick} className="text-xs cursor-pointer py-2 hover:bg-neutral-50 rounded-lg">Import SRT</DropdownMenuItem>
                        {captions.length > 0 && (
                          <DropdownMenuItem onClick={handleExportSrt} className="text-xs cursor-pointer py-2 hover:bg-neutral-50 rounded-lg">Export SRT</DropdownMenuItem>
                        )}
                        {file && (
                          <DropdownMenuItem onClick={handleManualSave} className="text-xs cursor-pointer py-2 hover:bg-neutral-50 rounded-lg">Save Project</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-neutral-100" />
                        <DropdownMenuLabel className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-1">Export Quality</DropdownMenuLabel>
                        <DropdownMenuItem 
                          onClick={() => setQuality("standard")} 
                          className="text-xs cursor-pointer py-2 hover:bg-neutral-50 rounded-lg flex items-center justify-between"
                        >
                          <span>Standard (720p)</span>
                          {quality === "standard" && <Check className="h-3.5 w-3.5 text-[#ff5c3a]" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setQuality("high")} 
                          className="text-xs cursor-pointer py-2 hover:bg-neutral-50 rounded-lg flex items-center justify-between"
                        >
                          <span>High (1080p)</span>
                          {quality === "high" && <Check className="h-3.5 w-3.5 text-[#ff5c3a]" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {file && (
                      <button
                        onClick={exportVideo}
                        disabled={exporting}
                        className="flex h-9 px-3 items-center justify-center gap-1.5 rounded-lg bg-[#ff5c3a] text-xs font-semibold text-white transition hover:bg-[#e84e2e] disabled:opacity-75 min-h-[44px] cursor-pointer"
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

                {/* Vertical Scroll Area (everything below top nav bar, except bottom tab bar) */}
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                  {/* 2. Video Preview (full-width) */}
                  <div className="w-full bg-[#f5f3ee] flex flex-col items-center justify-center p-3">
                    <div
                      className="w-full flex items-center justify-center overflow-hidden"
                      style={{
                        maxWidth: "100%",
                        aspectRatio: framePreset.id !== "original"
                          ? `${framePreset.width}/${framePreset.height}`
                          : (meta ? `${meta.width}/${meta.height}` : "9/16"),
                      }}
                    >
                      <VideoPreview
                        ref={videoRef}
                        src={videoUrl}
                        captions={captions}
                        style={style}
                        selectedCaptionId={selectedCaptionId}
                        onSelect={setSelectedCaptionId}
                        onTimeUpdate={setCurrentTime}
                        onLoaded={setMeta}
                        onCaptionStyleChange={handleCaptionStyleChange}
                        onCaptionPositionChange={handleCaptionPositionChange}
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

                  {/* 3. Format Selector Chips (horizontal scroll row) */}
                  <div className="flex overflow-x-auto scrollbar-none gap-2 px-4 py-3 bg-[#f5f3ee] border-b border-[#e8e4de] select-none">
                    {FRAME_PRESETS.map((p) => {
                      const active = framePreset.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setFramePreset(p)}
                          className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold select-none transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
                            active
                              ? "bg-[#ff5c3a] text-white shadow-sm"
                              : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* 4. Condensed Audio Strip / Expanded Timeline */}
                  {timelineExpanded ? (
                    <div className="border-b border-[#e8e4de] bg-[#f9f8f6] p-2">
                      <div className="flex justify-between items-center px-2 pb-2 border-b border-neutral-200/60 mb-2">
                        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Multi-track Editor</span>
                        <button
                          onClick={() => setTimelineExpanded(false)}
                          className="text-[11px] font-bold text-[#ff5c3a] hover:underline px-3 py-1.5 min-h-[44px] flex items-center cursor-pointer"
                        >
                          Collapse
                        </button>
                      </div>
                      <div className="overflow-hidden rounded-lg border border-[#e8e4de]">
                        {timelinePanel}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e8e4de] bg-white">
                      <span className="text-[11px] font-mono text-[#ff5c3a] font-semibold select-none flex-shrink-0">
                        {formatTime(currentTime)}
                      </span>
                      <CondensedTimeline
                        duration={meta?.duration ?? 0}
                        currentTime={currentTime}
                        onSeek={seek}
                      />
                      <span className="text-[11px] font-mono text-neutral-400 font-semibold select-none flex-shrink-0">
                        {formatTime(meta?.duration ?? 0)}
                      </span>
                      <button
                        onClick={() => setTimelineExpanded(true)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e4de] hover:bg-neutral-50 text-neutral-500 cursor-pointer min-h-[44px] min-w-[44px] flex-shrink-0"
                        title="Expand Timeline"
                        aria-label="Expand Timeline"
                      >
                        <ChevronsUpDown className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* 5. Caption List / Empty State */}
                  <div className="flex-1 bg-white">
                    {captions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center py-8 px-6 bg-white border border-[#e8e4de]/60 rounded-xl my-4 mx-4 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff5f3] text-[#ff5c3a] mb-4">
                          <FileText className="h-6 w-6" strokeWidth={2} />
                        </div>
                        <h3 className="text-[14px] font-semibold text-[#1a1a1a] mb-1">No captions yet</h3>
                        <p className="text-[12.5px] text-neutral-400 mb-5 max-w-[280px] leading-relaxed">
                          Auto-transcribe your speech or manually add captions to this video.
                        </p>
                        <div className="flex flex-col w-full gap-2">
                          <button
                            onClick={transcribe}
                            disabled={transcribing}
                            className="w-full flex h-11 items-center justify-center gap-2 rounded-lg bg-[#ff5c3a] text-xs font-semibold text-white shadow-sm hover:bg-[#e84e2e] active:scale-98 transition disabled:opacity-50 min-h-[44px] cursor-pointer"
                          >
                            {transcribing ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>{transcribeStage || "Transcribing..."}</span>
                              </>
                            ) : (
                              <>
                                <Wand2 className="h-3.5 w-3.5" />
                                <span>Auto-transcribe</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleAddCaptionMobile}
                            className="w-full flex h-11 items-center justify-center gap-2 rounded-lg border border-[#e8e4de] bg-white text-xs font-semibold text-neutral-600 hover:bg-[#faf9f6] active:scale-98 transition min-h-[44px] cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add caption</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-b border-[#e8e4de]">
                        {captionsPanel}
                      </div>
                    )}
                  </div>

                  {/* 6. Settings Panel Sheet */}
                  {activeMobileTab !== "captions" && (
                    <div className="border-t border-[#e8e4de] bg-white pb-6">
                      <div className="px-4 py-2.5 bg-[#faf9f6] border-b border-[#e8e4de] flex justify-between items-center select-none">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                          {activeMobileTab === "style" && "Text Style"}
                          {activeMobileTab === "anim" && "Caption Animation"}
                          {activeMobileTab === "tmpl" && "Style Templates"}
                          {activeMobileTab === "brand" && "Brand Settings"}
                        </span>
                        <button
                          onClick={() => setActiveMobileTab("captions")}
                          className="text-[11px] font-bold text-neutral-400 hover:text-neutral-600 px-3 py-1.5 min-h-[44px] flex items-center cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                      <div className="p-1">
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
                    </div>
                  )}
                </div>

                {/* 7. Bottom Navigation Tab Bar (Fixed at the absolute bottom of the viewport) */}
                <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-[#e8e4de] flex items-center justify-around px-2 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
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
                        className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] gap-1 transition cursor-pointer ${
                          active ? "text-[#ff5c3a]" : "text-neutral-400 hover:text-neutral-600"
                        }`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2} />
                        <span className="text-[10px] font-semibold tracking-wide select-none">{tabItem.label}</span>
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
    </div>
  );
};

export default Editor;
