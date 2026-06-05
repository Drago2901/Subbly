import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Menu as MenuIcon,
  Moon,
  Sun,
  Type,
  Pencil,
  Sparkles,
  Building2,
  AlignJustify,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Seo } from "@/components/Seo";

const PRICING_DESCRIPTION =
  "Pricing that scales with your content. Start free and upgrade when you're ready. Every plan includes AI captions and styling.";

type Period = "monthly" | "annual";

const PLANS = [
  {
    key: "free",
    name: "Free Plan",
    Icon: AlignJustify,
    monthly: 0,
    annual: 0,
    cta: "Get started",
    period: "/ forever",
    label: "WHAT'S INCLUDED",
    feats: [
      "3 videos per month",
      "5 GB cloud storage",
      "720p video render",
      "Max 1 min video",
    ],
    featured: false,
  },
  {
    key: "editor",
    name: "Editor Plan",
    Icon: Pencil,
    monthly: 6.99,
    annual: 4.89,
    cta: "Get Started",
    period: "/ per month",
    label: "EVERYTHING IN FREE, PLUS",
    feats: [
      "2 hours transcription",
      "20 GB cloud storage",
      "1080p video render",
      "Max video length 2 min",
      "Custom font upload",
    ],
    featured: false,
  },
  {
    key: "creator",
    name: "Creator Plan",
    Icon: Sparkles,
    monthly: 9.99,
    annual: 6.99,
    cta: "Get Started",
    period: "/ per month",
    label: "EVERYTHING IN EDITOR, PLUS",
    feats: [
      "5 hours transcription",
      "60 GB cloud storage",
      "4K video render",
      "Max 5 min video",
      "Alpha channel render",
      "SRT export",
    ],
    featured: true,
  },
  {
    key: "business",
    name: "Business Plan",
    Icon: Building2,
    monthly: 24.99,
    annual: 17.49,
    cta: "Get Started",
    period: "/ per month",
    label: "EVERYTHING IN CREATOR, PLUS",
    feats: [
      "12 hours transcription",
      "150 GB cloud storage",
      "Max 30 min video",
      "5 hrs translation",
    ],
    featured: false,
  },
];

const FAQS = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes — you can upgrade or downgrade at any time. Upgrades take effect immediately; downgrades apply at the end of your billing cycle.",
  },
  {
    q: "What video formats are supported?",
    a: "We support MP4, MOV, WebM, MKV, and AVI. Files up to 2 GB are accepted. For best results, we recommend MP4 (H.264).",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "The Free plan gives you a full taste of Subbly with no time limit. Paid plans don't require a credit card to explore — just sign up free and upgrade when ready.",
  },
  {
    q: "Do unused transcription hours roll over?",
    a: "Transcription hours reset each billing cycle and do not roll over. Audio enhancement credits also reset monthly on paid plans.",
  },
];

export default function Pricing() {
  const { theme, toggle } = useTheme();
  const [period, setPeriod] = useState<Period>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.title = "Pricing — Subbly";
    const desc =
      "Pricing that scales with your content. Start free and upgrade when you're ready. Every plan includes AI captions and styling.";
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
    }
    m.setAttribute("content", desc);
  }, []);

  const fmt = (n: number) =>
    n === 0 ? "0" : n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);

  return (
    <div
      className="min-h-screen bg-[#f5f3ee] text-[#1a1a1a]"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Nav */}
      <nav className="sticky top-0 z-[200] flex h-[62px] items-center justify-between border-b border-[#e8e4de] bg-white/95 px-6 backdrop-blur-xl md:px-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#ff5c3a]">
            <Type className="h-[17px] w-[17px] text-white" strokeWidth={2.2} />
          </div>
          <span className="font-serif-display text-[18px] tracking-[-0.2px]">
            Subbly
          </span>
        </Link>
        <div className="hidden items-center gap-[30px] md:flex">
          <Link to="/#features" className="text-[13.5px] text-[#666] hover:text-[#1a1a1a]">
            Features
          </Link>
          <span className="text-[13.5px] font-medium text-[#1a1a1a]">Pricing</span>
          <Link to="/#how" className="text-[13.5px] text-[#666] hover:text-[#1a1a1a]">
            How it works
          </Link>
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
            to="/auth"
            className="hidden items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-[14px] py-2 text-[13px] text-[#666] transition hover:text-[#1a1a1a] sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/editor"
            className="hidden items-center gap-1.5 rounded-lg bg-[#ff5c3a] px-[18px] py-2 text-[13px] font-medium text-white shadow-[0_2px_8px_rgba(255,92,58,0.2)] transition hover:bg-[#ff7558] md:inline-flex"
          >
            Get started free <ArrowRight className="h-3 w-3" strokeWidth={2.2} />
          </Link>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e4de] bg-white text-[#666] md:hidden"
          >
            <MenuIcon className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-b border-[#e8e4de] bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <Link to="/#features" className="rounded-lg px-3 py-2.5 text-[14px] text-[#666] hover:bg-[#f5f3ee]">Features</Link>
            <Link to="/#how" className="rounded-lg px-3 py-2.5 text-[14px] text-[#666] hover:bg-[#f5f3ee]">How it works</Link>
            <div className="my-2 h-px bg-[#e8e4de]" />
            <Link to="/auth" className="rounded-lg border border-[#e8e4de] px-3 py-2.5 text-center text-[14px] text-[#666]">Sign in</Link>
            <Link to="/editor" className="rounded-lg bg-[#ff5c3a] px-3 py-2.5 text-center text-[14px] font-medium text-white">Get started free</Link>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="border-b border-[#e8e4de] bg-white px-6 py-16 text-center md:py-20">
        <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[#ffd5cc] bg-[#fff5f3] px-3 py-1 text-[11.5px] font-medium text-[#ff5c3a]">
          <span className="h-[5px] w-[5px] rounded-full bg-[#ff5c3a]" /> No credit card required
        </div>
        <h1 className="font-serif-display mx-auto mb-3.5 max-w-[640px] text-[40px] font-normal leading-[1.1] tracking-[-1.5px] md:text-[52px]">
          Pricing that <em className="italic text-[#ff5c3a]">scales</em>
          <br />
          with your content
        </h1>
        <p className="mx-auto mb-7 max-w-[440px] text-[15px] leading-[1.7] text-[#666]">
          Start free and upgrade when you're ready. Every plan includes AI transcription, custom styling, and browser-based editing.
        </p>
        <div className="inline-flex items-center gap-1 rounded-[9px] border border-[#e8e4de] bg-[#f5f3ee] p-[3px]">
          {(["monthly", "annual"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex items-center gap-1.5 rounded-[7px] px-4 py-1.5 text-[12.5px] font-medium transition ${
                period === p
                  ? "bg-white text-[#1a1a1a] shadow-[0_1px_4px_rgba(26,26,26,0.08)]"
                  : "text-[#666]"
              }`}
            >
              {p === "monthly" ? "Monthly" : "Annual"}
              {p === "annual" && (
                <span className="rounded-[9px] bg-[#ff5c3a] px-1.5 py-px text-[9.5px] font-semibold text-white">
                  Save 30%
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Plan grid */}
      <section className="bg-[#f5f3ee] px-5 py-10 md:px-6 md:py-14">
        <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const price = period === "monthly" ? plan.monthly : plan.annual;
            const Icon = plan.Icon;
            const featured = plan.featured;
            return (
              <div
                key={plan.key}
                className={`relative flex flex-col rounded-2xl p-6 transition ${
                  featured
                    ? "border-2 border-[#ff5c3a] bg-[#fff5f3] shadow-[0_0_30px_rgba(255,92,58,0.1)]"
                    : "border border-[#e8e4de] bg-white hover:border-[#ffd5cc] hover:shadow-[0_4px_18px_rgba(26,26,26,0.08)]"
                }`}
              >
                {featured && (
                  <span className="absolute right-4 top-4 rounded-full border border-[#ffd5cc] bg-[#fff5f3] px-2.5 py-0.5 text-[10.5px] font-medium text-[#ff5c3a]">
                    Most Popular
                  </span>
                )}
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] border ${
                    featured
                      ? "border-[#ffd5cc] bg-[#ff5c3a]/10"
                      : "border-[#e8e4de] bg-[#f5f3ee]"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] ${featured ? "text-[#ff5c3a]" : "text-[#666]"}`}
                    strokeWidth={1.7}
                  />
                </div>
                <div className="mb-3.5 text-[14px] font-semibold">{plan.name}</div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[20px] font-normal text-[#666]">$</span>
                  <span className="text-[40px] font-semibold leading-none tracking-[-2px]">
                    {fmt(price)}
                  </span>
                </div>
                <div className="mb-[18px] mt-[3px] text-[11px] text-[#b0aba4]">{plan.period}</div>
                <Link
                  to="/auth"
                  className={`mb-5 block rounded-[9px] py-2.5 text-center text-[12.5px] font-medium transition ${
                    featured
                      ? "bg-[#ff5c3a] text-white hover:bg-[#ff7558]"
                      : "border border-[#e8e4de] bg-[#f5f3ee] text-[#666] hover:border-[#b0aba4] hover:bg-[#e8e4de] hover:text-[#1a1a1a]"
                  }`}
                >
                  {plan.cta}
                </Link>
                <div className={`mb-[18px] h-px ${featured ? "bg-[#ffd5cc]" : "bg-[#e8e4de]"}`} />
                <div
                  className={`mb-3 text-[10px] font-medium tracking-[0.08em] ${
                    featured ? "text-[#ff5c3a]" : "text-[#b0aba4]"
                  }`}
                >
                  {plan.label}
                </div>
                <ul className="flex flex-col gap-2">
                  {plan.feats.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[11.5px] leading-[1.5] text-[#666]">
                      <Check className="mt-px h-3.5 w-3.5 shrink-0 text-[#ff5c3a]" strokeWidth={2.2} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats */}
      <div className="mx-auto mb-14 flex max-w-[640px] flex-wrap items-center justify-center gap-x-10 gap-y-6 border-y border-[#e8e4de] bg-white px-5 py-8">
        {[
          { n: "99", s: "%", l: "Accuracy rate" },
          { n: "40", s: "+", l: "Languages" },
          { n: "<30", s: "s", l: "Processing time" },
          { n: "12k", s: "+", l: "Creators" },
        ].map((s, i) => (
          <div key={i} className="text-center">
            <div className="text-[26px] font-semibold tracking-[-1px]">
              {s.n}
              <span className="text-[#ff5c3a]">{s.s}</span>
            </div>
            <div className="text-[11px] text-[#b0aba4]">{s.l}</div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <section className="mx-auto mb-16 max-w-[600px] px-5">
        <h2 className="mb-7 text-center text-[20px] font-semibold tracking-[-0.5px]">
          Frequently asked questions
        </h2>
        <div>
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <button
                key={i}
                onClick={() => setOpenFaq(open ? null : i)}
                className="block w-full cursor-pointer border-b border-[#e8e4de] py-4 text-left"
              >
                <div
                  className={`flex items-center justify-between gap-3 text-[13.5px] font-medium ${
                    open ? "text-[#ff5c3a]" : "text-[#1a1a1a]"
                  }`}
                >
                  {f.q}
                  <ChevronDown
                    className={`h-[15px] w-[15px] shrink-0 text-[#b0aba4] transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                    strokeWidth={2}
                  />
                </div>
                <div
                  className={`grid overflow-hidden text-[12.5px] leading-[1.7] text-[#666] transition-all ${
                    open ? "mt-2 grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">{f.a}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-[1080px] flex-col items-center justify-between gap-3 border-t border-[#e8e4de] bg-white px-8 py-5 md:flex-row">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#ff5c3a]">
            <Type className="h-[15px] w-[15px] text-white" strokeWidth={2.2} />
          </div>
          <span className="font-serif-display text-[16px]">Subbly</span>
        </Link>
        <div className="flex gap-5 text-[12px] text-[#b0aba4]">
          <a href="#" className="hover:text-[#1a1a1a]">Privacy</a>
          <a href="#" className="hover:text-[#1a1a1a]">Terms</a>
          <a href="#" className="hover:text-[#1a1a1a]">Contact</a>
        </div>
        <span className="text-[12px] text-[#b0aba4]">© 2026 Subbly</span>
      </footer>
    </div>
  );
}
