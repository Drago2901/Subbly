import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchFile } from "@ffmpeg/util";
import { Upload, Film, Download, Loader2, X, CheckCircle2, AlertCircle, GripVertical, Layers, Play, Pause, SkipBack, SkipForward, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getFFmpeg, resetFFmpeg } from "@/lib/ffmpeg-loader";
import { checkRuntimeEnv } from "@/lib/env-check";
import { toast } from "sonner";
import { LiquidProgress } from "@/components/LiquidProgress";

const MAX_SIZE = 500 * 1024 * 1024;
const ACCEPTED = ["video/mp4", "video/quicktime", "video/x-msvideo"];
const ACCEPTED_EXT = [".mp4", ".mov", ".avi"];

type Stage = "idle" | "ready" | "processing" | "done";
type Quality = "fast" | "reencode";

type Item = { id: string; file: File; url: string; duration: number };

function formatSize(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
function formatTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function validate(f: File): string | null {
  const ext = "." + f.name.split(".").pop()?.toLowerCase();
  if (!ACCEPTED.includes(f.type) && !ACCEPTED_EXT.includes(ext)) return `Unsupported: ${f.name}`;
  if (f.size > MAX_SIZE) return `Too large (>500MB): ${f.name}`;
  return null;
}

async function probeDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.src = url;
    v.onloadedmetadata = () => resolve(v.duration || 0);
    v.onerror = () => resolve(0);
  });
}

export function VideoCompiler() {
  const [items, setItems] = useState<Item[]>([]);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [outputUrl, setOutputUrl] = useState<string>("");
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<Quality>(() => {
    if (typeof window === "undefined") return "reencode";
    const saved = window.localStorage.getItem("vc:quality");
    return saved === "fast" || saved === "reencode" ? (saved as Quality) : "reencode";
  });
  const cancelRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragIdx = useRef<number | null>(null);

  // Sequence preview state
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [elapsedBefore, setElapsedBefore] = useState(0); // sum of durations of clips before current
  const [currentTime, setCurrentTime] = useState(0); // current clip time
  const totalDur = useMemo(() => items.reduce((a, i) => a + (i.duration || 0), 0), [items]);

  // Reset preview when items change
  useEffect(() => {
    setPreviewIdx((p) => (p >= items.length ? 0 : p));
    setPreviewPlaying(false);
    setCurrentTime(0);
  }, [items.length]);

  useEffect(() => {
    let acc = 0;
    for (let i = 0; i < previewIdx && i < items.length; i++) acc += items[i].duration || 0;
    setElapsedBefore(acc);
    setCurrentTime(0);
    const v = previewVideoRef.current;
    if (v) {
      v.currentTime = 0;
      if (previewPlaying) v.play().catch(() => {});
    }
  }, [previewIdx, items, previewPlaying]);

  const playPausePreview = () => {
    const v = previewVideoRef.current;
    if (!v) return;
    if (previewPlaying) { v.pause(); setPreviewPlaying(false); }
    else { v.play().then(() => setPreviewPlaying(true)).catch(() => {}); }
  };
  const prevClip = () => setPreviewIdx((i) => Math.max(0, i - 1));
  const nextClip = () => setPreviewIdx((i) => Math.min(items.length - 1, i + 1));
  const onPreviewEnded = () => {
    if (previewIdx < items.length - 1) {
      setPreviewIdx(previewIdx + 1);
    } else {
      setPreviewPlaying(false);
    }
  };

  useEffect(() => {
    try { window.localStorage.setItem("vc:quality", quality); } catch {}
  }, [quality]);

  useEffect(() => {
    return () => {
      items.forEach((i) => URL.revokeObjectURL(i.url));
      if (outputUrl) URL.revokeObjectURL(outputUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const next: Item[] = [];
    for (const f of arr) {
      const err = validate(f);
      if (err) { toast.error(err); continue; }
      const url = URL.createObjectURL(f);
      const dur = await probeDuration(url);
      next.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, file: f, url, duration: dur });
    }
    if (next.length) {
      setItems((prev) => [...prev, ...next]);
      setStage("ready");
    }
  }, []);

  const removeItem = (id: string) => {
    setItems((prev) => {
      const it = prev.find((i) => i.id === id);
      if (it) URL.revokeObjectURL(it.url);
      const next = prev.filter((i) => i.id !== id);
      if (next.length === 0) setStage("idle");
      return next;
    });
  };

  const moveItem = (from: number, to: number) => {
    setItems((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const totalDuration = items.reduce((a, i) => a + (i.duration || 0), 0);
  const totalSize = items.reduce((a, i) => a + i.file.size, 0);

  const reset = () => {
    items.forEach((i) => URL.revokeObjectURL(i.url));
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setItems([]);
    setOutputUrl("");
    setOutputBlob(null);
    setStage("idle");
    setProgress(0);
    setStatusMsg("");
    setError(null);
  };

  const cancel = () => {
    if (stage !== "processing") return;
    cancelRef.current = true;
    setStatusMsg("Cancelling…");
  };

  const compile = async () => {
    if (items.length < 2) {
      toast.error("Add at least 2 videos to compile.");
      return;
    }
    const envIssue = checkRuntimeEnv();
    if (envIssue) {
      setError(envIssue.message);
      toast.error(envIssue.message, { duration: 12000 });
      return;
    }
    cancelRef.current = false;
    setError(null);
    setStage("processing");
    setProgress(2);
    setStatusMsg("Loading FFmpeg engine…");

    const checkCancel = () => {
      if (cancelRef.current) throw new Error("__cancelled__");
    };

    try {
      const ffmpeg = await getFFmpeg(setStatusMsg);
      checkCancel();

      // Write all inputs (normalize extension to source ext)
      const inputNames: string[] = [];
      for (let i = 0; i < items.length; i++) {
        checkCancel();
        const it = items[i];
        const ext = (it.file.name.split(".").pop() || "mp4").toLowerCase();
        const name = `vc_in_${i}.${ext}`;
        setStatusMsg(`Loading video ${i + 1} of ${items.length} — ${it.file.name}`);
        try { await ffmpeg.deleteFile(name); } catch {}
        await ffmpeg.writeFile(name, await fetchFile(it.file));
        inputNames.push(name);
        setProgress(2 + Math.floor(((i + 1) / items.length) * 18)); // up to ~20%
      }

      checkCancel();
      const outName = "vc_out.mp4";
      try { await ffmpeg.deleteFile(outName); } catch {}

      if (quality === "fast") {
        // Stream-copy concat via concat demuxer (works best when all inputs share codec/params)
        setStatusMsg("Concatenating with stream copy…");
        const listName = "vc_list.txt";
        const listBody = inputNames.map((n) => `file '${n}'`).join("\n") + "\n";
        try { await ffmpeg.deleteFile(listName); } catch {}
        await ffmpeg.writeFile(listName, new TextEncoder().encode(listBody));
        setProgress(40);
        await ffmpeg.exec([
          "-f", "concat",
          "-safe", "0",
          "-i", listName,
          "-c", "copy",
          "-movflags", "+faststart",
          "-y", outName,
        ]);
        try { await ffmpeg.deleteFile(listName); } catch {}
      } else {
        // Re-encode concat via filter (handles mixed codecs/resolutions)
        setStatusMsg("Re-encoding & merging videos…");
        setProgress(25);
        const inputArgs: string[] = [];
        inputNames.forEach((n) => { inputArgs.push("-i", n); });
        const n = inputNames.length;
        // Build filter: scale all to first input's frame, then concat v+a
        const parts: string[] = [];
        for (let i = 0; i < n; i++) {
          parts.push(`[${i}:v:0]setsar=1,fps=30[v${i}]`);
        }
        const concatInputs = Array.from({ length: n }, (_, i) => `[v${i}][${i}:a:0?]`).join("");
        const filter = `${parts.join(";")};${concatInputs}concat=n=${n}:v=1:a=1[outv][outa]`;

        const args = [
          ...inputArgs,
          "-filter_complex", filter,
          "-map", "[outv]",
          "-map", "[outa]",
          "-c:v", "libx264",
          "-preset", "veryfast",
          "-crf", "23",
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
          "-y", outName,
        ];

        // Per-second progress estimate via ffmpeg log
        let lastPct = 25;
        const total = totalDuration || 1;
        const logHandler = ({ message }: { message: string }) => {
          const m = message.match(/time=(\d+):(\d+):(\d+\.\d+)/);
          if (m) {
            const t = (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
            const pct = Math.min(90, 25 + Math.floor((t / total) * 65));
            if (pct > lastPct) { lastPct = pct; setProgress(pct); }
          }
        };
        ffmpeg.on("log", logHandler);

        const TIMEOUT_MS = Math.max(180_000, Math.ceil(total * 8000)); // 8s/sec of input, 3min floor
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([
            ffmpeg.exec(args),
            new Promise<never>((_, reject) => {
              timer = setTimeout(() => {
                try { (ffmpeg as unknown as { terminate?: () => void }).terminate?.(); } catch {}
                reject(new Error(`Compile timed out after ${Math.round(TIMEOUT_MS / 1000)}s`));
              }, TIMEOUT_MS);
            }),
          ]);
        } finally {
          if (timer) clearTimeout(timer);
          try { ffmpeg.off("log", logHandler); } catch {}
        }
      }

      checkCancel();
      setProgress(95);
      setStatusMsg("Finalizing output…");
      const data = await ffmpeg.readFile(outName);
      const bytes = data as Uint8Array;
      if (!bytes || bytes.byteLength === 0) throw new Error("Compiled file is empty");
      const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const blob = new Blob([buf], { type: "video/mp4" });
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      const url = URL.createObjectURL(blob);
      setOutputBlob(blob);
      setOutputUrl(url);
      setProgress(100);
      setStatusMsg("Done!");
      setStage("done");
      toast.success("Videos compiled into one file!");

      // Cleanup inputs
      for (const n of inputNames) {
        try { await ffmpeg.deleteFile(n); } catch {}
      }
      try { await ffmpeg.deleteFile(outName); } catch {}
    } catch (e) {
      const cancelled = e instanceof Error && e.message === "__cancelled__";
      if (cancelled) {
        setStatusMsg("Cancelled.");
        toast.message("Compile cancelled");
        resetFFmpeg();
        setStage("ready");
        setProgress(0);
      } else {
        console.error(e);
        const msg = e instanceof Error ? e.message : "Unknown error";
        setError(msg);
        toast.error("Compile failed. You can retry.");
        resetFFmpeg();
        setStage("ready");
        setProgress(0);
      }
    } finally {
      cancelRef.current = false;
    }
  };

  const downloadOutput = () => {
    if (!outputBlob || !outputUrl) return;
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = `compiled-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Dropzone (always visible to allow appending) */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-8 md:p-12 text-center transition-smooth bg-card shadow-soft ${
          dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 shadow-elegant">
          <Upload className="w-8 h-8 text-primary-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-1">
          {items.length === 0 ? "Drop videos to compile" : "Add more videos"}
        </h3>
        <p className="text-muted-foreground text-sm mb-2">
          Select multiple files — they'll be merged in the order shown below.
        </p>
        <p className="text-xs text-muted-foreground">MP4, MOV, AVI · up to 500MB each</p>
      </div>

      {items.length > 0 && (
        <div className="rounded-3xl bg-card shadow-soft p-6 md:p-8 space-y-5 animate-float-up">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                <Layers className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-medium">{items.length} video{items.length === 1 ? "" : "s"} queued</p>
                <p className="text-sm text-muted-foreground">
                  Total {formatTime(totalDuration)} · {formatSize(totalSize)}
                </p>
              </div>
            </div>
            {stage !== "processing" && (
              <Button variant="ghost" size="icon" onClick={reset} aria-label="Clear all">
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Reorderable list */}
          <ul className="space-y-2">
            {items.map((it, i) => (
              <li
                key={it.id}
                draggable={stage !== "processing"}
                onDragStart={() => { dragIdx.current = i; }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = dragIdx.current;
                  dragIdx.current = null;
                  if (from === null || from === i) return;
                  moveItem(from, i);
                }}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-2 pr-3"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 cursor-grab" />
                <div className="w-20 aspect-video rounded-md overflow-hidden bg-black shrink-0">
                  <video src={it.url} className="w-full h-full object-cover" muted preload="metadata" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{i + 1}. {it.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(it.duration)} · {formatSize(it.file.size)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => moveItem(i, i - 1)}
                    disabled={i === 0 || stage === "processing"}
                    aria-label="Move up"
                    className="h-8 w-8"
                  >▲</Button>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => moveItem(i, i + 1)}
                    disabled={i === items.length - 1 || stage === "processing"}
                    aria-label="Move down"
                    className="h-8 w-8"
                  >▼</Button>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => removeItem(it.id)}
                    disabled={stage === "processing"}
                    aria-label="Remove"
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {/* Sequence preview */}
          {items.length > 0 && stage !== "processing" && (
            <div className="space-y-3 rounded-2xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium inline-flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" /> Preview sequence
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Clip {Math.min(previewIdx + 1, items.length)} of {items.length} · {formatTime(elapsedBefore + currentTime)} / {formatTime(totalDur)}
                </span>
              </div>
              <div className="rounded-xl overflow-hidden bg-black aspect-video relative">
                {items[previewIdx] && (
                  <video
                    key={items[previewIdx].id}
                    ref={previewVideoRef}
                    src={items[previewIdx].url}
                    className="w-full h-full object-contain"
                    playsInline
                    onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
                    onEnded={onPreviewEnded}
                    onPlay={() => setPreviewPlaying(true)}
                    onPause={() => setPreviewPlaying(false)}
                  />
                )}
                <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 text-white text-[11px] font-medium truncate max-w-[80%]">
                  {items[previewIdx]?.file.name}
                </div>
              </div>
              {/* Segmented timeline */}
              <div className="flex w-full h-2 rounded-full overflow-hidden bg-muted">
                {items.map((it, i) => {
                  const w = totalDur > 0 ? ((it.duration || 0) / totalDur) * 100 : 100 / items.length;
                  const isCurrent = i === previewIdx;
                  const filled = i < previewIdx ? 100 : isCurrent ? ((it.duration ? (currentTime / it.duration) * 100 : 0)) : 0;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => setPreviewIdx(i)}
                      style={{ width: `${w}%` }}
                      className={`relative h-full border-r border-background last:border-r-0 ${isCurrent ? "bg-primary/20" : "bg-muted hover:bg-primary/10"}`}
                      aria-label={`Jump to clip ${i + 1}`}
                    >
                      <span className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${filled}%` }} />
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="icon" onClick={prevClip} disabled={previewIdx === 0} aria-label="Previous clip">
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button onClick={playPausePreview} size="icon" className="bg-gradient-primary h-10 w-10" aria-label={previewPlaying ? "Pause" : "Play"}>
                  {previewPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button variant="outline" size="icon" onClick={nextClip} disabled={previewIdx >= items.length - 1} aria-label="Next clip">
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[11px] text-center text-muted-foreground">
                Reorder or remove clips above, then compile when the sequence looks right.
              </p>
            </div>
          )}

          {/* Quality */}
          <div className="space-y-2 rounded-2xl border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium">Compile quality</label>
              <span className="text-[11px] text-muted-foreground">Re-encode is recommended for mixed sources</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={stage === "processing"}
                onClick={() => setQuality("fast")}
                className={`text-left p-3 rounded-xl border transition-smooth disabled:opacity-50 ${
                  quality === "fast" ? "border-primary bg-primary/5 shadow-elegant" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Layers className="w-4 h-4 text-primary" /> Fast (stream copy)
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Instant. Only works if all clips share codec/resolution.
                </p>
              </button>
              <button
                type="button"
                disabled={stage === "processing"}
                onClick={() => setQuality("reencode")}
                className={`text-left p-3 rounded-xl border transition-smooth disabled:opacity-50 ${
                  quality === "reencode" ? "border-primary bg-primary/5 shadow-elegant" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Film className="w-4 h-4 text-primary" /> Re-encode (safe)
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Re-encodes everything to H.264/AAC at 30fps. Slower, reliable.
                </p>
              </button>
            </div>
          </div>

          {stage === "processing" && (
            <div className="space-y-3">
              <LiquidProgress
                value={progress}
                label={quality === "reencode" ? "Re-encoding & merging" : "Merging clips"}
                sublabel={statusMsg}
              />
              <Progress value={progress} className="h-2" />
              <p className="text-center text-xs text-muted-foreground">{progress}% — {statusMsg}</p>
            </div>
          )}

          {error && stage !== "processing" && (
            <div className="space-y-2 rounded-2xl border border-destructive/40 p-3 bg-destructive/5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                <span className="truncate">Compile failed</span>
              </div>
              <p className="text-xs text-destructive break-words">{error}</p>
            </div>
          )}

          {stage === "done" && outputUrl && (
            <div className="space-y-3 animate-float-up">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 text-sm">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <span className="font-medium">Compile complete — preview & download below.</span>
              </div>
              <div className="rounded-2xl overflow-hidden bg-black aspect-video">
                <video key={outputUrl} src={outputUrl} controls className="w-full h-full" />
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            {stage === "processing" ? (
              <Button onClick={cancel} variant="destructive" size="lg" className="h-12">
                <X className="w-5 h-5 mr-2" /> Cancel ({progress}%)
              </Button>
            ) : stage === "done" ? (
              <Button
                onClick={downloadOutput}
                size="lg"
                className="bg-gradient-primary hover:opacity-90 shadow-elegant h-12"
              >
                <Download className="w-5 h-5 mr-2" />
                Download compiled video
              </Button>
            ) : (
              <Button
                onClick={compile}
                size="lg"
                disabled={items.length < 2}
                className="bg-gradient-primary hover:opacity-90 shadow-elegant h-12"
              >
                {error ? <Loader2 className="w-5 h-5 mr-2" /> : <Layers className="w-5 h-5 mr-2" />}
                {error ? "Retry compile" : `Compile ${items.length} video${items.length === 1 ? "" : "s"}`}
              </Button>
            )}
            <Button onClick={reset} variant="outline" size="lg" className="h-12" disabled={stage === "processing"}>
              Start over
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <AlertCircle className="w-3 h-3" />
        <span>All processing happens locally in your browser — nothing is uploaded.</span>
      </div>
    </div>
  );
}
