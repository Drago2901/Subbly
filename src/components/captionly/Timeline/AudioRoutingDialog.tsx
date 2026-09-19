import React, { useRef, useState } from "react";
import { Mic, Music, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AudioRoutingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddAudioFile: (target: "vocal" | "audioSfx", file: File) => void;
}

export const AudioRoutingDialog: React.FC<AudioRoutingDialogProps> = ({
  open,
  onOpenChange,
  onAddAudioFile,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<"vocal" | "audioSfx" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectOption = (target: "vocal" | "audioSfx") => {
    setSelectedTarget(target);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedTarget) {
      onAddAudioFile(selectedTarget, file);
      onOpenChange(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3,audio/wav,audio/mpeg,audio/m4a,audio/ogg,audio/aac,audio/webm,.mp3,.wav,.m4a,.ogg,.aac"
        onChange={handleFileChange}
        className="hidden"
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-card border border-border shadow-2xl rounded-2xl p-6 select-none z-50">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              Add Audio Track
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select the audio destination to route into the appropriate timeline track.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            {/* 1. Voice / Voiceover (Routes to 🎙️ Vocal) */}
            <button
              type="button"
              onClick={() => handleSelectOption("vocal")}
              className="flex items-start gap-3.5 p-3.5 rounded-xl border border-border bg-secondary/40 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition text-left cursor-pointer group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 group-hover:scale-105 transition flex-shrink-0">
                <Mic className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">🎙️ Voice / Voiceover</span>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    Vocal Track
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Speech, dialogues, voice recording, or voiceover audio with vocal waveform analysis.
                </p>
              </div>
            </button>

            {/* 2. Music / Sound Effects (Routes to 🔊 Audio / SFX) */}
            <button
              type="button"
              onClick={() => handleSelectOption("audioSfx")}
              className="flex items-start gap-3.5 p-3.5 rounded-xl border border-border bg-secondary/40 hover:bg-teal-500/10 hover:border-teal-500/40 transition text-left cursor-pointer group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/15 text-teal-400 group-hover:scale-105 transition flex-shrink-0">
                <Music className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">🔊 Music / SFX</span>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">
                    Audio / SFX Track
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Background music, sound effects, whooshes, meme sounds, and ambient tracks with volume & fade controls.
                </p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
