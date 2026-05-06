import { Plus, Trash2, Scissors, Combine, FileText } from "lucide-react";
import type { Caption } from "@/lib/captions/types";

type Props = {
  captions: Caption[];
  currentTime: number;
  onChange: (next: Caption[]) => void;
  onSeek: (t: number) => void;
};

const fmt = (t: number) => {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export function CaptionList({ captions, currentTime, onChange, onSeek }: Props) {
  const update = (id: string, patch: Partial<Caption>) =>
    onChange(captions.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id: string) => onChange(captions.filter((c) => c.id !== id));
  const add = () => {
    const last = captions[captions.length - 1];
    const start = last ? last.end : 0;
    onChange([
      ...captions,
      { id: crypto.randomUUID(), start, end: start + 2, text: "New caption" },
    ]);
  };

  const splitCaption = (id: string) => {
    const idx = captions.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const c = captions[idx];
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
    const merged: Caption = {
      id: a.id,
      start: a.start,
      end: b.end,
      text: `${a.text} ${b.text}`.trim(),
      words: a.words || b.words ? [...(a.words ?? []), ...(b.words ?? [])] : undefined,
    };
    const next = [...captions];
    next.splice(idx, 2, merged);
    onChange(next);
  };

  return (
    <div className="flex h-full flex-col bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="flex items-center justify-between border-b border-[#f0ede8] px-4 pb-3 pt-3.5">
        <div>
          <div className="text-[13px] font-semibold text-[#1a1a1a]">Captions</div>
          <div className="mt-0.5 text-[11px] text-[#bbb]">
            {captions.length} segment{captions.length === 1 ? "" : "s"}
          </div>
        </div>
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#ffd5cc] bg-[#fff5f3] px-2.5 py-1 text-[12px] font-medium text-[#ff5c3a] transition hover:bg-[#ffe8e2]"
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
          Add
        </button>
      </div>

      <div className="scrollbar-thin flex-1 space-y-1.5 overflow-y-auto p-3">
        {captions.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-5 py-10 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#e8e4de] bg-[#f5f3ee]">
              <FileText className="h-5 w-5 text-[#ccc]" strokeWidth={1.8} />
            </div>
            <div className="text-[12.5px] font-medium text-[#bbb]">No captions yet</div>
            <div className="text-[11.5px] leading-relaxed text-[#ccc]">
              Click "Add" or auto-transcribe to create captions.
            </div>
          </div>
        )}

        {captions.map((c, idx) => {
          const active = currentTime >= c.start && currentTime <= c.end;
          const hasNext = idx < captions.length - 1;
          return (
            <div
              key={c.id}
              className={`group cursor-pointer rounded-lg border px-3 py-2.5 transition ${
                active
                  ? "border-[#ff5c3a] bg-[#fff5f3]"
                  : "border-[#e8e4de] bg-white hover:border-[#ffd5cc] hover:bg-[#fffaf9]"
              }`}
              onClick={() => onSeek(c.start)}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] font-semibold ${active ? "text-[#ff5c3a]" : "text-[#bbb]"}`}
                  style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                >
                  {fmt(c.start)} – {fmt(c.end)}
                </span>
                <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); splitCaption(c.id); }}
                    title="Split"
                    className="text-[#aaa] hover:text-[#ff5c3a]"
                  >
                    <Scissors className="h-3.5 w-3.5" />
                  </button>
                  {hasNext && (
                    <button
                      onClick={(e) => { e.stopPropagation(); mergeWithNext(c.id); }}
                      title="Merge"
                      className="text-[#aaa] hover:text-[#ff5c3a]"
                    >
                      <Combine className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(c.id); }}
                    title="Delete"
                    className="text-[#aaa] hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <input
                value={c.text}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => update(c.id, { text: e.target.value })}
                className={`w-full bg-transparent text-[12px] leading-relaxed outline-none ${
                  active ? "text-[#333]" : "text-[#666]"
                }`}
              />
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 opacity-0 transition group-hover:opacity-100">
                <input
                  type="number"
                  step="0.1"
                  value={c.start.toFixed(2)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    update(c.id, { start: Math.max(0, parseFloat(e.target.value) || 0) })
                  }
                  className="h-6 rounded border border-[#e8e4de] bg-[#faf9f7] px-1.5 text-[10px] outline-none focus:border-[#ff5c3a]"
                />
                <input
                  type="number"
                  step="0.1"
                  value={c.end.toFixed(2)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    update(c.id, { end: Math.max(0, parseFloat(e.target.value) || 0) })
                  }
                  className="h-6 rounded border border-[#e8e4de] bg-[#faf9f7] px-1.5 text-[10px] outline-none focus:border-[#ff5c3a]"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
