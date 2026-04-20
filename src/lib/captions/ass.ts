import type { Caption, CaptionStyle } from "./types";

// Convert "#RRGGBB" + alpha (0..1) -> ASS color &HAABBGGRR (alpha is INVERTED in ASS: 0=opaque)
function toAssColor(hex: string, alpha = 1): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const a = Math.round((1 - alpha) * 255);
  const hh = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return `&H${hh(a)}${hh(b)}${hh(g)}${hh(r)}`;
}

function secondsToAssTime(t: number): string {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const cs = Math.floor((t - Math.floor(t)) * 100);
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${cs
    .toString()
    .padStart(2, "0")}`;
}

function escapeAss(s: string) {
  return s.replace(/\n/g, "\\N").replace(/\{/g, "(").replace(/\}/g, ")");
}

/**
 * Build an ASS subtitle file. PlayRes is set to the actual video size so
 * fontSize (in px relative to that height) is honored 1:1 when burned in.
 */
export function buildAss(
  captions: Caption[],
  style: CaptionStyle,
  videoWidth: number,
  videoHeight: number,
): string {
  const alignment = style.position === "top" ? 8 : style.position === "middle" ? 5 : 2;
  const marginV = style.position === "middle" ? 0 : Math.round(videoHeight * 0.08);

  const primary = toAssColor(style.color, 1);
  // SecondaryColour is what karaoke (\k) reveals as it sweeps — use the highlight color
  const secondary = toAssColor(style.highlightColor, 1);
  const back = toAssColor(style.bgColor, style.bgOpacity);
  const outline = toAssColor("#000000", 1);
  const bold = style.bold ? -1 : 0;
  const borderStyle = style.bgOpacity > 0.02 ? 3 : 1;

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontFamily},${style.fontSize},${primary},${secondary},${outline},${back},${bold},0,0,0,100,100,0,0,${borderStyle},2,0,${alignment},40,40,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const lines = captions
    .map((c) => {
      let body: string;
      if (style.karaoke && c.words && c.words.length > 0) {
        // Per-word color animation: at each word's start, snap text color to highlight,
        // then snap back to base at the word's end. Times are in ms relative to line start.
        const segments = c.words.map((w) => {
          const startMs = Math.max(0, Math.round((w.start - c.start) * 1000));
          const endMs = Math.max(startMs + 1, Math.round((w.end - c.start) * 1000));
          const txt = style.uppercase ? w.text.toUpperCase() : w.text;
          return `{\\t(${startMs},${startMs},\\1c${stripAlpha(secondary)})\\t(${endMs},${endMs},\\1c${stripAlpha(primary)})}${escapeAss(txt)}`;
        });
        body = segments.join("");
      } else {
        const text = style.uppercase ? c.text.toUpperCase() : c.text;
        body = escapeAss(text);
      }
      return `Dialogue: 0,${secondsToAssTime(c.start)},${secondsToAssTime(c.end)},Default,,0,0,0,,${body}`;
    })
    .join("\n");

  return header + lines + "\n";
}

// ASS color override tags use &HBBGGRR& (no alpha). Strip the alpha byte.
function stripAlpha(assColor: string): string {
  // assColor like &HAABBGGRR
  const hex = assColor.replace("&H", "");
  const bbggrr = hex.substring(2);
  return `&H${bbggrr}&`;
}
