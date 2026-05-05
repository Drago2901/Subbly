import type { Caption } from "./types";

const pad = (n: number, len = 2) => n.toString().padStart(len, "0");

function formatTime(seconds: number): string {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const milli = ms % 1000;
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(milli, 3)}`;
}

function parseTime(stamp: string): number {
  const m = stamp.trim().match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})$/);
  if (!m) return NaN;
  const [, hh, mm, ss, ms] = m;
  return (
    Number(hh) * 3600 +
    Number(mm) * 60 +
    Number(ss) +
    Number(ms.padEnd(3, "0")) / 1000
  );
}

export function captionsToSrt(captions: Caption[]): string {
  return captions
    .map((c, i) => {
      const text = (c.text ?? "").replace(/\r\n?/g, "\n").trim();
      return `${i + 1}\n${formatTime(c.start)} --> ${formatTime(c.end)}\n${text}\n`;
    })
    .join("\n");
}

export function srtToCaptions(srt: string): Caption[] {
  // Strip BOM and normalize line endings
  const cleaned = srt.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
  if (!cleaned) return [];
  const blocks = cleaned.split(/\n{2,}/);
  const out: Caption[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.length > 0);
    if (lines.length < 2) continue;
    // Optional numeric index on first line
    let idx = 0;
    if (/^\d+$/.test(lines[0].trim())) idx = 1;
    const timeLine = lines[idx];
    if (!timeLine) continue;
    const tm = timeLine.match(
      /^\s*([\d:,.]+)\s*-->\s*([\d:,.]+)/,
    );
    if (!tm) continue;
    const start = parseTime(tm[1]);
    const end = parseTime(tm[2]);
    if (!isFinite(start) || !isFinite(end)) continue;
    const text = lines.slice(idx + 1).join("\n").trim();
    if (!text) continue;
    out.push({
      id: crypto.randomUUID(),
      start,
      end,
      text,
    });
  }
  return out;
}
