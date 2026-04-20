import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegSingleton: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

async function loadFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegSingleton) return ffmpegSingleton;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();
    ffmpeg.on("log", ({ message }) => onLog?.(message));
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegSingleton = ffmpeg;
    return ffmpeg;
  })();
  return loadPromise;
}

export type RenderProgress = (info: { progress: number; message?: string }) => void;

export async function burnCaptions(opts: {
  videoFile: File;
  assText: string;
  onProgress?: RenderProgress;
  onLog?: (msg: string) => void;
}): Promise<Blob> {
  const { videoFile, assText, onProgress, onLog } = opts;
  const ffmpeg = await loadFFmpeg(onLog);

  ffmpeg.on("progress", ({ progress }) => {
    onProgress?.({ progress: Math.max(0, Math.min(1, progress)) });
  });

  const inputName = "input." + (videoFile.name.split(".").pop() || "mp4");
  const subsName = "subs.ass";
  const outputName = "output.mp4";

  await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
  await ffmpeg.writeFile(subsName, new TextEncoder().encode(assText));

  await ffmpeg.exec([
    "-i",
    inputName,
    "-vf",
    `subtitles=${subsName}`,
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-crf",
    "23",
    "-c:a",
    "copy",
    outputName,
  ]);

  const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
  // copy into a fresh buffer so we don't hold ffmpeg's heap memory
  const buf = new Uint8Array(data.byteLength);
  buf.set(data);
  return new Blob([buf], { type: "video/mp4" });
}
