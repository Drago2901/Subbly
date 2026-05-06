import { useCallback, useState } from "react";
import { UploadCloud, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onFile: (file: File) => void;
};

export function VideoDropzone({ onFile }: Props) {
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
          "relative flex w-full cursor-pointer flex-col items-center gap-4 overflow-hidden rounded-2xl border-[1.5px] border-dashed bg-white px-10 py-[52px] text-center transition-all",
          drag
            ? "border-[#ff5c3a] bg-[#fff5f3] shadow-[0_0_0_4px_rgba(255,92,58,0.1)]"
            : "border-[#d8d3cc] hover:border-[#ff5c3a] hover:bg-[#fffaf9] hover:shadow-[0_0_0_4px_rgba(255,92,58,0.06)]",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,92,58,0.04) 0%, transparent 70%)",
          }}
        />
        <input
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div
          className="flex h-14 w-14 items-center justify-center rounded-[14px] shadow-[0_4px_16px_rgba(255,92,58,0.3)]"
          style={{ background: "linear-gradient(145deg, #ff6a46, #ff5c3a)" }}
        >
          <UploadCloud className="h-6 w-6 text-white" strokeWidth={2} />
        </div>
        <div>
          <strong className="block text-[15px] font-medium text-[#1a1a1a]">
            Drop a video to caption
          </strong>
          <span className="mt-1 block text-[13px] leading-relaxed text-[#aaa]">
            MP4, MOV, WebM. We'll auto-transcribe with AI and let you
            <br className="hidden sm:inline" /> edit, style, and burn captions right in your browser.
          </span>
        </div>
        <div className="flex w-full max-w-[240px] items-center gap-3">
          <div className="h-px flex-1 bg-[#eeeae4]" />
          <span className="text-[11px] tracking-wider text-[#ccc]">OR</span>
          <div className="h-px flex-1 bg-[#eeeae4]" />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#e8e4de] bg-[#f9f8f5] px-[18px] py-2 text-[12.5px] text-[#888] transition hover:border-[#d0cbc4] hover:bg-white hover:text-[#555]">
          <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.8} />
          Click or drag &amp; drop · up to ~50MB recommended
        </span>
      </label>

      <div className="flex flex-wrap justify-center gap-1.5">
        {["MP4", "MOV", "WebM", "MKV", "AVI", "Up to 2GB"].map((t) => (
          <span
            key={t}
            className="rounded-[5px] border border-[#e8e4de] bg-[#f5f3ee] px-2.5 py-[3px] text-[11px] tracking-wide text-[#bbb]"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
