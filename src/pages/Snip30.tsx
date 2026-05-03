import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scissors, Layers, Type, ArrowLeft } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { VideoTrimmer } from "@/components/snip30/VideoTrimmer";
import { VideoCompiler } from "@/components/snip30/VideoCompiler";

type Mode = "trim" | "compile";

const Snip30 = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("trim");

  useEffect(() => {
    document.title = "Snip30 — Trim & Compile videos · Subbly";
  }, []);

  return (
    <div
      className="snip30-root min-h-screen bg-[#f5f3ee] text-[#1a1a1a]"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <Toaster position="top-center" richColors />

      {/* Nav — matches Subbly */}
      <nav className="sticky top-0 z-[200] flex h-[62px] items-center justify-between border-b border-[#e8e4de] bg-white/95 px-6 backdrop-blur-xl md:px-12">
        <Link to="/projects" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#ff5c3a]">
            <Type className="h-[17px] w-[17px] text-white" strokeWidth={2.2} />
          </div>
          <span className="font-serif-display text-[18px] tracking-[-0.2px]">Subbly</span>
        </Link>
        <button
          onClick={() => navigate("/projects")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-transparent px-3 py-2 text-[13px] text-[#666] transition hover:border-[#b0aba4] hover:text-[#1a1a1a]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
        </button>
      </nav>

      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-hero opacity-20 blur-3xl" />
      </div>

      <main className="container mx-auto px-4 pb-20">
        <section className="mx-auto max-w-2xl pb-8 pt-10 text-center animate-float-up">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[#ff5c3a]">
            Snip30
          </div>
          <h1 className="font-serif-display text-4xl font-normal tracking-tight md:text-5xl">
            {mode === "trim" ? (
              <>
                Trim videos into{" "}
                <span className="italic">short clips</span>
              </>
            ) : (
              <>
                Compile videos into <span className="italic">one</span>
              </>
            )}
          </h1>
          <p className="mt-3 text-[15px] text-[#666]">
            {mode === "trim"
              ? "Upload, choose your clip length, and download every part packaged as a ZIP."
              : "Drop multiple clips, reorder them, and merge into a single downloadable video."}
          </p>
        </section>

        {/* Mode tabs */}
        <div className="mx-auto mb-6 max-w-3xl">
          <div className="inline-flex rounded-2xl border border-[#e8e4de] bg-white p-1 shadow-soft">
            <button
              type="button"
              onClick={() => setMode("trim")}
              className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-smooth ${
                mode === "trim"
                  ? "bg-gradient-primary text-white shadow-elegant"
                  : "text-[#666] hover:text-[#1a1a1a]"
              }`}
            >
              <Scissors className="h-4 w-4" /> Trim
            </button>
            <button
              type="button"
              onClick={() => setMode("compile")}
              className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-smooth ${
                mode === "compile"
                  ? "bg-gradient-primary text-white shadow-elegant"
                  : "text-[#666] hover:text-[#1a1a1a]"
              }`}
            >
              <Layers className="h-4 w-4" /> Compile
            </button>
          </div>
        </div>

        {mode === "trim" ? <VideoTrimmer /> : <VideoCompiler />}
      </main>
    </div>
  );
};

export default Snip30;
