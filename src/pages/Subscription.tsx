import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlignJustify,
  ArrowUp,
  Building2,
  Check,
  CreditCard,
  FileText,
  LayoutGrid,
  ListOrdered,
  Menu as MenuIcon,
  Moon,
  Pencil,
  Sparkles,
  Sun,
  Type,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";

type TabKey = "overview" | "plans" | "payment" | "billing";
type Period = "monthly" | "yearly";

const TABS: { key: TabKey; label: string; Icon: typeof LayoutGrid }[] = [
  { key: "overview", label: "Overview", Icon: LayoutGrid },
  { key: "plans", label: "Plans", Icon: ListOrdered },
  { key: "payment", label: "Payment", Icon: CreditCard },
  { key: "billing", label: "Billing history", Icon: FileText },
];

const SUB_PLANS = [
  {
    key: "editor",
    name: "Editor Plan",
    Icon: Pencil,
    monthly: { price: 599, old: "₹850" },
    yearly: { price: 419, old: "₹599" },
    label: "KEY FEATURES",
    feats: ["2 hrs transcription", "20 GB storage", "1080p render", "Max 2 min video"],
    featured: false,
  },
  {
    key: "creator",
    name: "Creator Plan",
    Icon: Sparkles,
    monthly: { price: 850, old: "₹1250" },
    yearly: { price: 595, old: "₹850" },
    label: "EVERYTHING IN EDITOR, PLUS",
    feats: ["5 hrs transcription", "60 GB storage", "4K render", "2 hrs translation"],
    featured: true,
  },
  {
    key: "business",
    name: "Business Plan",
    Icon: Building2,
    monthly: { price: 2150, old: "₹3400" },
    yearly: { price: 1505, old: "₹2150" },
    label: "EVERYTHING IN CREATOR, PLUS",
    feats: [
      "12 hrs transcription",
      "150 GB storage",
      "Max 30 min video",
      "5 hrs translation",
    ],
    featured: false,
  },
];

export default function Subscription() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>("overview");
  const [period, setPeriod] = useState<Period>("monthly");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.title = "Subscription — Subbly";
  }, []);

  const userName =
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split("@")[0] ||
    "Account";
  const initials = (userName || "AD")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="min-h-screen bg-[#f5f3ee] pb-16 text-[#1a1a1a]"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Nav */}
      <nav className="sticky top-0 z-[200] flex h-[62px] items-center justify-between border-b border-[#e8e4de] bg-white/95 px-4 backdrop-blur-xl md:px-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#ff5c3a]">
            <Type className="h-[17px] w-[17px] text-white" strokeWidth={2.2} />
          </div>
          <span className="font-serif-display text-[18px] tracking-[-0.2px]">Subbly</span>
        </Link>
        <div className="hidden items-center gap-[26px] md:flex">
          <Link to="/projects" className="text-[13.5px] text-[#666] hover:text-[#1a1a1a]">
            Projects
          </Link>
          <Link to="/pricing" className="text-[13.5px] text-[#666] hover:text-[#1a1a1a]">
            Pricing
          </Link>
          <span className="text-[13.5px] font-medium text-[#1a1a1a]">Subscription</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e4de] bg-white text-[#666] hover:text-[#1a1a1a]"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#ffd5cc] bg-[#fff5f3] text-[10px] font-semibold text-[#ff5c3a]">
              {initials}
            </div>
            <span className="text-[13px] text-[#666]">{userName}</span>
          </div>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e4de] bg-white text-[#666] md:hidden"
            aria-label="Menu"
          >
            <MenuIcon className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-b border-[#e8e4de] bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <Link to="/projects" className="rounded-lg px-3 py-2.5 text-[14px] text-[#666] hover:bg-[#f5f3ee]">
              Projects
            </Link>
            <Link to="/pricing" className="rounded-lg px-3 py-2.5 text-[14px] text-[#666] hover:bg-[#f5f3ee]">
              Pricing
            </Link>
            <span className="rounded-lg bg-[#fff5f3] px-3 py-2.5 text-[14px] font-medium text-[#ff5c3a]">
              Subscription
            </span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[960px] px-5 pt-10 md:px-7 md:pt-12">
        {/* Portal label */}
        <div className="mb-4 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-[#ff5c3a]" strokeWidth={2} />
          <span className="text-[11.5px] font-medium text-[#ff5c3a]">Subscription portal</span>
        </div>

        {/* Hero */}
        <h1 className="mb-2 text-[32px] font-bold leading-[1.1] tracking-[-1.2px] md:text-[38px]">
          Your <span className="text-[#ff5c3a]">plan</span> &amp;
          <br /> billing
        </h1>
        <p className="mb-7 max-w-[460px] text-[13.5px] leading-[1.7] text-[#666]">
          Manage your subscription, payment methods, and billing history all in one place.
        </p>

        {/* Tabs */}
        <div className="mb-7 inline-flex flex-wrap gap-0.5 rounded-xl border border-[#e8e4de] bg-white p-[5px]">
          {TABS.map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[9px] px-4 py-2 text-[12.5px] font-medium transition ${
                  active
                    ? "border border-[#ffd5cc] bg-[#fff5f3] text-[#ff5c3a]"
                    : "border border-transparent text-[#666] hover:text-[#1a1a1a]"
                }`}
              >
                <Icon className="h-[13px] w-[13px]" strokeWidth={1.8} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Panels */}
        {tab === "overview" && (
          <>
            <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-[#ffd5cc] bg-white px-6 py-6 shadow-[0_2px_12px_rgba(255,92,58,0.06)] sm:flex-row">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#ffd5cc] bg-[#fff5f3]">
                  <AlignJustify className="h-[18px] w-[18px] text-[#ff5c3a]" strokeWidth={1.8} />
                </div>
                <div>
                  <div className="text-[11px] text-[#b0aba4]">Current plan</div>
                  <div className="text-[20px] font-bold tracking-[-0.3px]">Free Plan</div>
                  <div className="mt-1.5 max-w-[400px] text-[12.5px] leading-[1.6] text-[#666]">
                    3 videos/month · 5 GB storage · 720p render · Max 1 min video
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setTab("plans")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#ff5c3a] px-[18px] py-2 text-[12.5px] font-medium text-white transition hover:bg-[#ff7558]"
                    >
                      <ArrowUp className="h-3 w-3" strokeWidth={2.4} /> Upgrade plan
                    </button>
                    <button className="rounded-lg border border-[#e8e4de] bg-[#f5f3ee] px-4 py-2 text-[12.5px] font-medium text-[#666] hover:border-[#b0aba4] hover:text-[#1a1a1a]">
                      Manage billing
                    </button>
                  </div>
                </div>
              </div>
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11.5px] font-medium text-emerald-600">
                ● Active
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              {[
                { lbl: "TRANSCRIPTION", val: "0 / 1 hr", pct: 0, meta: "Resets in 23 days", red: false },
                { lbl: "CLOUD STORAGE", val: "1.2 / 5 GB", pct: 24, meta: "1.2 GB used", red: false },
                { lbl: "VIDEOS THIS MONTH", val: "3 / 3", pct: 100, meta: "Limit reached — upgrade", red: true },
              ].map((u) => (
                <div key={u.lbl} className="rounded-[10px] border border-[#e8e4de] bg-white p-[18px]">
                  <div className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.06em] text-[#b0aba4]">
                    {u.lbl}
                  </div>
                  <div className="mb-2 text-[18px] font-semibold tracking-[-0.3px]">{u.val}</div>
                  <div className="h-[3px] overflow-hidden rounded-full bg-[#e8e4de]">
                    <div
                      className={`h-full rounded-full ${u.red ? "bg-[#ff5c3a]" : "bg-[#ff5c3a]"}`}
                      style={{ width: `${u.pct}%` }}
                    />
                  </div>
                  <div className="mt-1.5 text-[10px] text-[#b0aba4]">{u.meta}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "plans" && (
          <>
            <div className="mb-7 flex justify-center">
              <div className="inline-flex">
                <button
                  onClick={() => setPeriod("monthly")}
                  className={`rounded-l-lg border border-r-0 px-[22px] py-2 text-[12.5px] font-medium ${
                    period === "monthly"
                      ? "border-[#ff5c3a] bg-[#ff5c3a] text-white"
                      : "border-[#e8e4de] bg-white text-[#666]"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setPeriod("yearly")}
                  className={`rounded-r-lg border px-[22px] py-2 text-[12.5px] font-medium ${
                    period === "yearly"
                      ? "border-[#ff5c3a] bg-[#ff5c3a] text-white"
                      : "border-[#e8e4de] bg-white text-[#666]"
                  }`}
                >
                  Annual{" "}
                  <span className="ml-1 rounded-md bg-emerald-500 px-1.5 py-px text-[10px] font-semibold text-white">
                    Save 30%
                  </span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {SUB_PLANS.map((p) => {
                const Icon = p.Icon;
                const price = period === "monthly" ? p.monthly : p.yearly;
                const featured = p.featured;
                return (
                  <div
                    key={p.key}
                    className={`relative rounded-[14px] p-[22px] pb-6 transition ${
                      featured
                        ? "border-2 border-[#ff5c3a] bg-[#fff5f3]"
                        : "border border-[#e8e4de] bg-white hover:border-[#ffd5cc] hover:shadow-[0_4px_16px_rgba(26,26,26,0.07)]"
                    }`}
                  >
                    {featured && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#ff5c3a] px-3 py-0.5 text-[10px] font-semibold text-white">
                        MOST POPULAR
                      </span>
                    )}
                    <div
                      className={`mb-3.5 flex h-9 w-9 items-center justify-center rounded-[9px] border ${
                        featured ? "border-[#ffd5cc] bg-[#ff5c3a]/10" : "border-[#e8e4de] bg-[#f5f3ee]"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${featured ? "text-[#ff5c3a]" : "text-[#666]"}`}
                        strokeWidth={1.8}
                      />
                    </div>
                    <div className="mb-2.5 text-[13.5px] font-semibold">{p.name}</div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-[16px] text-[#666]">₹</span>
                      <span className="text-[32px] font-semibold leading-none tracking-[-1.5px]">
                        {price.price}
                      </span>
                      <span className="ml-1 self-end pb-[3px] text-[11px] text-[#b0aba4] line-through">
                        {price.old}
                      </span>
                    </div>
                    <div className="mb-4 mt-0.5 text-[10.5px] text-[#b0aba4]">
                      / month + 18% GST
                    </div>
                    <button
                      className={`mb-4 w-full rounded-lg py-2.5 text-[12.5px] font-medium transition ${
                        featured
                          ? "bg-[#ff5c3a] text-white hover:bg-[#ff7558]"
                          : "border border-[#e8e4de] bg-[#f5f3ee] text-[#666] hover:border-[#b0aba4] hover:text-[#1a1a1a]"
                      }`}
                    >
                      Plan Upgrade
                    </button>
                    <div
                      className={`mb-3.5 h-px ${featured ? "bg-[#ffd5cc]" : "bg-[#e8e4de]"}`}
                    />
                    <div
                      className={`mb-2.5 text-[10px] font-medium uppercase tracking-[0.08em] ${
                        featured ? "text-[#ff5c3a]" : "text-[#b0aba4]"
                      }`}
                    >
                      {p.label}
                    </div>
                    <ul className="flex flex-col gap-2">
                      {p.feats.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-1.5 text-[11.5px] leading-[1.5] text-[#666]"
                        >
                          <Check className="mt-px h-3.5 w-3.5 shrink-0 text-[#ff5c3a]" strokeWidth={2.2} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "payment" && (
          <>
            <div className="mb-5">
              <h2 className="text-[18px] font-bold tracking-[-0.3px]">Payment Methods</h2>
              <p className="mt-1 text-[12.5px] text-[#666]">
                Manage your saved cards for subscriptions and purchases.
              </p>
            </div>
            <EmptyBox
              Icon={CreditCard}
              title="No payment methods"
              sub="Cards will appear here after your first purchase or subscription."
            />
          </>
        )}

        {tab === "billing" && (
          <>
            <div className="mb-5">
              <h2 className="text-[18px] font-bold tracking-[-0.3px]">Billing History</h2>
              <p className="mt-1 text-[12.5px] text-[#666]">
                View and download your past invoices and receipts.
              </p>
            </div>
            <EmptyBox
              Icon={FileText}
              title="No billing history found"
              sub="You haven't made any payments yet. Once you upgrade, your invoices will appear here."
            />
          </>
        )}
      </div>
    </div>
  );
}

function EmptyBox({
  Icon,
  title,
  sub,
}: {
  Icon: typeof CreditCard;
  title: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[#e8e4de] bg-white px-5 py-14 text-center">
      <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#ffd5cc] bg-[#fff5f3]">
        <Icon className="h-5 w-5 text-[#ff5c3a]" strokeWidth={1.8} />
      </div>
      <div className="mb-1 text-[14px] font-semibold">{title}</div>
      <div className="text-[12.5px] leading-[1.6] text-[#666]">{sub}</div>
    </div>
  );
}
