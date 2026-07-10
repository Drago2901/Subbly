import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Menu as MenuIcon,
  Moon,
  Sun,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { AvatarDropdown } from "@/components/AvatarDropdown";
import { Seo } from "@/components/Seo";

const PRICING_DESCRIPTION =
  "Pricing that scales with your content. Start free and upgrade when you're ready. Every plan includes AI captions and styling.";

type Period = "monthly" | "yearly";

interface Feature {
  text: string;
  included: boolean;
}

interface Plan {
  key: string;
  name: string;
  subtitle: string;
  monthlyPrice: number | "Free";
  yearlyPrice: number | "Free";
  monthlySubtext: string;
  yearlySubtext: string;
  cta: string;
  feats: Feature[];
  featured: boolean;
}

const PLANS: Plan[] = [
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
      { text: "Unlimited watermarked exports", included: true },
      { text: "2 min transcription / month", included: true },
      { text: "All caption styles", included: true },
      { text: "Google Fonts", included: true },
      { text: "SRT download", included: false },
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
      { text: "Unlimited watermark-free exports", included: true },
      { text: "60 min transcription / month", included: true },
      { text: "SRT download", included: true },
      { text: "5 custom fonts", included: true },
      { text: "1080p HD export", included: true },
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
      { text: "Unlimited watermark-free exports", included: true },
      { text: "3 hours transcription / month", included: true },
      { text: "SRT download · 10 custom fonts", included: true },
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
      { text: "Unlimited watermark-free exports", included: true },
      { text: "8 hours transcription / month", included: true },
      { text: "30 custom fonts · 3 devices", included: true },
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
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div
      className="min-h-screen bg-[#f5f3ee] text-[#1a1a1a]"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <Seo title="Pricing — Subbly" description={PRICING_DESCRIPTION} path="/pricing" jsonLd={faqJsonLd} />
      
      {/* Nav */}
      <nav className="relative sticky top-0 z-[200] flex h-[62px] items-center justify-between border-b border-[#e8e4de] bg-white/95 px-6 backdrop-blur-xl md:px-12 text-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/");
              }
            }}
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e4de] bg-white text-[#666] transition hover:text-[#1a1a1a]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#ff5c3a]">
              <span className="font-serif-display text-[22px] font-bold text-white leading-none select-none">S</span>
            </div>
            <span className="font-serif-display text-[18px] tracking-[-0.2px] text-[#1a1a1a]">
              Subbly
            </span>
          </Link>
        </div>
        <div className="hidden items-center gap-[30px] md:flex md:absolute md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2">
          <Link to="/#features" className="text-[13.5px] text-[#666] hover:text-[#1a1a1a] transition-colors">
            Features
          </Link>
          <Link to="/#how" className="text-[13.5px] text-[#666] hover:text-[#1a1a1a] transition-colors">
            How it works
          </Link>
          <span className="text-[13.5px] font-medium text-[#1a1a1a]">Pricing</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e4de] bg-white text-[#666] transition hover:text-[#1a1a1a]"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user ? (
            <AvatarDropdown />
          ) : (
            <Link
              to="/auth"
              className="hidden items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-[14px] py-2 text-[13px] text-[#666] transition hover:text-[#1a1a1a] sm:inline-flex"
            >
              Sign in
            </Link>
          )}
          <Link
            to="/editor"
            className="hidden items-center gap-1.5 rounded-lg bg-[#ff5c3a] px-[18px] py-2 text-[13px] font-medium text-white transition hover:bg-[#ff7558] md:inline-flex"
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
        <h1 className="font-serif-display mx-auto mb-3.5 max-w-[640px] text-[40px] font-normal leading-[1.1] tracking-[-1.5px] md:text-[52px] text-[#1a1a1a]">
          Pricing that <em className="italic text-[#ff5c3a]">scales</em>
          <br />
          with your content
        </h1>
        <p className="mx-auto mb-7 max-w-[440px] text-[15px] leading-[1.7] text-[#666]">
          Start free and upgrade when you're ready. Every plan includes AI transcription, custom styling, and browser-based editing.
        </p>
        
        {/* Toggle Container */}
        <div className="inline-flex items-center gap-1 rounded-[9px] border border-[#e8e4de] bg-[#f5f3ee] p-[3px]">
          <button
            onClick={() => setPeriod("monthly")}
            className={`rounded-[7px] px-4 py-1.5 text-[12.5px] font-medium transition ${
              period === "monthly"
                ? "bg-white text-[#1a1a1a] shadow-[0_1px_4px_rgba(26,26,26,0.08)]"
                : "text-[#666] hover:text-[#1a1a1a]"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriod("yearly")}
            className={`flex items-center gap-1.5 rounded-[7px] px-4 py-1.5 text-[12.5px] font-medium transition ${
              period === "yearly"
                ? "bg-white text-[#1a1a1a] shadow-[0_1px_4px_rgba(26,26,26,0.08)]"
                : "text-[#666] hover:text-[#1a1a1a]"
            }`}
          >
            Yearly
            <span className="ml-1.5 rounded-[9px] bg-[#ff5c3a] px-1.5 py-px text-[9.5px] font-semibold text-white">
              12% off
            </span>
          </button>
        </div>
      </section>

      {/* Plan grid */}
      <section className="bg-[#f5f3ee] px-5 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-[1080px]">
          <div className="mb-4 text-[11px] font-bold uppercase tracking-wider text-[#b0aba4]">
            Web App · For Creators
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => {
              const price = period === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
              const featured = plan.featured;
              return (
                <div
                  key={plan.key}
                  className={`relative flex flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 ${
                    featured
                      ? "border-2 border-[#ff5c3a] bg-[#fff5f3] hover:shadow-[0_0_40px_rgba(255,92,58,0.35)]"
                      : "border border-[#e8e4de] bg-white hover:border-[#ff5c3a]/40 hover:shadow-[0_0_30px_rgba(255,92,58,0.2)]"
                  }`}
                >
                  {featured && (
                    <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-[#ffd5cc] bg-[#fff5f3] px-2.5 py-0.5 text-[10.5px] font-medium text-[#ff5c3a]">
                      <Sparkles className="h-[10px] w-[10px]" strokeWidth={2.5} /> MOST POPULAR
                    </span>
                  )}
                  
                  <div className="mb-1 text-[20px] font-bold text-[#1a1a1a] leading-none">{plan.name}</div>
                  <div className="mb-5 text-[12.5px] text-[#666]">{plan.subtitle}</div>
                  
                  <div className="flex items-baseline gap-0.5">
                    {price === "Free" ? (
                      <span className="text-[36px] font-extrabold text-[#1a1a1a] leading-none tracking-tight">Free</span>
                    ) : (
                      <>
                        <span className="text-[24px] font-semibold text-[#1a1a1a]">₹</span>
                        <span className="text-[36px] font-extrabold text-[#1a1a1a] leading-none tracking-tight">
                          {price.toLocaleString("en-IN")}
                        </span>
                        <span className="ml-1 text-[13px] text-[#666] font-normal">
                          {period === "monthly" ? "/mo" : "/yr"}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="mb-6 mt-1 text-[11px] text-[#b0aba4] font-medium">
                    {period === "monthly" ? plan.monthlySubtext : plan.yearlySubtext}
                  </div>
                  
                  <Link
                    to={user ? (plan.key === "free" ? "/editor" : "/subscription?tab=plans") : "/auth"}
                    className={`mb-6 flex items-center justify-center gap-1.5 rounded-xl py-3 text-center text-[13.5px] font-semibold transition ${
                      featured
                        ? "bg-[#ff5c3a] text-white hover:bg-[#ff7558] shadow-[0_2px_10px_rgba(255,92,58,0.2)]"
                        : "border border-[#e8e4de] bg-[#f5f3ee] text-[#666] hover:border-[#b0aba4] hover:bg-[#e8e4de] hover:text-[#1a1a1a]"
                    }`}
                  >
                    {plan.cta} <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </Link>
                  
                  <ul className="flex flex-col gap-3.5">
                    {plan.feats.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-[12px] leading-relaxed text-[#666]">
                        {f.included ? (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff5c3a]" strokeWidth={2.5} />
                        ) : (
                          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center text-[#b0aba4] font-bold leading-none">—</span>
                        )}
                        <span className={f.included ? "text-[#666]" : "text-[#b0aba4] line-through"}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="mx-auto mb-14 flex max-w-[640px] flex-wrap items-center justify-center gap-x-10 gap-y-6 border-y border-[#e8e4de] bg-white px-5 py-8 text-[#1a1a1a]">
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
      <section className="mx-auto mb-16 max-w-[600px] px-5 text-[#1a1a1a]">
        <h2 className="mb-7 text-center text-[20px] font-semibold tracking-[-0.5px] text-[#1a1a1a]">
          Frequently asked questions
        </h2>
        <div className="divide-y divide-[#e8e4de]">
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <button
                key={i}
                onClick={() => setOpenFaq(open ? null : i)}
                className="block w-full cursor-pointer py-4 text-left border-none focus:outline-none bg-transparent"
              >
                <div
                  className={`flex items-center justify-between gap-3 text-[13.5px] font-medium transition-colors ${
                    open ? "text-[#ff5c3a]" : "text-[#1a1a1a] hover:text-[#ff5c3a]"
                  }`}
                >
                  {f.q}
                  <ChevronDown
                    className={`h-[15px] w-[15px] shrink-0 text-[#b0aba4] transition-transform duration-300 ${
                      open ? "rotate-180 text-[#ff5c3a]" : ""
                    }`}
                    strokeWidth={2}
                  />
                </div>
                <div
                  className={`grid overflow-hidden text-[12.5px] leading-[1.7] text-[#666] transition-all duration-300 ${
                    open ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-1">{f.a}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-[1080px] flex-col items-center justify-between gap-3 border-t border-[#e8e4de] bg-white px-8 py-5 md:flex-row text-[#b0aba4]">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#ff5c3a]">
            <span className="font-serif-display text-[19px] font-bold text-white leading-none select-none">S</span>
          </div>
          <span className="font-serif-display text-[16px] text-[#1a1a1a]">Subbly</span>
        </Link>
        <div className="flex gap-5 text-[12px] text-[#b0aba4]">
          <Link to="/privacy" className="hover:text-[#1a1a1a] transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-[#1a1a1a] transition-colors">Terms</Link>
          <Link to="/contact" className="hover:text-[#1a1a1a] transition-colors">Contact</Link>
        </div>
        <span className="text-[12px] text-[#b0aba4]">© 2026 Subbly</span>
      </footer>
    </div>
  );
}

