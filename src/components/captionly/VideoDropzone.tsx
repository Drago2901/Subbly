import { useCallback, useState } from "react";
import { UploadCloud, Film } from "lucide-react";
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
        "group relative flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface/40 p-12 text-center transition-all",
        "hover:border-primary/60 hover:bg-surface/70",
        drag && "border-primary bg-primary/5 shadow-glow",
      )}
    >
      <input
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
        <UploadCloud className="h-8 w-8 text-primary-foreground" />
      </div>
      <h3 className="text-xl font-semibold">Drop a video to caption</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        MP4, MOV, WebM. We'll auto-transcribe with AI and let you edit, style, and
        burn captions right in your browser.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-xs text-muted-foreground">
        <Film className="h-3.5 w-3.5" /> Click or drag &amp; drop · up to ~50MB recommended
      </div>
    </label>
  );
}
