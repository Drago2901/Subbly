import React, { useState, useMemo } from "react";
import { Search, X, Plus, Eye, Check, RefreshCw, Upload } from "lucide-react";
import { memeStudioService } from "@/lib/memeStudio/service";
import { MEME_CATEGORIES } from "@/lib/memeStudio/data";
import type { MemeItem, MemeType, MemeCategory } from "@/lib/memeStudio/types";

interface MediaBrowseTabProps {
  mediaType: MemeType | "all";
  onInsertMedia: (item: MemeItem) => void;
  onGoToUpload?: () => void;
  replaceTargetId?: string | null;
  placeholderText?: string;
}

export const MediaBrowseTab: React.FC<MediaBrowseTabProps> = ({
  mediaType,
  onInsertMedia,
  onGoToUpload,
  replaceTargetId,
  placeholderText = "Search memes, GIFs, or reactions...",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MemeCategory>("All");
  const [previewItem, setPreviewItem] = useState<MemeItem | null>(null);

  const items = useMemo(() => {
    return memeStudioService.getItems(mediaType, searchQuery, selectedCategory);
  }, [mediaType, searchQuery, selectedCategory]);

  const handleInsert = (item: MemeItem) => {
    onInsertMedia(item);
    setPreviewItem(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 1. Search Bar */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-[#888] dark:text-[#7E8695] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholderText}
            className="w-full h-9 pl-9 pr-8 rounded-xl border border-[#E8E4DE] dark:border-[#2C313C] bg-[#FAFAF8] dark:bg-[#1A1D24] text-xs text-[#1A1A1A] dark:text-white placeholder-[#888] dark:placeholder-[#7E8695] outline-none focus:border-[#FF6B2C] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 p-0.5 rounded-full text-[#888] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
              title="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Category Chips Bar */}
      <div className="px-4 pb-2.5 flex-shrink-0 overflow-x-auto no-scrollbar flex items-center gap-1.5 select-none">
        {MEME_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition duration-150 cursor-pointer ${
                isActive
                  ? "bg-[#FF6B2C] text-white shadow-sm shadow-orange-500/20 scale-[1.02]"
                  : "bg-[#F4F1EC] dark:bg-[#1A1D24] text-[#666] dark:text-[#A1A8B5] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#ECE8E1] dark:hover:bg-[#252A34]"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 3. Media Grid / Empty State */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 select-none">
        {replaceTargetId && (
          <div className="mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-bold flex items-center justify-between">
            <span>Click any item to replace selected media</span>
            <span className="text-[10px] uppercase tracking-wider bg-amber-500/20 px-1.5 py-0.5 rounded">
              Replace mode
            </span>
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center space-y-2 text-[#888] dark:text-[#7E8695]">
            <Search className="h-7 w-7 stroke-[1.5] opacity-40" />
            <p className="text-xs font-bold text-[#1A1A1A] dark:text-white">
              {mediaType === "meme" && !searchQuery ? "No memes available" : "No media found"}
            </p>
            <p className="text-[11px] max-w-[260px] leading-relaxed">
              {mediaType === "meme" && !searchQuery
                ? "No memes in the library. You can upload custom memes to use in your video."
                : "Try searching with another keyword or pick a different category."}
            </p>
            {mediaType === "meme" && !searchQuery && onGoToUpload && (
              <button
                type="button"
                onClick={onGoToUpload}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FF6B2C] text-white text-[11px] font-bold shadow-sm hover:bg-[#FF874D] transition cursor-pointer"
              >
                <Upload className="h-3 w-3" />
                Upload Meme
              </button>
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="mt-2 text-xs font-bold text-[#FF6B2C] hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl border border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#1A1D24] overflow-hidden shadow-sm hover:shadow-md hover:border-[#FF6B2C]/50 transition-all duration-200 flex flex-col cursor-pointer"
                onClick={() => handleInsert(item)}
              >
                {/* Visual Thumbnail */}
                <div
                  className={`relative w-full aspect-square flex items-center justify-center overflow-hidden ${
                    item.type === "sticker"
                      ? "bg-[#F9F8F5] dark:bg-[#12151B] p-4"
                      : "bg-black/5 dark:bg-black/20"
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    loading="lazy"
                    className={`w-full h-full object-contain transition-transform duration-200 group-hover:scale-105 ${
                      item.type === "sticker" ? "drop-shadow-md" : ""
                    }`}
                  />

                  {/* Top Type Badge */}
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8.5px] font-extrabold uppercase bg-black/60 backdrop-blur-md text-white tracking-wider">
                    {item.type}
                  </span>

                  {/* Hover Overlay with Insert Action */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInsert(item);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#FF6B2C] text-white text-[11px] font-bold shadow-lg hover:bg-[#FF874D] transition flex items-center gap-1 hover:scale-105 active:scale-95"
                    >
                      <Plus className="h-3 w-3" strokeWidth={2.5} />
                      <span>{replaceTargetId ? "Replace" : "Insert"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewItem(item);
                      }}
                      className="p-1.5 rounded-lg bg-black/60 text-white text-[11px] hover:bg-black/80 transition"
                      title="Inspect preview"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Title Bar */}
                <div className="p-2 bg-white dark:bg-[#1A1D24] border-t border-[#E8E4DE] dark:border-[#2C313C]/60 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#1A1A1A] dark:text-white truncate">
                    {item.title}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInsert(item);
                    }}
                    className="p-1 rounded-md text-[#888] hover:text-[#FF6B2C] hover:bg-[#FF6B2C]/10 transition"
                    title="Insert"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Full Preview Modal (when clicking eye icon) */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in-50 duration-150"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative max-w-sm w-full bg-white dark:bg-[#15181E] rounded-2xl border border-[#E8E4DE] dark:border-[#2C313C] shadow-2xl p-4 flex flex-col space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#FF6B2C]/10 text-[#FF6B2C] border border-[#FF6B2C]/20">
                {previewItem.type}
              </span>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1 rounded-md text-[#888] hover:text-[#1A1A1A] dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="w-full aspect-square rounded-xl bg-black/5 dark:bg-black/30 border border-[#E8E4DE] dark:border-[#2C313C] flex items-center justify-center overflow-hidden p-2">
              <img
                src={previewItem.url}
                alt={previewItem.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#1A1A1A] dark:text-white">
                {previewItem.title}
              </span>
              {previewItem.category && (
                <span className="text-[11px] text-[#888] dark:text-[#7E8695]">
                  Category: {previewItem.category}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="flex-1 py-2 rounded-xl border border-[#E8E4DE] dark:border-[#2C313C] text-xs font-bold text-[#666] dark:text-[#A1A8B5] hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleInsert(previewItem)}
                className="flex-1 py-2 rounded-xl bg-[#FF6B2C] hover:bg-[#FF874D] text-white text-xs font-bold shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span>{replaceTargetId ? "Replace Media" : "Insert Media"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
