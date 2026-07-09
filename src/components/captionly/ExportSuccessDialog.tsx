import { X, Check, Download, RefreshCw, FolderOpen, Link2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  onExportAnother: () => void;
  fileName: string;
  fileSize: number;
  duration: number;
  encodingTime: number;
  resolution: string;
  videoUrl: string;
};

export function ExportSuccessDialog({
  open,
  onClose,
  onExportAnother,
  fileName,
  fileSize,
  duration,
  encodingTime,
  resolution,
  videoUrl,
}: Props) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("Downloading video...");
  };

  const handleOpenFolder = () => {
    toast.info("Browser security prevents opening system folders directly. Check your default Downloads folder.");
    handleDownload();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Download link copied to clipboard!");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[620px] w-[95vw] bg-[#0e1017] border border-[#1f222e] rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.5)] p-6 text-white select-none [&>button]:hidden">
        <DialogHeader className="relative flex flex-col items-center text-center">
          {/* Custom Styled Close Button */}
          <button
            onClick={onClose}
            className="absolute right-0 top-0 text-neutral-400 hover:text-neutral-200 transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center bg-transparent border-none outline-none"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="relative flex items-center justify-center mb-4 mt-2">
            {/* Sparkles decoration from mockup */}
            <div className="absolute w-48 h-24 pointer-events-none">
              {/* Green sparkles */}
              <div className="absolute top-2 left-6 w-1.5 h-1.5 rounded-full bg-green-500/80" />
              <div className="absolute top-10 left-2 w-2 h-2 bg-green-500/70 rotate-45" />
              <div className="absolute bottom-2 left-10 w-1.5 h-1.5 rounded-full bg-green-500/80" />
              
              <div className="absolute top-4 right-8 w-2 h-2 bg-green-500/70 rotate-12" />
              <div className="absolute top-14 right-2 w-1.5 h-1.5 rounded-full bg-green-500/80" />
              
              {/* Yellow sparkles */}
              <div className="absolute top-8 left-14 w-2.5 h-2.5 bg-yellow-500/70 -rotate-12" />
              <div className="absolute bottom-6 right-12 w-2.5 h-2.5 bg-yellow-500/60 rotate-45" />
              <div className="absolute top-2 right-14 w-1.5 h-1.5 rounded-full bg-yellow-500/80" />
              
              {/* Grey sparkles */}
              <div className="absolute bottom-4 left-18 w-1 h-1 rounded-full bg-neutral-600" />
              <div className="absolute top-16 right-10 w-1 h-1 bg-neutral-600" />
            </div>

            {/* Check Circle */}
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]">
              <Check className="h-8 w-8" strokeWidth={3} />
            </div>
          </div>
          
          <h2 className="text-[19px] font-bold tracking-tight text-white">
            Export <span className="text-green-500">Complete!</span>
          </h2>
          <p className="text-[12.5px] text-neutral-400 max-w-[280px] leading-relaxed mt-1">
            Your video has been exported successfully and is ready to download.
          </p>
        </DialogHeader>

        {/* Details Card */}
        <div className="my-5 bg-[#13151c] border border-[#1f222e] rounded-xl p-4.5 flex gap-4 items-center">
          {/* File Document Icon (Left side of card) */}
          <div className="relative w-12 h-15 bg-[#1d1f27] border border-[#2d303f] rounded-lg flex-shrink-0 flex items-center justify-center shadow-md">
            {/* Document folded corner */}
            <div className="absolute top-0 right-0 w-3 h-3 bg-[#2d303f] rounded-bl-md rounded-tr-lg" />
            
            {/* Document lines overlay */}
            <div className="flex flex-col gap-1 w-6 opacity-30 mt-[-6px]">
              <div className="h-0.5 w-full bg-white" />
              <div className="h-0.5 w-4 bg-white" />
            </div>

            {/* MP4 tag */}
            <div className="absolute bottom-1 left-1 right-1 bg-green-500 rounded-[3px] py-0.5 text-[8.5px] font-extrabold text-black text-center uppercase tracking-wide">
              MP4
            </div>
          </div>

          {/* Details Lists (Grid Layout) */}
          <div className="flex-1 min-w-0 grid grid-cols-[1.1fr_auto_1.4fr] gap-x-4 items-stretch text-[11.5px] text-neutral-400">
            {/* Left side details */}
            <div className="flex flex-col justify-center space-y-2 min-w-0">
              <div className="font-bold text-white text-[12.5px] truncate max-w-[190px]" title={fileName}>
                {fileName}
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[13px]">📁</span>
                <span>Size: {formatBytes(fileSize)}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[13px]">⏱</span>
                <span>Duration: {formatDuration(duration)}</span>
              </div>
            </div>

            {/* Divider Line */}
            <div className="w-[1px] bg-[#1f222e] self-stretch mx-1" />

            {/* Right side details (Metrics with checkmark icon) */}
            <div className="flex flex-col justify-center space-y-2 pl-2.5 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10 text-green-500 flex-shrink-0">
                  <Check className="h-2 w-2" strokeWidth={4} />
                </div>
                <span className="truncate">Resolution: {resolution}</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10 text-green-500 flex-shrink-0">
                  <Check className="h-2 w-2" strokeWidth={4} />
                </div>
                <span className="truncate">FPS: 30</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10 text-green-500 flex-shrink-0">
                  <Check className="h-2 w-2" strokeWidth={4} />
                </div>
                <span className="truncate">Format: MP4 (H.264)</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10 text-green-500 flex-shrink-0">
                  <Check className="h-2 w-2" strokeWidth={4} />
                </div>
                <span className="truncate">Encoding: {encodingTime} sec</span>
              </div>
            </div>
          </div>
        </div>

        {/* Folder / Copy Link Actions */}
        <div className="flex items-center justify-center gap-5 mb-5 text-[12px] font-semibold text-neutral-400">
          <button
            onClick={handleOpenFolder}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1f222e] hover:bg-[#13151c] transition cursor-pointer"
          >
            <FolderOpen className="h-4 w-4 text-green-500" strokeWidth={2} />
            <span>Open Folder</span>
          </button>
          
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1f222e] hover:bg-[#13151c] transition cursor-pointer"
          >
            <Link2 className="h-4 w-4 text-green-500" strokeWidth={2} />
            <span>Copy Download Link</span>
          </button>
        </div>

        {/* Primary Buttons (stacked vertically as in mockup) */}
        <div className="space-y-2.5">
          <button
            onClick={handleDownload}
            className="w-full flex h-11 items-center justify-center gap-2 rounded-xl bg-green-500 text-xs font-bold text-black shadow-lg hover:bg-green-400 transition cursor-pointer active:scale-[0.98]"
          >
            <Download className="h-4 w-4" strokeWidth={2.5} />
            <span>Download MP4</span>
          </button>
          
          <button
            onClick={onExportAnother}
            className="w-full flex h-11 items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-transparent text-xs font-bold text-green-500 hover:bg-green-500/5 transition cursor-pointer active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={2.5} />
            <span>Export Another</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}>{children}</div>;
}
