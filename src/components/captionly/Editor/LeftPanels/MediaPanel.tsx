import React, { useState } from "react";
import { Smile, Film, Paperclip, Upload } from "lucide-react";
import { MemeUploadTab } from "@/components/captionly/MemeStudio/MemeUploadTab";
import { MediaBrowseTab } from "@/components/captionly/MemeStudio/MediaBrowseTab";
import type { MemeStudioTab, MemeType, MemeItem } from "@/lib/memeStudio/types";
import { CURATED_MEMES } from "@/lib/memeStudio/data";

interface MediaPanelProps {
  onInsertMedia: (item: MemeItem) => void;
  initialTab?: MemeStudioTab;
  initialFilter?: MemeType | "all";
}

export const MediaPanel: React.FC<MediaPanelProps> = ({
  onInsertMedia,
  initialTab = "gifs",
  initialFilter = "all",
}) => {
  const hasCuratedMemes = CURATED_MEMES.length > 0;
  const [tab, setTab] = useState<MemeStudioTab>(initialTab);

  return (
    <div className="flex h-full flex-col select-none overflow-hidden bg-card">
      {/* Tab Switcher */}
      <div className="px-3 pt-3 pb-2 border-b border-border bg-card/60">
        <div className="flex items-center bg-secondary/80 p-1 rounded-xl border border-border">
          {hasCuratedMemes && (
            <button
              type="button"
              onClick={() => setTab("memes")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tab === "memes"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smile className="h-3.5 w-3.5 text-primary" />
              <span>Memes</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setTab("gifs")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              tab === "gifs"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Film className="h-3.5 w-3.5 text-purple-400" />
            <span>GIFs</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("stickers")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              tab === "stickers"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Paperclip className="h-3.5 w-3.5 text-emerald-400" />
            <span>Stickers</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              tab === "upload"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="h-3.5 w-3.5 text-sky-400" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin p-3">
        {tab === "upload" ? (
          <MemeUploadTab onInsert={onInsertMedia} />
        ) : (
          <MediaBrowseTab
            key={tab}
            tab={tab}
            initialFilter={initialFilter}
            onInsert={onInsertMedia}
          />
        )}
      </div>
    </div>
  );
};
