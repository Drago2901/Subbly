import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  CreditCard,
  HardDrive,
  LayoutGrid,
  Mic,
  Receipt,
  Zap,
  Clock,
  Check,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { Seo } from "@/components/Seo";

type TabKey = "overview" | "plans" | "payment" | "billing";

const TABS: { key: TabKey; label: string; Icon: typeof LayoutGrid }[] = [
  { key: "overview",  label: "Overview",         Icon: LayoutGrid },
  { key: "plans",     label: "Plans & Upgrades",  Icon: Zap        },
  { key: "payment",   label: "Payment Methods",   Icon: CreditCard },
  { key: "billing",   label: "Billing History",   Icon: Receipt    },
];

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

/* ── Usage stat row ── */
function UsageStat({
  icon: Icon,
  iconColor,
  label,
  current,
  total,
  pct,
  barColor,
  leftNote,
  rightNote,
  noteColor = "text-zinc-500",
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  current: string;
  total: string;
  pct: number;
  barColor: string;
  leftNote: string;
  rightNote: string;
  noteColor?: string;
}) {
  return (
    <div className="flex flex-col gap-3 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-[#faf9f7] dark:bg-zinc-800 ${iconColor}`}>
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-medium text-[#1a1a1a] dark:text-zinc-100">{label}</span>
        </div>
        <div className="text-right text-xs text-[#b0aba4]">
          <span className="font-semibold text-[#1a1a1a] dark:text-zinc-100">{current}</span> / {total}
        </div>
      </div>

      {/* Progress */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#faf9f7] dark:bg-zinc-800">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: barColor }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span className={noteColor}>{leftNote}</span>
        <span className="text-[#b0aba4]">{rightNote}</span>
      </div>
    </div>
  );
}

/* ── Empty state placeholder ── */
function EmptyTab({
  icon: Icon,
  iconColor,
  title,
  description,
  cta,
  ctaAction,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  cta?: string;
  ctaAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-20 text-center">
      <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#faf9f7] dark:bg-zinc-800 ${iconColor}`}>
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mb-2 text-base font-semibold text-[#1a1a1a] dark:text-zinc-100">{title}</h3>
      <p className="mb-6 max-w-sm text-sm leading-relaxed text-[#666] dark:text-zinc-400">{description}</p>
      {cta && ctaAction && (
        <button
          onClick={ctaAction}
          className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
        >
          {cta}
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════ */
export default function Subscription() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<TabKey>(() => {
    const t = searchParams.get("tab") as TabKey;
    if (t && ["overview", "plans", "payment", "billing"].includes(t)) {
      return t;
    }
    return "overview";
  });
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    const t = searchParams.get("tab") as TabKey;
    if (t && ["overview", "plans", "payment", "billing"].includes(t)) {
      setTab(t);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#f5f3ee] dark:bg-zinc-950 text-[#1a1a1a] dark:text-zinc-50 transition-colors duration-300">
      <Seo
        title="Subscription — Subbly"
        description="Manage your plan, payment methods, and billing history."
        path="/subscription"
        noIndex
      />
      <NavBar activeView="Subscription" />

      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-12">

        {/* ── Page Header ── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a1a] dark:text-zinc-100">Subscription</h1>
            <p className="mt-1.5 text-sm text-[#666] dark:text-zinc-400">
              Manage your plan, payment methods, and billing history.
            </p>
          </div>
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/projects");
              }
            }}
            className="flex w-fit items-center gap-1.5 rounded-xl border border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-medium text-[#666] dark:text-zinc-400 transition hover:border-[#b0aba4] dark:hover:border-zinc-700 hover:bg-[#faf9f7] dark:hover:bg-zinc-800 hover:text-[#1a1a1a] dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div className="mb-8 flex flex-wrap gap-1 rounded-2xl border border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1.5">
          {TABS.map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all ${
                  active
                    ? "bg-[#faf9f7] dark:bg-zinc-800 text-[#1a1a1a] dark:text-zinc-100 shadow-sm border border-[#e8e4de] dark:border-zinc-700"
                    : "text-[#666] dark:text-zinc-400 hover:bg-[#faf9f7] dark:hover:bg-zinc-800 hover:text-[#1a1a1a] dark:hover:text-zinc-100"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${active ? "text-emerald-400" : "text-[#b0aba4]"}`}
                  strokeWidth={1.8}
                />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* ══ OVERVIEW ══ */}
        {tab === "overview" && (
          <div className="flex flex-col gap-5">

            {/* Current plan card */}
            <div className="overflow-hidden rounded-2xl border border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900">
              {/* Top stripe */}
              <div className="h-1 w-full bg-gradient-to-r from-emerald-500/60 via-emerald-400/40 to-transparent" />

              <div className="p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  {/* Plan info */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                      <Zap className="h-5 w-5 text-emerald-400" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#b0aba4]">Current Plan</p>
                      <h2 className="mt-1 text-2xl font-bold text-[#1a1a1a] dark:text-zinc-100">Free</h2>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#666] dark:text-zinc-400">
                        Upgrade to unlock AI translation, premium audio cleaning, and watermark-free exports.
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className="flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => setTab("plans")}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-95"
                  >
                    Upgrade Plan
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setTab("billing")}
                    className="flex items-center gap-2 rounded-xl border border-[#e8e4de] dark:border-zinc-800 bg-[#faf9f7] dark:bg-zinc-800/40 px-5 py-2.5 text-sm font-medium text-[#666] dark:text-zinc-400 transition hover:bg-[#eeeae4] dark:hover:bg-zinc-800 hover:text-[#1a1a1a] dark:hover:text-zinc-100"
                  >
                    <Receipt className="h-4 w-4 text-[#b0aba4]" />
                    Billing History
                  </button>
                </div>
              </div>
            </div>

            {/* Usage card */}
            <div className="overflow-hidden rounded-2xl border border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="border-b border-[#e8e4de] dark:border-zinc-800 px-6 py-4">
                <h3 className="text-sm font-semibold text-[#1a1a1a] dark:text-zinc-100">Plan Features &amp; Usage</h3>
                <p className="mt-0.5 text-xs text-[#b0aba4]">Your current usage this billing period</p>
              </div>

              <div className="grid grid-cols-1 divide-y divide-[#e8e4de] dark:divide-zinc-800 md:grid-cols-3 md:divide-x md:divide-y-0 dark:md:divide-zinc-800">
                <UsageStat
                  icon={HardDrive}
                  iconColor="text-emerald-400"
                  label="Storage"
                  current="< 0.1 GB"
                  total="5.0 GB"
                  pct={1.4}
                  barColor="#34d399"
                  leftNote="1.4% used"
                  rightNote="4.9 GB left"
                />
                <UsageStat
                  icon={Clock}
                  iconColor="text-sky-400"
                  label="Transcription"
                  current="4.5 mins"
                  total="5.0 mins"
                  pct={89}
                  barColor="#fbbf24"
                  leftNote="89% used"
                  rightNote="0.6 mins left"
                  noteColor="text-amber-400"
                />
                <UsageStat
                  icon={Mic}
                  iconColor="text-fuchsia-400"
                  label="Audio Cleans"
                  current="0"
                  total="3"
                  pct={0}
                  barColor="#a855f7"
                  leftNote="0% used"
                  rightNote="3 left"
                />
              </div>
            </div>
          </div>
        )}

        {/* ══ PLANS ══ */}
        {tab === "plans" && (
          <div className="flex flex-col gap-8">
            {/* Toggle Container */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1 rounded-[9px] border border-[#e8e4de] dark:border-zinc-800 bg-[#faf9f6] dark:bg-zinc-900 p-[3px]">
                <button
                  onClick={() => setPeriod("monthly")}
                  className={`rounded-[7px] px-4 py-1.5 text-[12.5px] font-medium transition cursor-pointer ${
                    period === "monthly"
                      ? "bg-white dark:bg-zinc-850 text-[#1a1a1a] dark:text-zinc-100 shadow-[0_1px_4px_rgba(26,26,26,0.08)]"
                      : "text-[#666] dark:text-zinc-400 hover:text-[#1a1a1a] dark:hover:text-zinc-100"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setPeriod("yearly")}
                  className={`flex items-center gap-1.5 rounded-[7px] px-4 py-1.5 text-[12.5px] font-medium transition cursor-pointer ${
                    period === "yearly"
                      ? "bg-white dark:bg-zinc-850 text-[#1a1a1a] dark:text-zinc-100 shadow-[0_1px_4px_rgba(26,26,26,0.08)]"
                      : "text-[#666] dark:text-zinc-400 hover:text-[#1a1a1a] dark:hover:text-zinc-100"
                  }`}
                >
                  Yearly
                  <span className="ml-1.5 rounded-[9px] bg-[#ff5c3a] px-1.5 py-px text-[9.5px] font-semibold text-white">
                    12% off
                  </span>
                </button>
              </div>
            </div>

            {/* Plan grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PLANS.map((plan) => {
                const price = period === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
                const featured = plan.featured;
                return (
                  <div
                    key={plan.key}
                    className={`relative flex flex-col rounded-2xl p-5 border transition-all duration-300 ${
                      featured
                        ? "border-2 border-[#ff5c3a] bg-[#fff5f3] dark:bg-zinc-900/60"
                        : "border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900"
                    }`}
                  >
                    {featured && (
                      <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-[#ffd5cc] bg-[#fff5f3] px-2.5 py-0.5 text-[9.5px] font-semibold text-[#ff5c3a]">
                        <Sparkles className="h-[9px] w-[9px]" strokeWidth={2.5} /> POPULAR
                      </span>
                    )}
                    
                    <div className="mb-1 text-[18px] font-bold text-[#1a1a1a] dark:text-zinc-100 leading-none">{plan.name}</div>
                    <div className="mb-4 text-[11.5px] text-[#666] dark:text-zinc-400">{plan.subtitle}</div>
                    
                    <div className="flex items-baseline gap-0.5">
                      {price === "Free" ? (
                        <span className="text-[32px] font-extrabold text-[#1a1a1a] dark:text-zinc-100 leading-none tracking-tight">Free</span>
                      ) : (
                        <>
                          <span className="text-[20px] font-semibold text-[#1a1a1a] dark:text-zinc-100">₹</span>
                          <span className="text-[32px] font-extrabold text-[#1a1a1a] dark:text-zinc-100 leading-none tracking-tight">
                            {price.toLocaleString("en-IN")}
                          </span>
                          <span className="ml-1 text-[12px] text-[#666] dark:text-zinc-400 font-normal">
                            {period === "monthly" ? "/mo" : "/yr"}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="mb-5 mt-1 text-[10.5px] text-[#b0aba4] font-medium">
                      {period === "monthly" ? plan.monthlySubtext : plan.yearlySubtext}
                    </div>
                    
                    <button
                      onClick={() => setTab("payment")}
                      className={`mb-5 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-center text-[12.5px] font-semibold transition cursor-pointer ${
                        featured
                          ? "bg-[#ff5c3a] text-white hover:bg-[#ff7558] shadow-[0_2px_10px_rgba(255,92,58,0.2)]"
                          : "border border-[#e8e4de] dark:border-zinc-800 bg-[#f5f3ee] dark:bg-zinc-950 text-[#666] dark:text-zinc-400 hover:border-[#b0aba4] dark:hover:border-zinc-700 hover:bg-[#e8e4de] dark:hover:bg-zinc-800 hover:text-[#1a1a1a] dark:hover:text-zinc-100"
                      }`}
                    >
                      {plan.cta} <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                    
                    <ul className="flex flex-col gap-3">
                      {plan.feats.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-[#666] dark:text-zinc-400">
                          {f.included ? (
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff5c3a]" strokeWidth={2.5} />
                          ) : (
                            <span className="mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center text-[#b0aba4] font-bold leading-none">—</span>
                          )}
                          <span className={f.included ? "text-[#666] dark:text-zinc-400" : "text-[#b0aba4] line-through"}>
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
        )}

        {/* ══ PAYMENT ══ */}
        {tab === "payment" && (
          <EmptyTab
            icon={CreditCard}
            iconColor="text-sky-400"
            title="No payment methods yet"
            description="Your saved cards will appear here after your first purchase or subscription upgrade."
          />
        )}

        {/* ══ BILLING ══ */}
        {tab === "billing" && (
          <EmptyTab
            icon={Receipt}
            iconColor="text-zinc-400"
            title="No billing history"
            description="You haven't made any payments yet. Once you upgrade to a paid plan, your invoices will appear here."
          />
        )}

      </div>
    </div>
  );
}
