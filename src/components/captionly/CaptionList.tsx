import { Plus, Trash2 } from "lucide-react";
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
        {captions.map((c) => {
          const active = currentTime >= c.start && currentTime <= c.end;
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
                  onClick={() => remove(c.id)}
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
