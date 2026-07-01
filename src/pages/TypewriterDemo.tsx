import { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Sparkles, Sliders, Type, Keyboard, HelpCircle, ArrowRight } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { Seo } from "@/components/Seo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export default function TypewriterDemo() {
  // Animation settings state
  const [text, setText] = useState("Create stunning AI captions for your short-form videos automatically! 🚀🎬");
  const [speed, setSpeed] = useState(50); // ms per char
  const [delay, setDelay] = useState(1000); // ms delay before repeat
  const [loop, setLoop] = useState(true);
  
  // Styling state
  const [fontSize, setFontSize] = useState(36);
  const [color, setColor] = useState("#FFFFFF");
  const [highlightColor, setHighlightColor] = useState("#FF5C3A");
  const [bgColor, setBgColor] = useState("#1A1A1A");
  const [bgOpacity, setBgOpacity] = useState(0.85);
  const [glow, setGlow] = useState(true);

  // Typewriter execution state
  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting">("typing");
  const [key, setKey] = useState(0); // For resetting animation timer
  
  // Live typewriter simulation effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (phase === "typing") {
      if (displayText.length < text.length) {
        timer = setTimeout(() => {
          setDisplayText(text.slice(0, displayText.length + 1));
        }, speed);
      } else {
        if (loop) {
          timer = setTimeout(() => {
            setPhase("deleting");
          }, delay);
        } else {
          setPhase("pause");
        }
      }
    } else if (phase === "deleting") {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(text.slice(0, displayText.length - 1));
        }, speed / 2); // delete twice as fast
      } else {
        timer = setTimeout(() => {
          setPhase("typing");
        }, 500); // short pause before restart
      }
    }
    
    return () => clearTimeout(timer);
  }, [displayText, phase, text, speed, delay, loop, key]);

  const handleReset = () => {
    setDisplayText("");
    setPhase("typing");
    setKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Seo title="Typewriter Effects Demo — Subbly" description="Test and preview interactive typewriter caption animations in real-time." path="/typewriter-demo" />
      
      <NavBar activeView="Editor" />

      <main className="mx-auto max-w-5xl px-6 py-12 md:px-12">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Type className="text-[#ff5c3a]" /> Typewriter Caption Simulator
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
              Experiment with speeds, coloring, backspacing, and highlight animations to customize your video captions.
            </p>
          </div>
          
          <Button 
            onClick={handleReset} 
            variant="outline" 
            className="flex items-center gap-2 border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-10 font-bold"
          >
            <RotateCcw className="h-4 w-4" /> Reset Simulation
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Simulator Controls */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/80">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-[#ff5c3a]" />
                  Animation Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Demo Text</label>
                  <Input
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      handleReset();
                    }}
                    placeholder="Enter custom caption..."
                    className="h-10 dark:bg-zinc-950 dark:border-zinc-800 text-sm"
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Typing Speed ({speed}ms)</label>
                    <span className="text-[11px] font-mono text-zinc-400">{speed < 30 ? "Fast" : speed > 80 ? "Slow" : "Normal"}</span>
                  </div>
                  <Slider
                    min={10}
                    max={200}
                    step={5}
                    value={[speed]}
                    onValueChange={(val) => setSpeed(val[0])}
                    className="py-1"
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pause Hold Delay ({delay}ms)</label>
                  </div>
                  <Slider
                    min={200}
                    max={3000}
                    step={100}
                    value={[delay]}
                    onValueChange={(val) => setDelay(val[0])}
                    className="py-1"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Loop Animation</label>
                    <p className="text-[10px] text-zinc-400">Restart typing after deletion finishes</p>
                  </div>
                  <Switch checked={loop} onCheckedChange={setLoop} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/80">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <Type className="h-4 w-4 text-[#ff5c3a]" />
                  Aesthetics / Styling
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Text Color</label>
                    <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1.5 h-10 bg-zinc-50 dark:bg-zinc-950">
                      <input 
                        type="color" 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)} 
                        className="h-6 w-8 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700 bg-transparent"
                      />
                      <span className="text-xs font-mono">{color}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Highlight Color</label>
                    <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1.5 h-10 bg-zinc-50 dark:bg-zinc-950">
                      <input 
                        type="color" 
                        value={highlightColor} 
                        onChange={(e) => setHighlightColor(e.target.value)} 
                        className="h-6 w-8 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700 bg-transparent"
                      />
                      <span className="text-xs font-mono">{highlightColor}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Box Background</label>
                    <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1.5 h-10 bg-zinc-50 dark:bg-zinc-950">
                      <input 
                        type="color" 
                        value={bgColor} 
                        onChange={(e) => setBgColor(e.target.value)} 
                        className="h-6 w-8 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700 bg-transparent"
                      />
                      <span className="text-xs font-mono">{bgColor}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Box Opacity ({Math.round(bgOpacity * 100)}%)</label>
                    <Slider
                      min={0}
                      max={1}
                      step={0.05}
                      value={[bgOpacity]}
                      onValueChange={(val) => setBgOpacity(val[0])}
                      className="py-2"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Font Size ({fontSize}px)</label>
                  <Slider
                    min={18}
                    max={64}
                    step={1}
                    value={[fontSize]}
                    onValueChange={(val) => setFontSize(val[0])}
                    className="py-1"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Glow Outline</label>
                    <p className="text-[10px] text-zinc-400">Apply a subtle text-shadow glow</p>
                  </div>
                  <Switch checked={glow} onCheckedChange={setGlow} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Screen Preview */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-[#e8e4de] dark:border-zinc-800 overflow-hidden shadow-md flex flex-col h-full bg-zinc-900 text-white">
              <CardHeader className="bg-[#1C1C24] border-b border-zinc-850 px-6 py-4.5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-[#FF5F56]" />
                    <div className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
                    <div className="h-3 w-3 rounded-full bg-[#28C840]" />
                  </div>
                  <span className="text-xs font-mono text-zinc-400 ml-2">Monitor Simulator (1080p Overlay)</span>
                </div>
                <div className="text-[10px] font-mono uppercase bg-zinc-800 px-2 py-0.5 rounded text-[#ff5c3a] border border-[#ff5c3a]/20">
                  {phase}
                </div>
              </CardHeader>
              
              {/* Simulator Screen Box */}
              <div className="flex-1 min-h-[380px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-zinc-950 flex flex-col items-center justify-center p-8 relative">
                {/* Background Grid Lines simulating video player */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
                
                {/* Simulated Waveform Overlay */}
                <div className="absolute top-6 left-6 flex items-center gap-[3px] opacity-[0.15]">
                  {[12, 28, 48, 30, 18, 40, 52, 24, 16, 32, 10].map((h, i) => (
                    <div key={i} className="w-0.5 rounded-sm bg-[#ff5c3a] animate-pulse" style={{ height: `${h}px`, animationDelay: `${i * 100}ms` }} />
                  ))}
                </div>

                {/* Animated Typewriter Caption Overlay */}
                <div 
                  className="rounded-2xl px-6 py-4.5 max-w-[500px] text-center transition-all duration-300"
                  style={{
                    backgroundColor: bgColor,
                    opacity: bgOpacity,
                    boxShadow: glow ? `0 4px 30px rgba(0, 0, 0, 0.4), 0 0 20px ${highlightColor}15` : "none"
                  }}
                >
                  <p 
                    className="leading-[1.4] font-extrabold tracking-[-0.01em]"
                    style={{
                      fontSize: `${fontSize}px`,
                      color: color,
                      textShadow: glow ? `0 0 10px ${highlightColor}80` : "none"
                    }}
                  >
                    {/* Render typed characters, highlight emojis/last characters */}
                    {displayText}
                    {phase === "typing" && (
                      <span className="inline-block w-1.5 h-[1.1em] ml-1 bg-[#ff5c3a] animate-ping align-middle" />
                    )}
                  </p>
                </div>
              </div>
              
              {/* Interactive Status Indicator Bar */}
              <div className="bg-[#1C1C24] border-t border-zinc-850 px-6 py-4 text-xs flex justify-between items-center text-zinc-400">
                <div className="flex items-center gap-1.5 font-mono">
                  <Keyboard className="h-4 w-4 text-[#ff5c3a]" />
                  <span>Length: {displayText.length} / {text.length} chars</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${phase === "typing" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                  <span className="capitalize">{phase} state</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
