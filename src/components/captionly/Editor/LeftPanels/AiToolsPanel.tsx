import React from "react";
import { Wand2, Globe, Sparkles, Trash2, Loader2, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CaptionStyle } from "@/lib/captions/types";

interface AiToolsPanelProps {
  language: string;
  languages: { code: string; label: string }[];
  onLanguageChange: (lang: string) => void;
  translating: boolean;
  transcribing: boolean;
  transcribeStage?: string;
  onTranscribe: () => void;
  hasCaptions: boolean;
  style: CaptionStyle;
  onStyleChange: (s: CaptionStyle) => void;
  onStripEmojis: () => void;
}

export const AiToolsPanel: React.FC<AiToolsPanelProps> = ({
  language,
  languages,
  onLanguageChange,
  translating,
  transcribing,
  transcribeStage,
  onTranscribe,
  hasCaptions,
  style,
  onStyleChange,
  onStripEmojis,
}) => {
  return (
    <div className="p-4 space-y-6 text-foreground select-none">
      {/* 1. Speech Auto-Transcription */}
      <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <Wand2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">AI Speech Transcription</span>
            <span className="text-[10px] text-muted-foreground">Whisper AI / Groq LPU speed</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onTranscribe}
          disabled={transcribing}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-bold transition hover:opacity-95 disabled:opacity-60 shadow-glow cursor-pointer active:scale-98"
        >
          {transcribing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{transcribeStage || "Transcribing Speech…"}</span>
            </>
          ) : (
            <>
              <Wand2 className="h-3.5 w-3.5" />
              <span>{hasCaptions ? "Re-Transcribe Video" : "Generate Captions Automatically"}</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Global Language Translation */}
      <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <Globe className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">AI Multi-Language Translation</span>
            <span className="text-[10px] text-muted-foreground">Translate subtitles into 25+ languages</span>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-medium text-muted-foreground">Target Language</label>
          <Select value={language} onValueChange={onLanguageChange} disabled={translating}>
            <SelectTrigger className="w-full rounded-lg border border-border bg-card text-xs font-bold text-foreground focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[260px] overflow-y-auto bg-popover border border-border text-popover-foreground">
              {languages.map((l) => (
                <SelectItem key={l.code} value={l.code} className="text-xs font-semibold cursor-pointer">
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {translating && (
          <div className="flex items-center gap-2 text-xs text-primary font-medium">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Translating subtitle lines…</span>
          </div>
        )}
      </div>

      {/* 3. Viral Context Emojis */}
      <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">AI Context Emojis</span>
              <span className="text-[10px] text-muted-foreground">Auto-match emojis with words</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onStyleChange({ ...style, emojiEnabled: !style.emojiEnabled })}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
              style.emojiEnabled
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {style.emojiEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        {style.emojiEnabled && (
          <div className="space-y-2 pt-1 border-t border-border/50">
            <span className="text-[11px] font-medium text-muted-foreground">Emoji Frequency</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(["light", "medium", "heavy"] as const).map((density) => (
                <button
                  key={density}
                  type="button"
                  onClick={() => onStyleChange({ ...style, emojiDensity: density })}
                  className={`py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                    (style.emojiDensity || "medium") === density
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {density}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onStripEmojis}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-border text-[11px] font-semibold text-muted-foreground hover:text-rose-400 hover:border-rose-400/40 transition cursor-pointer"
        >
          <Trash2 className="h-3 w-3" />
          <span>Remove All Emojis from Captions</span>
        </button>
      </div>
    </div>
  );
};
