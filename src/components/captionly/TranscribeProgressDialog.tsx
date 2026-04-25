import { Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { ChunkProgress } from "@/lib/captions/transcribeChunked";

type Props = {
  open: boolean;
  progress: ChunkProgress | null;
  onCancel: () => void;
};

export function TranscribeProgressDialog({ open, progress, onCancel }: Props) {
  const stage = progress?.stage ?? "splitting";
  const stageLabel =
    stage === "splitting"
      ? "Splitting video"
      : stage === "transcribing"
        ? "Transcribing chunks"
        : "Merging captions";

  const pct =
    stage === "splitting" && progress
      ? progress.splitTotal === 0
        ? 0
        : progress.splitDone / progress.splitTotal
      : stage === "transcribing" && progress
        ? progress.chunksTotal === 0
          ? 0
          : progress.chunksDone / progress.chunksTotal
        : stage === "merging"
          ? 1
          : 0;

  const detail =
    stage === "splitting" && progress
      ? `Preparing chunk ${Math.min(progress.splitDone + 1, progress.splitTotal)} of ${progress.splitTotal}`
      : stage === "transcribing" && progress
        ? `Processing ${progress.chunksDone} of ${progress.chunksTotal} chunks`
        : "Combining results…";

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {stageLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Progress value={pct * 100} />
          <p className="text-sm text-muted-foreground">{detail}</p>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="mr-1.5 h-4 w-4" /> Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
