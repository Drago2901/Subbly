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
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Seo } from "@/components/Seo";
import { AvatarDropdown } from "@/components/AvatarDropdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


const HOME_DESCRIPTION =
  "Upload a video, auto-generate captions with AI, edit text and styling, then export a captioned video — all in your browser.";

const HOME_JSONLD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Subbly",
    url: "https://subbly.lovable.app/",
    description: "AI video caption editor.",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Subbly",
    url: "https://subbly.lovable.app/",
    description: HOME_DESCRIPTION,
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Subbly",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    description: HOME_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  },
];

const Index = () => {
  const { user, loading } = useAuth();
  const { theme, toggle } = useTheme();



  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#1a1a1a]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Seo title="Subbly — AI Video Caption Editor" description={HOME_DESCRIPTION} path="/" jsonLd={HOME_JSONLD} />
      {/* Nav */}
      <nav className="relative sticky top-0 z-[200] flex h-[62px] items-center justify-between border-b border-[#e8e4de] bg-white/95 px-6 backdrop-blur-xl md:px-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#ff5c3a]">
            <span className="font-serif-display text-[22px] font-bold text-white leading-none select-none">S</span>
          </div>
          <span className="font-serif-display text-[18px] tracking-[-0.2px]">Subbly</span>
        </Link>
        <div className="hidden items-center gap-[30px] md:flex md:absolute md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2">
          <a href="#features" className="text-[13.5px] text-[#666] transition hover:text-[#1a1a1a]">Features</a>
          <a href="#how" className="text-[13.5px] text-[#666] transition hover:text-[#1a1a1a]">How it works</a>
          <Link to="/pricing" className="text-[13.5px] text-[#666] transition hover:text-[#1a1a1a]">Pricing</Link>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e4de] bg-white text-[#666] transition hover:text-[#1a1a1a]"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to="/editor"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#ff5c3a] px-[18px] py-2 text-[13px] font-medium text-white shadow-[0_2px_8px_rgba(255,92,58,0.2)] transition hover:-translate-y-px hover:bg-[#ff7558] hover:shadow-[0_4px_16px_rgba(255,92,58,0.3)]"
          >
            Open editor <ArrowRight className="h-3 w-3" strokeWidth={2.2} />
          </Link>
          {user ? (
            <AvatarDropdown />
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center rounded-lg border border-[#e8e4de] bg-white px-[16px] py-2 text-[13px] font-medium text-[#666] transition hover:text-[#1a1a1a] hover:border-[#b0aba4]"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      <main>
      {/* Hero */}
      <section className="bg-white px-6 pt-24 md:px-12">
        <div className="mx-auto max-w-[660px] text-center">
          <div className="mb-7 inline-flex items-center gap-1.5 rounded-full border border-[#ffd5cc] bg-[#fff5f3] px-4 py-1.5 text-xs font-medium tracking-[0.02em] text-[#ff5c3a]">
            <span className="h-[5px] w-[5px] rounded-full bg-[#ff5c3a]" />
            Word-perfect AI captions
          </div>
          <h1 className="font-serif-display mb-5 text-[44px] font-normal leading-[1.05] tracking-[-2px] md:text-[62px]">
            Caption your videos
            <br />
            in <em className="italic text-[#ff5c3a]">seconds</em>
          </h1>
          <p className="mx-auto mb-9 max-w-[440px] text-[16px] leading-[1.8] text-[#666]">
            Upload any video, get auto-generated captions, restyle them, and export — all in your browser.
          </p>
          <div className="mb-14 flex flex-wrap justify-center gap-3">
            <Link
              to="/editor"
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#ff5c3a] px-7 py-3.5 text-[14.5px] font-medium text-white transition hover:-translate-y-0.5 hover:bg-[#ff7558] hover:shadow-[0_6px_24px_rgba(255,92,58,0.32)]"
            >
              Start captioning <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <button className="inline-flex items-center gap-2 rounded-[10px] border border-[#e8e4de] bg-white px-6 py-3.5 text-[14.5px] text-[#666] transition hover:border-[#b0aba4] hover:text-[#1a1a1a]">
                  <Play className="h-3.5 w-3.5" /> Watch demo
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[700px] border-[#e8e4de] bg-white p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-4 border-b border-[#e8e4de] bg-[#faf9f7]">
                  <DialogTitle className="font-serif-display text-lg font-normal">Subbly Demo Walkthrough</DialogTitle>
                </DialogHeader>
                <div className="aspect-video bg-[#1a1a1a] relative flex items-center justify-center">
                  <video
                    src="https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4"
                    controls
                    autoPlay
                    className="w-full h-full object-cover"
                    poster="/placeholder.svg"
                  />
                </div>
              </DialogContent>
            </Dialog>

          </div>
        </div>

        {/* Mockup */}
        <div className="-mx-6 overflow-hidden rounded-t-[14px] bg-[#f5f3ee] px-9 pt-9 md:-mx-12">
          <div className="mx-auto max-w-[760px] overflow-hidden rounded-t-xl border border-b-0 border-[#e8e4de] bg-white shadow-[0_-4px_40px_rgba(26,26,26,0.06)]">
            <div className="flex items-center gap-1.5 border-b border-[#e8e4de] bg-[#faf9f7] px-4 py-[11px]">
              <div className="h-[9px] w-[9px] rounded-full bg-[#ff5f57]" />
              <div className="h-[9px] w-[9px] rounded-full bg-[#febc2e]" />
              <div className="h-[9px] w-[9px] rounded-full bg-[#28c840]" />
            </div>
            <div className="flex h-[260px]">
              <div className="hidden w-[190px] border-r border-[#e8e4de] bg-[#faf9f7] p-4 sm:block">
                <div className="mb-3 text-[9.5px] font-medium uppercase tracking-[0.1em] text-[#b0aba4]">
                  Captions
                </div>
                {[
                  { t: "0:00 – 0:03", x: "Welcome to the walkthrough", on: false },
                  { t: "0:03 – 0:07", x: "Today we'll show you how it works", on: true },
                  { t: "0:07 – 0:11", x: "Just upload your video to begin", on: false },
                  { t: "0:11 – 0:14", x: "AI transcribes in seconds", on: false },
                ].map((c, i) => (
                  <div
                    key={i}
                    className={`mb-1.5 rounded-[7px] px-2.5 py-2 ${
                      c.on ? "border border-[#ffd5cc] bg-[#fff5f3]" : ""
                    }`}
                  >
                    <div
                      className={`font-mono-jb mb-0.5 text-[10px] ${
                        c.on ? "text-[#ff5c3a]" : "text-[#ccc]"
                      }`}
                    >
                      {c.t}
                    </div>
                    <div className={`text-[11px] leading-[1.45] ${c.on ? "text-[#333]" : "text-[#ccc]"}`}>
                      {c.x}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="relative flex flex-1 items-end justify-center overflow-hidden rounded-lg border border-[#e8e4de] bg-[#f5f3ee] pb-4">
                  <div className="absolute inset-0 flex items-center justify-center gap-[3px] opacity-[0.18]">
                    {[32, 52, 66, 42, 60, 38, 74, 50, 40, 64, 34, 56, 44].map((h, i) => (
                      <div key={i} className="w-0.5 rounded-sm bg-[#ff5c3a]" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                  <div className="relative z-10 rounded-md bg-[#1a1a1a]/85 px-4 py-1.5 text-[12.5px] font-medium tracking-[0.01em] text-white backdrop-blur">
                    Today we'll show you how it works
                  </div>
                </div>
                <div className="flex h-8 items-center gap-2.5 rounded-[7px] border border-[#e8e4de] bg-[#faf9f7] px-3">
                  <span className="font-mono-jb text-[10px] text-[#b0aba4]">0:03</span>
                  <div className="relative h-[3px] flex-1 rounded-sm bg-[#e8e4de]">
                    <div className="h-full w-[37%] rounded-sm bg-[#ff5c3a]" />
                    <div className="absolute left-[37%] top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-[#ff5c3a] bg-white shadow-[0_0_0_3px_rgba(255,92,58,0.15)]" />
                  </div>
                  <span className="font-mono-jb text-[10px] text-[#b0aba4]">0:14</span>
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
            className={`p-7 text-center ${
              i < 3 ? "md:border-r md:border-[#e8e4de]" : ""
            } ${i % 2 === 0 ? "border-r border-[#e8e4de] md:border-r" : ""} ${
              i < 2 ? "border-b border-[#e8e4de] md:border-b-0" : ""
            }`}
          >
            <div className="font-serif-display text-[32px] tracking-[-1px]">{s.n}</div>
            <div className="mt-1 text-xs text-[#b0aba4]">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <section id="features" className="px-6 py-[72px] md:px-12">
        <div className="mb-2.5 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-[#ff5c3a]">
          Features
        </div>
        <h2 className="font-serif-display mb-2 text-center text-[38px] font-normal tracking-[-1px]">
          Everything you need
        </h2>
        <p className="mb-12 text-center text-[14.5px] text-[#b0aba4]">
          From upload to export in one smooth workflow
        </p>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-px overflow-hidden rounded-[14px] border border-[#e8e4de] bg-[#e8e4de] sm:grid-cols-2 md:grid-cols-3">
          {[
            { Icon: Upload, t: "One-click upload", d: "Drop any format — MP4, MOV, WebM. We handle the rest." },
            { Icon: Sparkles, t: "AI transcription", d: "99% accuracy across 40+ languages in under 30 seconds." },
            { Icon: Type, t: "Style editor", d: "Customize font, size, color, and position to match your brand." },
            { Icon: Check, t: "Inline corrections", d: "Click any caption to edit. Drag timestamps to adjust timing." },
            { Icon: Download, t: "Flexible export", d: "Download as MP4, SRT, or VTT — ready for any platform." },
            { Icon: User, t: "Project saving", d: "Sign in to save and resume projects from any device." },
          ].map(({ Icon, t, d }, i) => (
            <div key={i} className="bg-white p-7 transition hover:bg-[#fff5f3]">
              <div className="mb-4 flex h-[38px] w-[38px] items-center justify-center rounded-[9px] border border-[#ffd5cc] bg-[#fff5f3]">
                <Icon className="h-[18px] w-[18px] text-[#ff5c3a]" strokeWidth={1.7} />
              </div>
              <div className="mb-1.5 text-[14px] font-semibold">{t}</div>
              <div className="text-[12.5px] leading-[1.7] text-[#999]">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-6 pb-[72px] md:px-12">
        <div className="mb-2.5 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-[#ff5c3a]">
          How it works
        </div>
        <h2 className="font-serif-display mb-2 text-center text-[38px] font-normal tracking-[-1px]">
          Ready in three steps
        </h2>
        <p className="mb-12 text-center text-[14.5px] text-[#b0aba4]">No setup. No technical knowledge required.</p>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { n: "01", t: "Upload your video", d: "Drag and drop or browse. Any common video format is supported." },
            { n: "02", t: "AI generates captions", d: "Transcription in seconds. Edit anything that needs a tweak." },
            { n: "03", t: "Export and share", d: "Download as a captioned video or a subtitle file. Done." },
          ].map((s) => (
            <div
              key={s.n}
              className="relative overflow-hidden rounded-[14px] border border-[#e8e4de] bg-white p-7"
            >
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff5c3a] to-[#ffd5cc]" />
              <div className="font-mono-jb mb-4 flex h-[34px] w-[34px] items-center justify-center rounded-full border-[1.5px] border-[#ffd5cc] bg-[#fff5f3] text-[13px] font-semibold text-[#ff5c3a]">
                {s.n}
              </div>
              <div className="mb-2 text-[15px] font-semibold">{s.t}</div>
              <div className="text-[13px] leading-[1.7] text-[#999]">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 pb-[72px] md:px-12">
        <div className="mb-2.5 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-[#ff5c3a]">
          Testimonials
        </div>
        <h2 className="font-serif-display mb-2 text-center text-[38px] font-normal tracking-[-1px]">
          Creators love it
        </h2>
        <p className="mb-12 text-center text-[14.5px] text-[#b0aba4]">
          Join 12,000+ people saving hours every week
        </p>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { q: "Saves me hours every week. The transcription accuracy is genuinely impressive.", i: "AK", n: "Aisha K.", r: "YouTube creator" },
            { q: "Our social team uses this daily. SRT export fits our workflow perfectly.", i: "MR", n: "Marco R.", r: "Social media manager" },
            { q: "No tutorial needed. Uploaded my first video and had captions in under a minute.", i: "PS", n: "Priya S.", r: "Podcast producer" },
          ].map((t, i) => (
            <div
              key={i}
              className="rounded-[14px] border border-[#e8e4de] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(26,26,26,0.08)]"
            >
              <div className="mb-3.5 flex gap-1">
                {Array.from({ length: 5 }).map((_, k) => (
                  <div key={k} className="h-[13px] w-[13px] rounded bg-[#ff5c3a]" />
                ))}
              </div>
              <p className="mb-4 text-[13px] italic leading-[1.75] text-[#666]">"{t.q}"</p>
              <div className="flex items-center gap-2.5">
                <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-[1.5px] border-[#ffd5cc] bg-[#fff5f3] text-[10.5px] font-semibold text-[#ff5c3a]">
                  {t.i}
                </div>
                <div>
                  <div className="text-[13px] font-semibold">{t.n}</div>
                  <div className="text-[11px] text-[#b0aba4]">{t.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <div className="relative mx-4 mb-16 overflow-hidden rounded-[20px] bg-[#1a1a1a] p-8 text-center md:mx-12 md:p-[60px]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 50% 100%, rgba(255,92,58,0.15), transparent)",
          }}
        />
        <h2 className="font-serif-display relative mb-2.5 text-[36px] font-normal tracking-[-1px] text-white">
          Start captioning for free
        </h2>
        <p className="relative mb-8 text-[14.5px] text-white/45">
          No credit card required. First 3 videos on us.
        </p>
        <Link
          to="/editor"
          className="relative inline-flex items-center gap-2 rounded-[10px] bg-[#ff5c3a] px-[30px] py-3.5 text-[14.5px] font-medium text-white transition hover:-translate-y-0.5 hover:bg-[#ff7558] hover:shadow-[0_6px_24px_rgba(255,92,58,0.4)]"
        >
          Get started free <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </Link>
      </div>
      </main>

      {/* Footer */}
      <footer className="flex flex-col items-center justify-between gap-3 border-t border-[#e8e4de] bg-white px-6 py-5 text-xs text-[#b0aba4] md:flex-row md:px-12">
        <div>© 2025 Subbly</div>
        <div className="flex gap-[22px]">
          <a href="#" className="transition hover:text-[#1a1a1a]">Privacy</a>
          <a href="#" className="transition hover:text-[#1a1a1a]">Terms</a>
          <a href="#" className="transition hover:text-[#1a1a1a]">Contact</a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
