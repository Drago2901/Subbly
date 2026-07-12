import { useState, useMemo } from "react";
import { Plus, Trash2, Scissors, Combine, FileText, Search, MoreVertical, Clock } from "lucide-react";
import type { Caption } from "@/lib/captions/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  captions: Caption[];
  currentTime: number;
  onChange: (next: Caption[]) => void;
  onSeek: (t: number) => void;
  lockedTracks?: number[];
};

const fmt = (t: number) => {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  const ms = Math.floor((t % 1) * 100).toString().padStart(2, "0");
  return `${m}:${s}.${ms}`;
};

export function CaptionList({ captions, currentTime, onChange, onSeek, lockedTracks = [] }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const update = (id: string, patch: Partial<Caption>) => {
    const c = captions.find((cap) => cap.id === id);
    if (c && lockedTracks.includes(c.track || 1)) return;
    onChange(captions.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const remove = (id: string) => {
    const c = captions.find((cap) => cap.id === id);
    if (c && lockedTracks.includes(c.track || 1)) return;
    onChange(captions.filter((c) => c.id !== id));
  };

  const add = () => {
    let targetTrack = 1;
    let found = false;
    for (let t = 1; t <= 6; t++) {
      if (!lockedTracks.includes(t)) {
        targetTrack = t;
        found = true;
        break;
      }
    }
    if (!found) return;

    const last = captions[captions.length - 1];
    const start = last ? last.end : 0;
    const refCap = captions.find((c) => c.x !== undefined);
    onChange([
      ...captions,
      {
        id: crypto.randomUUID(),
        start,
        end: start + 2,
        text: "New caption",
        track: targetTrack,
        x: refCap?.x ?? 0.5,
        y: refCap?.y ?? 0.88,
        width: refCap?.width ?? 84,
        height: refCap?.height,
        style: refCap?.style ? JSON.parse(JSON.stringify(refCap.style)) : undefined,
      },
    ]);
  };

  const splitCaption = (id: string) => {
    const idx = captions.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const c = captions[idx];
    if (lockedTracks.includes(c.track || 1)) return;
    const mid = (c.start + c.end) / 2;
    const tokens = c.text.trim().split(/\s+/);
    const half = Math.max(1, Math.floor(tokens.length / 2));
    const leftText = tokens.slice(0, half).join(" ");
    const rightText = tokens.slice(half).join(" ") || "...";

    let leftWords = c.words;
    let rightWords: typeof c.words;
    if (c.words && c.words.length > 1) {
      const wIdx = Math.max(1, Math.floor(c.words.length / 2));
      leftWords = c.words.slice(0, wIdx);
      rightWords = c.words.slice(wIdx);
    }

    const left: Caption = { ...c, end: mid, text: leftText, words: leftWords };
    const right: Caption = {
      id: crypto.randomUUID(),
      start: mid,
      end: c.end,
      text: rightText,
      words: rightWords,
      style: c.style ? JSON.parse(JSON.stringify(c.style)) : undefined,
      x: c.x,
      y: c.y,
      width: c.width,
      height: c.height,
      track: c.track,
    };
    const next = [...captions];
    next.splice(idx, 1, left, right);
    onChange(next);
  };

  const mergeWithNext = (id: string) => {
    const idx = captions.findIndex((c) => c.id === id);
    if (idx < 0 || idx >= captions.length - 1) return;
    const a = captions[idx];
    const b = captions[idx + 1];
    if (lockedTracks.includes(a.track || 1) || lockedTracks.includes(b.track || 1)) return;
    const merged: Caption = {
      id: a.id,
      start: a.start,
      end: b.end,
      text: `${a.text} ${b.text}`.trim(),
      words: a.words || b.words ? [...(a.words ?? []), ...(b.words ?? [])] : undefined,
      style: a.style ? JSON.parse(JSON.stringify(a.style)) : undefined,
      x: a.x,
      y: a.y,
      width: a.width,
      height: a.height,
      track: a.track,
    };
    const next = [...captions];
    next.splice(idx, 2, merged);
    onChange(next);
  };

  const allTracksLocked = Array.from({ length: 6 }, (_, i) => i + 1).every((t) => lockedTracks.includes(t));

  const filteredCaptions = useMemo(() => {
    if (!searchQuery.trim()) return captions;
    const q = searchQuery.toLowerCase();
    return captions.filter((c) => c.text.toLowerCase().includes(q));
  }, [captions, searchQuery]);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#181B22]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Sticky Header Panel */}
      <div className="sticky top-0 z-10 flex flex-col gap-3.5 border-b border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#181B22] p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[15px] font-bold text-[#1A1A1A] dark:text-white tracking-wide">Captions</div>
            <div className="mt-0.5 text-[11px] text-[#666] dark:text-[#A1A8B5] font-medium">
              {captions.length} segment{captions.length === 1 ? "" : "s"} total
            </div>
          </div>
          <button
            onClick={add}
            disabled={allTracksLocked}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#FF6B2C] px-3.5 py-2 text-[12px] font-bold text-white transition-all hover:bg-[#FF874D] disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-orange-500/10 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.8} />
            New Caption
          </button>
        </div>

        {/* Sticky Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#666] dark:text-[#A1A8B5]" />
          <input
            type="text"
            placeholder="Search captions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#E8E4DE] bg-[#F9F8F5] dark:border-[#2C313C] dark:bg-[#1F232D] pl-9 pr-3 py-2 text-[12.5px] text-[#1A1A1A] dark:text-white placeholder-[#888] dark:placeholder-[#A1A8B5] outline-none transition focus:border-[#FF6B2C]"
          />
        </div>
      </div>

      {/* Caption Cards List */}
      <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4 bg-neutral-55/15 dark:bg-transparent">
        {filteredCaptions.length === 0 && (
          <div className="flex h-[240px] flex-col items-center justify-center gap-3 px-5 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8E4DE] bg-[#F9F8F5] dark:border-[#2C313C] dark:bg-[#1F232D]">
              <FileText className="h-5 w-5 text-[#666] dark:text-[#A1A8B5]" strokeWidth={1.8} />
            </div>
            <div className="text-[13px] font-bold text-[#1A1A1A] dark:text-white">No captions found</div>
            <div className="text-[11.5px] leading-relaxed text-[#666] dark:text-[#A1A8B5] max-w-[200px]">
              {searchQuery ? "Try refining your search filter query." : "Click 'New Caption' to start writing."}
            </div>
          </div>
        )}

        {filteredCaptions.map((c, idx) => {
          const active = currentTime >= c.start && currentTime <= c.end;
          const hasNext = idx < captions.length - 1;
          const isLocked = lockedTracks.includes(c.track || 1);
          return (
            <div
              key={c.id}
              className={`group flex flex-col gap-2.5 rounded-xl border p-3.5 transition-all duration-300 ${
                active
                  ? "border-[#FF6B2C] bg-white dark:bg-[#1F232D] shadow-[0_0_12px_rgba(255,107,44,0.15)]"
                  : "border-[#E8E4DE] bg-white dark:border-[#2C313C] dark:bg-[#1F232D] hover:bg-neutral-50/20 dark:hover:bg-[#1F232D]/90 hover:-translate-y-0.5 hover:shadow-md"
              }`}
              onClick={() => onSeek(c.start)}
            >
              {/* Card Top Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-5 items-center justify-center rounded px-1.5 text-[10px] font-bold ${
                    active ? "bg-[#FF6B2C] text-white" : "bg-[#F9F8F5] text-[#666] dark:bg-[#2C313C] dark:text-[#A1A8B5]"
                  }`}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-[#666] dark:text-[#A1A8B5] font-semibold">
                    <Clock className="h-3 w-3 text-[#666]/75 dark:text-[#A1A8B5]/75" />
                    <span>{fmt(c.start)}</span>
                    <span className="opacity-50">→</span>
                    <span>{fmt(c.end)}</span>
                  </div>
                </div>

                {/* Dropdown Menu or actions vertical */}
                {!isLocked && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[#F9F8F5] dark:hover:bg-[#2C313C] text-[#666] dark:text-[#A1A8B5] hover:text-[#1A1A1A] dark:hover:text-white transition cursor-pointer"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white dark:bg-[#1F232D] border border-[#E8E4DE] dark:border-[#2C313C] text-[#1A1A1A] dark:text-white shadow-xl rounded-lg w-40 p-1">
                      <DropdownMenuItem
                        onClick={() => splitCaption(c.id)}
                        className="text-xs cursor-pointer py-1.5 hover:bg-[#F9F8F5] dark:hover:bg-[#2C313C] rounded-md flex items-center gap-2"
                      >
                        <Scissors className="h-3.5 w-3.5 text-[#FF6B2C]" />
                        <span>Split Segment</span>
                      </DropdownMenuItem>
                      {hasNext && !lockedTracks.includes(captions[idx + 1].track || 1) && (
                        <DropdownMenuItem
                          onClick={() => mergeWithNext(c.id)}
                          className="text-xs cursor-pointer py-1.5 hover:bg-[#F9F8F5] dark:hover:bg-[#2C313C] rounded-md flex items-center gap-2"
                        >
                          <Combine className="h-3.5 w-3.5 text-blue-400" />
                          <span>Merge with Next</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => remove(c.id)}
                        className="text-xs cursor-pointer py-1.5 hover:bg-[#F9F8F5] dark:hover:bg-[#2C313C] text-red-400 hover:text-red-500 rounded-md flex items-center gap-2"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        <span>Delete Card</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Caption Textarea Preview */}
              <textarea
                value={c.text}
                aria-label="Caption text content"
                disabled={isLocked}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => update(c.id, { text: e.target.value, words: undefined })}
                rows={2}
                className={`w-full bg-transparent text-[13px] leading-relaxed resize-none border-b border-transparent hover:border-[#E8E4DE] dark:hover:border-[#2C313C] focus:border-[#FF6B2C] outline-none transition-colors py-1 ${
                  active ? "text-[#1A1A1A] dark:text-white" : "text-[#666] dark:text-[#A1A8B5] hover:text-[#1A1A1A] dark:hover:text-white"
                } ${isLocked ? "opacity-60 cursor-not-allowed" : ""}`}
              />

              {/* Micro-adjust Timestamps (visible/elevated inside card) */}
              <div className="flex gap-2 items-center mt-0.5">
                <div className="flex items-center gap-1.5 flex-1 rounded-lg border border-[#E8E4DE] bg-[#F9F8F5] dark:border-[#2C313C] dark:bg-[#181B22] px-2 py-1 text-[11px]">
                  <span className="text-[9.5px] uppercase tracking-wider font-bold text-[#666]/60 dark:text-[#A1A8B5]/60">Start</span>
                  <input
                    type="number"
                    step="0.05"
                    aria-label="Start time in seconds"
                    value={c.start.toFixed(2)}
                    disabled={isLocked}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      update(c.id, { start: Math.max(0, parseFloat(e.target.value) || 0) })
                    }
                    className={`w-full bg-transparent font-mono font-semibold text-[#1A1A1A] dark:text-white outline-none text-right ${
                      isLocked ? "cursor-not-allowed opacity-50" : ""
                    }`}
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-1 rounded-lg border border-[#E8E4DE] bg-[#F9F8F5] dark:border-[#2C313C] dark:bg-[#181B22] px-2 py-1 text-[11px]">
                  <span className="text-[9.5px] uppercase tracking-wider font-bold text-[#666]/60 dark:text-[#A1A8B5]/60">End</span>
                  <input
                    type="number"
                    step="0.05"
                    aria-label="End time in seconds"
                    value={c.end.toFixed(2)}
                    disabled={isLocked}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      update(c.id, { end: Math.max(0, parseFloat(e.target.value) || 0) })
                    }
                    className={`w-full bg-transparent font-mono font-semibold text-[#1A1A1A] dark:text-white outline-none text-right ${
                      isLocked ? "cursor-not-allowed opacity-50" : ""
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
