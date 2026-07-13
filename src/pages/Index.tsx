import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Play, Upload, Sparkles, Type, Check,
  Download, User, Globe, Sliders, Shield, Zap, ChevronDown,
  Star, Film, ShieldCheck, HelpCircle, ArrowUpRight, CheckCircle2,
  XCircle, Smartphone, Flame, BadgeHelp, CheckSquare
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Seo } from "@/components/Seo";
import { NavBar } from "@/components/NavBar";
import { HeroAnimation } from "@/components/HeroAnimation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// CountUp Component for Animated Statistics
function CountUp({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          let startTimestamp: number | null = null;
          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };
          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={elementRef}>{count.toLocaleString()}{suffix}</span>;
}

const HOME_DESCRIPTION =
  "Upload a video, auto-generate captions with AI, edit text and styling, then export a captioned video — all in your browser.";

const HOME_JSONLD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Subbly",
    url: "https://subbly.in/",
    description: "AI video caption editor.",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Subbly",
    url: "https://subbly.in/",
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

const PLANS = [
  {
    key: "free",
    name: "Free",
    subtitle: "Try everything, watermarked",
    monthlyPrice: "Free",
    yearlyPrice: "Free",
    monthlySubtext: "no card needed",
    yearlySubtext: "no card needed",
    cta: "Go to editor",
    feats: [
      "Unlimited watermarked exports",
      "2 min transcription / month",
      "All caption styles",
      "Google Fonts support",
      "SRT download is disabled",
    ],
    featured: false,
  },
  {
    key: "starter",
    name: "Starter",
    subtitle: "Post without the watermark",
    monthlyPrice: 299,
    yearlyPrice: 3157,
    monthlySubtext: "per month · UPI Autopay · cancel anytime",
    yearlySubtext: "≈ ₹263/mo · UPI Autopay · cancel anytime",
    cta: "Get Starter",
    feats: [
      "Unlimited watermark-free exports",
      "60 min transcription / month",
      "SRT & VTT download",
      "5 custom fonts upload",
      "1080p HD export rendering",
    ],
    featured: false,
  },
  {
    key: "editor",
    name: "Editor",
    subtitle: "For creators who post weekly",
    monthlyPrice: 499,
    yearlyPrice: 5269,
    monthlySubtext: "per month · UPI Autopay · cancel anytime",
    yearlySubtext: "≈ ₹439/mo · UPI Autopay · cancel anytime",
    cta: "Get Editor",
    feats: [
      "Unlimited watermark-free exports",
      "3 hours transcription / month",
      "SRT & VTT download support",
      "10 custom fonts upload",
      "Priority HD cloud rendering",
    ],
    featured: true,
  },
  {
    key: "pro",
    name: "Pro",
    subtitle: "For editors & agencies",
    monthlyPrice: 999,
    yearlyPrice: 10549,
    monthlySubtext: "per month · UPI Autopay · cancel anytime",
    yearlySubtext: "≈ ₹879/mo · UPI Autopay · cancel anytime",
    cta: "Get Pro",
    feats: [
      "Unlimited watermark-free exports",
      "8 hours transcription / month",
      "30 custom fonts · 3 active devices",
      "Dedicated multi-track layout",
      "Priority 24/7 client support",
    ],
    featured: false,
  },
];

const FAQS = [
  {
    q: "How does the AI video transcription work?",
    a: "Our system parses the audio track of your uploaded video through advanced automatic speech recognition (ASR) neural layers. It identifies words, marks timestamps down to the millisecond, and aligns captions with absolute timing accuracy.",
  },
  {
    q: "Can I switch or cancel plans at any time?",
    a: "Yes. You can upgrade, downgrade, or cancel your subscription directly from your account page. Upgrades happen instantly, while downgrades or cancellations apply at the end of the current billing cycle.",
  },
  {
    q: "What video formats are supported?",
    a: "Subbly supports all major video formats, including MP4, MOV, WebM, AVI, and MKV. We recommend using H.264 MP4 formats for optimal browser-based rendering speed.",
  },
  {
    q: "Do my transcription credits roll over to the next month?",
    a: "No, transcription hours reset at the beginning of each billing cycle to keep subscription rates clean and affordable. Unused credits do not roll over.",
  },
  {
    q: "Is there a limit to how many videos I can export?",
    a: "Not at all. Every plan, including the Free tier, includes unlimited video exports. The only difference is the Free plan applies a Subbly logo watermark, while paid tiers are completely watermark-free.",
  },
  {
    q: "What languages can Subbly transcribe?",
    a: "We support over 40 languages including English, Spanish, French, German, Portuguese, Hindi, Japanese, Mandarin, and Arabic. You can translate captions with a single click.",
  },
];

export default function Index() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showcaseTab, setShowcaseTab] = useState<"transcribe" | "styles" | "edit" | "translate" | "export">("transcribe");

  // Creator Logos
  const platforms = [
    { name: "YouTube", icon: "🔴", text: "YouTube Creators" },
    { name: "TikTok", icon: "🎵", text: "TikTok Stars" },
    { name: "Instagram", icon: "📸", text: "IG Reels" },
    { name: "LinkedIn", icon: "💼", text: "Professionals" },
    { name: "Facebook", icon: "👥", text: "FB Watch" }
  ];

  return (
    <div className="min-h-screen bg-[#fffaf5] dark:bg-[#0c0b08] text-zinc-800 dark:text-[#f4f3ef] font-sans antialiased bg-grid-dark-pattern dark:bg-grid-white-pattern selection:bg-[#ff5c3a]/30 selection:text-[#ff8c73] transition-colors duration-300">
      <Seo title="Subbly — World-Class AI Video Caption Editor" description={HOME_DESCRIPTION} path="/" jsonLd={HOME_JSONLD} />
      <NavBar isPublic />

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 md:px-12 md:pt-28 md:pb-24 overflow-hidden">
        {/* Glow Spheres */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[450px] w-[800px] rounded-full bg-gradient-to-b from-[#ff5c3a]/5 dark:from-[#ff5c3a]/12 to-transparent blur-[120px] z-0" />
        
        <div className="relative mx-auto max-w-7xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            {/* Badge Indicator */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-50/50 dark:bg-orange-950/20 px-3.5 py-1 text-xs font-semibold tracking-wide text-[#ff5c3a] dark:text-[#ff7558]">
              <Sparkles className="h-3.5 w-3.5 text-[#ff5c3a]" />
              <span>Next-Gen Speech-to-Text AI</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-[56px] font-bold leading-[1.08] tracking-tight text-zinc-900 dark:text-white mb-6 font-sans">
              Word-Perfect <br />
              <span className="bg-gradient-to-r from-[#ff5c3a] to-[#ff8c73] bg-clip-text text-transparent">AI Captions</span> <br />
              in seconds.
            </h1>

            <p className="text-base md:text-lg text-zinc-550 dark:text-zinc-400 leading-relaxed mb-8 max-w-[460px]">
              Upload your video, generate instant timed subtitles, customize templates with a single click, and export watermark-free.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 mb-8 w-full sm:w-auto">
              <Link
                to={user ? "/editor" : "/auth"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5c3a] to-[#ff7558] px-8 py-4 text-[15px] font-bold text-white shadow-lg hover:shadow-orange-500/20 transition-all hover:-translate-y-0.5"
              >
                Start Captioning Free <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              
              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-850 px-6 py-4 text-[15px] font-semibold text-zinc-650 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all">
                    <Play className="h-4 w-4 fill-zinc-650 group-hover:fill-white" /> Watch Demo
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[720px] border-zinc-200 dark:border-zinc-800 bg-[#fffaf5] dark:bg-[#0c0b08] p-0 overflow-hidden shadow-2xl">
                  <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-850 bg-white dark:bg-zinc-950">
                    <DialogTitle className="text-zinc-900 dark:text-white text-base font-bold flex items-center gap-2">
                      <Film className="h-4 w-4 text-[#ff5c3a]" /> Subbly Product Tour Walkthrough
                    </DialogTitle>
                  </DialogHeader>
                  <div className="aspect-video bg-black relative flex items-center justify-center">
                    <video
                      src="https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4"
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Small Badges / Trust Tags */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-8 text-xs font-semibold text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#ff5c3a]" strokeWidth={3} />
                <span>No Watermark Tiers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#ff5c3a]" strokeWidth={3} />
                <span>40+ Languages Supported</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#ff5c3a]" strokeWidth={3} />
                <span>Zero Card Required</span>
              </div>
            </div>

            {/* Social Proof Row */}
            <div className="flex items-center gap-3.5 border-t border-zinc-200 dark:border-zinc-800/80 pt-6 w-full">
              <div className="flex -space-x-2.5">
                {[
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80",
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&h=80&q=80"
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Creator Avatar"
                    className="h-8.5 w-8.5 rounded-full border-2 border-[#fffaf5] dark:border-[#0c0b08] object-cover"
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                     <Star key={i} className="h-3 w-3 fill-amber-400" />
                  ))}
                  <span className="text-[12.5px] font-bold text-zinc-800 dark:text-white ml-1">4.9 / 5</span>
                </div>
                <div className="text-[11.5px] text-zinc-550 dark:text-zinc-500 font-semibold">Trusted by 50,000+ creators worldwide</div>
              </div>
            </div>

          </div>

          {/* Hero Right Content (Interactive Editor Mockup) */}
          <div className="lg:col-span-7 w-full">
            <HeroAnimation />
          </div>

        </div>
      </section>

      {/* Premium Logo Cloud */}
      <section className="border-y border-zinc-200/80 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/40 py-10 px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-[10.5px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-655 mb-7">SUPPORTED CREATOR PLATFORMS</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 md:gap-x-20">
            {platforms.map((platform) => (
              <div 
                key={platform.name} 
                className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-[#ff5c3a] transition-colors duration-300 group cursor-pointer"
              >
                <span className="text-lg grayscale group-hover:grayscale-0 transition-all duration-300">{platform.icon}</span>
                <span className="text-sm font-semibold tracking-tight">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-14 px-6 bg-zinc-50/20 dark:bg-zinc-950/20 border-b border-zinc-200/60 dark:border-zinc-900/60">
        <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 500, suffix: "K+", label: "Videos Processed" },
            { value: 40, suffix: "+", label: "Languages Supported" },
            { value: 99, suffix: "%", label: "Transcription Accuracy" },
            { value: 24, suffix: "/7", label: "Cloud Processing Speed" }
          ].map((stat, idx) => (
            <div key={idx} className="text-center p-4 border-r border-zinc-200 dark:border-zinc-900 last:border-r-0">
              <div className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight font-mono mb-1">
                <CountUp end={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bento Grid Feature Section */}
      <section id="features" className="px-6 py-20 md:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#ff5c3a]">BENTO FEATURES</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mt-3 mb-4">
            Engineered for modern editors
          </h2>
          <p className="text-sm md:text-base text-zinc-550 dark:text-zinc-400">
            Speed up your content pipeline with intelligent styling and lightning-fast voice transcription tools.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: AI Speech to Text (2-column spanned on MD) */}
          <div className="md:col-span-2 group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-7 hover:border-orange-500/30 transition-all duration-300 subbly-card-hover shadow-sm hover:shadow-md">
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-500/20">
              <Sparkles className="h-5.5 w-5.5 text-[#ff5c3a]" />
            </div>
            <h3 className="text-lg font-bold text-zinc-850 dark:text-white mb-2">99% Accurate AI Speech Engine</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[480px] leading-relaxed mb-6">
              Skip manual typing. Subbly detects accents, cancels ambient noise, and outputs word-perfect subtitles in over 40 languages within seconds.
            </p>
            {/* Visual Waveform Demo inside card */}
            <div className="h-20 w-full rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-150 dark:border-zinc-855 p-4 flex items-center justify-between gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              {[12, 38, 22, 54, 32, 16, 28, 48, 72, 60, 42, 28, 12, 32, 58, 44, 22, 18, 38, 52, 28, 14, 28, 42, 64, 48, 22, 12].map((h, i) => (
                <div 
                  key={i} 
                  className="w-1.5 bg-orange-500/30 group-hover:bg-[#ff5c3a] rounded-sm transition-all duration-300" 
                  style={{ height: `${h}%`, animationDelay: `${i * 30}ms` }} 
                />
              ))}
            </div>
          </div>

          {/* Card 2: Interactive Caption Styling */}
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-7 hover:border-orange-500/30 transition-all duration-300 subbly-card-hover shadow-sm hover:shadow-md">
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-500/20">
              <Type className="h-5.5 w-5.5 text-[#ff5c3a]" />
            </div>
            <h3 className="text-lg font-bold text-zinc-850 dark:text-white mb-2">Styled Caption Presets</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
              Adopt styles used by viral creators. Toggle between animated karaoke highlights, block blur outlines, and text gradients.
            </p>
            {/* Mock Presets buttons */}
            <div className="flex flex-col gap-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 p-2.5 border border-zinc-150 dark:border-zinc-850">
              <div className="flex items-center justify-between rounded bg-amber-400 text-black px-2 py-1.5 text-[9.5px] font-extrabold uppercase">
                <span>Tiktok Style</span>
                <Check className="h-3 w-3" strokeWidth={3} />
              </div>
              <div className="flex items-center justify-between rounded border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 px-2 py-1.5 text-[9.5px] font-sans text-zinc-750 dark:text-white/70">
                <span>Cinema Block</span>
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-700" />
              </div>
            </div>
          </div>

          {/* Card 3: Timeline Corrections */}
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-7 hover:border-orange-500/30 transition-all duration-300 subbly-card-hover shadow-sm hover:shadow-md">
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-500/20">
              <Sliders className="h-5.5 w-5.5 text-[#ff5c3a]" />
            </div>
            <h3 className="text-lg font-bold text-zinc-855 dark:text-white mb-2">Tactile Timeline Slider</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
              Need a quick correction? Adjust timestamps simply by sliding blocks. Double click a word to edit text directly.
            </p>
            {/* Drag Handle simulation */}
            <div className="h-14 w-full rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-150 dark:border-zinc-855 p-2 flex items-center">
              <div className="h-9 flex-1 rounded bg-[#ff5c3a]/15 border border-[#ff5c3a]/30 text-[9px] font-mono text-[#ff5c3a] flex items-center justify-center relative">
                [ Edit Timing ]
                <div className="absolute right-0 top-0 bottom-0 w-1 rounded bg-orange-500" />
              </div>
            </div>
          </div>

          {/* Card 4: Translation Support (2-column spanned on MD) */}
          <div className="md:col-span-2 group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-7 hover:border-orange-500/30 transition-all duration-300 subbly-card-hover shadow-sm hover:shadow-md">
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-500/20">
              <Globe className="h-5.5 w-5.5 text-[#ff5c3a]" />
            </div>
            <h3 className="text-lg font-bold text-zinc-850 dark:text-white mb-2">Translate Into 100+ Languages</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[480px] leading-relaxed mb-6">
              Instantly localise your videos. Subbly automatically translates transcribing files so you can tap into worldwide viewer bases in Spanish, French, Chinese, Hindi, and more.
            </p>
            <div className="flex gap-2 text-[10.5px]">
              <span className="rounded bg-orange-50 dark:bg-orange-950/35 border border-orange-200 dark:border-orange-500/20 text-[#ff5c3a] dark:text-[#ff7558] px-2.5 py-1 font-bold">🇺🇸 English</span>
              <span className="text-zinc-450 dark:text-zinc-650 pt-1">➜</span>
              <span className="rounded bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-850 text-zinc-500 dark:text-zinc-400 px-2.5 py-1 font-semibold">🇪🇸 Spanish</span>
              <span className="rounded bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-850 text-zinc-500 dark:text-zinc-400 px-2.5 py-1 font-semibold">🇫🇷 French</span>
              <span className="rounded bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-850 text-zinc-500 dark:text-zinc-400 px-2.5 py-1 font-semibold">🇯🇵 Japanese</span>
            </div>
          </div>

          {/* Card 5: flexible exports */}
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-7 hover:border-orange-500/30 transition-all duration-300 subbly-card-hover shadow-sm hover:shadow-md">
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-500/20">
              <Download className="h-5.5 w-5.5 text-[#ff5c3a]" />
            </div>
            <h3 className="text-lg font-bold text-zinc-855 dark:text-white mb-2">Multi-Format Exports</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
              Export captioned videos as MP4 files or download subtitle standalone files in `.srt` or `.vtt` formats to upload directly to Youtube.
            </p>
            <div className="flex items-center gap-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 p-2.5 border border-zinc-150 dark:border-zinc-850 text-[10.5px] font-mono text-zinc-550 dark:text-zinc-450 justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 bg-[#ff5c3a]/15 text-[#ff5c3a] flex items-center justify-center rounded text-[9px] font-bold">SRT</div>
                <span>subtitle_export.srt</span>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </div>

          {/* Card 6: project saving */}
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-7 hover:border-orange-500/30 transition-all duration-300 subbly-card-hover shadow-sm hover:shadow-md">
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-500/20">
              <User className="h-5.5 w-5.5 text-[#ff5c3a]" />
            </div>
            <h3 className="text-lg font-bold text-zinc-850 dark:text-white mb-2">Cloud Project Syncing</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
              Save your draft projects securely on the cloud. Create on desktop, perform quick edits on your laptop, and resume at any time.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-550 dark:text-zinc-400">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>Project Saved in Subbly Cloud</span>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Product Showcase */}
      <section className="border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-950/20 py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#ff5c3a]">INTERACTIVE SHOWCASE</span>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-3 mb-4">Explore the editing console</h2>
            <p className="text-sm text-zinc-550 dark:text-zinc-400">Click the tabs below to preview the core editor features in high detail.</p>
          </div>

          {/* Switcher Navigation */}
          <div className="mx-auto max-w-3xl flex flex-wrap justify-center gap-2 mb-10">
            {[
              { id: "transcribe", label: "Auto-Transcribe", icon: Sparkles },
              { id: "styles", label: "Style Presets", icon: Type },
              { id: "edit", label: "Smart Timeline", icon: Sliders },
              { id: "translate", label: "Global Translation", icon: Globe },
              { id: "export", label: "Pro Exports", icon: Download }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = showcaseTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setShowcaseTab(tab.id as "transcribe" | "styles" | "edit" | "translate" | "export")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold border transition-all ${
                    isActive 
                      ? "bg-[#ff5c3a] border-[#ff5c3a] text-white shadow-md shadow-orange-500/10" 
                      : "bg-white/80 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Showcase Panel Container */}
          <div className="mx-auto max-w-4xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl transition-all duration-300">
            {showcaseTab === "transcribe" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="md:col-span-5">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Instant transcription with 99.4% precision</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                    Our AI models isolate audio tracks, strip background hums, and map out caption timestamps with accuracy. No manual tweaking needed.
                  </p>
                  <ul className="flex flex-col gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ff5c3a]" /> Noise reduction filters</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ff5c3a]" /> Smart word-boundary alignment</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ff5c3a]" /> Auto punctuation formatting</li>
                  </ul>
                </div>
                <div className="md:col-span-7 bg-zinc-50/80 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-850 p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-550 font-semibold">SPEECH DETECTOR WAVES</span>
                      <span className="text-[9px] bg-green-955 dark:bg-green-950 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded font-bold">READY</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="rounded bg-white dark:bg-zinc-950 p-2.5 border border-zinc-200 dark:border-zinc-850 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-zinc-800 dark:text-white">"Welcome to the video..."</span>
                        <span className="text-[9.5px] font-mono text-zinc-450 dark:text-zinc-500">0:00 - 0:01</span>
                      </div>
                      <div className="rounded bg-white dark:bg-zinc-950 p-2.5 border border-zinc-200 dark:border-zinc-850 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#ff5c3a]">"Subbly handles transcription..."</span>
                        <span className="text-[9.5px] font-mono text-zinc-450 dark:text-zinc-500">0:01 - 0:03</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showcaseTab === "styles" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="md:col-span-5">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Viral caption styles at your disposal</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                    Change colors, font weight, border outlines, and backgrounds in one click. Support for Google Fonts and custom file uploads.
                  </p>
                  <ul className="flex flex-col gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ff5c3a]" /> Custom font file uploads (.ttf/.otf)</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ff5c3a]" /> Bouncy animation presets</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ff5c3a]" /> Subtitle block backgrounds</li>
                  </ul>
                </div>
                <div className="md:col-span-7 bg-zinc-50/80 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-850 p-5 flex flex-col gap-4">
                  <div className="text-center font-extrabold uppercase tracking-wide text-2xl text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] border border-dashed border-zinc-200 dark:border-zinc-700/60 p-6 rounded-lg bg-white dark:bg-zinc-950">
                    AMBER GLOW
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 text-center text-[10px] font-bold text-zinc-700 dark:text-white">TikTok Style</div>
                    <div className="rounded border border-orange-500/20 bg-orange-95/20 dark:bg-orange-95/20 p-2 text-center text-[10px] font-bold text-[#ff5c3a]">Neon Glow</div>
                    <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 text-center text-[10px] font-bold text-zinc-700 dark:text-white">Classic SRT</div>
                  </div>
                </div>
              </div>
            )}

            {showcaseTab === "edit" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="md:col-span-5">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Perfect subtitle timing via timeline</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                    Correct word timings or split sentences with intuitive boundary slides. Simply grab the handle and drag.
                  </p>
                  <ul className="flex flex-col gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ff5c3a]" /> Sentence boundary splitters</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ff5c3a]" /> Drag-and-drop boundary handles</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ff5c3a]" /> Audio track correlation charts</li>
                  </ul>
                </div>
                <div className="md:col-span-7 bg-zinc-50/80 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-850 p-5 flex flex-col gap-3">
                  <div className="h-10 w-full rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 relative flex items-center px-3">
                    <div className="h-6 w-24 bg-orange-100 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-500/30 rounded text-[9.5px] font-mono text-[#ff5c3a] flex items-center justify-center">
                      [ Grab Handle ]
                    </div>
                    <div className="absolute left-28 top-0 bottom-0 w-[2px] bg-[#ff5c3a]" />
                  </div>
                  <div className="text-right text-[10px] text-zinc-450 dark:text-zinc-500 font-mono">Drag block boundaries to sync audio layers</div>
                </div>
              </div>
            )}

            {showcaseTab === "translate" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="md:col-span-5">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Auto-translate into multiple languages</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                    Deploy your videos to global markets. Localize captions with deep neural translation services.
                  </p>
                  <ul className="flex flex-col gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ff5c3a]" /> One-click translation</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ff5c3a]" /> High accuracy contextual translations</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ff5c3a]" /> Retain style templates across files</li>
                  </ul>
                </div>
                <div className="md:col-span-7 bg-zinc-50/80 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-850 p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">English Caption:</span>
                    <span className="font-semibold text-zinc-800 dark:text-white">"We build world-class interfaces"</span>
                  </div>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Spanish Translation:</span>
                    <span className="font-bold text-[#ff5c3a]">"Creamos interfaces de clase mundial"</span>
                  </div>
                </div>
              </div>
            )}

            {showcaseTab === "export" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="md:col-span-5">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Multi-format high-speed output</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                    Render styled videos at 1080p without watermark, or extract standalone subtitles.
                  </p>
                  <ul className="flex flex-col gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ff5c3a]" /> 1080p HD watermark-free formats</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ff5c3a]" /> SRT / VTT subtitle files downloads</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ff5c3a]" /> Priority cloud rendering speeds</li>
                  </ul>
                </div>
                <div className="md:col-span-7 bg-zinc-50/80 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-850 p-5 flex flex-col gap-4">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Render Progress:</span>
                      <span className="font-mono text-zinc-850 dark:text-white">100%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-[#ff5c3a] w-full" />
                    </div>
                  </div>
                  <button className="flex items-center justify-center gap-2 rounded-xl bg-[#ff5c3a] py-3 font-semibold text-white shadow-lg text-xs">
                    <Download className="h-4 w-4" /> Download Watermark-Free MP4
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="px-6 py-20 md:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#ff5c3a]">WORKFLOW</span>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-3 mb-4">Captions in three simple steps</h2>
          <p className="text-sm text-zinc-550 dark:text-zinc-400">Subbly streamlines transcription so you can focus entirely on video creation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* Vertical connecting line for layouts */}
          <div className="hidden md:block absolute top-14 left-[15%] right-[15%] h-[1.5px] bg-gradient-to-r from-[#ff5c3a] via-zinc-200 dark:via-zinc-800 to-zinc-100 dark:to-zinc-900 z-0" />

          {[
            { step: "01", title: "Upload Video", desc: "Drag and drop your MP4, MOV, or WebM video file. AI transcribes speech automatically." },
            { step: "02", title: "Apply Style Presets", desc: "Select layout presets, tweak fonts, and double-click to correct speech layers." },
            { step: "03", title: "Export Anywhere", desc: "Download caption standalone SRT sheets, or export watermark-free high-definition MP4s." }
          ].map((item, idx) => (
            <div key={idx} className="relative z-10 rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-955 p-7 group hover:border-orange-500/30 transition-all duration-300 shadow-sm">
              <span className="font-mono text-3xl font-extrabold text-[#ff5c3a]/20 group-hover:text-[#ff5c3a] transition-all duration-300 block mb-4">{item.step}</span>
              <h3 className="text-lg font-bold text-zinc-850 dark:text-white mb-2">{item.title}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-450 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Subbly Section */}
      <section className="border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/45 py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#ff5c3a]">COMPARISON</span>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-3 mb-4">Engineered to save hours</h2>
            <p className="text-sm text-zinc-550 dark:text-zinc-400">How Subbly stacks up against traditional subtitling workflows.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* Without Subbly */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-8 flex flex-col justify-between opacity-80">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-550 block mb-2">WITHOUT SUBBLY</span>
                <h3 className="text-xl font-bold text-zinc-500 dark:text-zinc-400 mb-6 flex items-center gap-2">
                  <XCircle className="h-5.5 w-5.5 text-red-500" /> Manual Captioning
                </h3>
                <ul className="flex flex-col gap-4 text-xs text-zinc-500 dark:text-zinc-500">
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 font-bold">❌</span>
                    <span>Typing every word manually leading to transcription errors.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 font-bold">❌</span>
                    <span>Spending hours adjusting timestamps frame-by-frame on traditional timelines.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 font-bold">❌</span>
                    <span>Manual translations require third-party tools or human translators.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 font-bold">❌</span>
                    <span>No preset styles, styles must be manually built for each video element.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 border-t border-zinc-100 dark:border-zinc-900 pt-6 text-[11px] text-zinc-500 dark:text-zinc-600 font-semibold uppercase">Est. Time: 2-3 hours per video</div>
            </div>

            {/* With Subbly */}
            <div className="rounded-2xl border border-orange-500/20 bg-orange-50/20 dark:bg-orange-950/10 p-8 flex flex-col justify-between relative shadow-orange-glow">
              <div className="absolute top-4 right-4 rounded bg-[#ff5c3a] text-white px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider">RECOMMENDED</div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff7558] block mb-2">WITH SUBBLY</span>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                  <CheckCircle2 className="h-5.5 w-5.5 text-green-500" /> AI-Powered Speed
                </h3>
                <ul className="flex flex-col gap-4 text-xs text-zinc-700 dark:text-zinc-300">
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 font-bold">✅</span>
                    <span>AI auto-generates transcribing layers with 99.4% speech precision.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 font-bold">✅</span>
                    <span>Double click words to auto-correct or split timestamps instantly.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 font-bold">✅</span>
                    <span>Auto-translate captions into 100+ languages in one click.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 font-bold">✅</span>
                    <span>Instantly apply TikTok, Netflix, and Neon styled captions.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 border-t border-orange-500/20 pt-6 text-[11px] text-[#ff7558] font-bold uppercase">Est. Time: 30 seconds per video</div>
            </div>

          </div>
        </div>
      </section>

      {/* Creator Testimonials Grid */}
      <section className="px-6 py-20 md:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#ff5c3a]">SOCIAL PROOF</span>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-3 mb-4">Loved by 12,000+ content creators</h2>
          <p className="text-sm text-zinc-550 dark:text-zinc-400">See how creators and marketing teams save hours of editing time every week.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "Subbly has saved me countless hours. The transcription accuracy is incredibly impressive, and the templates match my reels perfectly.",
              name: "Aisha K.",
              handle: "@aishacreates",
              avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80",
              role: "YouTube Content Creator"
            },
            {
              quote: "Our social media team uses this daily. Exporting watermark-free SRT files fits into our Premiere editing workflow beautifully.",
              name: "Marco R.",
              handle: "@marcomedia",
              avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
              role: "Social Media Agency Director"
            },
            {
              quote: "No tutorials required. I uploaded my podcast file and had styled bouncy captions within less than 45 seconds. Highly recommended!",
              name: "Priya S.",
              handle: "@priyaspark",
              avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
              role: "Podcast Producer"
            }
          ].map((t, idx) => (
            <div key={idx} className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-6 flex flex-col justify-between hover:border-orange-500/25 dark:hover:border-orange-500/25 transition-all duration-300 shadow-sm">
              <div>
                <div className="flex gap-0.5 text-amber-500 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-500" />
                  ))}
                </div>
                <p className="text-xs text-zinc-605 dark:text-zinc-300 italic leading-relaxed mb-6">"{t.quote}"</p>
              </div>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="h-9 w-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-800" />
                <div>
                  <div className="text-xs font-bold text-zinc-800 dark:text-white">{t.name}</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-500 font-semibold">{t.role} · {t.handle}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Grid */}
      <section id="pricing" className="border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/20 dark:bg-zinc-950/20 py-20 px-6 md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#ff5c3a]">PRICING PLANS</span>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-3 mb-4">Pricing that scales with your reach</h2>
            <p className="text-sm text-zinc-550 dark:text-zinc-400">Start free and upgrade when your pipeline grows. Cancel at any time.</p>

            {/* Toggle switch */}
            <div className="mt-8 inline-flex items-center gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setPeriod("monthly")}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                  period === "monthly"
                    ? "bg-[#ff5c3a] text-white"
                    : "text-zinc-500 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                Monthly billing
              </button>
              <button
                onClick={() => setPeriod("yearly")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                  period === "yearly"
                    ? "bg-[#ff5c3a] text-white"
                    : "text-zinc-500 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                Yearly billing
                <span className="rounded bg-[#ff5c3a]/10 dark:bg-black/30 px-1.5 py-0.5 text-[9px] text-[#ff5c3a] dark:text-[#ff8c73] font-bold">12% OFF</span>
              </button>
            </div>
          </div>

          {/* Pricing cards grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {PLANS.map((plan) => {
              const price = period === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
              const featured = plan.featured;
              return (
                <div
                  key={plan.key}
                  className={`relative flex flex-col rounded-2xl p-6 transition-all duration-300 ${
                    featured
                      ? "border-2 border-[#ff5c3a] bg-orange-50/20 dark:bg-orange-950/10 shadow-orange-glow hover:-translate-y-1"
                      : "border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-800 hover:-translate-y-1 shadow-sm"
                  }`}
                >
                  {featured && (
                    <span className="absolute -top-3.5 right-6 inline-flex items-center gap-1 rounded-full bg-[#ff5c3a] px-3 py-0.5 text-[9.5px] font-bold text-white tracking-wider">
                      <Sparkles className="h-2.5 w-2.5" /> MOST POPULAR
                    </span>
                  )}
                  
                  <div className="mb-1 text-base font-bold text-zinc-900 dark:text-white">{plan.name}</div>
                  <div className="mb-5 text-[11.5px] text-zinc-450 dark:text-zinc-555 font-medium">{plan.subtitle}</div>
                  
                  <div className="flex items-baseline gap-1 mb-1">
                    {price === "Free" ? (
                      <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">Free</span>
                    ) : (
                      <>
                        <span className="text-xl font-bold text-zinc-900 dark:text-white">₹</span>
                        <span className="text-3xl font-extrabold text-zinc-900 dark:text-white leading-none tracking-tight">
                          {price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-zinc-450 dark:text-zinc-550 font-semibold">
                          {period === "monthly" ? "/mo" : "/yr"}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="mb-6 text-[10.5px] text-zinc-400 dark:text-zinc-455 font-medium">
                    {period === "monthly" ? plan.monthlySubtext : plan.yearlySubtext}
                  </div>
                  
                  <Link
                    to={user ? (plan.key === "free" ? "/editor" : "/subscription?tab=plans") : "/auth"}
                    className={`mb-6 flex items-center justify-center gap-1.5 rounded-xl py-3 text-center text-xs font-bold transition-all ${
                      featured
                        ? "bg-[#ff5c3a] text-white hover:bg-[#ff7558] shadow-md shadow-orange-500/25"
                        : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {plan.cta} <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                  </Link>
                  
                  <ul className="flex flex-col gap-3.5 pt-4 border-t border-zinc-100 dark:border-zinc-900 flex-1">
                    {plan.feats.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff5c3a]" strokeWidth={3} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Refund policy trust badges */}
          <div className="mt-14 max-w-md mx-auto text-center rounded-2xl bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 flex items-center justify-center gap-3 shadow-sm">
            <ShieldCheck className="h-8 w-8 text-[#ff5c3a]" />
            <div className="text-left">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-white">100% Secure Checkout & UPI Autopay</h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-medium mt-0.5">Upgrade or downgrade dynamically. No cancellation fees.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-20 md:px-12 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#ff5c3a]">FAQ ACCORDION</span>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-3 mb-4">Frequently Asked Questions</h2>
          <p className="text-sm text-zinc-550 dark:text-zinc-400">Everything you need to know about Subbly's billing and limits.</p>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-900 border-t border-b border-zinc-200 dark:divide-zinc-900">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-1">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between py-4 text-left font-semibold text-zinc-850 dark:text-white hover:text-[#ff5c3a] dark:hover:text-[#ff7558] transition-colors focus:outline-none"
                >
                  <span className="text-sm">{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-zinc-450 dark:text-zinc-550 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#ff5c3a] dark:text-[#ff7558]" : ""}`} />
                </button>
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100 pb-5" : "grid-rows-[0fr] opacity-0 h-0 overflow-hidden"
                  }`}
                >
                  <div className="overflow-hidden text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[680px]">
                    {faq.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Banner Banner */}
      <section className="relative mx-4 mb-20 overflow-hidden rounded-[24px] border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/80 p-8 text-center md:mx-12 md:p-16 max-w-6xl lg:mx-auto shadow-md">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 70% at 50% 120%, rgba(255,92,58,0.15), transparent)",
          }}
        />
        <span className="relative z-10 text-[10.5px] font-bold uppercase tracking-widest text-[#ff5c3a] block mb-3">GET STARTED TODAY</span>
        <h2 className="relative z-10 text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
          Start captioning your videos for free
        </h2>
        <p className="relative z-10 text-xs text-zinc-500 dark:text-zinc-455 mb-8 max-w-sm mx-auto">
          Sign up instantly. First 3 exports are fully watermark-free. No credit card required.
        </p>
        <Link
          to={user ? "/editor" : "/auth"}
          className="relative z-10 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5c3a] to-[#ff7558] px-8 py-4 text-[14.5px] font-bold text-white shadow-lg hover:shadow-orange-500/25 transition-all hover:scale-105"
        >
          Get Started Free <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </section>

      {/* Premium Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/60 px-6 py-14 md:px-12 text-xs">
        <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-6 gap-8 mb-10 text-zinc-550 dark:text-[#b0aba4]">
          
          {/* Logo / Brand columns */}
          <div className="col-span-2 flex flex-col items-start gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-[#ff5c3a] to-[#ff8c73] p-[1.5px] shadow-[0_2px_8px_rgba(255,92,58,0.15)]">
                <img
                  src="/logo.png"
                  alt="Subbly Logo"
                  className="h-full w-full object-contain rounded-[7px]"
                />
              </div>
              <span className="font-serif text-[16.5px] font-bold text-zinc-850 dark:text-white">Subbly</span>
            </Link>
            <p className="text-[11.5px] text-zinc-500 dark:text-zinc-500 leading-relaxed max-w-[200px]">
              AI-powered captions for creators, agencies, and marketing editors. Ready in seconds.
            </p>
            <span className="text-[10px] text-zinc-450 dark:text-zinc-700 font-semibold uppercase tracking-wider">© 2026 Subbly Inc.</span>
          </div>

          {/* Links Column 1: Product */}
          <div>
            <h5 className="font-bold text-zinc-800 dark:text-white uppercase tracking-wider text-[10px] mb-4">Product</h5>
            <ul className="flex flex-col gap-3 font-medium text-zinc-500 dark:text-zinc-450">
              <li><Link to="/editor" className="hover:text-[#ff5c3a] transition-colors">Video Editor</Link></li>
              <li><a href="#features" className="hover:text-[#ff5c3a] transition-colors">AI Transcriber</a></li>
              <li><a href="#features" className="hover:text-[#ff5c3a] transition-colors">Preset Styles</a></li>
              <li><Link to="/pricing" className="hover:text-[#ff5c3a] transition-colors">Pricing Options</Link></li>
            </ul>
          </div>

          {/* Links Column 2: Resources */}
          <div>
            <h5 className="font-bold text-zinc-800 dark:text-white uppercase tracking-wider text-[10px] mb-4">Resources</h5>
            <ul className="flex flex-col gap-3 font-medium text-zinc-500 dark:text-zinc-455">
              <li><Link to="/contact" className="hover:text-[#ff5c3a] transition-colors">Get Support</Link></li>
              <li><Link to="/contact" className="hover:text-[#ff5c3a] transition-colors">Report Bugs</Link></li>
              <li><Link to="/pricing" className="hover:text-[#ff5c3a] transition-colors">Billing Guides</Link></li>
              <li><Link to="/" className="hover:text-[#ff5c3a] transition-colors">API Docs</Link></li>
            </ul>
          </div>

          {/* Links Column 3: Legal */}
          <div>
            <h5 className="font-bold text-zinc-800 dark:text-white uppercase tracking-wider text-[10px] mb-4">Legal</h5>
            <ul className="flex flex-col gap-3 font-medium text-zinc-500 dark:text-zinc-450">
              <li><Link to="/privacy" className="hover:text-[#ff5c3a] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-[#ff5c3a] transition-colors">Terms of Service</Link></li>
              <li><Link to="/contact" className="hover:text-[#ff5c3a] transition-colors">Contact Legal</Link></li>
            </ul>
          </div>

          {/* Newsletter signup Column */}
          <div className="col-span-2 md:col-span-1">
            <h5 className="font-bold text-zinc-800 dark:text-white uppercase tracking-wider text-[10px] mb-4">Get Updates</h5>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Enter email..."
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-850 dark:text-white focus:outline-none focus:border-[#ff5c3a] transition-colors text-xs placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
              <button className="w-full rounded-lg bg-[#ff5c3a] py-2 text-white font-bold hover:bg-[#ff7558] transition-colors">
                Subscribe
              </button>
            </form>
          </div>

        </div>

        <div className="mx-auto max-w-7xl pt-8 border-t border-zinc-200 dark:border-zinc-900/60 flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-450 dark:text-zinc-600 font-medium">
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-zinc-400 transition-colors">Privacy Settings</Link>
            <span className="text-zinc-300 dark:text-zinc-800">•</span>
            <Link to="/terms" className="hover:text-zinc-400 transition-colors">Cookies Policy</Link>
          </div>
          <div>Proudly designed for creators.</div>
        </div>
      </footer>
    </div>
  );
}
