import { useState } from "react";
import { Sparkles, Type, SlidersHorizontal, Globe, Download, Check } from "lucide-react";

interface StyleDefinition {
  label: string;
  color: string;
  fontWeight: number;
  letterSpacing: string;
  textShadow: string;
  background: string;
  border: string;
  boxShadow: string;
  padded?: boolean;
}

const STYLES: Record<string, StyleDefinition> = {
  amber: {
    label: "Amber Glow",
    color: "#FFB020",
    fontWeight: 800,
    letterSpacing: "0.02em",
    textShadow: "0 2px 0 rgba(0,0,0,0.5)",
    background: "transparent",
    border: "none",
    boxShadow: "none",
  },
  tiktok: {
    label: "TikTok Style",
    color: "#FFFFFF",
    fontWeight: 900,
    letterSpacing: "0.01em",
    textShadow:
      "-2px -2px 0 #FE2C55, 2px -2px 0 #25F4EE, -2px 2px 0 #FE2C55, 2px 2px 0 #25F4EE, 0 0 6px rgba(0,0,0,0.4)",
    background: "transparent",
    border: "none",
    boxShadow: "none",
  },
  neon: {
    label: "Neon Glow",
    color: "#FF3B3B",
    fontWeight: 800,
    letterSpacing: "0.02em",
    textShadow:
      "0 0 4px #FF3B3B, 0 0 11px #FF3B3B, 0 0 19px #FF3B3B, 0 0 40px #FF0000, 0 0 80px #FF0000",
    background: "transparent",
    border: "none",
    boxShadow: "none",
  },
  srt: {
    label: "Classic SRT",
    color: "#FFFFFF",
    fontWeight: 600,
    letterSpacing: "0",
    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
    background: "rgba(0,0,0,0.75)",
    border: "1px solid rgba(255,255,255,0.15)",
    boxShadow: "none",
    padded: true,
  },
};

const NAV = [
  { icon: Sparkles, label: "Auto-Transcribe" },
  { icon: Type, label: "Style Presets", active: true },
  { icon: SlidersHorizontal, label: "Smart Timeline" },
  { icon: Globe, label: "Global Translation" },
  { icon: Download, label: "Pro Exports" },
];

export default function StylePresetsDemo() {
  const [activeStyle, setActiveStyle] = useState<string>("amber");
  const [sampleText, setSampleText] = useState<string>("AMBER GLOW");
  const [editing, setEditing] = useState<boolean>(false);

  const style = STYLES[activeStyle] || STYLES.amber;

  const handleStyleClick = (key: string) => {
    setActiveStyle(key);
    const selectedStyle = STYLES[key];
    if (selectedStyle && !editing) {
      setSampleText(selectedStyle.label.toUpperCase());
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 15% 10%, rgba(255,120,20,0.06), transparent 40%), #0A0908",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        padding: "40px 24px",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        {/* Nav */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 32,
          }}
        >
          {NAV.map(({ icon: Icon, label, active }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 999,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "default",
                userSelect: "none",
                transition: "all 0.2s ease",
                ...(active
                  ? {
                      background:
                        "linear-gradient(135deg, #FF6A2C, #FF8A3D)",
                      color: "#150900",
                      boxShadow: "0 0 0 2px #FF9A54, 0 4px 16px rgba(255,106,44,0.35)",
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.55)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }),
              }}
            >
              <Icon size={15} strokeWidth={2.4} />
              {label}
            </div>
          ))}
        </div>

        {/* Panel */}
        <div
          style={{
            background: "rgba(20,17,15,0.9)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: 40,
            display: "grid",
            gridTemplateColumns: "minmax(220px, 320px) 1fr",
            gap: 40,
          }}
        >
          {/* Left copy */}
          <div>
            <h2
              style={{
                color: "#FFFFFF",
                fontSize: 24,
                fontWeight: 800,
                margin: "0 0 14px",
                letterSpacing: "-0.01em",
              }}
            >
              Viral caption styles at your disposal
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 14.5,
                lineHeight: 1.6,
                margin: "0 0 22px",
              }}
            >
              Change colors, font weight, border outlines, and backgrounds in
              one click. Support for Google Fonts and custom file uploads.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[
                "Custom font file uploads (.ttf/.otf)",
                "Bouncy animation presets",
                "Subtitle block backgrounds",
              ].map((item) => (
                <li
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    marginBottom: 12,
                    fontSize: 14,
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  <Check
                    size={16}
                    strokeWidth={3}
                    color="#FF6A2C"
                    style={{ marginTop: 2, flexShrink: 0 }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right preview */}
          <div>
            <div
              style={{
                background: "rgba(0,0,0,0.35)",
                border: "1px dashed rgba(255,255,255,0.18)",
                borderRadius: 14,
                minHeight: 110,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 20px",
                marginBottom: 18,
                position: "relative",
              }}
              onClick={() => setEditing(true)}
            >
              {editing ? (
                <input
                  autoFocus
                  value={sampleText}
                  onChange={(e) => setSampleText(e.target.value.toUpperCase())}
                  onBlur={() => setEditing(false)}
                  onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    textAlign: "center",
                    width: "100%",
                    fontSize: 28,
                    color: style.color,
                    fontWeight: style.fontWeight,
                    letterSpacing: style.letterSpacing,
                    textShadow: style.textShadow,
                    fontFamily: "inherit",
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: 28,
                    color: style.color,
                    fontWeight: style.fontWeight,
                    letterSpacing: style.letterSpacing,
                    textShadow: style.textShadow,
                    background: style.background,
                    border: style.border,
                    padding: style.padded ? "8px 18px" : 0,
                    borderRadius: style.padded ? 8 : 0,
                    cursor: "text",
                  }}
                >
                  {sampleText}
                </span>
              )}
              <span
                style={{
                  position: "absolute",
                  bottom: 8,
                  right: 12,
                  fontSize: 10.5,
                  color: "rgba(255,255,255,0.28)",
                  letterSpacing: "0.03em",
                }}
              >
                click text to edit
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              {Object.entries(STYLES)
                .filter(([key]) => key !== "amber")
                .map(([key, s]) => {
                  const isActive = activeStyle === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleStyleClick(key)}
                      style={{
                        padding: "14px 10px",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        background: isActive
                          ? "rgba(255,106,44,0.12)"
                          : "rgba(255,255,255,0.03)",
                        border: isActive
                          ? "1px solid #FF6A2C"
                          : "1px solid rgba(255,255,255,0.08)",
                        color: key === "neon" ? "#FF5C5C" : "#FFFFFF",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
