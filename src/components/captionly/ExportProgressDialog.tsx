import { useEffect, useRef, useState } from "react";
import { Loader2, X, Film, Wand2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export type ExportStage = "render" | "transcode";

type Props = {
  open: boolean;
  stage: ExportStage;
  progress: number; // 0..1 for current stage
  format: "webm" | "mp4";
  onCancel: () => void;
};

export function ExportProgressDialog({ open, stage, progress, format, onCancel }: Props) {
  const startRef = useRef<number>(performance.now());
  const stageStartRef = useRef<number>(performance.now());
  const lastStageRef = useRef<ExportStage>(stage);
  const [now, setNow] = useState(performance.now());

  // Reset timers when dialog opens or stage changes
  useEffect(() => {
    if (open) {
      startRef.current = performance.now();
      stageStartRef.current = performance.now();
      lastStageRef.current = stage;
    }
  }, [open]);

  useEffect(() => {
    if (lastStageRef.current !== stage) {
      stageStartRef.current = performance.now();
      lastStageRef.current = stage;
    }
  }, [stage]);

  // Tick every 250ms for ETA refresh
  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setNow(performance.now()), 250);
    return () => window.clearInterval(id);
  }, [open]);

  const willTranscode = format === "mp4";
  // Overall progress weighting: render = 60%, transcode = 40% when both run
  const overall = willTranscode
    ? stage === "render"
      ? progress * 0.6
      : 0.6 + progress * 0.4
    : progress;

  const elapsedSec = (now - startRef.current) / 1000;
  const stageElapsed = (now - stageStartRef.current) / 1000;
  const eta =
    progress > 0.02 && progress < 0.99
      ? Math.max(0, (stageElapsed / progress) * (1 - progress))
      : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Exporting {format.toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Overall */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Overall</span>
              <span className="font-mono text-muted-foreground">
                {Math.round(overall * 100)}%
              </span>
            </div>
            <Progress value={overall * 100} className="h-2" />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Elapsed {formatTime(elapsedSec)}</span>
              {eta !== null && <span>ETA {formatTime(eta)} for this step</span>}
            </div>
          </div>

          {/* Stage list */}
          <div className="space-y-2">
            <StageRow
              icon={<Film className="h-3.5 w-3.5" />}
              label="Rendering captions onto video"
              status={
                stage === "render"
                  ? "active"
                  : willTranscode
                    ? "done"
                    : "done"
              }
              progress={stage === "render" ? progress : 1}
            />
            {willTranscode && (
              <StageRow
                icon={<Wand2 className="h-3.5 w-3.5" />}
                label="Converting to MP4 (H.264 + AAC)"
                status={stage === "transcode" ? "active" : "pending"}
                progress={stage === "transcode" ? progress : 0}
              />
            )}
          </div>

          <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-[11px] text-muted-foreground">
            Keep this tab focused — background tabs are throttled by the browser
            and exports may stall.
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            <X className="mr-1.5 h-4 w-4" /> Cancel export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StageRow({
  icon,
  label,
  status,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  status: "pending" | "active" | "done";
  progress: number;
}) {
  return (
    <div
      className={`rounded-lg border p-2.5 transition-colors ${
        status === "active"
          ? "border-primary/50 bg-primary/5"
          : status === "done"
            ? "border-border bg-surface-2"
            : "border-border bg-surface-2 opacity-60"
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="flex items-center gap-2">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded ${
              status === "done"
                ? "bg-primary/20 text-primary"
                : status === "active"
                  ? "bg-primary/20 text-primary"
                  : "bg-surface-3 text-muted-foreground"
            }`}
          >
            {status === "done" ? <CheckCircle2 className="h-3.5 w-3.5" /> : icon}
          </span>
          <span className="font-medium">{label}</span>
        </span>
        <span className="font-mono text-muted-foreground">
          {Math.round(progress * 100)}%
        </span>
      </div>
      <Progress value={progress * 100} className="h-1.5" />
    </div>
  );
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "—";
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}
