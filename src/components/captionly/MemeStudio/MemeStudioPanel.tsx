import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  Search,
  Smile,
  Film,
  Paperclip,
  Info,
} from "lucide-react";
import { MemeUploadTab } from "./MemeUploadTab";
import { MediaBrowseTab } from "./MediaBrowseTab";
import type { MemeStudioTab, MemeType, MemeItem } from "@/lib/memeStudio/types";

interface MemeStudioPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertMedia: (item: MemeItem) => void;
  initialTab?: MemeStudioTab;
  initialFilter?: MemeType | "all";
  replaceTargetId?: string | null;
}

export const MemeStudioPanel: React.FC<MemeStudioPanelProps> = ({
  isOpen,
  onClose,
  onInsertMedia,
  initialTab = "memes",
  initialFilter = "all",
  replaceTargetId,
}) => {
  const [activeTab, setActiveTab] = useState<MemeStudioTab>(initialTab);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Handle ESC key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      {/* Dimmed backdrop for mobile or click-outside */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 pointer-events-auto md:bg-black/20"
        aria-hidden="true"
      />

      {/* Main Slide-Over Panel */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Meme Studio"
        className="relative w-full sm:w-[450px] h-full bg-[#FFFFFF] dark:bg-[#12151B] border-l border-[#E8E4DE] dark:border-[#242832] shadow-2xl flex flex-col pointer-events-auto z-50 animate-in slide-in-from-right duration-250 ease-out select-none"
      >
        {/* 1. Panel Header */}
        <div className="p-4 pb-3 border-b border-[#E8E4DE] dark:border-[#222630] flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF6B2C]/10 text-[#FF6B2C]">
                <Smile className="h-4 w-4" />
              </div>
              <h2 className="text-[16px] font-extrabold text-[#1A1A1A] dark:text-white tracking-tight">
                Meme Studio
              </h2>
              <span className="bg-[#FF6B2C] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                Beta
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#888] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1F232D] transition cursor-pointer"
              aria-label="Close Meme Studio"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-[12px] text-[#666] dark:text-[#A1A8B5] mt-0.5">
            Find the perfect meme, GIF or sticker for your content.
          </p>

          {/* 2. Navigation Tabs (Memes | GIFs | Stickers | Upload) */}
          <div className="flex items-center bg-[#F4F1EC] dark:bg-[#1A1D24] p-1 rounded-xl mt-3 border border-[#E8E4DE] dark:border-[#2C313C]">
            <button
              type="button"
              onClick={() => setActiveTab("memes")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                activeTab === "memes"
                  ? "bg-white dark:bg-[#252A34] text-[#1A1A1A] dark:text-white shadow-sm"
                  : "text-[#666] dark:text-[#A1A8B5] hover:text-[#1A1A1A] dark:hover:text-white"
              }`}
            >
              <Smile className="h-3.5 w-3.5 text-[#FF6B2C]" />
              <span>Memes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("gifs")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                activeTab === "gifs"
                  ? "bg-white dark:bg-[#252A34] text-[#1A1A1A] dark:text-white shadow-sm"
                  : "text-[#666] dark:text-[#A1A8B5] hover:text-[#1A1A1A] dark:hover:text-white"
              }`}
            >
              <Film className="h-3.5 w-3.5 text-purple-500" />
              <span>GIFs</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("stickers")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                activeTab === "stickers"
                  ? "bg-white dark:bg-[#252A34] text-[#1A1A1A] dark:text-white shadow-sm"
                  : "text-[#666] dark:text-[#A1A8B5] hover:text-[#1A1A1A] dark:hover:text-white"
              }`}
            >
              <Paperclip className="h-3.5 w-3.5 text-amber-500" />
              <span>Stickers</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                activeTab === "upload"
                  ? "bg-white dark:bg-[#252A34] text-[#1A1A1A] dark:text-white shadow-sm"
                  : "text-[#666] dark:text-[#A1A8B5] hover:text-[#1A1A1A] dark:hover:text-white"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* 3. Panel Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "memes" && (
            <MediaBrowseTab
              mediaType="meme"
              onInsertMedia={onInsertMedia}
              replaceTargetId={replaceTargetId}
              placeholderText="Search trending & classic memes..."
            />
          )}

          {activeTab === "gifs" && (
            <MediaBrowseTab
              mediaType="gif"
              onInsertMedia={onInsertMedia}
              replaceTargetId={replaceTargetId}
              placeholderText="Search animated GIFs & reactions..."
            />
          )}

          {activeTab === "stickers" && (
            <MediaBrowseTab
              mediaType="sticker"
              onInsertMedia={onInsertMedia}
              replaceTargetId={replaceTargetId}
              placeholderText="Search transparent reaction stickers..."
            />
          )}

          {(activeTab === "search" as MemeStudioTab) && (
            <MediaBrowseTab
              mediaType="all"
              onInsertMedia={onInsertMedia}
              replaceTargetId={replaceTargetId}
              placeholderText="Search all memes, GIFs, and stickers..."
            />
          )}

          {activeTab === "upload" && (
            <MemeUploadTab
              filter={initialFilter}
              onInsertMedia={onInsertMedia}
              replaceTargetId={replaceTargetId}
            />
          )}
        </div>

        {/* 4. Panel Footer / Attribution Note */}
        <div className="p-3 px-4 border-t border-[#E8E4DE] dark:border-[#222630] bg-[#FAFAF8] dark:bg-[#15181E] flex items-center justify-between text-[10.5px] text-[#888] dark:text-[#7E8695]">
          <span className="flex items-center gap-1">
            <Info className="h-3 w-3" /> Subbly Native Media Engine
          </span>
          <span className="font-semibold text-[#FF6B2C]">No AI • Curated & User Media</span>
        </div>
      </aside>
    </div>
  );
};
