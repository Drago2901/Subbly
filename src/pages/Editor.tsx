import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Cloud,
  Download,
  FileText,
  Loader2,
  LogOut,
  Save,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
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
import { wordsToCaptions } from "@/lib/captions/segment";
import { burnCaptions, ExportCancelledError } from "@/lib/captions/render";
import { transcodeWebmToMp4 } from "@/lib/captions/transcode";
import { extractAudioNative } from "@/lib/captions/audio";
import {
  DEFAULT_STYLE,
  type Caption,
  type CaptionStyle,
  type Word,
} from "@/lib/captions/types";
import {
  EXPORT_PRESETS,
  SOURCE_PRESET_ID,
  getPresetById,
} from "@/lib/captions/presets";
import { useAuth } from "@/hooks/useAuth";
import { captionsToSrt, srtToCaptions } from "@/lib/captions/srt";
import { Seo } from "@/components/Seo";
import { useIsMobile } from "@/hooks/use-mobile";

type ProjectMeta = {
  width: number;
  height: number;
  duration: number;
};

const Editor = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("project");

  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<ProjectMeta | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [style, setStyle] = useState<CaptionStyle>(DEFAULT_STYLE);
  const [title, setTitle] = useState("Untitled project");
  const [transcribing, setTranscribing] = useState(false);
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
  const [exportFormat, setExportFormat] = useState<"webm" | "mp4">("webm");
  const [exportPresetId, setExportPresetId] = useState<string>(SOURCE_PRESET_ID);
  const [exportStage, setExportStage] = useState<"render" | "transcode">("render");
  const videoRef = useRef<HTMLVideoElement>(null);
  const exportAbortRef = useRef<AbortController | null>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);
  // Snapshot of the last persisted caption/style/title, used to skip redundant auto-saves.
  const lastSavedRef = useRef<string>("");

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
        setTitle(data.title);
        setCaptions(loadedCaptions);
        setStyle(loadedStyle);
        // Mark this as the baseline so auto-save doesn't fire on the initial load.
        lastSavedRef.current = JSON.stringify({
          captions: loadedCaptions,
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
      } catch (err: any) {
        toast.error(err?.message || "Could not load project");
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

  const handleFile = (f: File) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setCaptions([]);
    setMeta(null);
    setStoredSourcePath(null);
    setStoredExportPath(null);
    if (title === "Untitled project") {
      setTitle(f.name.replace(/\.[^.]+$/, ""));
    }
  };

  const transcribe = async () => {
    if (!file) return;
    setTranscribing(true);
    try {
      // Extract audio natively in-browser (no WASM download — near-instant)
      const audioBlob = await extractAudioNative(file);

      const fd = new FormData();
      fd.append("file", new File([audioBlob], "audio.wav", { type: "audio/wav" }));

      const { data, error } = await supabase.functions.invoke("transcribe-video", {
        body: fd,
      });
      if (error) throw error;
      const words: Word[] = data?.words ?? [];
      if (!words.length) {
        toast.error("No speech detected in this video.");
        return;
      }
      setCaptions(wordsToCaptions(words, 42));
      toast.success("Transcription complete");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Transcription failed");
    } finally {
      setTranscribing(false);
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
      } catch (err: any) {
        toast.error(err?.message || "Could not save project");
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
      const parsed = srtToCaptions(text);
      if (!parsed.length) {
        toast.error("No captions found in SRT file.");
        return;
      }
      setCaptions(parsed);
      // Show the first caption immediately on the preview.
      if (videoRef.current) {
        videoRef.current.currentTime = parsed[0].start;
      }
      setCurrentTime(parsed[0].start);
      toast.success(`Imported ${parsed.length} captions`);
    } catch (err: any) {
      toast.error(err?.message || "Could not read SRT file");
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
      const preset = getPresetById(exportPresetId);
      const output =
        preset.id === SOURCE_PRESET_ID
          ? undefined
          : { width: preset.width, height: preset.height, fit: preset.fit };
      let blob = await burnCaptions({
        videoFile: file,
        captions,
        style,
        output,
        signal: controller.signal,
        onProgress: ({ progress }) => setExportProgress(progress),
        onLog: (m) => console.log("[export]", m),
      });

      if (controller.signal.aborted) throw new ExportCancelledError();

      if (exportFormat === "mp4") {
        setExportStage("transcode");
        setExportProgress(0);
        blob = await transcodeWebmToMp4({
          webmBlob: blob,
          signal: controller.signal,
          onProgress: (p) => setExportProgress(p),
          onLog: (m) => console.log("[ffmpeg]", m),
        });
      }

      if (controller.signal.aborted) throw new ExportCancelledError();

      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
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
    } catch (e: any) {
      if (e?.name === "ExportCancelledError" || controller.signal.aborted) {
        toast.info("Export cancelled");
      } else {
        console.error(e);
        toast.error(e?.message || "Export failed");
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
          <div className="flex items-stretch overflow-hidden rounded-[7px]">
            <button
              onClick={exportVideo}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-l-[7px] bg-[#ff5c3a] px-4 py-1.5 text-[12.5px] font-medium text-white transition hover:bg-[#e84e2e] disabled:opacity-70"
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
                  <Download className="h-3.5 w-3.5" strokeWidth={2} />
                  <span className="hidden sm:inline">Export {exportFormat.toUpperCase()}</span>
                  <span className="sm:hidden">{exportFormat.toUpperCase()}</span>
                </>
              )}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={exporting}
                  className="flex items-center justify-center border-l border-white/20 bg-[#ff5c3a] px-2 text-white transition hover:bg-[#e84e2e] disabled:opacity-70"
                  aria-label="Choose export format"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Export format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={exportFormat}
                  onValueChange={(v) => setExportFormat(v as "webm" | "mp4")}
                >
                  <DropdownMenuRadioItem value="webm">
                    WebM — fast, smaller file
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="mp4">
                    MP4 — universal, slower export
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Resolution</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={exportPresetId}
                  onValueChange={setExportPresetId}
                >
                  {EXPORT_PRESETS.map((p) => (
                    <DropdownMenuRadioItem key={p.id} value={p.id}>
                      <span className="flex flex-col">
                        <span>{p.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {p.description}
                        </span>
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [file, exporting, exportProgress, exportStage, exportFormat, exportPresetId, saving, title, captions, style, meta],
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
      <header className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#e8e4de] bg-white px-3 py-2 md:gap-3 md:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            to="/"
            className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[7px] border border-[#e8e4de] bg-white text-[#666] transition hover:bg-[#f5f3ee]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
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
          {user ? (
            <button
              onClick={signOut}
              className="hidden items-center gap-1.5 rounded-[7px] px-2.5 py-1.5 text-[12.5px] text-[#888] transition hover:bg-[#f5f3ee] hover:text-[#555] md:inline-flex"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} />
              Sign out
            </button>
          ) : (
            <Link
              to="/auth"
              className="hidden items-center rounded-[7px] px-2.5 py-1.5 text-[12.5px] text-[#888] transition hover:bg-[#f5f3ee] hover:text-[#555] md:inline-flex"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

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
          />
        );

        const previewPanel = (
          <div className="flex h-full flex-col overflow-hidden bg-[#f5f3ee]">
            <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-[#e8e4de] bg-white px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="hidden text-[11px] text-[#aaa] sm:inline">Preview resolution</span>
                <Select value={exportPresetId} onValueChange={setExportPresetId}>
                  <SelectTrigger className="h-7 w-full max-w-[240px] rounded-[6px] border-[#e8e4de] bg-[#f5f3ee] px-3 text-[12px] text-[#1a1a1a] focus:ring-0 sm:w-[240px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPORT_PRESETS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex flex-col">
                          <span className="text-[13px]">{p.label}</span>
                          <span className="text-[11px] text-[#bbb]">{p.description}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#aaa]">
                {storedSourcePath && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#ffd5cc] bg-[#fff5f3] px-2 py-0.5 text-[#ff5c3a]">
                    <Cloud className="h-3 w-3" /> Saved
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center overflow-hidden p-4 md:p-6">
              <div
                className="w-full"
                style={
                  exportPresetId !== SOURCE_PRESET_ID
                    ? {
                        maxWidth: (() => {
                          const p = getPresetById(exportPresetId);
                          return p.height > p.width ? "320px" : "720px";
                        })(),
                      }
                    : { maxWidth: "720px" }
                }
              >
                <VideoPreview
                  ref={videoRef}
                  src={videoUrl}
                  captions={captions}
                  style={style}
                  onTimeUpdate={setCurrentTime}
                  onLoaded={setMeta}
                  onPositionChange={({ posX, posY }) =>
                    setStyle((s) => ({ ...s, position: "free", posX, posY }))
                  }
                  frame={
                    exportPresetId === SOURCE_PRESET_ID
                      ? null
                      : (() => {
                          const p = getPresetById(exportPresetId);
                          return { width: p.width, height: p.height, fit: p.fit };
                        })()
                  }
                />
              </div>
            </div>

            <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#e8e4de] bg-white px-4 py-2.5">
              <div className="text-[11px] text-[#aaa]">
                {meta ? (
                  <>{meta.width}×{meta.height} · {meta.duration.toFixed(1)}s</>
                ) : (
                  "Loading metadata…"
                )}
              </div>
              <button
                onClick={transcribe}
                disabled={transcribing}
                className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#e8e4de] bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-[#1a1a1a] transition hover:border-[#ff5c3a] hover:bg-[#fff5f3] hover:text-[#ff5c3a] disabled:opacity-60"
              >
                {transcribing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Transcribing…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                    {captions.length ? "Re-transcribe" : "Auto-transcribe"}
                  </>
                )}
              </button>
            </div>
          </div>
        );

        const stylePanel = <StylePanel style={style} onChange={setStyle} />;

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
            playing={!!videoRef.current && !videoRef.current.paused}
            onTogglePlay={() => {
              const v = videoRef.current;
              if (!v) return;
              if (v.paused) v.play().catch(() => {});
              else v.pause();
            }}
          />
        ) : null;

        return (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Desktop layout */}
            <div className="hidden flex-1 overflow-hidden md:flex">
              <aside className="flex w-[280px] flex-shrink-0 flex-col overflow-hidden border-r border-[#e8e4de] bg-white">
                {captionsPanel}
              </aside>
              <main className="flex flex-1 flex-col overflow-hidden">
                {previewPanel}
              </main>
              <aside className="flex w-[300px] flex-shrink-0 flex-col overflow-hidden border-l border-[#e8e4de] bg-white">
                {stylePanel}
              </aside>
            </div>

            {/* Mobile layout */}
            <div className="flex flex-1 flex-col overflow-hidden bg-white p-2 md:hidden">
              <Tabs defaultValue="preview" className="flex flex-1 flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-3 bg-[#f5f3ee]">
                  <TabsTrigger value="captions">Captions</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="style">Style</TabsTrigger>
                </TabsList>
                <TabsContent value="captions" className="mt-2 flex-1 overflow-hidden rounded-xl border border-[#e8e4de]">
                  {captionsPanel}
                </TabsContent>
                <TabsContent value="preview" className="mt-2 flex-1 overflow-hidden rounded-xl border border-[#e8e4de]">
                  {previewPanel}
                </TabsContent>
                <TabsContent value="style" className="mt-2 flex-1 overflow-hidden rounded-xl border border-[#e8e4de]">
                  {stylePanel}
                </TabsContent>
              </Tabs>
            </div>

            {/* Timeline at bottom */}
            {timelinePanel}
          </div>
        );
      })()}

      <ExportProgressDialog
        open={exporting}
        stage={exportStage}
        progress={exportProgress}
        format={exportFormat}
        onCancel={cancelExport}
      />
    </div>
  );
};

export default Editor;
