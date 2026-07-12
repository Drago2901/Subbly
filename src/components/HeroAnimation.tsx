import { useState, useEffect } from "react";
import { 
  UploadCloud, Sparkles, Check, Languages, Sliders, 
  Download, Type, Palette, Globe, Play, MousePointer, 
  Settings, Film, Music, Scissors, Video, ChevronDown 
} from "lucide-react";

type Phase = "upload" | "analyze" | "captions" | "style" | "timeline" | "translate" | "export";

export function HeroAnimation() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [progress, setProgress] = useState(0);
  const [activeStyle, setActiveStyle] = useState<"tiktok" | "netflix" | "neon">("tiktok");
  const [activeLang, setActiveLang] = useState<"English" | "Spanish" | "French">("English");
  const [playing, setPlaying] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50, opacity: 0 });
  const [clickEffect, setClickEffect] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [timelineHandleOffset, setTimelineHandleOffset] = useState(45); // percent
  const [activeWordIdx, setActiveWordIdx] = useState(0);

  // Cycle animation phases
  useEffect(() => {
    let active = true;
    
    const runAnimation = async () => {
      if (!active) return;
      // 1. UPLOAD PHASE
      setPhase("upload");
      setProgress(0);
      setPlaying(false);
      setActiveLang("English");
      setActiveStyle("tiktok");
      setTimelineHandleOffset(45);
      setActiveWordIdx(0);
      setCurrentTime("0:00");
      // Animate cursor dragging file
      setCursorPos({ x: 75, y: 85, opacity: 1 });
      
      await delay(1200);
      if (!active) return;
      setCursorPos({ x: 50, y: 50, opacity: 1 });
      
      // Animate upload progress
      for (let i = 0; i <= 100; i += 5) {
        if (!active) return;
        setProgress(i);
        await delay(50);
      }
      triggerClick();
      await delay(800);
      if (!active) return;

      // 2. ANALYZE PHASE
      setPhase("analyze");
      setProgress(0);
      setCursorPos({ x: 20, y: 40, opacity: 0 }); // Hide cursor during AI work
      for (let i = 0; i <= 100; i += 4) {
        if (!active) return;
        setProgress(i);
        await delay(70);
      }
      await delay(500);
      if (!active) return;

      // 3. CAPTIONS PLAYBACK PHASE
      setPhase("captions");
      setPlaying(true);
      setCursorPos({ x: 50, y: 50, opacity: 0 });
      // Cycle words
      for (let i = 0; i < 4; i++) {
        if (!active) return;
        setActiveWordIdx(i);
        setCurrentTime(`0:0${i + 1}`);
        await delay(800);
      }
      setPlaying(false);
      if (!active) return;

      // 4. STYLE TEMPLATES PHASE
      setPhase("style");
      // Move cursor to right sidebar style 1 (Netflix)
      setCursorPos({ x: 84, y: 28, opacity: 1 });
      await delay(800);
      if (!active) return;
      triggerClick();
      setActiveStyle("netflix");
      await delay(1000);
      if (!active) return;
      
      // Move cursor to right sidebar style 2 (Neon)
      setCursorPos({ x: 84, y: 40, opacity: 1 });
      await delay(800);
      if (!active) return;
      triggerClick();
      setActiveStyle("neon");
      await delay(1200);
      if (!active) return;

      // 5. TIMELINE EDITING PHASE
      setPhase("timeline");
      // Move cursor to timeline handle
      setCursorPos({ x: 52, y: 84, opacity: 1 });
      await delay(800);
      if (!active) return;
      // Drag handle
      setCursorPos({ x: 62, y: 84, opacity: 1 });
      setTimelineHandleOffset(55);
      await delay(1000);
      if (!active) return;

      // 6. TRANSLATE PHASE
      setPhase("translate");
      // Move cursor to top language selector
      setCursorPos({ x: 45, y: 15, opacity: 1 });
      await delay(800);
      if (!active) return;
      triggerClick();
      await delay(300);
      if (!active) return;
      // Move to Spanish
      setCursorPos({ x: 45, y: 24, opacity: 1 });
      await delay(500);
      if (!active) return;
      triggerClick();
      setActiveLang("Spanish");
      await delay(1200);
      if (!active) return;

      // 7. EXPORT PHASE
      setPhase("export");
      // Move to Export button
      setCursorPos({ x: 88, y: 15, opacity: 1 });
      await delay(800);
      if (!active) return;
      triggerClick();
      setProgress(0);
      for (let i = 0; i <= 100; i += 10) {
        if (!active) return;
        setProgress(i);
        await delay(100);
      }
      if (!active) return;
      // Pulsing click on download
      setCursorPos({ x: 50, y: 64, opacity: 1 });
      await delay(800);
      if (!active) return;
      triggerClick();
      await delay(2000); // Wait on completed screen
      
      // Reset loop
      if (active) {
        runAnimation();
      }
    };

    runAnimation();

    return () => {
      active = false;
    };
  }, []);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const triggerClick = () => {
    setClickEffect(true);
    setTimeout(() => setClickEffect(false), 300);
  };

  // Mock caption data
  const captionsData = {
    English: [
      { text: "Welcome", start: "0:00", end: "0:01" },
      { text: "to Subbly,", start: "0:01", end: "0:02" },
      { text: "the easiest AI", start: "0:02", end: "0:03" },
      { text: "caption editor", start: "0:03", end: "0:04" },
    ],
    Spanish: [
      { text: "Bienvenido", start: "0:00", end: "0:01" },
      { text: "a Subbly,", start: "0:01", end: "0:02" },
      { text: "el editor de subtítulos", start: "0:02", end: "0:03" },
      { text: "IA más fácil", start: "0:03", end: "0:04" },
    ],
    French: [
      { text: "Bienvenue", start: "0:00", end: "0:01" },
      { text: "sur Subbly,", start: "0:01", end: "0:02" },
      { text: "l'éditeur de sous-titres", start: "0:02", end: "0:03" },
      { text: "IA le plus simple", start: "0:03", end: "0:04" },
    ],
  };

  const currentCaptions = captionsData[activeLang];

  return (
    <div className="relative mx-auto w-full max-w-[840px] overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-950 p-1.5 shadow-2xl transition-all">
      {/* Top Browser Bar */}
      <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/40 bg-zinc-100/80 dark:bg-zinc-900/60 px-4 py-2 rounded-t-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400/85" />
          <div className="h-3 w-3 rounded-full bg-yellow-400/85" />
          <div className="h-3 w-3 rounded-full bg-green-400/85" />
        </div>
        <div className="flex h-5 w-48 items-center justify-center rounded bg-zinc-200/50 dark:bg-zinc-800/50 px-2 text-[10px] text-zinc-400 dark:text-zinc-505 font-mono tracking-tight">
          app.subbly.co/editor
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#ff5c3a] animate-pulse" />
          <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">AI Live Demo</span>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="relative flex h-[390px] w-full overflow-hidden bg-white dark:bg-zinc-900 transition-colors">
        
        {/* Left Side: Captions list & Navigation sidebar */}
        <div className="hidden w-[210px] border-r border-zinc-200/60 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-950/20 p-3 sm:flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Captions List</span>
              <span className="rounded bg-orange-100 dark:bg-orange-950/50 px-1 py-0.5 text-[8.5px] font-semibold text-[#ff5c3a]">{activeLang}</span>
            </div>
            
            {phase === "upload" && (
              <div className="flex flex-col gap-2 opacity-40">
                {[1, 2, 3].map((v) => (
                  <div key={v} className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800/40 animate-pulse" />
                ))}
              </div>
            )}
            
            {phase === "analyze" && (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((v) => (
                  <div key={v} className="flex flex-col gap-1 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-2 opacity-50">
                    <div className="h-2 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-2 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                ))}
              </div>
            )}

            {(phase !== "upload" && phase !== "analyze") && (
              <div className="flex flex-col gap-1.5 transition-all duration-300">
                {currentCaptions.map((cap, idx) => {
                  const isActive = idx === activeWordIdx && (phase === "captions" || playing);
                  return (
                    <div 
                      key={idx} 
                      className={`group flex items-start gap-2.5 rounded-lg border p-2 transition-all duration-200 ${
                        isActive 
                          ? "border-orange-200 bg-orange-50/50 dark:border-orange-950/40 dark:bg-orange-950/20" 
                          : "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
                      }`}
                    >
                      <span className={`font-mono text-[9px] font-medium leading-[14px] ${isActive ? "text-[#ff5c3a]" : "text-zinc-300 dark:text-zinc-650"}`}>
                        {cap.start}
                      </span>
                      <div className="flex-1">
                        <div className={`text-[11.5px] font-medium leading-[14px] ${isActive ? "text-[#ff5c3a]" : "text-zinc-700 dark:text-zinc-300"}`}>
                          {cap.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800/30 pt-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#ff5c3a]/10">
              <Sparkles className="h-3 w-3 text-[#ff5c3a]" />
            </div>
            <div className="text-[10px]">
              <div className="font-semibold text-zinc-700 dark:text-zinc-300">AI Auto-Correct</div>
              <div className="text-zinc-400 dark:text-zinc-500">99% precision</div>
            </div>
          </div>
        </div>

        {/* Center Panel: Video preview area */}
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
          
          {/* Editor Header Actions */}
          <div className="flex h-12 items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/40 bg-white dark:bg-zinc-900 px-4">
            <div className="flex items-center gap-1.5">
              <Film className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 truncate max-w-[100px] sm:max-w-none">tiktok_promo.mov</span>
            </div>
            
            {/* Lang Dropdown Simulation */}
            <div className="relative">
              <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition">
                <Globe className="h-3 w-3 text-[#ff5c3a]" />
                <span>Language: <strong className="text-zinc-800 dark:text-zinc-200">{activeLang}</strong></span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </div>
              {phase === "translate" && activeLang === "English" && (
                <div className="absolute right-0 top-7 z-10 w-28 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 shadow-lg transition animate-fade-in">
                  <div className="rounded px-2 py-1 text-[10px] text-zinc-450">Translate to...</div>
                  <div className="rounded px-2 py-1.5 text-[10.5px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[#ff5c3a]">Spanish</div>
                  <div className="rounded px-2 py-1.5 text-[10.5px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400">French</div>
                </div>
              )}
            </div>

            <button className="flex items-center gap-1 rounded-lg bg-[#ff5c3a] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#ff7558] transition shadow-[0_2px_6px_rgba(255,92,58,0.15)]">
              <span>Export</span>
            </button>
          </div>

          {/* Interactive Player Screen */}
          <div className="relative flex flex-1 items-center justify-center p-4">
            
            {/* 1. UPLOAD VIEW */}
            {phase === "upload" && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-6 text-center w-full max-w-[280px] shadow-sm">
                <div className="relative mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/20">
                  <UploadCloud className="h-5 w-5 text-[#ff5c3a] animate-bounce" />
                </div>
                <div className="text-[11.5px] font-bold text-zinc-800 dark:text-zinc-200">Drag video file here</div>
                <div className="text-[9.5px] text-zinc-400 dark:text-zinc-505 mb-4">MP4, MOV, WebM (up to 2GB)</div>
                {progress > 0 && (
                  <div className="w-full">
                    <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 dark:text-zinc-500 mb-1">
                      <span>Uploading...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-[#ff5c3a] rounded-full transition-all duration-75" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. ANALYZE VIEW */}
            {phase === "analyze" && (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100/55 dark:bg-orange-950/30">
                  <Sparkles className="h-6 w-6 text-[#ff5c3a] animate-pulse-scale" />
                  <div className="absolute inset-0 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin" />
                </div>
                <div className="text-[12.5px] font-bold text-zinc-800 dark:text-zinc-200">AI Transcription Active</div>
                <div className="text-[9.5px] text-zinc-400 dark:text-zinc-505 mt-1 max-w-[200px]">Generating timed transcription layers...</div>
                
                <div className="mt-5 w-40">
                  <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 dark:text-zinc-505 mb-1">
                    <span>Speech parsing</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#ff5c3a] to-[#ff8c73] rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* 3. CAPTIONS / STYLES / TIMELINE / TRANSLATE VIEW (Video mockup state) */}
            {(phase !== "upload" && phase !== "analyze" && phase !== "export") && (
              <div className="relative overflow-hidden aspect-[9/16] h-full max-h-[260px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 shadow-lg">
                {/* Mock Video Canvas */}
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-zinc-950 flex flex-col justify-between p-3.5">
                  <div className="flex items-start justify-between">
                    <span className="rounded-full bg-black/60 px-2 py-0.5 text-[8px] font-mono text-white/90 backdrop-blur-md">
                      HD 1080p
                    </span>
                    <span className="rounded-full bg-orange-500/95 px-2 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider animate-pulse-scale">
                      Active
                    </span>
                  </div>

                  {/* Dynamic Caption Template Overlay */}
                  <div className="flex-1 flex items-center justify-center px-2 py-8">
                    {/* Caption content */}
                    {activeStyle === "tiktok" && (
                      <div className="text-center font-extrabold uppercase tracking-wide text-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] scale-105 transition-all text-amber-400 select-none animate-pulse-scale">
                        {currentCaptions[activeWordIdx]?.text || "Subbly"}
                      </div>
                    )}
                    
                    {activeStyle === "netflix" && (
                      <div className="text-center font-sans font-medium text-xs text-white px-2 py-1 rounded bg-black/85 border border-white/5 transition-all shadow-md">
                        {currentCaptions[activeWordIdx]?.text || "Subbly"}
                      </div>
                    )}

                    {activeStyle === "neon" && (
                      <div className="text-center font-mono font-bold text-base text-white border border-[#ff5c3a] px-2.5 py-1 shadow-[0_0_15px_rgba(255,92,58,0.4)] transition-all bg-[#ff5c3a]/25 rounded">
                        {currentCaptions[activeWordIdx]?.text || "Subbly"}
                      </div>
                    )}
                  </div>

                  {/* Watermark badge */}
                  <div className="flex items-center justify-center opacity-40">
                    <span className="text-[7.5px] text-white/40">Powered by Subbly AI</span>
                  </div>
                </div>

                {/* Laser scan line overlay in timeline/style transition */}
                {phase === "style" && (
                  <div className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#ff5c3a] to-transparent animate-laser-scan pointer-events-none" />
                )}
              </div>
            )}

            {/* 7. EXPORT COMPLETED VIEW */}
            {phase === "export" && (
              <div className="flex flex-col items-center justify-center text-center p-4">
                {progress < 100 ? (
                  <div className="flex flex-col items-center">
                    <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/20">
                      <Film className="h-5.5 w-5.5 text-[#ff5c3a] animate-spin" />
                    </div>
                    <div className="text-[12.5px] font-bold text-zinc-800 dark:text-zinc-200">Rendering video...</div>
                    <div className="text-[9.5px] text-zinc-400 dark:text-zinc-505 mt-1">Applying template layers to timeline</div>
                    <div className="mt-4 w-40">
                      <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div className="h-full bg-[#ff5c3a] rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center animate-fade-in">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40 border border-green-200/50">
                      <Check className="h-6 w-6 text-green-500" strokeWidth={3} />
                    </div>
                    <div className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">Video Export Complete!</div>
                    <div className="text-[9.5px] text-zinc-400 dark:text-zinc-505 mt-1 mb-5">Watermark removed · 1080p Full HD MP4</div>
                    
                    <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5c3a] to-[#ff7558] px-5 py-2.5 text-[11.5px] font-bold text-white shadow-lg hover:shadow-orange-500/20 transition-all hover:scale-105">
                      <Download className="h-4 w-4" /> Download Video
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Timeline Editor */}
          <div className="border-t border-zinc-200/60 dark:border-zinc-800/40 bg-white dark:bg-zinc-900 px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[9px] font-semibold text-zinc-400 dark:text-zinc-500">
              <div className="flex items-center gap-2">
                <Play className={`h-2.5 w-2.5 ${playing ? "text-[#ff5c3a]" : ""}`} fill={playing ? "currentColor" : "none"} />
                <span>TIMELINE TRACK</span>
              </div>
              <span className="font-mono">{currentTime} / 0:04</span>
            </div>

            {/* Subtitle blocks on timeline */}
            <div className="relative h-9 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden flex items-center px-1">
              
              {/* Audio Waveform Graphic */}
              <div className="absolute inset-x-0 inset-y-1 flex items-center justify-between opacity-15 px-2 pointer-events-none">
                {[14, 28, 38, 22, 16, 28, 38, 48, 32, 28, 12, 18, 32, 38, 24, 18, 32, 44, 22, 14, 28, 38, 22, 16, 28].map((h, i) => (
                  <div key={i} className="w-[3px] bg-zinc-650 dark:bg-zinc-400 rounded-sm" style={{ height: `${h}%` }} />
                ))}
              </div>

              {/* Subtitle segments */}
              <div className="relative flex-1 h-7 flex items-center gap-1 z-10">
                <div className={`h-6 rounded bg-zinc-200/60 dark:bg-zinc-850 text-[9px] font-mono flex items-center justify-center flex-[1.2] transition-colors border ${activeWordIdx === 0 && (phase === "captions" || playing) ? "border-[#ff5c3a] bg-orange-50/50 dark:border-orange-500/50 dark:bg-orange-950/30 text-[#ff5c3a]" : "border-zinc-200 dark:border-zinc-700 text-zinc-500"}`}>
                  Wlc
                </div>
                <div className={`h-6 rounded bg-zinc-200/60 dark:bg-zinc-850 text-[9px] font-mono flex items-center justify-center flex-[1.4] transition-colors border ${activeWordIdx === 1 && (phase === "captions" || playing) ? "border-[#ff5c3a] bg-orange-50/50 dark:border-orange-500/50 dark:bg-orange-950/30 text-[#ff5c3a]" : "border-zinc-200 dark:border-zinc-700 text-zinc-500"}`}>
                  to Subbly
                </div>
                <div className={`relative h-6 rounded bg-zinc-200/60 dark:bg-zinc-850 text-[9px] font-mono flex items-center justify-center transition-all border ${
                  phase === "timeline" ? "border-orange-400 bg-orange-50/50 dark:border-orange-500/60 dark:bg-orange-950/40 text-[#ff5c3a]" :
                  activeWordIdx >= 2 && (phase === "captions" || playing) ? "border-[#ff5c3a] bg-orange-50/50 dark:border-orange-500/50 dark:bg-orange-950/30 text-[#ff5c3a]" : "border-zinc-200 dark:border-zinc-700 text-zinc-500"
                }`} style={{ flex: phase === "timeline" ? "1.8" : "1.5" }}>
                  AI editor
                  
                  {/* Timeline Handle slider handles (shown when editing in phase 5) */}
                  {phase === "timeline" && (
                    <div className="absolute right-0 top-0 bottom-0 w-1.5 rounded-r bg-[#ff5c3a] cursor-col-resize flex flex-col justify-center gap-0.5 px-px">
                      <div className="h-2 w-[1px] bg-white" />
                      <div className="h-2 w-[1px] bg-white" />
                    </div>
                  )}
                </div>
                <div className="h-6 rounded bg-zinc-200/60 dark:bg-zinc-850 text-[9px] font-mono flex items-center justify-center flex-[1.2] border border-zinc-200 dark:border-zinc-700 text-zinc-500">
                  captions
                </div>
              </div>

              {/* Progress seeker head overlay */}
              <div 
                className="absolute top-0 bottom-0 w-[2px] bg-[#ff5c3a] z-20 pointer-events-none transition-all duration-300"
                style={{ left: `${phase === "timeline" ? timelineHandleOffset : (phase === "captions" || playing) ? (20 + activeWordIdx * 20) : 10}%` }}
              >
                <div className="h-1.5 w-1.5 -ml-0.5 rounded-full bg-[#ff5c3a] shadow-md shadow-orange-500/30" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Styling presets & adjustments */}
        <div className="hidden w-[160px] border-l border-zinc-200/60 dark:border-zinc-800/40 bg-zinc-50/30 dark:bg-zinc-950/10 p-3 sm:flex flex-col gap-3.5">
          <div>
            <div className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-505">Preset Styles</div>
            <div className="flex flex-col gap-2">
              <button 
                className={`flex items-center gap-2 rounded-lg border p-1.5 text-left transition ${
                  activeStyle === "tiktok" 
                    ? "border-orange-300 bg-orange-50/50 dark:border-orange-950/40 dark:bg-orange-950/20 text-[#ff5c3a]" 
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-400"
                }`}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-400 text-black text-[9px] font-extrabold">Aa</div>
                <div className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">Tiktok Bouncy</div>
              </button>

              <button 
                className={`flex items-center gap-2 rounded-lg border p-1.5 text-left transition ${
                  activeStyle === "netflix" 
                    ? "border-orange-300 bg-orange-50/50 dark:border-orange-950/40 dark:bg-orange-950/20 text-[#ff5c3a]" 
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-400"
                }`}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-850 text-white text-[9px] border border-white/10 font-sans">Aa</div>
                <div className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">Cinema Block</div>
              </button>

              <button 
                className={`flex items-center gap-2 rounded-lg border p-1.5 text-left transition ${
                  activeStyle === "neon" 
                    ? "border-orange-300 bg-orange-50/50 dark:border-orange-950/40 dark:bg-orange-950/20 text-[#ff5c3a]" 
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-400"
                }`}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded bg-[#ff5c3a]/25 text-[#ff5c3a] text-[9px] border border-[#ff5c3a]/50 font-mono">Aa</div>
                <div className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">Glow Outline</div>
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-550">Animations</div>
            <div className="grid grid-cols-2 gap-1 text-[9px] font-semibold text-zinc-500">
              <div className="rounded bg-zinc-100 dark:bg-zinc-800/40 p-1 text-center border border-zinc-200/50 dark:border-zinc-850">Fade In</div>
              <div className="rounded bg-[#ff5c3a]/10 text-[#ff5c3a] border border-[#ff5c3a]/30 p-1 text-center animate-pulse-scale">Bouncy</div>
              <div className="rounded bg-zinc-100 dark:bg-zinc-800/40 p-1 text-center border border-zinc-200/50 dark:border-zinc-850">Slide Up</div>
              <div className="rounded bg-zinc-100 dark:bg-zinc-800/40 p-1 text-center border border-zinc-200/50 dark:border-zinc-850">Karaoke</div>
            </div>
          </div>

          <div className="mt-auto border-t border-zinc-100 dark:border-zinc-850/60 pt-2.5 text-[9.5px] text-zinc-450 dark:text-zinc-500">
            <span className="font-semibold block text-zinc-750 dark:text-zinc-300 mb-0.5">Active Font</span>
            Outfit Sans-Serif
          </div>
        </div>

      </div>

      {/* Floating Animated HTML Mouse Cursor */}
      <div 
        className="absolute pointer-events-none z-[105] transition-all duration-700 ease-in-out"
        style={{ 
          left: `${cursorPos.x}%`, 
          top: `${cursorPos.y}%`, 
          opacity: cursorPos.opacity,
          transform: "translate(-4px, -4px)"
        }}
      >
        <div className="relative">
          <MousePointer className="h-5.5 w-5.5 text-orange-500 fill-orange-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
          {clickEffect && (
            <div className="absolute -left-1 -top-1 h-7 w-7 rounded-full border border-orange-500 bg-orange-500/25 animate-ping duration-300" />
          )}
        </div>
      </div>
      
      {/* Visual Navigation Steps Overlay indicator */}
      <div className="grid grid-cols-7 border-t border-zinc-200/60 dark:border-zinc-800/40 bg-zinc-50 dark:bg-zinc-950 p-2 text-center text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 sm:text-[10px]">
        {[
          { label: "1. Upload", active: phase === "upload" },
          { label: "2. AI Parse", active: phase === "analyze" },
          { label: "3. Captions", active: phase === "captions" },
          { label: "4. Style", active: phase === "style" },
          { label: "5. Edit", active: phase === "timeline" },
          { label: "6. Translate", active: phase === "translate" },
          { label: "7. Export", active: phase === "export" }
        ].map((s, i) => (
          <div key={i} className={`flex flex-col items-center gap-0.5 transition-all duration-200 ${s.active ? "text-[#ff5c3a] scale-105" : ""}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.active ? "bg-[#ff5c3a]" : "bg-zinc-200 dark:bg-zinc-800"}`} />
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{s.label.split(" ")[1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
