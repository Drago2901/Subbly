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
  Undo2,
  Redo2,
  FolderClosed,
  Flame,
  Video,
  Music,
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
  { id: "portrait", label: "Portrait", width: 4, height: 5, fit: "contain" },
];

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
      className="relative flex-1 h-8 bg-[#E8E4DE] dark:bg-[#181B22] rounded-lg flex items-center gap-0.5 px-2 cursor-pointer overflow-hidden border border-[#D4CFC8] dark:border-[#2C313C]"
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
              backgroundColor: active ? "#FF6B2C" : (theme === "dark" ? "#2C313C" : "#C8C2BB"),
            }}
          />
        );
      })}
      {/* Playhead */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-[#FF6B2C] z-10"
        style={{ left: `${progressPct}%` }}
      />
    </div>
  );
};

const Editor = () => {
  const { user, signOut, isAdmin } = useAuth();
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const exportAbortRef = useRef<AbortController | null>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);

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
          const sliced = prev.slice(0, historyIndex + 1);
          return [...sliced, JSON.parse(JSON.stringify(captions))];
        });
        setHistoryIndex((prev) => prev + 1);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [captions, historyIndex, history]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoingRef.current = true;
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const entry = history[prevIndex];
      if (entry) setCaptions(JSON.parse(JSON.stringify(entry)));
      toast.success("Undo successful");
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoingRef.current = true;
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const entry = history[nextIndex];
      if (entry) setCaptions(JSON.parse(JSON.stringify(entry)));
      toast.success("Redo successful");
    }
  }, [historyIndex, history]);

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
  }, [videoUrl, transcribing]);

  // Global Spacebar Keydown Listener for Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

    const runEmojiAlignment = async () => {
      const stageToast = toast.loading(
        style.emojiEnabled ? "Adding context emojis to speech segments…" : "Removing emojis from captions…",
      );
      try {
        if (!style.emojiEnabled) {
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
                return match ? { ...c, text: match.text, words: match.words } : c;
              }),
            );
            toast.success("AI Emojis integrated with viral context");
          }
        }
      } catch (e: unknown) {
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
          setStoredSourcePath(data.source_path);
          setStoredSourceMime(data.source_mime);
          setStoredSourceName(data.source_name);
          setStoredExportPath(data.export_path);
          setLanguage(data.language || "auto");

          if (data.source_path) {
            const { data: urlData, error: urlError } = await supabase.storage
              .from("videos")
              .createSignedUrl(data.source_path, 7200);

            if (urlError) throw urlError;
            if (urlData?.signedUrl) {
              setVideoUrl(urlData.signedUrl);
              const mockFile = new File([], data.source_name || "project_video.mp4", {
                type: data.source_mime || "video/mp4",
              });
              setFile(mockFile);
            }
          }
          lastSavedRef.current = JSON.stringify({
            captions: data.captions,
            style: data.style,
            title: data.title,
            language: data.language || "auto",
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

  // Auto-Save Loop
  useEffect(() => {
    if (!projectId || !file) return;

    const timer = setInterval(async () => {
      const currentSnapshot = JSON.stringify({
        captions,
        style,
        title,
        language,
      });

      if (currentSnapshot === lastSavedRef.current) return;

      setAutoSaveState("saving");
      try {
        const { error } = await supabase
          .from("projects")
          .update({
            title,
            captions: JSON.parse(JSON.stringify(captions)),
            style: JSON.parse(JSON.stringify(style)),
            language,
            updated_at: new Date().toISOString(),
          })
          .eq("id", projectId);

        if (error) throw error;
        lastSavedRef.current = currentSnapshot;
        setAutoSaveState("saved");
      } catch (err) {
        console.error("Auto-save failed:", err);
        setAutoSaveState("idle");
      }
    }, 4500);

    return () => clearInterval(timer);
  }, [projectId, file, captions, style, title, language]);

  const handleManualSave = useCallback(async () => {
    if (!projectId) {
      toast.error("Save is only available for cloud projects");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          title,
          captions: JSON.parse(JSON.stringify(captions)),
          style: JSON.parse(JSON.stringify(style)),
          language,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (error) throw error;
      lastSavedRef.current = JSON.stringify({ captions, style, title, language });
      setAutoSaveState("saved");
      toast.success("Project saved successfully");
    } catch (err: unknown) {
      console.error("Manual save failed:", err);
      toast.error(`Save error: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }, [projectId, title, captions, style, language]);

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


  const transcribe = async () => {
    if (!file) return;
    setTranscribing(true);
    setTranscribeStage("Preparing…");
    const stageToast = toast.loading("Auto-transcription: Preparing audio…");

    try {
      const form = new FormData();

      // For files <= 25 MB send directly — ElevenLabs Scribe v2 accepts mp4, webm, mov, etc.
      // For larger files extract a compact 16 kHz mono WAV to reduce upload size.
      const SIZE_THRESHOLD = 25 * 1024 * 1024; // 25 MB
      if (file.size <= SIZE_THRESHOLD) {
        // Fast path: no preprocessing at all
        form.append("file", file, file.name);
      } else {
        setTranscribeStage("Extracting audio…");
        toast.loading("Extracting audio from large file…", { id: stageToast });
        const audioBlob = await extractAudioNative(file);
        form.append("file", audioBlob, "audio.wav");
      }

      if (language && language !== "auto") form.append("language", language);

      setTranscribeStage("Transcribing…");
      toast.loading("Speech engine running neural voice transcripts…", { id: stageToast });

      // Use direct fetch so the browser sets the correct multipart Content-Type
      // boundary automatically (supabase.functions.invoke overrides it and breaks FormData)
      const { data: { session } } = await supabase.auth.getSession();
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-video`;
      const fnRes = await fetch(fnUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ""}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: form,
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

      if (transcriptionData?.words && Array.isArray(transcriptionData.words)) {
        let alignedWords = transcriptionData.words as Word[];
        if (style.emojiEnabled) {
          setTranscribeStage("Aligning emojis…");
          toast.loading("Running AI semantic emoji alignments…", { id: stageToast });
          try {
            const emojiRes = await invokeEdgeFunction("align-emojis", {
              body: {
                captions: [{ id: "temp", text: alignedWords.map((w) => w.text).join(" "), words: alignedWords }],
                density: style.emojiDensity || "medium",
              },
            });
            if (emojiRes?.captions?.[0]?.words) {
              alignedWords = emojiRes.captions[0].words;
            }
          } catch (emojiErr) {
            console.warn("AI Emojis skipped during transcription:", emojiErr);
          }
        }

        const segments = wordsToCaptions(alignedWords);
        setCaptions(segments);
        toast.success("AI Transcription completed successfully!");
      } else {
        throw new Error("No speech segments recognized in this video file.");
      }
    } catch (err: unknown) {
      console.error("Transcription pipeline issue:", err);
      toast.error(`Transcription Failed: ${(err as Error).message}`);
    } finally {
      setTranscribing(false);
      setTranscribeStage("");
      toast.dismiss(stageToast);
    }
  };


  const handleLanguageChange = async (nextLang: string) => {
    setLanguage(nextLang);
    if (!captions.length || nextLang === "auto") return;

    setTranslating(true);
    const stageToast = toast.loading(`Translating all captions to ${LANGUAGES.find(l => l.code === nextLang)?.label || nextLang}…`);
    try {
      const res = await invokeEdgeFunction("translate-captions", {
        body: {
          captions: captions.map(c => ({ id: c.id, text: c.text })),
          targetLanguage: nextLang,
        }
      });
      if (res && Array.isArray(res.translatedCaptions)) {
        interface TranslatedCap {
          id: string;
          text: string;
        }
        const list = res.translatedCaptions as TranslatedCap[];
        setCaptions(cur =>
          cur.map(c => {
            const match = list.find(x => x.id === c.id);
            return match ? { ...c, text: match.text, words: undefined } : c;
          })
        );
        toast.success(`Captions translated to ${LANGUAGES.find(l => l.code === nextLang)?.label || nextLang}`);
      }
    } catch (e: unknown) {
      console.error("Translation issue:", e);
      toast.error(`Translation error: ${(e as Error).message}`);
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
      const webmBlob = await burnCaptions(
        file,
        captions,
        style,
        (progress) => {
          setExportProgress(progress);
        },
        exportAbortRef.current.signal,
        frame,
        outputQuality
      );

      setExportStage("transcode");
      setExportProgress(0);

      const mp4Blob = await transcodeWebmToMp4(
        new File([webmBlob], "rendered.webm", { type: "video/webm" }),
        (progress) => setExportProgress(progress)
      );

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
          .upload(randPath, mp4Blob, { overwrite: true });

        if (!uploadErr) {
          await supabase
            .from("projects")
            .update({ export_path: randPath })
            .eq("id", projectId);
          setStoredExportPath(randPath);
        }
      }
    } catch (err: unknown) {
      if (err instanceof ExportCancelledError) {
        toast.info("Export cancelled by user");
      } else {
        console.error("Video export pipeline error:", err);
        toast.error(`Export failed: ${(err as Error).message}`);
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
        {captions.length > 0 && (
          <button
            onClick={handleExportSrt}
            className="inline-flex h-8.5 items-center gap-1.5 rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-[#F9F8F5] dark:bg-[#1F232D] px-3.5 text-[12px] font-bold text-[#1A1A1A] dark:text-white transition hover:bg-neutral-100 dark:hover:bg-[#2C313C] hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileText className="h-3.5 w-3.5 text-blue-500" strokeWidth={2.4} />
            <span>Export SRT</span>
          </button>
        )}

        {file && (
          <div className="flex items-center gap-2 border border-[#E8E4DE] dark:border-[#2C313C] bg-[#F9F8F5] dark:bg-[#1F232D] p-1.5 rounded-lg">
            <span className="px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-[#666] dark:text-[#A1A8B5] bg-[#EAE7E2] dark:bg-[#181B22] rounded shadow-inner uppercase select-none border border-[#E8E4DE] dark:border-[#2C313C]">
              MP4
            </span>

            <Select
              value={quality}
              onValueChange={(q) => setQuality(q as "standard" | "high")}
              disabled={exporting}
            >
              <SelectTrigger className="h-7 w-[85px] border-none bg-transparent shadow-none px-1 text-[11.5px] text-[#1A1A1A] dark:text-white font-bold focus:ring-0 focus:ring-offset-0 hover:bg-[#E8E4DE]/50 dark:hover:bg-[#2C313C]/40 rounded">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="min-w-[100px] bg-[#F9F8F5] dark:bg-[#1F232D] border border-[#E8E4DE] dark:border-[#2C313C] text-[#1A1A1A] dark:text-white">
                <SelectItem value="standard" className="text-[12px] font-semibold cursor-pointer">720p SD</SelectItem>
                <SelectItem value="high" className="text-[12px] font-semibold cursor-pointer">1080p HD</SelectItem>
              </SelectContent>
            </Select>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-[#E8E4DE]/60 dark:hover:bg-[#2C313C]/40 text-[#666] dark:text-[#A1A8B5] hover:text-[#1A1A1A] dark:hover:text-white transition cursor-pointer flex-shrink-0"
                  aria-label="Quality settings information"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[260px] text-xs leading-normal bg-[#F9F8F5] dark:bg-[#1F232D] text-[#1A1A1A] dark:text-white border border-[#E8E4DE] dark:border-[#2C313C] p-3 shadow-2xl rounded-lg">
                <div className="space-y-1">
                  <p><span className="font-bold text-[#FF6B2C]">Standard:</span> 720p HD (Faster Export)</p>
                  <p><span className="font-bold text-[#FF6B2C]">High:</span> 1080p Full HD (Best Quality)</p>
                </div>
              </TooltipContent>
            </Tooltip>

            <button
              onClick={exportVideo}
              disabled={exporting}
              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-[#FF6B2C] px-3 py-1.5 text-[12px] font-bold text-white transition hover:bg-[#FF874D] disabled:opacity-70 shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
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
    [file, exporting, exportProgress, exportStage, quality, saving, captions, exportVideo, handleExportSrt, handleManualSave, handleImportSrtClick],
  );

  if (loadingProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F9F8F6] dark:bg-[#0F1117]">
        <Loader2 className="h-6 w-6 animate-spin text-[#FF6B2C]" />
      </div>
    );
  }

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-[#F9F8F6] dark:bg-[#0F1117] text-[#1A1A1A] dark:text-white select-none"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <Seo
        title="Editor — Subbly"
        description="Subbly's caption editor — auto-transcribe your video, edit captions, style subtitles, and export a captioned video."
        path="/editor"
        noIndex
      />

      {/* 1. FLOATING NAVIGATION BAR */}
      {!isMobile && (
        <header className="flex flex-shrink-0 items-center justify-between gap-3 border border-[#E8E4DE]/60 dark:border-[#2C313C]/60 bg-white/80 dark:bg-[#181B22]/80 backdrop-blur-md px-4 py-2 mx-4 mt-3 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] select-none h-14 z-50">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate(user ? "/projects" : "/");
                }
              }}
              className="flex h-8.5 w-8.5 flex-shrink-0 items-center justify-center rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-[#F9F8F5] dark:bg-[#1F232D] text-[#666] dark:text-[#A1A8B5] hover:text-[#1A1A1A] dark:hover:text-white transition hover:bg-neutral-50 dark:hover:bg-[#2C313C] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <ArrowLeft className="h-4.5 w-4.5" strokeWidth={2.4} />
            </button>
            <div className="flex items-center gap-2 select-none">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF6B2C] shadow-md shadow-orange-500/10">
                <Sparkles className="h-[15px] w-[15px] text-white" strokeWidth={2} />
              </div>
              <span className="hidden text-[14px] font-extrabold tracking-wider uppercase sm:inline bg-gradient-to-r from-[#1A1A1A] to-[#666] dark:from-white dark:to-[#A1A8B5] bg-clip-text text-transparent">Subbly</span>
            </div>
            <div className="hidden h-5 w-px bg-[#E8E4DE] dark:bg-[#2C313C] sm:block" />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              className="h-8.5 min-w-0 flex-1 border-transparent bg-transparent px-2 text-[13px] font-bold text-[#1A1A1A] dark:text-white hover:border-[#E8E4DE] dark:hover:border-[#2C313C] focus-visible:border-[#E8E4DE] dark:focus-visible:border-[#2C313C] focus-visible:ring-0 md:w-60 md:flex-none placeholder-[#666] dark:placeholder-[#A1A8B5]"
            />

            {/* Auto Save Status Indicator */}
            {projectId && autoSaveState !== "idle" && (
              <span className="hidden flex-shrink-0 items-center gap-1 text-[11px] sm:inline-flex select-none">
                {autoSaveState === "saving" ? (
                  <span className="text-[#666] dark:text-[#A1A8B5] flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin text-[#FF6B2C]" />
                    Saving…
                  </span>
                ) : (
                  <span className="text-[#22C55E] flex items-center gap-1 font-bold animate-pulse">
                    <Check className="h-3.5 w-3.5 text-[#22C55E]" strokeWidth={3.5} />
                    ✔ Saved just now
                  </span>
                )}
              </span>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            {/* Header Undo / Redo */}
            <div className="flex items-center gap-1 border-r border-[#E8E4DE] dark:border-[#2C313C] pr-2.5">
              <button
                title="Undo edit"
                onClick={handleUndo}
                disabled={historyIndex === 0}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-[#F9F8F5] dark:bg-[#1F232D] text-[#666] dark:text-[#A1A8B5] hover:text-[#1A1A1A] dark:hover:text-white disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-[#2C313C] hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                title="Redo edit"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-[#F9F8F5] dark:bg-[#1F232D] text-[#666] dark:text-[#A1A8B5] hover:text-[#1A1A1A] dark:hover:text-white disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-[#2C313C] hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </div>

            {headerRight}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-[#F9F8F5] dark:bg-[#1F232D] text-[#666] dark:text-[#A1A8B5] hover:text-[#1A1A1A] dark:hover:text-white transition hover:bg-neutral-50 dark:hover:bg-[#2C313C] hover:scale-105 active:scale-95 cursor-pointer"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {user ? (
              <AvatarDropdown />
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center rounded-lg bg-[#FF6B2C] px-[16px] py-1.5 text-[12px] font-bold text-white shadow-md shadow-orange-500/10 transition hover:bg-[#FF874D] hover:scale-[1.02] active:scale-[0.98]"
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
            <h1 className="mb-2.5 text-[32px] font-extrabold leading-[1.1] tracking-tight md:text-[36px] text-[#1A1A1A] dark:text-white">
              Caption your videos in <span className="bg-gradient-to-r from-[#FF6B2C] to-[#FF874D] bg-clip-text text-transparent">seconds</span>
            </h1>
            <p className="mx-auto max-w-[360px] text-[14px] leading-relaxed text-[#666666] dark:text-[#A1A8B5]">
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
                <div className="inline-flex items-center gap-1.5 bg-[#EAE7E2] dark:bg-[#181B22] p-1 rounded-full border border-[#D4CFC8] dark:border-[#2C313C] shadow-md select-none">
                  {FRAME_PRESETS.map((p) => {
                    const active = framePreset.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setFramePreset(p)}
                        className={`rounded-full px-3.5 py-1 text-[11.5px] font-bold transition cursor-pointer select-none ${active
                          ? "bg-[#FF6B2C] text-white shadow-sm"
                          : "text-[#666] dark:text-[#A1A8B5] hover:text-[#1A1A1A] dark:hover:text-white"
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
            activeTab={activeTab}
            showTabsHeader={false}
          />
        );

        const combinedToolbar = (
          <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#181B22] px-4 py-2.5">
            {/* Left: Language selector */}
            <div className="flex items-center gap-3">
              {meta && (
                <div className="flex items-center gap-2.5">
                  <Globe className="h-4 w-4 text-[#666] dark:text-[#A1A8B5]" strokeWidth={2} />
                  <span className="hidden text-[11.5px] font-bold text-[#666] dark:text-[#A1A8B5] sm:inline">Caption Language</span>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="h-7.5 w-[130px] rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-[#F9F8F5] dark:bg-[#1F232D] px-2.5 text-[11.5px] font-bold text-[#1A1A1A] dark:text-white focus:ring-0 focus:ring-offset-0 transition hover:bg-neutral-50 dark:hover:bg-[#2C313C] cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[280px] overflow-y-auto bg-[#F9F8F5] border border-[#E8E4DE] text-[#1A1A1A] dark:bg-[#1F232D] dark:border-[#2C313C] dark:text-white shadow-xl">
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.code} value={l.code} className="text-[12px] font-semibold cursor-pointer hover:bg-[#2C313C] focus:bg-[#2C313C] transition-colors">
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {translating && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#666] dark:text-[#A1A8B5]">
                      <Loader2 className="h-3 w-3 animate-spin text-[#FF6B2C]" />
                      Translating…
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right: Metadata + Auto-Transcribe Button */}
            <div className="flex items-center gap-4">
              {meta && (
                <div className="text-[11px] font-bold text-[#666] dark:text-[#A1A8B5] font-mono">
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
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#FF6B2C] bg-[#FF6B2C]/10 px-3.5 text-[11.5px] font-bold text-[#FF6B2C] hover:bg-[#FF6B2C] hover:text-white transition disabled:opacity-60 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
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
          <div className="flex flex-1 overflow-hidden select-none">

            {/* Desktop Layout - Slim Sidebar Left + Resizable Horizontal Panels */}
            {!isMobile && (
              <div className="flex flex-1 overflow-hidden">
                {/* 2.1 SLIM NAVIGATION SIDEBAR */}
                <aside className="w-16 flex-shrink-0 bg-white dark:bg-[#181B22] border-r border-[#E8E4DE] dark:border-[#2C313C] flex flex-col items-center justify-between py-4 select-none">
                  <div className="flex flex-col gap-4.5 w-full items-center">
                    {/* Captions */}
                    <SidebarIcon title="Captions" icon={Type} active={activeTab === "style"} onClick={() => setActiveTab("style")} />
                    {/* Animation Styles */}
                    <SidebarIcon title="Animation Styles" icon={Sparkles} active={activeTab === "anim"} onClick={() => setActiveTab("anim")} />
                    {/* Caption Templates */}
                    <SidebarIcon title="Caption Templates" icon={Layers} active={activeTab === "tmpl"} onClick={() => setActiveTab("tmpl")} />
                    {/* Brand Kit */}
                    <SidebarIcon title="Brand Kit" icon={Palette} active={activeTab === "brand"} onClick={() => setActiveTab("brand")} />

                    {/* Divider */}
                    <div className="w-8 h-px bg-[#E8E4DE] dark:bg-[#2C313C] rounded-full" />

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
                          className="flex h-11 w-11 items-center justify-center rounded-xl transition duration-300 hover:scale-[1.05] active:scale-95 cursor-pointer bg-[#FF6B2C] text-white shadow-[0_0_15px_rgba(255,107,44,0.35)] hover:bg-[#FF874D] disabled:opacity-70"
                          title="Export Video"
                        >
                          {exporting ? (
                            <Loader2 className="h-[19px] w-[19px] animate-spin" />
                          ) : (
                            <Download className="h-[19px] w-[19px]" />
                          )}
                        </button>
                        <span className="absolute left-16 rounded bg-[#1A1A1A] dark:bg-black border border-[#333] dark:border-[#2C313C] px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 z-50 whitespace-nowrap shadow-md">
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
                <div className="flex-1 flex flex-col overflow-hidden bg-[#F9F8F6] dark:bg-[#0F1117] bg-grid-dark-pattern dark:bg-grid-white-pattern relative">
                  {/* Soft ambient background glows */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#FF6B2C]/5 via-transparent to-purple-500/5 dark:from-[#FF6B2C]/10 dark:to-purple-500/10 opacity-70" />
                  
                  {/* Top Workspace Panels */}
                  <div className="flex-1 min-h-0 overflow-hidden px-4 py-3 z-10">
                    <ResizablePanelGroup direction="horizontal" className="h-full w-full gap-3">
                      {/* Left: captionsPanel */}
                      <ResizablePanel defaultSize={26} minSize={15} maxSize={40} className="rounded-2xl border border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#181B22] overflow-hidden shadow-2xl">
                        {captionsPanel}
                      </ResizablePanel>

                      <ResizableHandle className="bg-transparent hover:bg-[#FF6B2C]/20 transition w-1 cursor-col-resize" />

                      {/* Middle: previewPanel */}
                      <ResizablePanel defaultSize={48} minSize={35} className="bg-transparent overflow-hidden">
                        {previewPanel}
                      </ResizablePanel>

                      <ResizableHandle className="bg-transparent hover:bg-[#FF6B2C]/20 transition w-1 cursor-col-resize" />

                      {/* Right: stylePanel */}
                      <ResizablePanel defaultSize={26} minSize={15} maxSize={40} className="rounded-2xl border border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#181B22] overflow-hidden shadow-2xl">
                        {stylePanel}
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </div>

                  {/* Bottom Timeline Panel Container */}
                  <div className="flex-shrink-0 h-[260px] flex flex-col overflow-hidden bg-white dark:bg-[#181B22] border border-[#E8E4DE] dark:border-[#2C313C] mx-4 mb-3 rounded-2xl shadow-2xl select-none">
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
              <div className="flex flex-1 flex-col overflow-hidden bg-[#181B22] pb-16">
                {/* 1. Top Nav Bar */}
                <div className="h-11 flex-shrink-0 flex items-center justify-between px-3 border-b border-[#2C313C] bg-[#181B22]">
                  <button
                    onClick={() => {
                      if (window.history.length > 1) {
                        navigate(-1);
                      } else {
                        navigate(user ? "/projects" : "/");
                      }
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2C313C] bg-[#1F232D] text-[#A1A8B5] hover:text-white min-h-[44px] min-w-[44px] cursor-pointer"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
                  </button>

                  <span className="text-[13px] font-bold text-white max-w-[160px] truncate">
                    {title}
                  </span>

                  <div className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2C313C] bg-[#1F232D] text-[#A1A8B5] hover:text-white min-h-[44px] min-w-[44px] cursor-pointer"
                          aria-label="Project actions menu"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 bg-[#1F232D] border border-[#2C313C] text-white shadow-xl rounded-xl">
                        <DropdownMenuLabel className="text-[10px] font-bold text-[#A1A8B5] uppercase tracking-wider px-2 py-1">Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={handleImportSrtClick} className="text-xs cursor-pointer py-2 hover:bg-[#2C313C] rounded-lg">Import SRT</DropdownMenuItem>
                        {captions.length > 0 && (
                          <DropdownMenuItem onClick={handleExportSrt} className="text-xs cursor-pointer py-2 hover:bg-[#2C313C] rounded-lg">Export SRT</DropdownMenuItem>
                        )}
                        {file && (
                          <DropdownMenuItem onClick={handleManualSave} className="text-xs cursor-pointer py-2 hover:bg-[#2C313C] rounded-lg">Save Project</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-[#2C313C]" />
                        <DropdownMenuLabel className="text-[10px] font-bold text-[#A1A8B5] uppercase tracking-wider px-2 py-1">Export Quality</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => setQuality("standard")}
                          className="text-xs cursor-pointer py-2 hover:bg-[#2C313C] rounded-lg flex items-center justify-between"
                        >
                          <span>Standard (720p)</span>
                          {quality === "standard" && <Check className="h-3.5 w-3.5 text-[#FF6B2C]" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setQuality("high")}
                          className="text-xs cursor-pointer py-2 hover:bg-[#2C313C] rounded-lg flex items-center justify-between"
                        >
                          <span>High (1080p)</span>
                          {quality === "high" && <Check className="h-3.5 w-3.5 text-[#FF6B2C]" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {file && (
                      <button
                        onClick={exportVideo}
                        disabled={exporting}
                        className="flex h-9 px-3 items-center justify-center gap-1.5 rounded-lg bg-[#FF6B2C] text-xs font-bold text-white transition hover:bg-[#FF874D] disabled:opacity-75 min-h-[44px] cursor-pointer"
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

                {/* Vertical Scroll Area */}
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                  {/* Video Preview */}
                  <div className="w-full bg-[#F9F8F6] dark:bg-[#0F1117] flex flex-col items-center justify-center p-3">
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

                  {/* Format Selector Chips */}
                  <div className="flex overflow-x-auto scrollbar-none gap-2 px-4 py-3 bg-[#F9F8F6] dark:bg-[#0F1117] border-b border-[#E8E4DE] dark:border-[#2C313C] select-none">
                    {FRAME_PRESETS.map((p) => {
                      const active = framePreset.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setFramePreset(p)}
                          className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold select-none transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${active
                              ? "bg-[#FF6B2C] text-white shadow-sm"
                              : "bg-[#F9F8F5] text-[#666] border border-[#E8E4DE] hover:bg-neutral-50 dark:bg-[#1F232D] dark:text-[#A1A8B5] dark:border-[#2C313C] dark:hover:bg-[#2C313C] dark:hover:text-white"
                            }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Condensed Audio Strip / Expanded Timeline */}
                  {timelineExpanded ? (
                    <div className="border-b border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#181B22] p-2">
                      <div className="flex justify-between items-center px-2 pb-2 border-b border-[#E8E4DE] dark:border-[#2C313C] mb-2">
                        <span className="text-[11px] font-bold text-[#666] dark:text-[#A1A8B5] uppercase tracking-wider">Multi-track Editor</span>
                        <button
                          onClick={() => setTimelineExpanded(false)}
                          className="text-[11px] font-bold text-[#FF6B2C] hover:underline px-3 py-1.5 min-h-[44px] flex items-center cursor-pointer"
                        >
                          Collapse
                        </button>
                      </div>
                      <div className="overflow-hidden rounded-lg border border-[#2C313C]">
                        {timelinePanel}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2C313C] bg-[#181B22]">
                      <span className="text-[11px] font-mono text-[#FF6B2C] font-semibold select-none flex-shrink-0">
                        {formatTime(currentTime)}
                      </span>
                      <CondensedTimeline
                        duration={meta?.duration ?? 0}
                        currentTime={currentTime}
                        onSeek={seek}
                      />
                      <span className="text-[11px] font-mono text-[#A1A8B5] font-semibold select-none flex-shrink-0">
                        {formatTime(meta?.duration ?? 0)}
                      </span>
                      <button
                        onClick={() => setTimelineExpanded(true)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2C313C] bg-[#1F232D] text-[#A1A8B5] hover:text-white hover:bg-[#2C313C] cursor-pointer min-h-[44px] min-w-[44px] flex-shrink-0"
                        title="Expand Timeline"
                        aria-label="Expand Timeline"
                      >
                        <ChevronsUpDown className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Caption List / Empty State */}
                  <div className="flex-1 bg-[#181B22]">
                    {captions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center py-8 px-6 bg-[#1F232D] border border-[#2C313C] rounded-xl my-4 mx-4 shadow-md">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6B2C]/10 text-[#FF6B2C] mb-4">
                          <FileText className="h-6 w-6" strokeWidth={2} />
                        </div>
                        <h3 className="text-[14px] font-bold text-white mb-1">No captions yet</h3>
                        <p className="text-[12.5px] text-[#A1A8B5] mb-5 max-w-[280px] leading-relaxed">
                          Auto-transcribe your speech or manually add captions to this video.
                        </p>
                        <div className="flex flex-col w-full gap-2">
                          <button
                            onClick={transcribe}
                            disabled={transcribing}
                            className="w-full flex h-11 items-center justify-center gap-2 rounded-lg bg-[#FF6B2C] text-xs font-bold text-white shadow-md hover:bg-[#FF874D] transition disabled:opacity-50 min-h-[44px] cursor-pointer"
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
                            className="w-full flex h-11 items-center justify-center gap-2 rounded-lg border border-[#2C313C] bg-[#1F232D] text-xs font-bold text-[#A1A8B5] hover:text-white hover:bg-[#2C313C] transition min-h-[44px] cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add caption</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-b border-[#2C313C]">
                        {captionsPanel}
                      </div>
                    )}
                  </div>

                  {/* Settings Panel Sheet */}
                  {activeMobileTab !== "captions" && (
                    <div className="border-t border-[#2C313C] bg-[#181B22] pb-6">
                      <div className="px-4 py-2.5 bg-[#1F232D] border-b border-[#2C313C] flex justify-between items-center select-none">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A8B5]">
                          {activeMobileTab === "style" && "Text Style"}
                          {activeMobileTab === "anim" && "Caption Animation"}
                          {activeMobileTab === "tmpl" && "Style Templates"}
                          {activeMobileTab === "brand" && "Brand Settings"}
                        </span>
                        <button
                          onClick={() => setActiveMobileTab("captions")}
                          className="text-[11px] font-bold text-[#A1A8B5] hover:text-white px-3 py-1.5 min-h-[44px] flex items-center cursor-pointer"
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

                {/* Bottom Navigation Tab Bar (Mobile) */}
                <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-[#1F232D] border-t border-[#2C313C] flex items-center justify-around px-2 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
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
                        className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] gap-1 transition cursor-pointer ${active ? "text-[#FF6B2C]" : "text-[#A1A8B5] hover:text-white"
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
        <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#FF6B2C] rounded-r-md" />
      )}
      <button
        type="button"
        onClick={onClick}
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition duration-300 hover:scale-[1.05] active:scale-95 cursor-pointer relative ${active
            ? "bg-[#FF6B2C] text-white shadow-[0_0_15px_rgba(255,107,44,0.4)]"
            : "bg-transparent text-[#999] dark:text-[#A1A8B5] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#F0EDE8] dark:hover:bg-[#1F232D]"
          }`}
        title={title}
      >
        <Icon className="h-[21px] w-[21px]" />
      </button>

      {/* Floating tooltip on hover */}
      <span className="absolute left-16 rounded bg-[#1A1A1A] dark:bg-black border border-[#333] dark:border-[#2C313C] px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 z-50 whitespace-nowrap shadow-md">
        {title}
      </span>
    </div>
  );
}

export default Editor;

