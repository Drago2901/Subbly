import React, { useState } from "react";

interface HangingPendantLampProps {
  isLit: boolean;
  isFlickering: boolean;
  onActivate: () => void;
}

export const HangingPendantLamp: React.FC<HangingPendantLampProps> = ({
  isLit,
  isFlickering,
  onActivate,
}) => {
  const [isPulling, setIsPulling] = useState(false);

  const handleTrigger = () => {
    if (isLit) return;
    setIsPulling(true);
    setTimeout(() => setIsPulling(false), 240);
    onActivate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTrigger();
    }
  };

  return (
    <div className={`pendant-lamp-container ${isLit ? "lamp-active" : "lamp-inactive"}`}>
      {/* Light cone beam projection */}
      <div className={`lamp-light-beam ${isLit ? "beam-visible" : ""} ${isFlickering ? "beam-flicker" : ""}`} />

      {/* Main Lamp Interactive Click Area & Pull Cord */}
      <div
        className={`lamp-fixture-group ${isPulling ? "lamp-swaying" : ""}`}
        onClick={handleTrigger}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label="Turn on the lamp to begin"
      >
        {/* Subtle Bulb Glow/Flicker Overlay aligned with the 3D rendered bulb */}
        <div className={`lamp-bulb-overlay ${isLit ? "bulb-lit" : ""} ${isFlickering ? "bulb-flicker" : ""}`} />

        {/* Pull Cord & Golden Brass Beaded Knob */}
        <div
          className={`lamp-pull-cord-assembly ${isPulling ? "cord-pulled" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            handleTrigger();
          }}
          title="Pull cord to turn on Subbly light"
        >
          <div className="lamp-pull-string" />
          <div className="lamp-pull-knob" />
        </div>
      </div>

      {/* Handwritten Hint & Curved Arrow (Only visible before lamp is turned on) */}
      {!isLit && (
        <div className="lamp-hint-wrapper" onClick={handleTrigger}>
          <span className="lamp-hint-text">Tap the light to begin…</span>
          <svg
            className="lamp-hint-arrow"
            viewBox="0 0 70 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Subtle organic curved dashed arrow pointing towards the pull knob */}
            <path
              d="M10 38 C 24 44, 46 36, 52 14"
              stroke="#FF8A3D"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeDasharray="4 3"
            />
            <path
              d="M44 18 L52 12 L56 22"
              stroke="#FF8A3D"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
