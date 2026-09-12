import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  Image as ImageIcon,
  Film,
  Video,
  X,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Play,
  Pause,
} from "lucide-react";
import { toast } from "sonner";
import {
  validateMediaFile,
  ACCEPTED_FILE_TYPES,
  type MemeItem,
  type MemeType,
} from "@/lib/memeStudio/types";

interface MemeUploadTabProps {
  filter?: MemeType | "all";
  onInsertMedia: (item: MemeItem) => void;
  replaceTargetId?: string | null;
}

export const MemeUploadTab: React.FC<MemeUploadTabProps> = ({
  filter = "all",
  onInsertMedia,
  replaceTargetId,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<MemeType>("image");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mediaTitle, setMediaTitle] = useState("");
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAbortRef = useRef<boolean>(false);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const resetUploadState = useCallback(() => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(null);
    setUploadError(null);
    setMediaTitle("");
    setAspectRatio(undefined);
    uploadAbortRef.current = false;
  }, [previewUrl]);

  const handleProcessFile = useCallback((file: File) => {
    setUploadError(null);

    const validation = validateMediaFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || "File validation failed.");
      toast.error(validation.error || "File validation failed.");
      return;
    }

    const type = validation.mediaType || "image";
    setDetectedType(type);
    setSelectedFile(file);
    setMediaTitle(file.name.replace(/\.[^/.]+$/, ""));

    // Simulate reliable upload progress with cancellation support
    setUploadProgress(10);
    uploadAbortRef.current = false;

    let current = 10;
    const interval = setInterval(() => {
      if (uploadAbortRef.current) {
        clearInterval(interval);
        setUploadProgress(null);
        return;
      }

      current += Math.floor(Math.random() * 25) + 15;
      if (current >= 100) {
        clearInterval(interval);
        setUploadProgress(100);

        // Create fast local object URL for preview and insertion
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // Detect aspect ratio for layout optimization
        if (type === "video") {
          const v = document.createElement("video");
          v.preload = "metadata";
          v.onloadedmetadata = () => {
            if (v.videoWidth && v.videoHeight) {
              setAspectRatio(v.videoWidth / v.videoHeight);
            }
          };
          v.src = objectUrl;
        } else {
          const img = new Image();
          img.onload = () => {
            if (img.naturalWidth && img.naturalHeight) {
              setAspectRatio(img.naturalWidth / img.naturalHeight);
            }
          };
          img.src = objectUrl;
        }

        setTimeout(() => setUploadProgress(null), 300);
      } else {
        setUploadProgress(current);
      }
    }, 60);
  }, []);

  const handleCancelUpload = () => {
    uploadAbortRef.current = true;
    resetUploadState();
    toast.info("Upload cancelled");
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleConfirmInsert = () => {
    if (!previewUrl) return;

    const memeItem: MemeItem = {
      id: `uploaded-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: mediaTitle.trim() || "Uploaded Media",
      url: previewUrl,
      type: detectedType,
      aspectRatio,
      createdAt: Date.now(),
    };

    onInsertMedia(memeItem);
    resetUploadState();
  };

  const toggleVideoPlay = () => {
    const video = videoPreviewRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsVideoPlaying(true);
    } else {
      video.pause();
      setIsVideoPlaying(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-3 space-y-4">
      {/* 1. Header description */}
      <div className="flex items-center justify-between text-xs text-[#666] dark:text-[#A1A8B5]">
        <span>
          Upload {filter !== "all" ? `${filter}s` : "images, GIFs, memes or videos"} to insert
        </span>
        {replaceTargetId && (
          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-md font-bold text-[10px]">
            Replacing media
          </span>
        )}
      </div>

      {/* 2. Upload Drag & Drop Area (when no file is loaded) */}
      {!previewUrl && uploadProgress === null && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition duration-200 cursor-pointer text-center select-none ${
            dragOver
              ? "border-[#FF6B2C] bg-[#FF6B2C]/10 scale-[1.01]"
              : "border-[#E8E4DE] dark:border-[#2C313C] hover:border-[#FF6B2C]/60 bg-[#FAFAF8] dark:bg-[#1A1D24]/60 hover:bg-[#F2EFE9] dark:hover:bg-[#1A1D24]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            className="hidden"
            onChange={handleFileInputChange}
          />

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF6B2C]/10 text-[#FF6B2C] mb-3 shadow-inner">
            <Upload className="h-6 w-6" strokeWidth={2.2} />
          </div>

          <p className="text-[13.5px] font-bold text-[#1A1A1A] dark:text-white mb-1">
            Drag & drop your file here, or <span className="text-[#FF6B2C]">browse</span>
          </p>

          <p className="text-[11px] text-[#888] dark:text-[#7E8695] max-w-[260px] leading-relaxed">
            Supports PNG, JPG, WEBP, animated GIF, and MP4/WebM videos
          </p>

          <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-[#999] dark:text-[#6E7684]">
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> Image / GIF ≤ 10MB
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Video className="h-3 w-3" /> Video ≤ 25MB
            </span>
          </div>
        </div>
      )}

      {/* 3. Upload Progress State */}
      {uploadProgress !== null && (
        <div className="p-6 rounded-2xl border border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#1A1D24] shadow-sm flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-4 w-4 text-[#FF6B2C] animate-spin" />
              <span className="text-xs font-bold text-[#1A1A1A] dark:text-white truncate max-w-[200px]">
                {selectedFile?.name || "Processing media..."}
              </span>
            </div>
            <span className="text-xs font-bold text-[#FF6B2C]">{uploadProgress}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-[#E8E4DE] dark:bg-[#2C313C] overflow-hidden">
            <div
              className="h-full bg-[#FF6B2C] transition-all duration-150 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCancelUpload}
              className="text-xs font-bold text-red-500 hover:text-red-600 cursor-pointer pt-1 transition"
            >
              Cancel upload
            </button>
          </div>
        </div>
      )}

      {/* 4. Upload Error State */}
      {uploadError && (
        <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-2.5 text-red-600 dark:text-red-400 text-xs">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <p className="font-bold">Upload Failed</p>
            <p className="text-[11.5px] opacity-90">{uploadError}</p>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-400 hover:text-red-600 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 5. Pre-insertion Preview Card */}
      {previewUrl && (
        <div className="flex flex-col p-4 rounded-2xl border border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#15181E] shadow-lg space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#FF6B2C]/10 text-[#FF6B2C] border border-[#FF6B2C]/20 tracking-wider">
                {detectedType}
              </span>
              <span className="text-xs font-bold text-[#888] dark:text-[#7E8695]">
                {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : "Ready"}
              </span>
            </div>

            <button
              type="button"
              onClick={resetUploadState}
              className="p-1 rounded-md text-[#888] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#2C313C] transition cursor-pointer"
              title="Discard and pick another file"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Media Player / Image Canvas Preview */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/5 dark:bg-black/40 border border-[#E8E4DE] dark:border-[#2C313C] flex items-center justify-center">
            {detectedType === "video" ? (
              <>
                <video
                  ref={videoPreviewRef}
                  src={previewUrl}
                  playsInline
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={toggleVideoPlay}
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition cursor-pointer"
                >
                  {isVideoPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </button>
              </>
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Title Editor */}
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] font-bold text-[#666] dark:text-[#A1A8B5]">
              Media title
            </label>
            <input
              type="text"
              value={mediaTitle}
              onChange={(e) => setMediaTitle(e.target.value)}
              placeholder="e.g. Surprised Reaction"
              className="w-full rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-[#FAFAF8] dark:bg-[#1A1D24] px-3 py-1.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:border-[#FF6B2C] transition"
            />
          </div>

          {/* Action Buttons: Cancel and Insert */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={resetUploadState}
              className="flex-1 py-2 px-3 rounded-xl border border-[#E8E4DE] dark:border-[#2C313C] text-xs font-bold text-[#666] dark:text-[#A1A8B5] hover:bg-[#F2EFE9] dark:hover:bg-[#2C313C] hover:text-[#1A1A1A] dark:hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmInsert}
              className="flex-1 py-2 px-3 rounded-xl bg-[#FF6B2C] hover:bg-[#FF874D] text-white text-xs font-bold shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span>{replaceTargetId ? "Replace Media" : "Insert Media"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
