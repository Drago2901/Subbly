import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/** The selected avatar: either a sprite-sheet cell or a custom uploaded image. */
export type AvatarSelection =
  | { type: "sprite"; sprite: "m" | "f"; col: number; row: number }
  | { type: "custom"; url: string };

const AVATAR_KEY = (uid: string) => `avatar_selection_${uid}`;

// ── Sprite-sheet constants (shared across components) ──────────────────
// Males: 6 cols × 4 rows
export const SPRITE_M = "/avatars/anime-avatars.jpg";
export const SPRITE_M_COLS = 6;
export const SPRITE_M_ROWS = 4;
export const SPRITE_M_TOTAL = 23; // only 23 characters, not full 24

// Females: 5 cols × 2 rows
export const SPRITE_F = "/avatars/anime-avatars-female.jpg";
export const SPRITE_F_COLS = 5;
export const SPRITE_F_ROWS = 2;
export const SPRITE_F_TOTAL = 10;

// Image dimensions
export const IMG_W = 1024;
export const IMG_H_M = 682;
export const IMG_H_F = 682;

/** Build a CSS background-position style to crop a single avatar from the sprite sheet. */
export function buildSpriteStyle(
  col: number,
  row: number,
  sprite: "m" | "f",
  displaySize = 112,
): React.CSSProperties {
  const isF = sprite === "f";
  const cols = isF ? SPRITE_F_COLS : SPRITE_M_COLS;
  const rows = isF ? SPRITE_F_ROWS : SPRITE_M_ROWS;
  const imgW = IMG_W;
  const imgH = isF ? IMG_H_F : IMG_H_M;
  const cellW = imgW / cols;
  const cellH = imgH / rows;

  // Base scale factor matches the width of the cell to keep the avatar square
  const zoom = isF ? 1.25 : 1.35;
  const scale = (displaySize / cellW) * zoom;

  // Centering offsets
  const shiftX = (displaySize * (zoom - 1)) / 2;
  // Shift Y focus slightly upwards (less crop at the top, more crop at the bottom to hide text)
  const shiftY = (displaySize * (zoom - 1)) * (isF ? 0.1 : 0.15);

  const posX = -(col * cellW * scale) - shiftX;
  const posY = -(row * cellH * scale) - shiftY;

  return {
    width: displaySize,
    height: displaySize,
    backgroundImage: `url(${isF ? SPRITE_F : SPRITE_M})`,
    backgroundSize: `${imgW * scale}px ${imgH * scale}px`,
    backgroundPosition: `${posX}px ${posY}px`,
    backgroundRepeat: "no-repeat",
    borderRadius: "50%",
  };
}

// ── Context ────────────────────────────────────────────────────────────
type AvatarContextValue = {
  selection: AvatarSelection | null;
  setSelection: (sel: AvatarSelection | null) => void;
  uploadCustom: (file: File) => Promise<string | null>;
};

const AvatarContext = createContext<AvatarContextValue | null>(null);

export function AvatarProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const loadInitial = (): AvatarSelection | null => {
    if (!user) return null;
    try {
      const raw = localStorage.getItem(AVATAR_KEY(user.id));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const [selection, setSelectionState] = useState<AvatarSelection | null>(
    loadInitial,
  );

  useEffect(() => {
    if (!user) {
      setSelectionState(null);
      return;
    }
    try {
      const raw = localStorage.getItem(AVATAR_KEY(user.id));
      setSelectionState(raw ? JSON.parse(raw) : null);
    } catch {
      setSelectionState(null);
    }
  }, [user]);

  const setSelection = useCallback(
    (sel: AvatarSelection | null) => {
      setSelectionState(sel);
      if (!user) return;
      if (sel) {
        localStorage.setItem(AVATAR_KEY(user.id), JSON.stringify(sel));
      } else {
        localStorage.removeItem(AVATAR_KEY(user.id));
      }
    },
    [user],
  );

  /** Upload a custom avatar file to Supabase Storage and return its public URL. */
  const uploadCustom = useCallback(
    async (file: File): Promise<string | null> => {
      if (!user) return null;
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (error) {
        console.warn("Avatar upload failed:", error.message);
        return null;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      return data.publicUrl;
    },
    [user],
  );

  return (
    <AvatarContext.Provider value={{ selection, setSelection, uploadCustom }}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error("useAvatar must be used within AvatarProvider");
  return ctx;
}
