import { supabase } from "@/integrations/supabase/client";
import type { Word } from "./types";
import { splitVideoIntoChunks, probeVideoDuration, type VideoChunk } from "./chunker";

export type ChunkProgressStage = "splitting" | "transcribing" | "merging";

export type ChunkProgress = {
  stage: ChunkProgressStage;
  chunksDone: number;
  chunksTotal: number;
  splitDone: number;
  splitTotal: number;
};

const MAX_RETRIES = 2;
const PARALLELISM = 3;

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Error("Cancelled"));
    }, { once: true });
  });

async function transcribeOne(
  chunk: VideoChunk,
  signal?: AbortSignal,
): Promise<Word[]> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (signal?.aborted) throw new Error("Cancelled");
    try {
      const fd = new FormData();
      fd.append(
        "file",
        new File([chunk.blob], `chunk_${chunk.index}.mp4`, { type: "video/mp4" }),
      );
      const { data, error } = await supabase.functions.invoke("transcribe-video", {
        body: fd,
      });
      if (error) throw error;
      const words: Word[] = (data?.words ?? []) as Word[];
      // Offset every timestamp into the global timeline.
      return words.map((w) => ({
        ...w,
        start: (w.start ?? 0) + chunk.offset,
        end: (w.end ?? 0) + chunk.offset,
      }));
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        await sleep(500 * Math.pow(2, attempt), signal);
        continue;
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Chunk transcription failed");
}

/**
 * Run an async mapper with bounded concurrency, preserving input order in the result.
 */
async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, idx: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await mapper(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Merge per-chunk words. Removes words from the next chunk that look like
 * duplicates of the previous chunk's tail (overlap at boundary).
 *
 * In high-accuracy mode, also collapses overlapping word time ranges.
 */
function mergeWords(perChunk: Word[][], highAccuracy: boolean): Word[] {
  const out: Word[] = [];
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, "");

  for (let i = 0; i < perChunk.length; i++) {
    let words = perChunk[i].filter((w) => !w.type || w.type === "word" || w.type === "spacing");
    if (out.length > 0 && words.length > 0) {
      // Boundary dedupe: drop leading words whose timestamp lies inside the previous tail
      // OR whose normalized text matches the last few words.
      const lastEnd = out[out.length - 1].end;
      const tail = out.slice(-6).map((w) => norm(w.text));
      let drop = 0;
      const lookahead = highAccuracy ? 6 : 3;
      while (drop < Math.min(lookahead, words.length)) {
        const w = words[drop];
        const overlapsTime = (w.start ?? 0) < lastEnd - 0.05;
        const matchesTail = tail.includes(norm(w.text));
        if (overlapsTime || (highAccuracy && matchesTail)) {
          drop++;
        } else {
          break;
        }
      }
      words = words.slice(drop);
    }
    out.push(...words);
  }
  return out;
}

export async function transcribeChunked(opts: {
  file: File;
  chunkSeconds: number;
  highAccuracy?: boolean;
  signal?: AbortSignal;
  onProgress?: (p: ChunkProgress) => void;
}): Promise<{ words: Word[]; chunkCount: number }> {
  const { file, chunkSeconds, highAccuracy = false, signal, onProgress } = opts;

  const duration = await probeVideoDuration(file);
  const totalChunks = Math.max(1, Math.ceil(duration / chunkSeconds));

  onProgress?.({
    stage: "splitting",
    chunksDone: 0,
    chunksTotal: totalChunks,
    splitDone: 0,
    splitTotal: totalChunks,
  });

  const chunks = await splitVideoIntoChunks({
    file,
    duration,
    chunkSeconds,
    signal,
    onProgress: (done, total) =>
      onProgress?.({
        stage: "splitting",
        chunksDone: 0,
        chunksTotal: total,
        splitDone: done,
        splitTotal: total,
      }),
  });

  let done = 0;
  onProgress?.({
    stage: "transcribing",
    chunksDone: 0,
    chunksTotal: chunks.length,
    splitDone: chunks.length,
    splitTotal: chunks.length,
  });

  const perChunkWords = await mapConcurrent(chunks, PARALLELISM, async (chunk) => {
    const words = await transcribeOne(chunk, signal);
    done++;
    onProgress?.({
      stage: "transcribing",
      chunksDone: done,
      chunksTotal: chunks.length,
      splitDone: chunks.length,
      splitTotal: chunks.length,
    });
    return words;
  });

  onProgress?.({
    stage: "merging",
    chunksDone: chunks.length,
    chunksTotal: chunks.length,
    splitDone: chunks.length,
    splitTotal: chunks.length,
  });

  const merged = mergeWords(perChunkWords, highAccuracy);
  return { words: merged, chunkCount: chunks.length };
}
