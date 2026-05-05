import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
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
import { ExportProgressDialog } from "@/components/captionly/ExportProgressDialog";
import { wordsToCaptions } from "@/lib/captions/segment";
import { burnCaptions, ExportCancelledError } from "@/lib/captions/render";
import { transcodeWebmToMp4 } from "@/lib/captions/transcode";
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

  useEffect(() => {
    document.title = "Editor — Captionly";
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
        setTitle(data.title);
        setCaptions((data.captions as Caption[]) ?? []);
        setStyle({ ...DEFAULT_STYLE, ...((data.style as Partial<CaptionStyle>) ?? {}) });
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
      const fd = new FormData();
      fd.append("file", file);
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
      videoRef.current.play().catch(() => {});
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

        if (projectId) {
          const { error } = await supabase
            .from("projects")
            .update(payload)
            .eq("id", projectId);
          if (error) throw error;
          return projectId;
        }

        const { data, error } = await supabase
          .from("projects")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
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
      const text = await f.text();
      const parsed = srtToCaptions(text);
      if (!parsed.length) {
        toast.error("No captions found in SRT file.");
        return;
      }
      setCaptions(parsed);
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
      <div className="flex items-center gap-1 md:gap-2">
        <Button variant="ghost" size="sm" onClick={handleImportSrtClick} className="px-2 md:px-3">
          <Upload className="h-4 w-4 md:mr-1.5" />
          <span className="hidden md:inline">Import SRT</span>
        </Button>
        {captions.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleExportSrt} className="px-2 md:px-3">
            <FileText className="h-4 w-4 md:mr-1.5" />
            <span className="hidden md:inline">Export SRT</span>
          </Button>
        )}
        {file && (
          <Button variant="ghost" size="sm" onClick={handleManualSave} disabled={saving} className="px-2 md:px-3">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin md:mr-1.5" />
            ) : (
              <Save className="h-4 w-4 md:mr-1.5" />
            )}
            <span className="hidden md:inline">Save</span>
          </Button>
        )}
        {file && (
          <div className="flex items-stretch overflow-hidden rounded-md">
            <Button
              onClick={exportVideo}
              disabled={exporting}
              size="sm"
              className="rounded-r-none bg-gradient-primary px-3 text-primary-foreground hover:opacity-95"
            >
              {exporting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  <span className="text-xs">
                    {exportStage === "transcode" ? "Converting" : "Rendering"}{" "}
                    {Math.round(exportProgress * 100)}%
                  </span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 md:mr-1.5" />
                  <span className="hidden md:inline">Export {exportFormat.toUpperCase()}</span>
                  <span className="ml-1 md:hidden text-xs font-medium">{exportFormat.toUpperCase()}</span>
                </>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={exporting}
                  className="rounded-l-none border-l border-primary-foreground/20 bg-gradient-primary px-2 text-primary-foreground hover:opacity-95"
                  aria-label="Choose export format"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
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
      <div className="flex h-screen items-center justify-center bg-gradient-surface">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-surface">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface/60 px-3 py-2 backdrop-blur md:gap-3 md:px-6 md:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link to="/" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-primary shadow-glow sm:flex">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project title"
            className="h-8 min-w-0 flex-1 border-transparent bg-transparent px-2 text-sm font-medium hover:border-border focus-visible:border-border md:w-60 md:flex-none"
          />
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5 md:gap-2">
          {headerRight}
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut} className="hidden md:inline-flex">
              <LogOut className="mr-1.5 h-4 w-4" /> Sign out
            </Button>
          ) : (
            <Link to="/auth" className="hidden md:inline-flex text-xs text-muted-foreground hover:text-foreground px-2">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <input
        ref={srtInputRef}
        type="file"
        accept=".srt,application/x-subrip,text/plain"
        className="hidden"
        onChange={handleSrtFile}
      />

      {!file && (
        <main className="mx-auto flex w-full max-w-3xl flex-1 animate-fade-in flex-col items-center justify-center px-6 py-10">
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              Caption your videos in{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">seconds</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Upload a video to start. We'll save your captions and styling so you can come back
              anytime.
            </p>
          </div>
          <div className="w-full">
            <VideoDropzone onFile={handleFile} />
          </div>
        </main>
      )}

      {file && videoUrl && (
        <div className="grid flex-1 animate-fade-in grid-cols-12 gap-3 overflow-hidden p-3">
          <aside className="col-span-12 flex h-[40vh] flex-col overflow-hidden rounded-xl border border-border bg-surface md:col-span-3 md:h-auto">
            <CaptionList
              captions={captions}
              currentTime={currentTime}
              onChange={setCaptions}
              onSeek={seek}
            />
          </aside>

          <main className="col-span-12 flex flex-col gap-3 md:col-span-6">
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Preview resolution
                </div>
                <Select value={exportPresetId} onValueChange={setExportPresetId}>
                  <SelectTrigger className="h-8 w-[260px] text-xs">
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPORT_PRESETS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex flex-col">
                          <span>{p.label}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {p.description}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div
                className="mx-auto w-full"
                style={
                  exportPresetId !== SOURCE_PRESET_ID
                    ? {
                        maxWidth: (() => {
                          const p = getPresetById(exportPresetId);
                          // Constrain vertical/portrait formats so they don't dominate the column
                          return p.height > p.width ? "320px" : "100%";
                        })(),
                      }
                    : undefined
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
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {meta ? (
                  <>
                    {meta.width}×{meta.height} · {meta.duration.toFixed(1)}s
                  </>
                ) : (
                  "Loading metadata…"
                )}
                {storedSourcePath && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-primary/30 px-2 py-0.5 text-[10px] text-primary">
                    <Cloud className="h-3 w-3" /> Saved
                  </span>
                )}
              </div>
              <Button
                onClick={transcribe}
                disabled={transcribing}
                variant="secondary"
                className="border border-primary/30 hover:border-primary/60"
              >
                {transcribing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transcribing…
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4 text-primary" />
                    {captions.length ? "Re-transcribe" : "Auto-transcribe"}
                  </>
                )}
              </Button>
            </div>
          </main>

          <aside className="col-span-12 overflow-hidden rounded-xl border border-border bg-surface md:col-span-3">
            <StylePanel style={style} onChange={setStyle} />
          </aside>
        </div>
      )}

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
