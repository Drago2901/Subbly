import { Plus, Trash2, Scissors, Combine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Caption } from "@/lib/captions/types";

type Props = {
  captions: Caption[];
  currentTime: number;
  onChange: (next: Caption[]) => void;
  onSeek: (t: number) => void;
};

const fmt = (t: number) => {
  const m = Math.floor(t / 60);
  const s = (t % 60).toFixed(2).padStart(5, "0");
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

    const left: Caption = {
      ...c,
      end: mid,
      text: leftText,
      words: leftWords,
    };
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
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Captions</h3>
          <p className="text-xs text-muted-foreground">{captions.length} segments</p>
        </div>
        <Button size="sm" variant="secondary" onClick={add}>
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </div>
      <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto p-3">
        {captions.map((c, idx) => {
          const active = currentTime >= c.start && currentTime <= c.end;
          const hasNext = idx < captions.length - 1;
          return (
            <div
              key={c.id}
              className={`group rounded-lg border p-3 transition-all ${
                active
                  ? "border-primary/60 bg-primary/5 shadow-glow"
                  : "border-border bg-surface-2 hover:border-border"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <button
                  onClick={() => onSeek(c.start)}
                  className="rounded bg-surface-3 px-2 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {fmt(c.start)}
                </button>
                <span className="text-muted-foreground">→</span>
                <button
                  onClick={() => onSeek(c.end)}
                  className="rounded bg-surface-3 px-2 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {fmt(c.end)}
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => splitCaption(c.id)}
                  title="Split caption"
                  className="text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                >
                  <Scissors className="h-4 w-4" />
                </button>
                {hasNext && (
                  <button
                    onClick={() => mergeWithNext(c.id)}
                    title="Merge with next"
                    className="text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                  >
                    <Combine className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => remove(c.id)}
                  title="Delete"
                  className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Input
                value={c.text}
                onChange={(e) => update(c.id, { text: e.target.value })}
                className="border-0 bg-transparent px-0 text-sm focus-visible:ring-0"
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={c.start.toFixed(2)}
                  onChange={(e) =>
                    update(c.id, { start: Math.max(0, parseFloat(e.target.value) || 0) })
                  }
                  className="h-7 bg-surface-3 text-xs"
                />
                <Input
                  type="number"
                  step="0.1"
                  value={c.end.toFixed(2)}
                  onChange={(e) =>
                    update(c.id, { end: Math.max(0, parseFloat(e.target.value) || 0) })
                  }
                  className="h-7 bg-surface-3 text-xs"
                />
              </div>
            </div>
          );
        })}
        {captions.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No captions yet. Click "Add" to create one.
          </p>
        )}
      </div>
    </div>
  );
}
