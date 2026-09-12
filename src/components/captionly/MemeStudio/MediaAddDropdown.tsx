import React from "react";
import { Plus, Image as ImageIcon, Film, Smile, Video as VideoIcon, Paperclip } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MemeType, MemeStudioTab } from "@/lib/memeStudio/types";

interface MediaAddDropdownProps {
  onOpenMemeStudio: (options?: { tab?: MemeStudioTab; filter?: MemeType | "all" }) => void;
  className?: string;
}

export const MediaAddDropdown: React.FC<MediaAddDropdownProps> = ({
  onOpenMemeStudio,
  className = "",
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Add media to content"
          className={`inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#1A1D24] px-3 text-[11.5px] font-bold text-[#1A1A1A] dark:text-white shadow-sm hover:border-[#FF6B2C] hover:text-[#FF6B2C] dark:hover:text-[#FF6B2C] hover:bg-[#FF6B2C]/5 transition duration-150 cursor-pointer select-none active:scale-[0.98] ${className}`}
        >
          <Plus className="h-3.5 w-3.5 text-[#FF6B2C]" strokeWidth={2.5} />
          <span>Add</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-52 rounded-xl border border-[#E8E4DE] dark:border-[#2C313C] bg-white/95 dark:bg-[#15181E]/95 backdrop-blur-md p-1.5 shadow-xl text-[#1A1A1A] dark:text-white z-50 animate-in fade-in-50 zoom-in-95 duration-100"
      >
        <DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#888] dark:text-[#7E8695]">
          Add to content
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-[#E8E4DE] dark:bg-[#2C313C] my-1" />

        {/* Image */}
        <DropdownMenuItem
          onClick={() => onOpenMemeStudio({ tab: "upload", filter: "image" })}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-semibold cursor-pointer hover:bg-[#F4F1EC] dark:hover:bg-[#1F232D] text-[#1A1A1A] dark:text-white transition"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10 text-blue-500">
            <ImageIcon className="h-3.5 w-3.5" />
          </div>
          <span>Image</span>
        </DropdownMenuItem>

        {/* GIF */}
        <DropdownMenuItem
          onClick={() => onOpenMemeStudio({ tab: "gifs", filter: "gif" })}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-semibold cursor-pointer hover:bg-[#F4F1EC] dark:hover:bg-[#1F232D] text-[#1A1A1A] dark:text-white transition"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/10 text-purple-500">
            <Film className="h-3.5 w-3.5" />
          </div>
          <span>GIF</span>
        </DropdownMenuItem>

        {/* Meme */}
        <DropdownMenuItem
          onClick={() => onOpenMemeStudio({ tab: "memes", filter: "meme" })}
          className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[12.5px] font-bold cursor-pointer bg-[#FF6B2C]/5 hover:bg-[#FF6B2C]/15 text-[#FF6B2C] transition group"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FF6B2C]/20 text-[#FF6B2C]">
              <Smile className="h-3.5 w-3.5" />
            </div>
            <span>Meme</span>
          </div>
          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#FF6B2C] text-white tracking-wider">
            Beta
          </span>
        </DropdownMenuItem>

        {/* Video */}
        <DropdownMenuItem
          onClick={() => onOpenMemeStudio({ tab: "upload", filter: "video" })}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-semibold cursor-pointer hover:bg-[#F4F1EC] dark:hover:bg-[#1F232D] text-[#1A1A1A] dark:text-white transition"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
            <VideoIcon className="h-3.5 w-3.5" />
          </div>
          <span>Video</span>
        </DropdownMenuItem>

        {/* Sticker */}
        <DropdownMenuItem
          onClick={() => onOpenMemeStudio({ tab: "stickers", filter: "sticker" })}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-semibold cursor-pointer hover:bg-[#F4F1EC] dark:hover:bg-[#1F232D] text-[#1A1A1A] dark:text-white transition"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
            <Paperclip className="h-3.5 w-3.5" />
          </div>
          <span>Sticker</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
