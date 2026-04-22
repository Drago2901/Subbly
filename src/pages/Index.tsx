import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2, Sparkles, Wand2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { VideoDropzone } from "@/components/captionly/VideoDropzone";
import { VideoPreview } from "@/components/captionly/VideoPreview";
import { CaptionList } from "@/components/captionly/CaptionList";
import { StylePanel } from "@/components/captionly/StylePanel";
import { wordsToCaptions } from "@/lib/captions/segment";
import { buildAss } from "@/lib/captions/ass";
import { burnCaptions } from "@/lib/captions/render";
import { DEFAULT_STYLE, type Caption, type CaptionStyle, type Word } from "@/lib/captions/types";

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ width: number; height: number; duration: number } | null>(
    null,
  );
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [style, setStyle] = useState<CaptionStyle>(DEFAULT_STYLE);
  const [transcribing, setTranscribing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    document.title = "Captionly — AI Video Caption Editor";
    const desc = "Upload a video, auto-generate captions with AI, edit text and styling, then export an MP4 with burned-in subtitles — all in your browser.";
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
    }
    m.setAttribute("content", desc);
  }, []);

  const handleFile = (f: File) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setCaptions([]);
    setMeta(null);
  };

  const reset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setFile(null);
    setVideoUrl(null);
    setCaptions([]);
    setMeta(null);
    setStyle(DEFAULT_STYLE);
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

  const exportVideo = async () => {
    if (!file) {
      toast.error("Upload a video first.");
      return;
    }
    setExporting(true);
    setExportProgress(0);
    try {
      const w = meta?.width ?? 1080;
      const h = meta?.height ?? 1920;
      const ass = buildAss(captions, style, w, h);
      const blob = await burnCaptions({
        videoFile: file,
        assText: ass,
        onProgress: ({ progress }) => setExportProgress(progress),
        onLog: (m) => console.log("[ffmpeg]", m),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `captioned-${file.name.replace(/\.[^.]+$/, "")}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success("Export ready — downloading.");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const headerRight = useMemo(
    () =>
      file ? (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="mr-1.5 h-4 w-4" /> New video
          </Button>
          <Button
            onClick={exportVideo}
            disabled={exporting || captions.length === 0}
            className="bg-gradient-primary text-primary-foreground hover:opacity-95"
          >
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rendering {Math.round(exportProgress * 100)}%
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" /> Export MP4
              </>
            )}
          </Button>
        </div>
      ) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [file, exporting, exportProgress, captions.length],
  );

  return (
    <div className="flex h-screen flex-col bg-gradient-surface">
      <header className="flex items-center justify-between border-b border-border bg-surface/60 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-none">Captionly</h1>
            <p className="text-[11px] text-muted-foreground">AI caption editor</p>
          </div>
        </div>
        {headerRight}
      </header>

      {!file && (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-10 animate-fade-in">
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              Caption your videos in{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">seconds</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              AI transcription with word-perfect timestamps. Edit text, restyle, and export an MP4
              with captions baked in — no signup, no upload to anyone but you.
            </p>
          </div>
          <div className="w-full">
            <VideoDropzone onFile={handleFile} />
          </div>
        </main>
      )}

      {file && videoUrl && (
        <div className="grid flex-1 grid-cols-12 gap-3 overflow-hidden p-3 animate-fade-in">
          {/* Left: captions */}
          <aside className="col-span-12 flex h-[40vh] flex-col overflow-hidden rounded-xl border border-border bg-surface md:col-span-3 md:h-auto">
            <CaptionList
              captions={captions}
              currentTime={currentTime}
              onChange={setCaptions}
              onSeek={seek}
            />
          </aside>

          {/* Center: preview */}
          <main className="col-span-12 flex flex-col gap-3 md:col-span-6">
            <div className="rounded-xl border border-border bg-surface p-3">
              <VideoPreview
                ref={videoRef}
                src={videoUrl}
                captions={captions}
                style={style}
                onTimeUpdate={setCurrentTime}
                onLoaded={setMeta}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
              <div className="text-xs text-muted-foreground">
                {meta ? (
                  <>
                    {meta.width}×{meta.height} · {meta.duration.toFixed(1)}s
                  </>
                ) : (
                  "Loading metadata…"
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

          {/* Right: style */}
          <aside className="col-span-12 overflow-y-auto rounded-xl border border-border bg-surface md:col-span-3">
            <StylePanel style={style} onChange={setStyle} />
          </aside>
        </div>
      )}
    </div>
  );
};

export default Index;
