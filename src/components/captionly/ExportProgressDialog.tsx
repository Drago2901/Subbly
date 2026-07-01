import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getSupportedMimeType } from "@/lib/captions/render";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const willTranscode = format === "mp4" && !getSupportedMimeType().includes("video/mp4");
  // Overall progress weighting: render = 60%, transcode = 40% when both run
  const overall = willTranscode
    ? stage === "render"
      ? progress * 0.6
      : 0.6 + progress * 0.4
    : progress;

  const elapsedSec = (now - startRef.current) / 1000;
  const eta =
    overall > 0.02 && overall < 0.99
      ? Math.max(0, (elapsedSec / overall) * (1 - overall))
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
              <span className="font-medium">Overall Progress</span>
              <span className="font-mono text-muted-foreground">
                {Math.round(overall * 100)}%
              </span>
            </div>
            <Progress value={overall * 100} className="h-2" />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Elapsed {formatTime(elapsedSec)}</span>
              {eta !== null && <span>ETA {formatTime(eta)}</span>}
            </div>
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

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "—";
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}
