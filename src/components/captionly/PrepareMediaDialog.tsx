import { useEffect, useRef, useState } from "react";
import { X, Languages, Smile, Sparkles, ArrowRight, Play } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export type PrepareOptions = {
  language: string; // ISO 639-3 or "" for auto
  translate: boolean;
  emojis: boolean;
};

type Props = {
  open: boolean;
  videoUrl: string | null;
  fileName?: string | null;
  onCancel: () => void;
  onConfirm: (opts: PrepareOptions) => void;
};

const LANGUAGES: { code: string; label: string }[] = [
  { code: "", label: "Auto-detect" },
  { code: "eng", label: "English" },
  { code: "spa", label: "Spanish" },
  { code: "fra", label: "French" },
  { code: "deu", label: "German" },
  { code: "ita", label: "Italian" },
  { code: "por", label: "Portuguese" },
  { code: "nld", label: "Dutch" },
  { code: "rus", label: "Russian" },
  { code: "ukr", label: "Ukrainian" },
  { code: "pol", label: "Polish" },
  { code: "tur", label: "Turkish" },
  { code: "ara", label: "Arabic" },
  { code: "heb", label: "Hebrew" },
  { code: "hin", label: "Hindi" },
  { code: "ben", label: "Bengali" },
  { code: "urd", label: "Urdu" },
  { code: "tam", label: "Tamil" },
  { code: "tel", label: "Telugu" },
  { code: "mar", label: "Marathi" },
  { code: "guj", label: "Gujarati" },
  { code: "pan", label: "Punjabi" },
  { code: "jpn", label: "Japanese" },
  { code: "kor", label: "Korean" },
  { code: "zho", label: "Chinese (Mandarin)" },
  { code: "yue", label: "Chinese (Cantonese)" },
  { code: "tha", label: "Thai" },
  { code: "vie", label: "Vietnamese" },
  { code: "ind", label: "Indonesian" },
  { code: "msa", label: "Malay" },
  { code: "fil", label: "Filipino" },
  { code: "swa", label: "Swahili" },
  { code: "ron", label: "Romanian" },
  { code: "ces", label: "Czech" },
  { code: "ell", label: "Greek" },
  { code: "swe", label: "Swedish" },
  { code: "nor", label: "Norwegian" },
  { code: "dan", label: "Danish" },
  { code: "fin", label: "Finnish" },
];

export function PrepareMediaDialog({ open, videoUrl, fileName, onCancel, onConfirm }: Props) {
  const [language, setLanguage] = useState("");
  const [translate, setTranslate] = useState(false);
  const [emojis, setEmojis] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (open) {
      setLanguage("");
      setTranslate(false);
      setEmojis(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      style={{ fontFamily: "'Outfit', sans-serif" }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-white/10 bg-[#101114] text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight">Prepare Your Media</h2>
            <p className="mt-0.5 text-[13px] text-white/55">
              Select a language to transcribe your media.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-md p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Video preview */}
        <div className="px-5">
          <div className="mx-auto flex max-w-[280px] flex-col items-center">
            <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black">
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="h-auto w-full"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <div className="aspect-video w-full" />
              )}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
                  <Play className="h-4 w-4 fill-white text-white" />
                </div>
              </div>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-white/55">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Ready for processing
              {fileName && <span className="text-white/30">· {fileName}</span>}
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="space-y-3 px-5 pt-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <Languages className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[13.5px] font-medium">Language Settings</div>
              <div className="text-[11.5px] text-white/45">Configure the source language</div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11.5px] text-white/55">
              What language is spoken?
            </label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-10 w-full rounded-lg border-white/10 bg-white/5 text-[13px] text-white hover:bg-white/[0.07] focus:ring-0">
                <SelectValue placeholder="Choose spoken language" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code || "auto"} value={l.code || "auto"}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Translate */}
        <div className="px-5 pt-3">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-medium">Translation</div>
              <div className="text-[11.5px] text-white/50">
                Automatically translate captions to English
              </div>
            </div>
            <Switch checked={translate} onCheckedChange={setTranslate} />
          </div>
        </div>

        {/* Emojis */}
        <div className="px-5 pt-2.5">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
              <Smile className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-medium">Emojis</div>
              <div className="text-[11.5px] text-white/50">
                Add engaging emojis to your captions automatically
              </div>
            </div>
            <Switch checked={emojis} onCheckedChange={setEmojis} />
          </div>
        </div>

        {/* CTA */}
        <div className="p-5">
          <button
            onClick={() =>
              onConfirm({
                language: language === "auto" ? "" : language,
                translate,
                emojis,
              })
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-[13.5px] font-medium text-white transition hover:bg-emerald-500"
          >
            Generate Transcription
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
