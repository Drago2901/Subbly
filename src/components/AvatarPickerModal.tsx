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

// ── Character configuration array (matches the reference images) ───────
const CHARACTERS: {
  name: string;
  category: "male" | "female";
  sprite: "m" | "f";
  col: number;
  row: number;
  aura: string;
}[] = [
  // Male characters
  { name: "Lelouch Lamperouge", category: "male", sprite: "m", col: 0, row: 0, aura: "#a855f7" },
  { name: "Monkey D. Luffy", category: "male", sprite: "m", col: 1, row: 0, aura: "#ff6b00" },
  { name: "Levi Ackerman", category: "male", sprite: "m", col: 2, row: 0, aura: "#1e90ff" },
  { name: "L (Lawliet)", category: "male", sprite: "m", col: 3, row: 0, aura: "#00bcd4" },
  { name: "Roronoa Zoro", category: "male", sprite: "m", col: 4, row: 0, aura: "#22c55e" },
  { name: "Killua Zoldyck", category: "male", sprite: "m", col: 5, row: 0, aura: "#3b82f6" },
  { name: "Okabe Rintarou", category: "male", sprite: "m", col: 0, row: 1, aura: "#06b6d4" },
  { name: "Light Yagami", category: "male", sprite: "m", col: 1, row: 1, aura: "#ef4444" },
  { name: "Edward Elric", category: "male", sprite: "m", col: 2, row: 1, aura: "#fbbf24" },
  { name: "Naruto Uzumaki", category: "male", sprite: "m", col: 3, row: 1, aura: "#f97316" },
  { name: "Guts", category: "male", sprite: "m", col: 4, row: 1, aura: "#dc2626" },
  { name: "Sakata Gintoki", category: "male", sprite: "m", col: 5, row: 1, aura: "#a78bfa" },
  { name: "Eren Yeager", category: "male", sprite: "m", col: 0, row: 2, aura: "#22d3ee" },
  { name: "Itachi Uchiha", category: "male", sprite: "m", col: 2, row: 2, aura: "#ef4444" },
  { name: "Satoru Gojo", category: "male", sprite: "m", col: 3, row: 2, aura: "#6366f1" },
  { name: "Ken Kaneki", category: "male", sprite: "m", col: 5, row: 2, aura: "#f472b6" },
  { name: "Hachiman Hikigaya", category: "male", sprite: "m", col: 0, row: 3, aura: "#64748b" },
  { name: "Kakashi Hatake", category: "male", sprite: "m", col: 1, row: 3, aura: "#38bdf8" },
  { name: "Spike Spiegel", category: "male", sprite: "m", col: 2, row: 3, aura: "#f59e0b" },
  { name: "Saitama", category: "male", sprite: "m", col: 3, row: 3, aura: "#fde047" },

  // Female characters
  { name: "Kurisu Makise", category: "female", sprite: "m", col: 1, row: 2, aura: "#e879f9" },
  { name: "Mikasa Ackerman", category: "female", sprite: "m", col: 4, row: 2, aura: "#7c3aed" },
  { name: "Rem", category: "female", sprite: "m", col: 4, row: 3, aura: "#93c5fd" },
  { name: "Mikasa Ackerman", category: "female", sprite: "f", col: 0, row: 0, aura: "#ef4444" },
  { name: "Nezuko Kamado", category: "female", sprite: "f", col: 1, row: 0, aura: "#f472b6" },
  { name: "Sailor Moon", category: "female", sprite: "f", col: 2, row: 0, aura: "#3b82f6" },
  { name: "Makima", category: "female", sprite: "f", col: 3, row: 0, aura: "#ef4444" },
  { name: "Yor Forger", category: "female", sprite: "f", col: 4, row: 0, aura: "#f59e0b" },
  { name: "C.C.", category: "female", sprite: "f", col: 0, row: 1, aura: "#22c55e" },
  { name: "Violet Evergarden", category: "female", sprite: "f", col: 1, row: 1, aura: "#38bdf8" },
  { name: "Erza Scarlet", category: "female", sprite: "f", col: 2, row: 1, aura: "#dc2626" },
  { name: "Nico Robin", category: "female", sprite: "f", col: 3, row: 1, aura: "#f97316" },
  { name: "Mai Sakurajima", category: "female", sprite: "f", col: 4, row: 1, aura: "#8b5cf6" },
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

  const renderGrid = (activeTab: TabId) => {
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

    const filtered = CHARACTERS.filter((c) => c.category === activeTab);

    filtered.forEach((char) => {
      const isSelected =
        selection?.type === "sprite" &&
        selection.sprite === char.sprite &&
        selection.col === char.col &&
        selection.row === char.row;

      items.push(
        <button
          key={`${char.sprite}-${char.col}-${char.row}`}
          onClick={() => handleSelect({ type: "sprite", sprite: char.sprite, col: char.col, row: char.row })}
          className="group flex flex-col items-center gap-1.5 transition-transform hover:scale-105 active:scale-95"
          aria-label={`Select avatar ${char.name}`}
        >
          <div className="relative">
            {/* Aura glow */}
            <div
              className="absolute -inset-2 rounded-full opacity-0 group-hover:opacity-80 transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle, ${char.aura}55 0%, ${char.aura}00 70%)`,
                filter: "blur(6px)",
              }}
            />
            {isSelected && (
              <div
                className="absolute -inset-1.5 rounded-full animate-pulse"
                style={{
                  background: `conic-gradient(from 0deg, ${char.aura}, transparent, ${char.aura})`,
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
              style={buildSpriteStyle(char.col, char.row, char.sprite, 80)}
            />
          </div>
          <span className="max-w-[85px] truncate text-[10px] font-medium text-white/70 group-hover:text-white transition-colors">
            {char.name}
          </span>
        </button>,
      );
    });

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
            {renderGrid(tab)}
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
