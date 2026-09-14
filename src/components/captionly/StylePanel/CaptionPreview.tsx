import { useEffect, useMemo, useState } from "react";
import { DEFAULT_STYLE } from "@/lib/captions/types";
import { TEMPLATES, mapTemplateToStyle, hexToRgba } from "./stylePanelConstants";

export function CaptionPreview({ t }: { t: typeof TEMPLATES[number] }) {
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCycle((prev) => prev + 1);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const tempStyle = useMemo(() => {
    return { ...DEFAULT_STYLE, ...mapTemplateToStyle(t) };
  }, [t]);

  return (
    <div className="w-full text-center">
      <span
        key={cycle}
        className={`cap-anim cap-anim-${tempStyle.animation}`}
        style={{
          fontFamily: `"${tempStyle.fontFamily}", sans-serif`,
          fontWeight: tempStyle.fontWeight,
          fontSize: "14px",
          color: tempStyle.color,
          backgroundColor: tempStyle.bgOpacity > 0 ? hexToRgba(tempStyle.bgColor, tempStyle.bgOpacity) : "transparent",
          borderRadius: tempStyle.bgOpacity > 0 ? "4px" : 0,
          padding: tempStyle.bgOpacity > 0 ? "2px 6px" : 0,
          WebkitTextStroke: tempStyle.strokeWidth > 0 ? `0.5px ${tempStyle.strokeColor}` : "none",
        }}
      >
        {t.text} <span style={{ color: tempStyle.karaoke ? tempStyle.highlightColor : tempStyle.color }}>{t.highlight}</span>
      </span>
    </div>
  );
}
