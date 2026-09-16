import type { Word, Caption } from "./types";

/** Checks if a word is an actual spoken word with meaningful content and timing. */
const isRealWord = (w: Word): boolean => {
  if (!w || typeof w.text !== "string") return false;
  const trimmed = w.text.trim();
  if (trimmed.length === 0) return false;
  if (w.type === "spacing") return false;
  if (w.type === "audio_event" || /^\[.*\]$/.test(trimmed)) return false;
  return true;
};

// Partition any n >= 1 into chunks of size 2 or 3, prioritizing 3s.
// E.g. n=7 returns [3, 2, 2]; n=5 returns [3, 2]; n=4 returns [2, 2].
function getOptimalPartition(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [1];
  if (n === 2) return [2];
  if (n === 3) return [3];
  if (n === 4) return [2, 2];
  if (n === 5) return [3, 2];
  return [3, ...getOptimalPartition(n - 3)];
}

/**
 * Group raw transcribed words into punchy short-form caption segments (2-3 words per card),
 * guaranteeing pristine text spacing, clean word timestamps, and strictly valid durations.
 */
export function wordsToCaptions(rawWords: Word[], maxChars = 42): Caption[] {
  if (!Array.isArray(rawWords) || rawWords.length === 0) return [];

  // 1. Sanitize & extract clean, real words
  const words: Word[] = [];
  for (const w of rawWords) {
    if (!isRealWord(w)) continue;
    const text = w.text.trim();
    const start = typeof w.start === "number" && !isNaN(w.start) ? Math.max(0, w.start) : 0;
    const end = typeof w.end === "number" && !isNaN(w.end) ? Math.max(start + 0.05, w.end) : start + 0.3;
    words.push({
      text,
      start,
      end,
      type: "word",
    });
  }

  if (words.length === 0) return [];

  // 2. Break words into clauses based on punctuation and pauses
  const clauses: Word[][] = [];
  let currentClause: Word[] = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    currentClause.push(w);

    let isBoundary = false;

    // Boundary 1: Sentence-ending punctuation (. ? ! or CJK equivalents)
    if (/[.!?。！？]$/.test(w.text)) {
      isBoundary = true;
    }

    // Boundary 2: Clause-ending punctuation (, ; : —) if clause has at least 2 words
    if (!isBoundary && /[,;:—、，]$/.test(w.text) && currentClause.length >= 2) {
      isBoundary = true;
    }

    // Boundary 3: Speech silence/pause before next word
    if (!isBoundary && i < words.length - 1) {
      const nextWord = words[i + 1];
      const gap = nextWord.start - w.end;
      if (gap >= 0.45 && currentClause.length >= 2) {
        isBoundary = true;
      } else if (gap >= 1.0) {
        isBoundary = true;
      }
    }

    // Boundary 4: Clause character length exceeds maxChars limit
    if (!isBoundary && currentClause.length >= 3) {
      const charCount = currentClause.reduce((acc, item) => acc + item.text.length + 1, 0);
      if (charCount >= maxChars) {
        isBoundary = true;
      }
    }

    if (isBoundary) {
      clauses.push(currentClause);
      currentClause = [];
    }
  }

  if (currentClause.length > 0) {
    clauses.push(currentClause);
  }

  // 3. Partition each clause into compact caption cards (2-3 words)
  const out: Caption[] = [];

  for (const clause of clauses) {
    const n = clause.length;
    if (n === 0) continue;

    const sizes = getOptimalPartition(n);
    let wordIndex = 0;

    for (const size of sizes) {
      const chunkWords = clause.slice(wordIndex, wordIndex + size);
      wordIndex += size;

      if (chunkWords.length > 0) {
        const start = chunkWords[0].start;
        const lastWord = chunkWords[chunkWords.length - 1];
        // Ensure caption card has a minimum visible duration of 0.3s
        const end = Math.max(start + 0.3, lastWord.end);

        // ALWAYS join words with clean single spaces
        const text = chunkWords.map((cw) => cw.text).join(" ");

        // Deep clone clean words for word-level karaoke and timings
        const wordsForCaption: Word[] = chunkWords.map((cw) => ({
          text: cw.text,
          start: cw.start,
          end: cw.end,
          type: "word",
        }));

        out.push({
          id: typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `cap_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          start,
          end,
          text,
          words: wordsForCaption,
        });
      }
    }
  }

  // 4. Ensure monotonic, non-overlapping timestamps between adjacent captions
  for (let i = 0; i < out.length; i++) {
    if (i < out.length - 1) {
      if (out[i].end > out[i + 1].start) {
        // Adjust end to not overlap next start, while preserving min duration
        out[i].end = Math.max(out[i].start + 0.1, out[i + 1].start);
      }
    }
    // Guarantee start < end
    if (out[i].end <= out[i].start) {
      out[i].end = out[i].start + 0.3;
    }
  }

  return out;
}


