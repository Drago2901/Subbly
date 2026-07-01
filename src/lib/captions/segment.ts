import type { Word, Caption } from "./types";

const isRealWord = (w: Word) => {
  return w.type !== "spacing" && w.text && w.text.trim().length > 0;
};

// Partition any n >= 2 into chunks of size 2 or 3, prioritizing 3s.
// Returns an array of sizes, e.g. for n=7 returns [3, 2, 2].
function getOptimalPartition(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [1];
  if (n === 2) return [2];
  if (n === 3) return [3];
  if (n === 4) return [2, 2];
  if (n === 5) return [3, 2];
  
  // For n >= 6, subtract 3 and recurse.
  return [3, ...getOptimalPartition(n - 3)];
}

// Group words into smaller segments (max 2-3 words), preserving word timestamps.
export function wordsToCaptions(words: Word[], maxChars = 42): Caption[] {
  const out: Caption[] = [];
  const clauses: Word[][] = [];
  let currentClause: Word[] = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w.type && w.type !== "word" && w.type !== "spacing") continue;

    currentClause.push(w);

    const isWord = isRealWord(w);
    let isBoundary = false;

    // Boundary condition 1: Punctuation attached to the word ends sentence
    if (isWord && /[.!?]$/.test(w.text.trim())) {
      isBoundary = true;
    }

    // Boundary condition 2: Clause-ending punctuation (break early if we have at least 2 words)
    if (isWord && /[,;:—]$/.test(w.text.trim())) {
      const wordCount = currentClause.filter(isRealWord).length;
      if (wordCount >= 2) {
        isBoundary = true;
      }
    }

    // Boundary condition 3: Large silence/pause before next word
    if (!isBoundary && i < words.length - 1) {
      let nextWord: Word | null = null;
      for (let j = i + 1; j < words.length; j++) {
        if (isRealWord(words[j])) {
          nextWord = words[j];
          break;
        }
      }
      if (nextWord && w.end && nextWord.start) {
        const gap = nextWord.start - w.end;
        if (gap > 0.45) { // 450ms silence
          isBoundary = true;
        }
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

  // Process each clause and chunk it into groups of 2-3 words.
  for (const clause of clauses) {
    const actualWords = clause.filter(isRealWord);
    const n = actualWords.length;
    if (n === 0) continue;

    const sizes = getOptimalPartition(n);
    let tokenIndex = 0;

    for (const size of sizes) {
      const chunkTokens: Word[] = [];
      let wordsCollected = 0;

      while (tokenIndex < clause.length && wordsCollected < size) {
        const tok = clause[tokenIndex];
        chunkTokens.push(tok);
        if (isRealWord(tok)) {
          wordsCollected++;
        }
        tokenIndex++;
      }

      // Consume any trailing spacing/non-word tokens until the next actual word
      while (tokenIndex < clause.length && !isRealWord(clause[tokenIndex])) {
        chunkTokens.push(clause[tokenIndex]);
        tokenIndex++;
      }

      if (chunkTokens.length > 0) {
        const actualToks = chunkTokens.filter(isRealWord);
        if (actualToks.length > 0) {
          const start = actualToks[0].start;
          const end = actualToks[actualToks.length - 1].end;
          
          // Re-generate text by joining tokens
          const text = chunkTokens.map(t => t.text).join("").trim();

          out.push({
            id: crypto.randomUUID(),
            start,
            end,
            text,
            words: chunkTokens,
          });
        }
      }
    }
  }

  return out;
}

