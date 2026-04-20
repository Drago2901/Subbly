import type { Word, Caption } from "./types";

// Group words into ~max-chars caption lines, preserving word timestamps.
export function wordsToCaptions(words: Word[], maxChars = 42): Caption[] {
  const out: Caption[] = [];
  let buf: Word[] = [];
  let chars = 0;

  const flush = () => {
    if (buf.length === 0) return;
    out.push({
      id: crypto.randomUUID(),
      start: buf[0].start,
      end: buf[buf.length - 1].end,
      text: buf.map((w) => w.text).join("").trim(),
      words: buf.slice(),
    });
    buf = [];
    chars = 0;
  };

  for (const w of words) {
    if (w.type && w.type !== "word" && w.type !== "spacing") continue;
    const t = w.text ?? "";
    if (chars + t.length > maxChars && buf.length > 0) flush();
    buf.push(w);
    chars += t.length;
    // break on sentence enders too
    if (/[.!?]$/.test(t.trim()) && chars > 12) flush();
  }
  flush();
  return out;
}
