export type MemeType = "image" | "gif" | "video" | "meme" | "sticker";

export type MemeStudioTab = "memes" | "gifs" | "stickers" | "upload" | "search";

export type MemeCategory =
  | "All"
  | "Trending"
  | "Reaction"
  | "Work"
  | "Anime"
  | "Gaming"
  | "Success"
  | "Funny"
  | "Sad"
  | "Angry"
  | "Happy"
  | "Confused"
  | "Celebration"
  | "Emoji";

export interface MemeItem {
  id: string;
  title: string;
  url: string;
  type: MemeType;
  category?: string;
  tags?: string[];
  aspectRatio?: number;
  animated?: boolean;
  width?: number;
  height?: number;
  createdAt?: number;
}

export interface MediaValidationResult {
  valid: boolean;
  error?: string;
  mediaType?: MemeType;
}

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export const SUPPORTED_EXTENSIONS = {
  image: [".png", ".jpg", ".jpeg", ".webp"],
  gif: [".gif"],
  video: [".mp4", ".webm"],
  meme: [".png", ".jpg", ".jpeg", ".webp"],
  sticker: [".png", ".webp", ".svg"],
};

export const ACCEPTED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
].join(",");

export function validateMediaFile(file: File): MediaValidationResult {
  const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
  const mime = file.type.toLowerCase();

  let detectedType: MemeType | null = null;

  if (mime === "image/gif" || ext === ".gif") {
    detectedType = "gif";
  } else if (mime.startsWith("video/") || SUPPORTED_EXTENSIONS.video.includes(ext)) {
    if (!["video/mp4", "video/webm"].includes(mime) && ![".mp4", ".webm"].includes(ext)) {
      return {
        valid: false,
        error: "This video format isn't supported. Please upload MP4 or WebM.",
      };
    }
    detectedType = "video";
  } else if (mime.startsWith("image/") || SUPPORTED_EXTENSIONS.image.includes(ext)) {
    detectedType = "image";
  }

  if (!detectedType) {
    return {
      valid: false,
      error: "This file type isn't supported. Please choose an image, animated GIF, or MP4/WebM video.",
    };
  }

  const isVideo = detectedType === "video";
  const maxSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;

  if (file.size > maxSize) {
    const sizeMb = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `This file is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is ${sizeMb}MB.`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "The selected file is empty or corrupted.",
    };
  }

  return {
    valid: true,
    mediaType: detectedType,
  };
}
