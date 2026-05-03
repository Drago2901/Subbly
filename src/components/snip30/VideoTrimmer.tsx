import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFile } from "@ffmpeg/util";
import JSZip from "jszip";
import { Upload, Film, Scissors, Download, Loader2, X, CheckCircle2, AlertCircle, Play, Pause, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getFFmpeg, resetFFmpeg } from "@/lib/ffmpeg-loader";
import { checkRuntimeEnv } from "@/lib/env-check";
import { toast } from "sonner";
import { LiquidProgress } from "@/components/LiquidProgress";

const MAX_DURATION = 30;
const MAX_SIZE = 500 * 1024 * 1024; // 500MB
const ACCEPTED = ["video/mp4", "video/quicktime", "video/x-msvideo"];
const ACCEPTED_EXT = [".mp4", ".mov", ".avi"];

type Stage = "idle" | "ready" | "processing" | "done";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
function formatSize(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

type Clip = { name: string; url: string; blob: Blob; start: number; duration: number };

function ClipThumb({
  clip,
  index,
  active,
  onSelect,
  onDownload,
  onRename,
}: {
  clip: Clip;
  index: number;
  active: boolean;
  onSelect: () => void;
  onDownload: () => void;
  onRename: (newName: string) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(clip.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(clip.name);
  }, [clip.name, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      // select stem (filename without .mp4)
      const dot = inputRef.current.value.lastIndexOf(".");
      inputRef.current.setSelectionRange(0, dot > 0 ? dot : inputRef.current.value.length);
    }
  }, [editing]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const handleMouseEnter = () => {
    const v = ref.current;
    if (!v || playing) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  };
  const handleMouseLeave = () => {
    const v = ref.current;
    if (!v || playing) return;
    v.pause();
    v.currentTime = 0;
  };

  const commit = () => {
    onRename(draft);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(clip.name);
    setEditing(false);
  };

  return (
    <div
      className={`group rounded-xl overflow-hidden bg-card border-2 transition-smooth ${
        active
          ? "border-primary shadow-elegant ring-2 ring-primary/30"
          : "border-border hover:border-primary/50"
      }`}
    >
      <div
        className="relative bg-black aspect-video"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <video
          ref={ref}
          src={clip.url}
          preload="metadata"
          muted
          playsInline
          loop
          onEnded={() => setPlaying(false)}
          onPause={() => setPlaying(false)}
          className="w-full h-full object-cover"
        />

        <button
          type="button"
          onClick={onSelect}
          className="absolute inset-0 w-full h-full"
          aria-label={`Select part ${index + 1} as main preview`}
        />

        <button
          type="button"
          onClick={togglePlay}
          className="absolute top-1.5 left-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 backdrop-blur-sm transition-smooth opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label={playing ? "Pause preview" : "Play preview"}
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-primary text-white rounded-full p-1.5 backdrop-blur-sm transition-smooth opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label={`Download part ${index + 1}`}
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pointer-events-none">
          <div className="flex items-center justify-between text-[11px] text-white">
            <span className="font-semibold">Part {index + 1}</span>
            <span className="opacity-80">{clip.duration.toFixed(1)}s</span>
          </div>
          <div className="text-[10px] text-white/70">
            {formatTime(clip.start)} → {formatTime(clip.start + clip.duration)}
          </div>
        </div>

        {active && (
          <div className="absolute bottom-1.5 right-1.5 bg-primary text-primary-foreground rounded-full p-0.5 shadow pointer-events-none">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Filename editor */}
      <div className="p-2 bg-card">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); commit(); }
                if (e.key === "Escape") { e.preventDefault(); cancel(); }
              }}
              onBlur={commit}
              className="flex-1 min-w-0 text-xs px-2 py-1 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label={`Filename for part ${index + 1}`}
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={commit}
              className="shrink-0 p-1 rounded-md text-primary hover:bg-primary/10"
              aria-label="Save filename"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full flex items-center gap-1.5 text-xs text-left text-muted-foreground hover:text-foreground transition-smooth group/name px-1 py-0.5"
            aria-label={`Edit filename for part ${index + 1}`}
            title="Click to rename"
          >
            <span className="truncate flex-1 font-mono">{clip.name}</span>
            <Pencil className="w-3 h-3 opacity-0 group-hover/name:opacity-100 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}

export function VideoTrimmer() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [outputUrl, setOutputUrl] = useState<string>("");
  const [zipping, setZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0); // 0-100
  const [zipError, setZipError] = useState<string | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClip, setSelectedClip] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [quality, setQuality] = useState<"fast" | "reencode">(() => {
    if (typeof window === "undefined") return "fast";
    const saved = window.localStorage.getItem("vt:quality");
    return saved === "reencode" || saved === "fast" ? saved : "fast";
  });
  const [clipDuration, setClipDuration] = useState<number>(MAX_DURATION);

  // Persist quality preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem("vt:quality", quality); } catch {}
  }, [quality]);

  // Cancellation flag for in-flight ZIP build
  const cancelRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
    };
  }, [videoUrl, outputUrl]);

  const validateFile = (f: File): string | null => {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED.includes(f.type) && !ACCEPTED_EXT.includes(ext)) {
      return "Unsupported format. Use MP4, MOV, or AVI.";
    }
    if (f.size > MAX_SIZE) return "File too large. Max 500MB.";
    return null;
  };

  const handleFile = useCallback((f: File) => {
    const err = validateFile(f);
    if (err) {
      toast.error(err);
      return;
    }
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    clips.forEach((c) => URL.revokeObjectURL(c.url));
    setClips([]);
    setSelectedClip(0);
    setOutputUrl("");
    setZipping(false);
    setStartTime(0);
    setProgress(0);
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setStage("ready");
  }, [videoUrl, outputUrl, clips]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const onLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const reset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    clips.forEach((c) => URL.revokeObjectURL(c.url));
    setClips([]);
    setSelectedClip(0);
    setFile(null);
    setVideoUrl("");
    setOutputUrl("");
    setZipping(false);
    setDuration(0);
    setStartTime(0);
    setProgress(0);
    setStage("idle");
  };

  const maxStart = Math.max(0, duration - 0.1);
  const segLen = Math.max(1, clipDuration);
  const trimDuration = Math.min(segLen, duration - startTime);
  const totalSegments = duration > 0 ? Math.ceil(duration / segLen) : 0;

  // FFmpeg codec args based on quality mode.
  // - fast: stream copy (no re-encode) — instant, but cuts on nearest keyframe.
  // - reencode: H.264 + AAC — frame-accurate cuts, slower, larger CPU cost.
  const codecArgsFor = (mode: "fast" | "reencode"): string[] =>
    mode === "fast"
      ? ["-c", "copy", "-avoid_negative_ts", "make_zero"]
      : [
          "-c:v", "libx264",
          "-preset", "veryfast",
          "-crf", "23",
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
        ];

  const trim = async () => {
    if (!file) return;
    const envIssue = checkRuntimeEnv();
    if (envIssue) {
      toast.error(envIssue.message, { duration: 12000 });
      setStatusMsg(envIssue.message);
      return;
    }
    setStage("processing");
    setProgress(2);
    setStatusMsg("Loading FFmpeg engine...");

    try {
      const ffmpeg = await getFFmpeg(setStatusMsg);
      setProgress(10);
      setStatusMsg("Loading video...");

      const inputName = "input." + (file.name.split(".").pop() || "mp4");
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const baseName = file.name.replace(/\.[^.]+$/, "");
      const segments: { name: string; blob: Blob; start: number; duration: number }[] = [];

      // Always split with fast/stream-copy. Quality mode is applied at ZIP time.
      const splitArgs = codecArgsFor("fast");

      // Single-segment path: video shorter than the chosen clip length
      if (duration <= segLen) {
        setProgress(30);
        setStatusMsg("Trimming your video...");
        await ffmpeg.exec([
          "-i", inputName,
          ...splitArgs,
          "output_0.mp4",
        ]);
        const data = await ffmpeg.readFile("output_0.mp4");
        const bytes = data as Uint8Array;
        const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
        const blob = new Blob([buf], { type: "video/mp4" });
        const name = `${baseName}-part-01.mp4`;
        segments.push({ name, blob, start: 0, duration });
        try { await ffmpeg.deleteFile("output_0.mp4"); } catch {}
        setProgress(95);
      } else {
        const count = Math.ceil(duration / segLen);
        for (let i = 0; i < count; i++) {
          const segStart = i * segLen;
          const segDur = Math.min(segLen, duration - segStart);
          setStatusMsg(`Trimming part ${i + 1} of ${count}...`);
          const outName = `output_${i}.mp4`;
          await ffmpeg.exec([
            "-ss", segStart.toString(),
            "-i", inputName,
            "-t", segDur.toString(),
            ...splitArgs,
            outName,
          ]);
          const data = await ffmpeg.readFile(outName);
          const bytes = data as Uint8Array;
          const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
          const blob = new Blob([buf], { type: "video/mp4" });
          const partName = `${baseName}-part-${String(i + 1).padStart(2, "0")}.mp4`;
          segments.push({ name: partName, blob, start: segStart, duration: segDur });
          try { await ffmpeg.deleteFile(outName); } catch {}
          setProgress(10 + Math.floor(((i + 1) / count) * 85));
        }
      }

      // Build clip URLs for the selector (ZIP is built on demand at download time)
      clips.forEach((c) => URL.revokeObjectURL(c.url));
      const builtClips: Clip[] = segments.map((s) => ({
        name: s.name,
        url: URL.createObjectURL(s.blob),
        blob: s.blob,
        start: s.start,
        duration: s.duration,
      }));
      setClips(builtClips);
      setSelectedClip(0);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      setOutputUrl(builtClips[0].url);
      setProgress(100);
      setStatusMsg(`Done! ${segments.length} clip${segments.length > 1 ? "s" : ""} ready.`);
      setStage("done");
      toast.success(`${segments.length} clip${segments.length > 1 ? "s" : ""} ready to download!`);

      try { await ffmpeg.deleteFile(inputName); } catch {}
    } catch (e) {
      console.error(e);
      toast.error("Processing failed. Try a different file.");
      setStage("ready");
      setProgress(0);
    }
  };

  // Build a safe, unique .mp4 filename from user input
  const sanitizeName = (raw: string, fallback: string): string => {
    let name = (raw || "").trim();
    if (!name) name = fallback;
    // strip path separators and reserved chars
    name = name.replace(/[\\/:*?"<>|\x00-\x1F]/g, "_");
    if (!/\.mp4$/i.test(name)) name = name.replace(/\.[^.]+$/, "") + ".mp4";
    return name;
  };

  const renameClip = (index: number, newName: string) => {
    setClips((prev) => {
      const fallback = prev[index]?.name ?? `clip-${index + 1}.mp4`;
      const cleaned = sanitizeName(newName, fallback);
      // ensure uniqueness across clips
      const taken = new Set(prev.map((c, i) => (i === index ? null : c.name)).filter(Boolean) as string[]);
      let final = cleaned;
      if (taken.has(final)) {
        const stem = final.replace(/\.mp4$/i, "");
        let n = 2;
        while (taken.has(`${stem}-${n}.mp4`)) n++;
        final = `${stem}-${n}.mp4`;
      }
      return prev.map((c, i) => (i === index ? { ...c, name: final } : c));
    });
  };

  const cancelZip = () => {
    if (!zipping) return;
    cancelRef.current = true;
    setStatusMsg("Cancelling…");
  };

  const downloadZip = async () => {
    if (!file || clips.length === 0 || zipping) return;
    cancelRef.current = false;
    setZipError(null);
    setZipProgress(0);
    setZipping(true);

    const checkCancel = () => {
      if (cancelRef.current) throw new Error("__cancelled__");
    };

    try {
      const zip = new JSZip();
      const seen = new Map<string, number>();
      const total = clips.length;

      // Re-encoding phase takes 0-85%, zipping 85-100%. Fast mode: zipping uses 0-100%.
      const reencodeShare = quality === "reencode" ? 85 : 0;

      // If user picked "reencode", re-encode each clip on demand before zipping.
      let processed: { name: string; blob: Blob }[] = clips.map((c) => ({ name: c.name, blob: c.blob }));
      if (quality === "reencode") {
        const ffmpeg = await getFFmpeg(setStatusMsg);
        const reArgs = codecArgsFor("reencode");
        processed = [];
        for (let i = 0; i < total; i++) {
          checkCancel();
          const c = clips[i];
          setStatusMsg(`Re-encoding part ${i + 1} of ${total} — ${c.name}`);
          const inName = `zin_${i}.mp4`;
          const outName = `zout_${i}.mp4`;

          // Pre-clean any leftovers from a prior cancelled run
          try { await ffmpeg.deleteFile(inName); } catch {}
          try { await ffmpeg.deleteFile(outName); } catch {}

          await ffmpeg.writeFile(inName, await fetchFile(c.blob));
          checkCancel();

          // Re-encode with explicit MP4 demuxer + regenerated PTS so stream-copied
          // inputs (which often have broken/sparse timestamps) don't stall the encoder.
          // Wrap in a timeout so a stuck exec surfaces as an error instead of hanging forever.
          const execArgs = [
            "-fflags", "+genpts",
            "-f", "mp4",
            "-i", inName,
            "-an", "-sn",                       // ignore subs; re-add audio below
            "-map", "0:v:0",
            "-map", "0:a:0?",
            ...reArgs,
            "-y",
            outName,
          ];
          const TIMEOUT_MS = 120_000; // 2 min per clip ceiling
          let timer: ReturnType<typeof setTimeout> | undefined;
          try {
            await Promise.race([
              ffmpeg.exec(execArgs),
              new Promise<never>((_, reject) => {
                timer = setTimeout(() => {
                  // Best-effort interrupt; ignore if unavailable
                  try { (ffmpeg as unknown as { terminate?: () => void }).terminate?.(); } catch {}
                  reject(new Error(`Re-encoding part ${i + 1} timed out after ${TIMEOUT_MS / 1000}s`));
                }, TIMEOUT_MS);
              }),
            ]);
          } finally {
            if (timer) clearTimeout(timer);
          }
          checkCancel();

          const data = await ffmpeg.readFile(outName);
          const bytes = data as Uint8Array;
          if (!bytes || bytes.byteLength === 0) {
            throw new Error(`Re-encoded part ${i + 1} produced an empty file`);
          }
          const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
          processed.push({ name: c.name, blob: new Blob([buf], { type: "video/mp4" }) });
          try { await ffmpeg.deleteFile(inName); } catch {}
          try { await ffmpeg.deleteFile(outName); } catch {}
          setZipProgress(Math.floor(((i + 1) / total) * reencodeShare));
        }
      }

      checkCancel();
      // Add files to ZIP with per-part status
      for (let i = 0; i < processed.length; i++) {
        checkCancel();
        const c = processed[i];
        let name = c.name;
        const count = seen.get(name) ?? 0;
        if (count > 0) {
          const stem = name.replace(/\.mp4$/i, "");
          name = `${stem}-${count + 1}.mp4`;
        }
        seen.set(c.name, count + 1);
        setStatusMsg(`Adding to ZIP (${i + 1}/${processed.length}) — ${name}`);
        zip.file(name, c.blob);
      }

      checkCancel();
      setStatusMsg("Compressing ZIP archive…");
      const zipped = await zip.generateAsync({ type: "blob" }, (meta) => {
        // meta.percent is 0-100 over the compression step
        const compShare = 100 - reencodeShare;
        setZipProgress(reencodeShare + Math.floor((meta.percent / 100) * compShare));
      });
      checkCancel();

      const url = URL.createObjectURL(zipped);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.name.replace(/\.[^.]+$/, "")}-trimmed.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setZipProgress(100);
      setStatusMsg("ZIP ready — download started.");
      toast.success("ZIP downloaded");
    } catch (e) {
      const cancelled = e instanceof Error && e.message === "__cancelled__";
      if (cancelled) {
        setStatusMsg("ZIP build cancelled.");
        setZipError(null);
        toast.message("ZIP build cancelled");
        // We may have terminated ffmpeg; reset so the next run reloads cleanly.
        if (quality === "reencode") resetFFmpeg();
      } else {
        console.error(e);
        const msg = e instanceof Error ? e.message : "Unknown error";
        setZipError(msg);
        setStatusMsg("ZIP build failed.");
        toast.error("Failed to build ZIP. You can retry.");
        // Re-encode failures often leave the WASM instance in a bad state — force reload on retry.
        if (quality === "reencode") resetFFmpeg();
      }
    } finally {
      cancelRef.current = false;
      setZipping(false);
    }
  };

  const downloadClip = (clip: Clip) => {
    const a = document.createElement("a");
    a.href = clip.url;
    a.download = clip.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {stage === "idle" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-12 md:p-20 text-center transition-smooth bg-card shadow-soft ${
            dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 shadow-elegant">
            <Upload className="w-10 h-10 text-primary-foreground" />
          </div>
          <h3 className="text-2xl font-semibold mb-2">Drop your video here</h3>
          <p className="text-muted-foreground mb-4">or click to browse from your device</p>
          <p className="text-xs text-muted-foreground">MP4, MOV, AVI · up to 500MB</p>
        </div>
      )}

      {stage !== "idle" && file && (
        <div className="rounded-3xl bg-card shadow-soft p-6 md:p-8 space-y-6 animate-float-up">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                <Film className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatSize(file.size)} · {formatTime(duration)}
                </p>
              </div>
            </div>
            {stage !== "processing" && (
              <Button variant="ghost" size="icon" onClick={reset} aria-label="Remove">
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          <div className="rounded-2xl overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              onLoadedMetadata={onLoadedMetadata}
              className="w-full h-full"
            />
          </div>

          {stage === "ready" && duration > 0 && (
            <div className="space-y-5">
              {/* Clip-duration selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Clip length</label>
                <div className="flex flex-wrap gap-2">
                  {[10, 15, 30, 60].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setClipDuration(s)}
                      className={`px-3 h-9 rounded-lg text-sm border transition-smooth ${
                        clipDuration === s
                          ? "bg-primary text-primary-foreground border-primary shadow-elegant"
                          : "bg-card border-border hover:border-primary/50"
                      }`}
                    >
                      {s}s
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-xs text-muted-foreground">Custom</span>
                    <Input
                      type="number"
                      min={1}
                      max={600}
                      step={1}
                      value={clipDuration}
                      onChange={(e) => {
                        const v = Math.max(1, Math.min(600, parseInt(e.target.value) || 1));
                        setClipDuration(v);
                      }}
                      className="w-20 h-9"
                      aria-label="Custom clip length in seconds"
                    />
                    <span className="text-xs text-muted-foreground">s</span>
                  </div>
                </div>
              </div>

              {duration <= segLen ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    Video is {formatTime(duration)} — under {segLen}s, the full clip will be kept.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 text-sm">
                  <Scissors className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    Video is {formatTime(duration)} — will be split into{" "}
                    <strong>{totalSegments}</strong> parts of up to {segLen}s and packaged in a ZIP.
                  </span>
                </div>
              )}

              <Button
                onClick={trim}
                size="lg"
                className="w-full bg-gradient-primary hover:opacity-90 transition-smooth shadow-elegant text-base h-12"
              >
                <Scissors className="w-5 h-5 mr-2" />
                {duration > segLen
                  ? `Split into ${totalSegments} clip${totalSegments === 1 ? "" : "s"}`
                  : "Trim Video"}
              </Button>
            </div>
          )}

          {stage === "processing" && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse-glow">
                  <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="font-medium">Processing your video…</p>
                <p className="text-sm text-muted-foreground">{statusMsg}</p>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-center text-xs text-muted-foreground">{progress}%</p>
            </div>
          )}

          {stage === "done" && outputUrl && clips.length > 0 && (
            <div className="space-y-4 animate-float-up">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 text-sm">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <span className="font-medium">
                  {clips.length === 1
                    ? "Trim complete! Preview below."
                    : `Trim complete! ${clips.length} clips ready — pick one to preview.`}
                </span>
              </div>
              <div className="rounded-2xl overflow-hidden bg-black aspect-video">
                <video
                  key={outputUrl}
                  src={outputUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              </div>

              {clips.length > 1 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Clips ({clips.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {clips.map((c, i) => (
                      <ClipThumb
                        key={i}
                        clip={c}
                        index={i}
                        active={i === selectedClip}
                        onSelect={() => {
                          setSelectedClip(i);
                          setOutputUrl(c.url);
                        }}
                        onDownload={() => downloadClip(c)}
                        onRename={(newName) => renameClip(i, newName)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quality mode — only relevant when building the ZIP */}
              <div className="space-y-2 rounded-2xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium">ZIP quality mode</label>
                  <span className="text-[11px] text-muted-foreground">Applied when you download the ZIP</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={zipping}
                    onClick={() => setQuality("fast")}
                    className={`text-left p-3 rounded-xl border transition-smooth disabled:opacity-50 ${
                      quality === "fast"
                        ? "border-primary bg-primary/5 shadow-elegant"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <Scissors className="w-4 h-4 text-primary" /> Fast (stream copy)
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Instant. Uses the already-trimmed clips as-is.
                    </p>
                  </button>
                  <button
                    type="button"
                    disabled={zipping}
                    onClick={() => setQuality("reencode")}
                    className={`text-left p-3 rounded-xl border transition-smooth disabled:opacity-50 ${
                      quality === "reencode"
                        ? "border-primary bg-primary/5 shadow-elegant"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <Film className="w-4 h-4 text-primary" /> Re-encode (precise)
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Re-encodes each clip to H.264/AAC. Slower, cleaner.
                    </p>
                  </button>
                </div>
              </div>

              {/* ZIP progress — liquid-fill with bursting bubbles */}
              {zipping && (
                <LiquidProgress
                  value={zipProgress}
                  label={quality === "reencode" ? "Re-encoding & packaging" : "Packaging ZIP"}
                  sublabel={statusMsg}
                />
              )}
              {zipError && !zipping && (
                <div className="space-y-2 rounded-2xl border border-destructive/40 p-3 bg-destructive/5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                    <span className="truncate">ZIP build failed</span>
                  </div>
                  <p className="text-xs text-destructive break-words">{zipError}</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                {zipping ? (
                  <Button
                    onClick={cancelZip}
                    variant="destructive"
                    size="lg"
                    className="h-12"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Cancel ({zipProgress}%)
                  </Button>
                ) : (
                  <Button
                    onClick={downloadZip}
                    size="lg"
                    className="bg-gradient-primary hover:opacity-90 shadow-elegant h-12"
                  >
                    {zipError ? (
                      <Loader2 className="w-5 h-5 mr-2" />
                    ) : (
                      <Download className="w-5 h-5 mr-2" />
                    )}
                    {zipError
                      ? "Retry ZIP"
                      : `Download ZIP (${clips.length} ${clips.length === 1 ? "clip" : "clips"})`}
                  </Button>
                )}
                <Button onClick={reset} variant="outline" size="lg" className="h-12" disabled={zipping}>
                  Trim Another
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <AlertCircle className="w-3 h-3" />
        <span>Files are processed locally in your browser — nothing is uploaded.</span>
      </div>
    </div>
  );
}
