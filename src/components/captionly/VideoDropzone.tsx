import { useCallback, useState } from "react";
import { UploadCloud, FolderOpen, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onFile: (file: File) => void;
  onDemo?: () => void;
};

export function VideoDropzone({ onFile, onDemo }: Props) {
  const [drag, setDrag] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const f = files[0];
      if (!f.type.startsWith("video/")) {
        alert("Please drop a video file.");
        return;
      }
      onFile(f);
    },
    [onFile],
  );

  return (
    <div className="flex w-full flex-col items-center gap-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative flex w-full cursor-pointer flex-col items-center gap-6 overflow-hidden rounded-2xl border-[1.5px] border-dashed px-10 py-[50px] text-center transition-all duration-300 shadow-xl",
          drag
            ? "border-[#FF6B2C] bg-[#FF6B2C]/10 shadow-[0_0_20px_rgba(255,107,44,0.15)]"
            : "border-[#E8E4DE] bg-white hover:border-[#FF6B2C] hover:bg-neutral-50/50 hover:shadow-[0_0_20px_rgba(255,107,44,0.08)] dark:border-[#2C313C] dark:bg-[#1F232D] dark:text-white dark:hover:bg-[#1F232D]/85 dark:hover:shadow-[0_0_20px_rgba(255,107,44,0.08)]",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 animate-pulse"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,107,44,0.08) 0%, transparent 70%)",
          }}
        />
        <input
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div
          className="flex h-14 w-14 items-center justify-center rounded-[14px] shadow-[0_4px_16px_rgba(255,107,44,0.3)] transition-transform duration-300 hover:scale-105"
          style={{ background: "linear-gradient(145deg, #FF874D, #FF6B2C)" }}
        >
          <UploadCloud className="h-6 w-6 text-white" strokeWidth={2} />
        </div>
        <div>
          <strong className="block text-[16px] font-bold text-[#1A1A1A] dark:text-white tracking-wide">
            Drop a video to caption
          </strong>
          <span className="mt-2 block text-[13px] leading-relaxed text-[#666] dark:text-[#A1A8B5]">
            MP4, MOV, WebM. We'll auto-transcribe with AI and let you
            <br className="hidden sm:inline" /> edit, style, and burn captions right in your browser.
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E4DE] bg-[#F9F8F5] px-4 py-2 text-[12.5px] text-[#666] transition hover:border-[#FF6B2C] hover:bg-white hover:text-[#1A1A1A] shadow-sm hover:scale-[1.02] duration-200 dark:border-[#2C313C] dark:bg-[#181B22] dark:text-[#A1A8B5] dark:hover:bg-[#1F232D] dark:hover:text-white">
            <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.8} />
            Click to browse file
          </span>

          {onDemo && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDemo();
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF6B2C] to-[#FF874D] px-5 py-2 text-[12.5px] font-bold text-white shadow-md hover:shadow-orange-500/20 hover:scale-[1.02] transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 fill-white" />
              Try Sample Demo Video
            </button>
          )}
        </div>
      </label>

      <div className="flex flex-wrap justify-center gap-2">
        {["MP4", "MOV", "WebM", "MKV", "AVI", "Up to 2GB"].map((t) => (
          <span
            key={t}
            className="rounded-lg border border-[#E8E4DE] bg-white px-3 py-1 text-[11px] font-semibold tracking-wide text-[#666] dark:border-[#2C313C] dark:bg-[#1F232D] dark:text-[#A1A8B5]"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

