import { useRef, useState } from "react";
import { X, Upload, Camera, Loader2 } from "lucide-react";
import {
  useAvatar,
  buildSpriteStyle,
  SPRITE_M_COLS,
  SPRITE_M_ROWS,
  SPRITE_M_TOTAL,
  SPRITE_F_COLS,
  SPRITE_F_ROWS,
  SPRITE_F_TOTAL,
  type AvatarSelection,
} from "@/hooks/useAvatar";

// ── Character name arrays (match the reference images) ─────────────────
const MALE_NAMES = [
  "Lelouch Lamperouge", "Monkey D. Luffy", "Levi Ackerman", "L (Lawliet)", "Roronoa Zoro", "Killua Zoldyck",
  "Okabe Rintarou", "Light Yagami", "Edward Elric", "Naruto Uzumaki", "Guts", "Sakata Gintoki",
  "Eren Yeager", "Kurisu Makise", "Itachi Uchiha", "Satoru Gojo", "Mikasa Ackerman", "Ken Kaneki",
  "Hachiman Hikigaya", "Kakashi Hatake", "Spike Spiegel", "Saitama", "Rem",
];

const FEMALE_NAMES = [
  "Mikasa Ackerman", "Nezuko Kamado", "Sailor Moon", "Makima", "Yor Forger",
  "C.C.", "Violet Evergarden", "Erza Scarlet", "Nico Robin", "Mai Sakurajima",
];

// Aura color per character (matches the glowing aura in reference images)
const MALE_AURA_COLORS = [
  "#a855f7", "#ff6b00", "#1e90ff", "#00bcd4", "#22c55e", "#3b82f6",
  "#06b6d4", "#ef4444", "#fbbf24", "#f97316", "#dc2626", "#a78bfa",
  "#22d3ee", "#e879f9", "#ef4444", "#6366f1", "#7c3aed", "#f472b6",
  "#64748b", "#38bdf8", "#f59e0b", "#fde047", "#93c5fd",
];

const FEMALE_AURA_COLORS = [
  "#ef4444", "#f472b6", "#3b82f6", "#ef4444", "#f59e0b",
  "#22c55e", "#38bdf8", "#dc2626", "#f97316", "#8b5cf6",
];

type Props = {
  open: boolean;
  onClose: () => void;
};

type TabId = "male" | "female";

export function AvatarPickerModal({ open, onClose }: Props) {
  const { selection, setSelection, uploadCustom } = useAvatar();
  const [tab, setTab] = useState<TabId>("male");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleSelect = (sel: AvatarSelection) => {
    setSelection(sel);
    onClose();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadCustom(file);
      if (url) {
        handleSelect({ type: "custom", url });
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const renderGrid = (
    sprite: "m" | "f",
    cols: number,
    rows: number,
    total: number,
    names: string[],
    auraColors: string[],
  ) => {
    const items: JSX.Element[] = [];

    // Prominent "From Gallery" upload button as the first option
    items.push(
      <button
        key="custom-upload-card"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="group flex flex-col items-center gap-1.5 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        aria-label="Upload custom avatar from gallery"
      >
        <div className="relative">
          {/* Aura glow on hover */}
          <div
            className="absolute -inset-2 rounded-full opacity-0 group-hover:opacity-85 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle, #ff5c3a44 0%, #ff5c3a00 70%)`,
              filter: "blur(6px)",
            }}
          />
          {/* Dash border circle */}
          <div className="relative z-10 flex h-[80px] w-[80px] items-center justify-center rounded-full border-2 border-dashed border-white/10 bg-white/[0.03] group-hover:border-[#ff5c3a]/60 group-hover:bg-[#ff5c3a]/5 transition-all duration-200">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#ff5c3a]" />
            ) : (
              <Upload className="h-6 w-6 text-white/30 group-hover:text-[#ff5c3a] transition-colors" strokeWidth={2.2} />
            )}
          </div>
        </div>
        <span className="max-w-[85px] truncate text-[10px] font-semibold text-white/60 group-hover:text-white transition-colors">
          {uploading ? "Uploading..." : "From Gallery"}
        </span>
      </button>
    );

    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (idx >= total) break;
        const col = c;
        const row = r;
        const name = names[idx] || "";
        const aura = auraColors[idx] || "#f97316";
        const isSelected =
          selection?.type === "sprite" &&
          selection.sprite === sprite &&
          selection.col === col &&
          selection.row === row;

        items.push(
          <button
            key={`${sprite}-${col}-${row}`}
            onClick={() => handleSelect({ type: "sprite", sprite, col, row })}
            className="group flex flex-col items-center gap-1.5 transition-transform hover:scale-105 active:scale-95"
            aria-label={`Select avatar ${name}`}
          >
            <div className="relative">
              {/* Aura glow */}
              <div
                className="absolute -inset-2 rounded-full opacity-0 group-hover:opacity-80 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle, ${aura}55 0%, ${aura}00 70%)`,
                  filter: "blur(6px)",
                }}
              />
              {isSelected && (
                <div
                  className="absolute -inset-1.5 rounded-full animate-pulse"
                  style={{
                    background: `conic-gradient(from 0deg, ${aura}, transparent, ${aura})`,
                    filter: "blur(3px)",
                  }}
                />
              )}
              {/* Avatar circle */}
              <div
                className={`relative z-10 overflow-hidden rounded-full border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-orange-400 shadow-lg shadow-orange-500/30 ring-2 ring-orange-400/50"
                    : "border-white/10 hover:border-white/30"
                }`}
                style={buildSpriteStyle(col, row, sprite, 80)}
              />
            </div>
            <span className="max-w-[85px] truncate text-[10px] font-medium text-white/70 group-hover:text-white transition-colors">
              {name}
            </span>
          </button>,
        );
        idx++;
      }
    }
    return items;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative mx-4 flex max-h-[85vh] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f14] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Choose Your Avatar
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6">
          {(["male", "female"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-5 py-3 text-sm font-semibold capitalize transition ${
                tab === t
                  ? "text-orange-400"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {t === "male" ? "🦸‍♂️ Male" : "🦸‍♀️ Female"}
              {tab === t && (
                <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-orange-400" />
              )}
            </button>
          ))}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-4 gap-5 sm:grid-cols-5 md:grid-cols-6">
            {tab === "male"
              ? renderGrid("m", SPRITE_M_COLS, SPRITE_M_ROWS, SPRITE_M_TOTAL, MALE_NAMES, MALE_AURA_COLORS)
              : renderGrid("f", SPRITE_F_COLS, SPRITE_F_ROWS, SPRITE_F_TOTAL, FEMALE_NAMES, FEMALE_AURA_COLORS)}
          </div>
        </div>

        {/* Footer hint */}
        <div className="border-t border-white/5 bg-white/[0.02] px-6 py-3 text-center text-[11px] text-white/30">
          Click an avatar to select • Upload a custom image for a personalized look
        </div>
      </div>
    </div>
  );
}
