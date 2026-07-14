import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";

import {
  ArrowRight,
  Check,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Seo } from "@/components/Seo";
import { NavBar } from "@/components/NavBar";

// CountUp Component for Statistics
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
      { text: "Google Fonts support", included: true },
      { text: "SRT & VTT download", included: false },
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
      { text: "SRT & VTT download", included: true },
      { text: "5 custom fonts upload", included: true },
      { text: "1080p HD export rendering", included: true },
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
      { text: "SRT & VTT download", included: true },
      { text: "10 custom fonts upload", included: true },
      { text: "Priority HD cloud rendering", included: true },
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
      { text: "Dedicated support pipeline", included: true },
      { text: "Multi-track audio processing", included: true },
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
  {
    q: "What is UPI Autopay and how does cancellation work?",
    a: "UPI Autopay allows secure, hassle-free monthly or yearly recurring transactions directly through your BHIM, Google Pay, PhonePe, or Paytm app. You can cancel your autopay mandate anytime with one click, without any questions asked.",
  },
  {
    q: "Can I export subtitle files stand-alone?",
    a: "Yes! On all paid tiers (Starter, Editor, Pro), you can export subtitles separately as standard SRT or WebVTT files, ready to upload directly to platforms like YouTube or Facebook.",
  }
];

export default function Pricing() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
      className="min-h-screen bg-[#fffaf5] dark:bg-[#0c0b08] text-zinc-800 dark:text-[#f4f3ef] font-sans antialiased bg-grid-dark-pattern dark:bg-grid-white-pattern selection:bg-[#ff5c3a]/30 selection:text-[#ff8c73] transition-colors duration-300"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <Seo title="Pricing — Subbly" description={PRICING_DESCRIPTION} path="/pricing" jsonLd={faqJsonLd} />
      
      <NavBar isPublic activeView="Pricing" />

      {/* Hero Header Section */}
      <section className="relative px-6 py-16 text-center md:py-24 overflow-hidden border-b border-zinc-200/60 dark:border-zinc-900/60">
        {/* Glow Sphere */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[350px] w-[700px] rounded-full bg-gradient-to-b from-[#ff5c3a]/5 dark:from-[#ff5c3a]/10 to-transparent blur-[100px] z-0" />
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-50/50 dark:bg-orange-950/20 px-3.5 py-1 text-xs font-semibold text-[#ff5c3a] dark:text-[#ff7558]">
            <span className="h-[5px] w-[5px] rounded-full bg-[#ff5c3a]" /> No credit card required to start
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-6 leading-none">
            Pricing that <span className="bg-gradient-to-r from-[#ff5c3a] to-[#ff8c73] bg-clip-text text-transparent">scales</span>
            <br />
            with your content
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-sm md:text-base leading-relaxed mb-8 max-w-[480px] mx-auto">
            Start free and upgrade when you're ready. Every plan includes AI transcription, viral custom styling templates, and fast exports.
          </p>
          
          {/* Toggle Container */}
          <div className="inline-flex items-center gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setPeriod("monthly")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                period === "monthly"
                  ? "bg-[#ff5c3a] text-white shadow-sm"
                  : "text-zinc-550 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setPeriod("yearly")}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                period === "yearly"
                  ? "bg-[#ff5c3a] text-white shadow-sm"
                  : "text-zinc-550 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Yearly Billing
              <span className="rounded bg-[#ff5c3a]/10 dark:bg-black/30 px-1.5 py-0.5 text-[9px] font-bold text-[#ff5c3a] dark:text-[#ff8c73]">
                12% OFF
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plan grid */}
      <section className="px-5 py-12 md:px-6 md:py-20 max-w-7xl mx-auto">
        <div>
          <div className="mb-5 text-[10.5px] font-bold uppercase tracking-widest text-zinc-550 text-center md:text-left">
            WEB CONSOLE PLAN PACKAGES
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => {
              const price = period === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
              const featured = plan.featured;
              return (
                <div
                  key={plan.key}
                  className={`relative flex flex-col rounded-2xl p-6 transition-all duration-300 ${
                    featured
                      ? "border-2 border-[#ff5c3a] bg-orange-50/20 dark:bg-orange-950/10 shadow-orange-glow hover:-translate-y-1.5"
                      : "border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-800 hover:-translate-y-1.5"
                  }`}
                >
                  {featured && (
                    <span className="absolute -top-3.5 right-6 inline-flex items-center gap-1 rounded-full bg-[#ff5c3a] px-3 py-0.5 text-[9.5px] font-bold text-white tracking-wider">
                      <Sparkles className="h-2.5 w-2.5" /> MOST POPULAR
                    </span>
                  )}
                  
                  <div className="mb-1 text-base font-bold text-zinc-900 dark:text-white">{plan.name}</div>
                  <div className="mb-5 text-[11.5px] text-zinc-450 dark:text-zinc-550 font-medium">{plan.subtitle}</div>
                  
                  <div className="flex items-baseline gap-1 mb-1">
                    {price === "Free" ? (
                      <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">Free</span>
                    ) : (
                      <>
                        <span className="text-xl font-bold text-zinc-900 dark:text-white">₹</span>
                        <span className="text-3xl font-extrabold text-zinc-900 dark:text-white leading-none tracking-tight">
                          {price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-zinc-450 dark:text-zinc-555 font-semibold">
                          {period === "monthly" ? "/mo" : "/yr"}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="mb-6 text-[10.5px] text-zinc-400 dark:text-zinc-450 font-medium">
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
                    {plan.feats.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-500 dark:text-zinc-450">
                        {f.included ? (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff5c3a] dark:text-[#ff7558]" strokeWidth={2.5} />
                        ) : (
                          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center text-zinc-350 dark:text-zinc-700 font-bold leading-none">—</span>
                        )}
                        <span className={f.included ? "text-zinc-650 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-600 line-through font-normal"}>
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

      {/* Stats counters */}
      <section className="bg-zinc-50/50 dark:bg-zinc-950/40 border-y border-zinc-200/80 dark:border-zinc-900 py-10 px-6">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-center gap-x-12 gap-y-6 md:gap-x-20 text-zinc-800 dark:text-[#f4f3ef]">
          {[
            { n: 99, s: "%", l: "Accuracy rate" },
            { n: 40, s: "+", l: "Languages" },
            { n: 30, s: "s", l: "Processing time" },
            { n: 12, s: "k+", l: "Active Creators" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold tracking-tight">
                <CountUp end={s.n} suffix={s.s} />
              </div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-550 font-bold uppercase tracking-wider mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Secure Autopay note */}
      <div className="max-w-md mx-auto my-12 text-center rounded-2xl bg-white dark:bg-zinc-950 p-5 border border-zinc-200 dark:border-zinc-900 flex items-center justify-center gap-3.5">
        <ShieldCheck className="h-8 w-8 text-[#ff5c3a] dark:text-[#ff7558]" />
        <div className="text-left">
          <h4 className="text-xs font-bold text-zinc-800 dark:text-white">100% Secure Mandate & UPI Autopay</h4>
          <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-normal mt-0.5">Pause or withdraw billing mandates anytime from your UPI applications.</p>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="mx-auto mb-20 max-w-3xl px-5 text-zinc-800 dark:text-[#f4f3ef]">
        <div className="text-center mb-12">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#ff5c3a]">FAQ ACCORDION</span>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-3 mb-4">Frequently Asked Questions</h2>
          <p className="text-sm text-zinc-550 dark:text-zinc-400">Everything you need to know about Subbly's billing and limits.</p>
        </div>
        
        <div className="divide-y divide-zinc-200 dark:divide-zinc-900 border-t border-b border-zinc-200 dark:divide-zinc-900">
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={i} className="py-1">
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full flex items-center justify-between py-4 text-left font-semibold text-zinc-850 dark:text-white hover:text-[#ff5c3a] dark:hover:text-[#ff7558] transition-colors focus:outline-none"
                >
                  <span className="text-sm">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 text-zinc-450 dark:text-zinc-555 transition-transform duration-300 ${open ? "rotate-180 text-[#ff5c3a] dark:text-[#ff7558]" : ""}`} />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    open ? "grid-rows-[1fr] opacity-100 pb-5" : "grid-rows-[0fr] opacity-0 h-0 overflow-hidden"
                  }`}
                >
                  <div className="overflow-hidden text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {f.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/60 px-6 py-10 text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-4 md:flex-row text-zinc-550 dark:text-[#b0aba4]">
          <BrandLogo size="md" />
          <div className="flex gap-6 text-[11.5px] font-semibold text-zinc-500 dark:text-zinc-450">
            <Link to="/privacy" className="hover:text-[#ff5c3a] transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-[#ff5c3a] transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-[#ff5c3a] transition-colors">Contact</Link>
          </div>
          <span className="text-[11px] text-zinc-450 dark:text-zinc-650">© 2026 Subbly Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
