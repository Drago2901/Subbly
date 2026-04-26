import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  Play,
  Upload,
  Sparkles,
  Type,
  Check,
  Download,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    document.title = "Subbly — AI Video Caption Editor";
    const desc =
      "Upload a video, auto-generate captions with AI, edit text and styling, then export a captioned video — all in your browser.";
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
    }
    m.setAttribute("content", desc);
  }, []);

  if (!loading && user) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#1a1a1a]">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-[#e8e4de] bg-white px-6 py-4 md:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff5c3a]">
            <Type className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <span className="text-[15px] font-medium">Subbly</span>
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          <a href="#features" className="text-[13px] text-[#888] hover:text-[#1a1a1a]">Features</a>
          <a href="#how" className="text-[13px] text-[#888] hover:text-[#1a1a1a]">How it works</a>
          <a href="#pricing" className="text-[13px] text-[#888] hover:text-[#1a1a1a]">Pricing</a>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            className="rounded-md border border-[#ddd] bg-white px-4 py-1.5 text-[13px] text-[#555] hover:bg-[#faf9f7]"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            className="rounded-md bg-[#ff5c3a] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#ee4f2e]"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-white px-6 pt-20 md:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ffd5cc] bg-[#fff5f3] px-3.5 py-1.5 text-xs text-[#ff5c3a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff5c3a]" />
            Word-perfect AI captions
          </div>
          <h1 className="mb-4 text-[44px] font-medium leading-[1.1] tracking-[-0.02em] md:text-[54px]">
            Caption your videos
            <br />
            in <span className="text-[#ff5c3a]">seconds</span>
          </h1>
          <p className="mx-auto mb-8 max-w-md text-[15px] leading-[1.75] text-[#888]">
            Upload any video, get auto-generated captions, restyle them, and export — all in your browser.
          </p>
          <div className="mb-12 flex flex-wrap justify-center gap-2.5">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-lg bg-[#ff5c3a] px-7 py-3.5 text-sm font-medium text-white hover:bg-[#ee4f2e]"
            >
              Start captioning <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button className="inline-flex items-center gap-2 rounded-lg border border-[#e0dbd4] bg-white px-6 py-3.5 text-sm text-[#555] hover:bg-[#faf9f7]">
              <Play className="h-3.5 w-3.5" /> Watch demo
            </button>
          </div>
        </div>

        {/* Mockup */}
        <div className="bg-[#f5f3ee] px-4 pt-8 md:px-8">
          <div className="mx-auto max-w-2xl overflow-hidden rounded-t-[10px] border border-b-0 border-[#e8e4de] bg-white">
            <div className="flex items-center gap-1.5 border-b border-[#eeeae4] bg-[#faf9f7] px-3.5 py-2.5">
              <div className="h-2 w-2 rounded-full bg-[#ff5f57]" />
              <div className="h-2 w-2 rounded-full bg-[#febc2e]" />
              <div className="h-2 w-2 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex h-60">
              <div className="hidden w-44 border-r border-[#eeeae4] bg-[#faf9f7] p-3.5 sm:block">
                <div className="mb-2.5 text-[10px] tracking-[0.07em] text-[#aaa]">CAPTIONS</div>
                {[
                  { t: "0:00 – 0:03", x: "Welcome to the walkthrough", on: false },
                  { t: "0:03 – 0:07", x: "Today we'll show you how it works", on: true },
                  { t: "0:07 – 0:11", x: "Just upload your video to begin", on: false },
                  { t: "0:11 – 0:14", x: "AI transcribes in seconds", on: false },
                ].map((c, i) => (
                  <div
                    key={i}
                    className={`mb-1.5 rounded-md px-2.5 py-2 ${
                      c.on ? "border border-[#ffd5cc] bg-[#fff5f3]" : ""
                    }`}
                  >
                    <div className={`mb-0.5 text-[10px] ${c.on ? "text-[#ff5c3a]" : "text-[#ccc]"}`}>
                      {c.t}
                    </div>
                    <div className={`text-[11px] leading-[1.45] ${c.on ? "text-[#555]" : "text-[#ccc]"}`}>
                      {c.x}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-1 flex-col gap-2.5 bg-white p-3.5">
                <div className="relative flex flex-1 items-end justify-center overflow-hidden rounded-md border border-[#eeeae4] bg-[#faf9f7] pb-3.5">
                  <div className="absolute inset-0 flex items-center justify-center gap-[3px] opacity-20">
                    {[35, 55, 70, 45, 62, 40, 78, 52, 42, 68, 36, 58, 46].map((h, i) => (
                      <div key={i} className="w-0.5 rounded-sm bg-[#ff5c3a]" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                  <div className="relative z-10 rounded-[5px] bg-[#1a1a1a]/80 px-3.5 py-1 text-xs font-medium text-white">
                    Today we'll show you how it works
                  </div>
                </div>
                <div className="flex h-[30px] items-center gap-2 rounded-md border border-[#eeeae4] bg-[#faf9f7] px-2.5">
                  <span className="text-[10px] text-[#bbb]">0:03</span>
                  <div className="relative h-[3px] flex-1 rounded-sm bg-[#e8e4de]">
                    <div className="h-full w-[35%] rounded-sm bg-[#ff5c3a]" />
                    <div className="absolute left-[35%] top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#ff5c3a] bg-white" />
                  </div>
                  <span className="text-[10px] text-[#bbb]">0:14</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 border-y border-[#e8e4de] bg-white md:grid-cols-4">
        {[
          { n: "50k+", l: "Videos captioned" },
          { n: "12k+", l: "Active creators" },
          { n: "99%", l: "Accuracy rate" },
          { n: "<30s", l: "Processing time" },
        ].map((s, i) => (
          <div
            key={i}
            className={`p-6 text-center ${
              i < 3 ? "md:border-r md:border-[#e8e4de]" : ""
            } ${i % 2 === 0 ? "border-r border-[#e8e4de] md:border-r" : ""} ${
              i < 2 ? "border-b border-[#e8e4de] md:border-b-0" : ""
            }`}
          >
            <div className="text-[26px] font-medium tracking-[-0.5px]">{s.n}</div>
            <div className="mt-1 text-xs text-[#aaa]">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <section id="features" className="px-6 py-16 md:px-10">
        <div className="mb-2 text-center text-[11px] tracking-[0.09em] text-[#ff5c3a]">FEATURES</div>
        <h2 className="mb-1.5 text-center text-[30px] font-medium tracking-[-0.5px]">Everything you need</h2>
        <p className="mb-10 text-center text-sm text-[#aaa]">From upload to export in one smooth workflow</p>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#e8e4de] bg-[#e8e4de] sm:grid-cols-2 md:grid-cols-3">
          {[
            { Icon: Upload, t: "One-click upload", d: "Drop any format — MP4, MOV, WebM. We handle the rest." },
            { Icon: Sparkles, t: "AI transcription", d: "99% accuracy across 40+ languages in under 30 seconds." },
            { Icon: Type, t: "Style editor", d: "Customize font, size, color, and position to match your brand." },
            { Icon: Check, t: "Inline corrections", d: "Click any caption to edit. Drag timestamps to adjust timing." },
            { Icon: Download, t: "Flexible export", d: "Download as MP4, SRT, or VTT — ready for any platform." },
            { Icon: User, t: "Project saving", d: "Sign in to save and resume projects from any device." },
          ].map(({ Icon, t, d }, i) => (
            <div key={i} className="bg-white p-6">
              <div className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-lg border border-[#ffd5cc] bg-[#fff5f3]">
                <Icon className="h-[17px] w-[17px] text-[#ff5c3a]" strokeWidth={1.8} />
              </div>
              <div className="mb-1.5 text-[13px] font-medium">{t}</div>
              <div className="text-xs leading-[1.65] text-[#999]">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-6 pb-16 md:px-10">
        <div className="mb-2 text-center text-[11px] tracking-[0.09em] text-[#ff5c3a]">HOW IT WORKS</div>
        <h2 className="mb-1.5 text-center text-[30px] font-medium tracking-[-0.5px]">Ready in three steps</h2>
        <p className="mb-10 text-center text-sm text-[#aaa]">No setup. No technical knowledge required.</p>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { n: 1, t: "Upload your video", d: "Drag and drop or browse. Any common video format is supported." },
            { n: 2, t: "AI generates captions", d: "Transcription in seconds. Edit anything that needs a tweak." },
            { n: 3, t: "Export and share", d: "Download as a captioned video or a subtitle file. Done." },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border border-[#e8e4de] bg-white p-6">
              <div className="mb-3.5 flex h-8 w-8 items-center justify-center rounded-full border border-[#ffd5cc] bg-[#fff5f3] text-[13px] font-medium text-[#ff5c3a]">
                {s.n}
              </div>
              <div className="mb-1.5 text-sm font-medium">{s.t}</div>
              <div className="text-xs leading-[1.65] text-[#999]">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 pb-16 md:px-10">
        <div className="mb-2 text-center text-[11px] tracking-[0.09em] text-[#ff5c3a]">TESTIMONIALS</div>
        <h2 className="mb-1.5 text-center text-[30px] font-medium tracking-[-0.5px]">Creators love it</h2>
        <p className="mb-10 text-center text-sm text-[#aaa]">Join 12,000+ people saving hours every week</p>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3.5 md:grid-cols-3">
          {[
            { q: "Saves me hours every week. The transcription accuracy is genuinely impressive.", i: "AK", n: "Aisha K.", r: "YouTube creator" },
            { q: "Our social team uses this daily. SRT export fits our workflow perfectly.", i: "MR", n: "Marco R.", r: "Social media manager" },
            { q: "No tutorial needed. Uploaded my first video and had captions in under a minute.", i: "PS", n: "Priya S.", r: "Podcast producer" },
          ].map((t, i) => (
            <div key={i} className="rounded-xl border border-[#e8e4de] bg-white p-5">
              <div className="mb-3 flex gap-[3px]">
                {Array.from({ length: 5 }).map((_, k) => (
                  <div key={k} className="h-3 w-3 rounded-sm bg-[#ff5c3a]" />
                ))}
              </div>
              <p className="mb-4 text-xs leading-[1.7] text-[#666]">{t.q}</p>
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#ffd5cc] bg-[#fff5f3] text-[10px] font-medium text-[#ff5c3a]">
                  {t.i}
                </div>
                <div>
                  <div className="text-xs font-medium">{t.n}</div>
                  <div className="text-[11px] text-[#bbb]">{t.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <div className="mx-6 mb-14 rounded-2xl bg-[#1a1a1a] p-12 text-center md:mx-10">
        <h2 className="mb-2 text-[28px] font-medium tracking-[-0.5px] text-white">Start captioning for free</h2>
        <p className="mb-7 text-sm text-white/45">No credit card required. First 3 videos on us.</p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-lg bg-[#ff5c3a] px-7 py-3.5 text-sm font-medium text-white hover:bg-[#ee4f2e]"
        >
          Get started free <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Footer */}
      <footer className="flex flex-col items-center justify-between gap-3 border-t border-[#e8e4de] bg-white px-6 py-5 text-xs text-[#bbb] md:flex-row md:px-10">
        <div>© 2025 Subbly</div>
        <div className="flex gap-5">
          <a href="#" className="hover:text-[#888]">Privacy</a>
          <a href="#" className="hover:text-[#888]">Terms</a>
          <a href="#" className="hover:text-[#888]">Contact</a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
