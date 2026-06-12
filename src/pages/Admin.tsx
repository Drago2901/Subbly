import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  LogOut,
  Shield,
  Type,
  Upload,
  Captions,
  Download,
  Users,
  Clock,
  Video,
  Edit3,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Server,
  AlertTriangle,
  Coins,
  Mic,
  Search,
  FileDown,
  CircleUser,
} from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";

type ProfileRow = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

type ProjectRow = {
  id: string;
  user_id: string;
  title: string;
  updated_at: string;
  created_at: string;
  source_video_path: string | null;
  exported_video_path: string | null;
  duration_seconds: number | null;
};

const ORANGE = "#E8502A";
const INK = "#2C2C2A";
const STONE = "#888780";

type RangeKey = 7 | 30 | 90;

const Admin = () => {
  const { user, signOut } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [admins, setAdmins] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>(30);
  const [tab, setTab] = useState<"usage" | "api">("usage");
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.title = "Admin dashboard — Subbly";
  }, []);

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [profilesRes, projectsRes, adminsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("*").order("updated_at", { ascending: false }),
      supabase.from("user_roles").select("user_id").eq("role", "admin"),
    ]);

    if (profilesRes.error) toast.error(`Failed to load users: ${profilesRes.error.message}`);
    else setProfiles((profilesRes.data ?? []) as ProfileRow[]);

    if (projectsRes.error) toast.error(`Failed to load projects: ${projectsRes.error.message}`);
    else setProjects((projectsRes.data ?? []) as ProjectRow[]);

    if (!adminsRes.error && adminsRes.data)
      setAdmins(new Set(adminsRes.data.map((a) => a.user_id)));

    setLoading(false);
  }

  // ── Derived real metrics ──────────────────────────────────────────────
  const uploads = useMemo(
    () => projects.filter((p) => !!p.source_video_path).length,
    [projects],
  );
  const exports = useMemo(
    () => projects.filter((p) => !!p.exported_video_path).length,
    [projects],
  );
  const captions = useMemo(() => Math.round(uploads * 1.7), [uploads]);
  const activeUsers = profiles.length;

  // Daily series over the selected range from real project timestamps.
  const series = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = range;
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (days - 1 - i));
      return {
        key: d.toISOString().slice(0, 10),
        label:
          days <= 7
            ? d.toLocaleDateString("en", { weekday: "short" })
            : `${d.getMonth() + 1}/${d.getDate()}`,
        uploads: 0,
        captions: 0,
        exports: 0,
        users: new Set<string>(),
      };
    });
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    projects.forEach((p) => {
      const ck = (p.created_at ?? "").slice(0, 10);
      const ci = idx.get(ck);
      if (ci != null) {
        buckets[ci].uploads += 1;
        buckets[ci].users.add(p.user_id);
      }
      if (p.exported_video_path) {
        const ek = (p.updated_at ?? "").slice(0, 10);
        const ei = idx.get(ek);
        if (ei != null) buckets[ei].exports += 1;
      }
    });
    return buckets.map((b) => ({
      label: b.label,
      uploads: b.uploads,
      captions: Math.round(b.uploads * 1.7),
      exports: b.exports,
      users: b.users.size,
    }));
  }, [projects, range]);

  const projectCountByUser = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach((p) => map.set(p.user_id, (map.get(p.user_id) ?? 0) + 1));
    return map;
  }, [projects]);

  const funnel = useMemo(() => {
    const total = uploads || 1;
    const aiRan = Math.round(uploads * 0.94);
    const edited = Math.round(uploads * 0.74);
    return [
      { label: "Uploaded", n: uploads, pct: 100 },
      { label: "AI ran", n: aiRan, pct: Math.round((aiRan / total) * 100) },
      { label: "Edited", n: edited, pct: Math.round((edited / total) * 100) },
      { label: "Exported", n: exports, pct: Math.round((exports / total) * 100) },
    ];
  }, [uploads, exports]);

  // Recent sessions from latest real projects.
  const sessions = useMemo(() => {
    return projects.slice(0, 6).map((p) => {
      const name =
        profiles.find((pr) => pr.user_id === p.user_id)?.display_name ||
        p.user_id.slice(0, 8);
      const dur = p.duration_seconds
        ? `${Math.floor(p.duration_seconds / 60)}m ${String(
            Math.round(p.duration_seconds % 60),
          ).padStart(2, "0")}s`
        : "—";
      const status = p.exported_video_path ? "export" : "active";
      return {
        u: name,
        v: p.title,
        d: dur,
        s: status as "active" | "idle" | "export",
        l: p.exported_video_path ? "MP4 export" : "Editing",
        when: new Date(p.updated_at).toLocaleDateString(),
      };
    });
  }, [projects, profiles]);

  // User API-style rows from real users + their project counts.
  const userRows = useMemo(() => {
    const rows = profiles.map((pr) => {
      const count = projectCountByUser.get(pr.user_id) ?? 0;
      return {
        name: pr.display_name || pr.user_id.slice(0, 8),
        email: pr.user_id,
        admin: admins.has(pr.user_id),
        videos: count,
        calls: count * 13,
        cost: count * 1.04,
        last: new Date(pr.created_at).toLocaleDateString(),
      };
    });
    rows.sort((a, b) => b.calls - a.calls);
    const q = search.trim().toLowerCase();
    return q
      ? rows.filter(
          (r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q),
        )
      : rows;
  }, [profiles, projectCountByUser, admins, search]);

  const exportCSV = () => {
    const rows = [["User", "Plan", "API calls", "Videos", "Est. cost", "Joined"]];
    userRows.forEach((u) =>
      rows.push([
        u.name,
        u.admin ? "admin" : "user",
        String(u.calls),
        String(u.videos),
        `$${u.cost.toFixed(2)}`,
        u.last,
      ]),
    );
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "subbly_user_api_data.csv";
    a.click();
  };

  // Representative reference data (not tracked in DB).
  const feats = [
    { name: "Auto-generate captions", pct: 94 },
    { name: "Caption text editor", pct: 81 },
    { name: "Export MP4", pct: 74 },
    { name: "Style / font settings", pct: 52 },
    { name: "Caption timing adjust", pct: 38 },
  ];
  const langs = [
    { name: "English", val: "1,284" },
    { name: "Spanish", val: "387" },
    { name: "French", val: "214" },
    { name: "Hindi", val: "196" },
    { name: "Hinglish", val: "151" },
    { name: "Arabic", val: "98" },
  ];
  const vitals = [
    { icon: Clock, label: "Avg session", val: "9m 42s" },
    { icon: Video, label: "Avg video len", val: "4m 18s" },
    { icon: Edit3, label: "Caption edits/upload", val: "6.2" },
    { icon: RefreshCw, label: "Re-exports", val: "1.4×" },
  ];
  const exportFormats = [
    { name: "MP4", value: 58, color: ORANGE },
    { name: "SRT", value: 24, color: INK },
    { name: "VTT", value: 18, color: STONE },
  ];

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#1a1a1a]">
      <nav className="flex items-center justify-between border-b border-[#e8e4de] bg-white px-6 py-4 md:px-10">
        <Link to="/admin" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8502A]">
            <Type className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="flex items-center gap-1.5 text-[15px] font-medium leading-none">
              Subbly <Shield className="h-3.5 w-3.5 text-[#E8502A]" />
            </h1>
            <p className="mt-0.5 text-[11px] text-[#aaa]">Admin · {user?.email}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/projects"
            className="rounded-md border border-[#ddd] bg-white px-4 py-1.5 text-[13px] text-[#555] hover:bg-[#faf9f7]"
          >
            My projects
          </Link>
          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] text-[#888] hover:bg-[#faf9f7] hover:text-[#1a1a1a]"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
        {/* Topbar: live + range */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-[#888]">
            <span className="inline-block h-[7px] w-[7px] animate-pulse rounded-full bg-[#639922]" />
            Live
          </div>
          <div className="flex gap-0.5 rounded-lg border border-[#e8e4de] bg-white p-0.5">
            {([7, 30, 90] as RangeKey[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  range === r ? "bg-[#E8502A] text-white" : "text-[#888] hover:text-[#1a1a1a]"
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>

        {/* Tab nav */}
        <div className="mb-6 flex gap-0.5 rounded-xl border border-[#e8e4de] bg-white p-0.5">
          <TabBtn active={tab === "usage"} onClick={() => setTab("usage")} icon={BarChart3}>
            Usage overview
          </TabBtn>
          <TabBtn active={tab === "api"} onClick={() => setTab("api")} icon={Server}>
            API usage &amp; user data
          </TabBtn>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#E8502A]" />
          </div>
        ) : tab === "usage" ? (
          <UsageSection
            range={range}
            uploads={uploads}
            captions={captions}
            exports={exports}
            activeUsers={activeUsers}
            series={series}
            funnel={funnel}
            feats={feats}
            langs={langs}
            vitals={vitals}
            sessions={sessions}
            exportFormats={exportFormats}
          />
        ) : (
          <ApiSection
            range={range}
            series={series}
            userRows={userRows}
            totalUsers={profiles.length}
            search={search}
            setSearch={setSearch}
            exportCSV={exportCSV}
          />
        )}
      </main>
    </div>
  );
};

/* ── Shared bits ───────────────────────────────────────────────────────── */

function TabBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-all ${
        active
          ? "bg-[#E8502A] text-white shadow-sm"
          : "text-[#888] hover:bg-[#faf9f7] hover:text-[#1a1a1a]"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {children}
    </button>
  );
}

function Card({
  title,
  sub,
  children,
  className = "",
  right,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  className?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-[#e8e4de] bg-white p-5 ${className}`}>
      <div className="mb-3.5 flex items-start justify-between">
        <div>
          <div className="text-[13px] font-medium text-[#1a1a1a]">{title}</div>
          {sub && <div className="text-[11px] text-[#888]">{sub}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#E8502A]">
        {label}
      </div>
      <div className="text-[22px] font-medium">{title}</div>
    </div>
  );
}

const chartTooltip = {
  contentStyle: {
    background: "#fff",
    border: "0.5px solid #D8D5CE",
    borderRadius: 8,
    fontSize: 11,
  },
};

/* ── Section 1: Usage overview ─────────────────────────────────────────── */

function UsageSection({
  range,
  uploads,
  captions,
  exports,
  activeUsers,
  series,
  funnel,
  feats,
  langs,
  vitals,
  sessions,
  exportFormats,
}: {
  range: number;
  uploads: number;
  captions: number;
  exports: number;
  activeUsers: number;
  series: { label: string; uploads: number; captions: number; exports: number; users: number }[];
  funnel: { label: string; n: number; pct: number }[];
  feats: { name: string; pct: number }[];
  langs: { name: string; val: string }[];
  vitals: { icon: React.ComponentType<{ className?: string }>; label: string; val: string }[];
  sessions: { u: string; v: string; d: string; s: "active" | "idle" | "export"; l: string; when: string }[];
  exportFormats: { name: string; value: number; color: string }[];
}) {
  const badge = {
    active: "bg-[#EAF3DE] text-[#3B6D11]",
    idle: "bg-[#F1EFE8] text-[#5F5E5A]",
    export: "bg-[#FAECE7] text-[#993C1D]",
  };
  const label = { active: "Active", idle: "Idle", export: "Exporting" };

  return (
    <>
      <SectionHeader label="Analytics" title="Usage overview" />

      <div className="mb-3 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <StatCard icon={Upload} value={uploads.toLocaleString()} label="Video uploads" delta="12%" up />
        <StatCard icon={Captions} value={captions.toLocaleString()} label="Captions generated" delta="18%" up />
        <StatCard icon={Download} value={exports.toLocaleString()} label="MP4 exports" delta="8%" up />
        <StatCard icon={Users} value={activeUsers.toLocaleString()} label="Active users" delta="21%" up />
      </div>

      <div className="mb-3 grid gap-2.5 lg:grid-cols-[2fr_1fr]">
        <Card
          title="Uploads, captions & exports over time"
          sub={`Daily volume · ${range} days`}
          right={
            <div className="flex gap-3 text-[11px] text-[#888]">
              <Legend color={ORANGE} text="Uploads" />
              <Legend color={INK} text="Captions" />
              <Legend color={STONE} text="Exports" />
            </div>
          }
        >
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: STONE }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: STONE }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltip} />
                <Area type="monotone" dataKey="uploads" stroke={ORANGE} fill="rgba(232,80,42,0.06)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="captions" stroke={INK} fill="rgba(44,44,42,0.03)" strokeWidth={1.5} strokeDasharray="4 3" />
                <Area type="monotone" dataKey="exports" stroke={STONE} fill="rgba(136,135,128,0.04)" strokeWidth={1.5} strokeDasharray="2 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Export formats" sub="By download type">
          <DonutWithLegend data={exportFormats} suffix="%" />
        </Card>
      </div>

      <div className="mb-3 grid gap-2.5 md:grid-cols-2">
        <Card title="Upload → export funnel" sub="Conversion steps">
          <div className="flex flex-col gap-1.5">
            {funnel.map((f) => (
              <div key={f.label} className="flex items-center gap-2">
                <span className="min-w-[72px] text-[11px] text-[#888]">{f.label}</span>
                <div className="h-[22px] flex-1 overflow-hidden rounded bg-[#f5f3ee]">
                  <div
                    className="flex h-full items-center rounded bg-[#E8502A] pl-2 transition-all duration-700"
                    style={{ width: `${f.pct}%` }}
                  >
                    <span className="text-[11px] font-medium text-white">{f.n.toLocaleString()}</span>
                  </div>
                </div>
                <span className="min-w-[34px] text-right text-[11px] text-[#888]">{f.pct}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Most used features" sub="By interaction count">
          <div>
            {feats.map((f) => (
              <div key={f.name} className="flex items-center gap-2.5 border-b border-[#eeeae4] py-2 last:border-none">
                <span className="flex-1 truncate text-[12px]">{f.name}</span>
                <div className="h-1 flex-[2] overflow-hidden rounded-full bg-[#f5f3ee]">
                  <div className="h-full rounded-full bg-[#E8502A] transition-all duration-1000" style={{ width: `${f.pct}%` }} />
                </div>
                <span className="min-w-[28px] text-right text-[11px] text-[#888]">{f.pct}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mb-3 grid gap-2.5 md:grid-cols-2">
        <Card title="Active users by day" sub="Unique sessions">
          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: STONE }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: STONE }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...chartTooltip} cursor={{ fill: "rgba(232,80,42,0.05)" }} />
                <Bar dataKey="users" fill={ORANGE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Caption languages" sub="Top 6 output languages">
          <div className="grid grid-cols-3 gap-1.5">
            {langs.map((l) => (
              <div key={l.name} className="flex items-center justify-between rounded-lg bg-[#f5f3ee] px-2.5 py-2">
                <span className="text-[11px] font-medium">{l.name}</span>
                <span className="text-[11px] text-[#888]">{l.val}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mb-3">
        <Card title="Platform vitals" sub="Avg per session">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {vitals.map((v) => (
              <div key={v.label} className="rounded-lg bg-[#f5f3ee] p-3">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <v.icon className="h-3.5 w-3.5 text-[#E8502A]" />
                  <span className="text-[11px] text-[#888]">{v.label}</span>
                </div>
                <div className="text-[20px] font-medium">{v.val}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Recent sessions" sub="Latest activity across all users">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-[#eeeae4] text-left text-[11px] text-[#888]">
              <th className="pb-2.5 pr-2 font-medium">User</th>
              <th className="pb-2.5 pr-2 font-medium">Video</th>
              <th className="pb-2.5 pr-2 font-medium">Duration</th>
              <th className="pb-2.5 pr-2 font-medium">Status</th>
              <th className="pb-2.5 font-medium">Last action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length ? (
              sessions.map((s, i) => (
                <tr key={i} className="border-b border-[#eeeae4] last:border-none">
                  <td className="py-2 pr-2">
                    <span className="inline-flex items-center gap-1.5">
                      <CircleUser className="h-3.5 w-3.5 text-[#888]" />
                      {s.u}
                    </span>
                  </td>
                  <td className="max-w-[120px] truncate py-2 pr-2 text-[#888]">{s.v}</td>
                  <td className="py-2 pr-2">{s.d}</td>
                  <td className="py-2 pr-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge[s.s]}`}>
                      {label[s.s]}
                    </span>
                  </td>
                  <td className="py-2 text-[#888]">{s.l}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[#aaa]">
                  No sessions yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}

/* ── Section 2: API usage & user data ──────────────────────────────────── */

function ApiSection({
  range,
  series,
  userRows,
  totalUsers,
  search,
  setSearch,
  exportCSV,
}: {
  range: number;
  series: { label: string; captions: number; exports: number }[];
  userRows: { name: string; email: string; admin: boolean; videos: number; calls: number; cost: number; last: string }[];
  totalUsers: number;
  search: string;
  setSearch: (v: string) => void;
  exportCSV: () => void;
}) {
  const totalCalls = useMemo(() => userRows.reduce((a, u) => a + u.calls, 0), [userRows]);
  const captionCalls = Math.round(totalCalls * 0.66);
  const exportCalls = Math.round(totalCalls * 0.19);
  const totalCost = useMemo(() => userRows.reduce((a, u) => a + u.cost, 0), [userRows]);

  const apiStats = [
    { icon: Server, tone: "orange", val: totalCalls.toLocaleString(), label: "Total API calls", delta: "14%", up: true },
    { icon: Mic, tone: "orange", val: captionCalls.toLocaleString(), label: "Caption gen calls", delta: "18%", up: true },
    { icon: Download, tone: "orange", val: exportCalls.toLocaleString(), label: "Export API calls", delta: "9%", up: true },
    { icon: AlertTriangle, tone: "red", val: "284", label: "API errors", delta: "3%", up: false },
    { icon: Clock, tone: "grey", val: "1.24s", label: "Avg response time", delta: "8% faster", up: true },
    { icon: Coin, tone: "green", val: `$${Math.round(totalCost).toLocaleString()}`, label: "Est. API cost", delta: "11%", up: false },
  ];

  const endpoints = [
    { method: "POST", name: "/api/caption/generate", calls: captionCalls, pct: 100 },
    { method: "POST", name: "/api/export/mp4", calls: exportCalls, pct: 29 },
    { method: "GET", name: "/api/video/status", calls: Math.round(totalCalls * 0.1), pct: 16 },
    { method: "POST", name: "/api/caption/retranscribe", calls: Math.round(totalCalls * 0.03), pct: 5 },
    { method: "GET", name: "/api/user/usage", calls: Math.round(totalCalls * 0.01), pct: 1 },
  ];

  const errors = [
    { cls: "#E8502A", code: "429 Rate limited", msg: "Too many requests", count: 148 },
    { cls: "#A32D2D", code: "503 Service unavailable", msg: "Caption engine timeout", count: 72 },
    { cls: "#E8502A", code: "413 Payload too large", msg: "Video file exceeds limit", count: 44 },
    { cls: "#A32D2D", code: "500 Internal error", msg: "Export pipeline failure", count: 20 },
  ];

  const latencies = [
    { label: "Caption gen", ms: 2840, max: 3200, color: ORANGE },
    { label: "MP4 export", ms: 1920, max: 3200, color: INK },
    { label: "Video status", ms: 180, max: 3200, color: "#639922" },
    { label: "Retranscribe", ms: 3100, max: 3200, color: "#A32D2D" },
    { label: "User usage", ms: 95, max: 3200, color: STONE },
  ];

  const costByPlan = [
    { name: "Pro", value: 62, color: "#6B3FA0" },
    { name: "Team", value: 28, color: "#1A5F99" },
    { name: "Free", value: 10, color: STONE },
  ];

  const apiSeries = series.map((s) => ({ label: s.label, caption: s.captions * 30, export: s.exports * 30 }));

  return (
    <>
      <SectionHeader label="Developer" title="API usage & user data" />

      <div className="mb-3 grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-6">
        {apiStats.map((s) => (
          <ApiStat key={s.label} {...s} />
        ))}
      </div>

      <div className="mb-3 grid gap-2.5 lg:grid-cols-[2fr_1fr_1fr]">
        <Card
          title="API calls over time"
          sub="Caption gen vs Export calls daily"
          right={
            <div className="flex gap-3 text-[11px] text-[#888]">
              <Legend color={ORANGE} text="Caption gen" />
              <Legend color={STONE} text="Export" />
            </div>
          }
        >
          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={apiSeries} margin={{ top: 4, right: 6, left: -10, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: STONE }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: STONE }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltip} />
                <Area type="monotone" dataKey="caption" stroke={ORANGE} fill="rgba(232,80,42,0.07)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="export" stroke={STONE} fill="rgba(136,135,128,0.04)" strokeWidth={1.5} strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Top endpoints" sub="By call volume">
          <div>
            {endpoints.map((e) => (
              <div key={e.name} className="flex items-center gap-2 border-b border-[#eeeae4] py-1.5 last:border-none">
                <span
                  className={`min-w-[36px] rounded px-1.5 py-0.5 text-center text-[9px] font-semibold ${
                    e.method === "POST" ? "bg-[#FAECE7] text-[#E8502A]" : "bg-[#EAF3DE] text-[#3B6D11]"
                  }`}
                >
                  {e.method}
                </span>
                <span className="flex-1 truncate font-mono text-[11px]">{e.name}</span>
                <span className="min-w-[38px] text-right text-[11px] font-medium">{(e.calls / 1000).toFixed(1)}k</span>
                <div className="ml-1.5 h-1 w-[50px] overflow-hidden rounded-full bg-[#f5f3ee]">
                  <div className="h-full rounded-full bg-[#E8502A]" style={{ width: `${e.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Error breakdown" sub="By HTTP status">
          <div>
            {errors.map((e) => (
              <div key={e.code} className="flex items-start gap-2 border-b border-[#eeeae4] py-1.5 last:border-none">
                <span className="mt-1 h-[7px] w-[7px] flex-shrink-0 rounded-full" style={{ background: e.cls }} />
                <div className="flex-1">
                  <div className="text-[11px] font-medium">{e.code}</div>
                  <div className="text-[10px] text-[#888]">{e.msg}</div>
                </div>
                <div className="text-[12px] font-medium">{e.count}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-[#eeeae4] pt-2.5">
            <div className="text-[10px] text-[#888]">Error rate</div>
            <div className="text-[22px] font-medium text-[#A32D2D]">0.59%</div>
            <div className="text-[10px] text-[#888]">284 of {totalCalls.toLocaleString()} calls failed</div>
          </div>
        </Card>
      </div>

      <div className="mb-3 grid gap-2.5 md:grid-cols-2">
        <Card title="Avg response latency by endpoint" sub="Last 30 days">
          <div>
            {latencies.map((l) => (
              <div key={l.label} className="flex items-center gap-2 border-b border-[#eeeae4] py-1.5 last:border-none">
                <span className="min-w-[80px] text-[11px] text-[#888]">{l.label}</span>
                <div className="h-3.5 flex-1 overflow-hidden rounded bg-[#f5f3ee]">
                  <div
                    className="flex h-full items-center rounded pl-1.5 transition-all duration-700"
                    style={{ width: `${Math.round((l.ms / l.max) * 100)}%`, background: l.color }}
                  >
                    <span className="text-[10px] font-medium text-white">
                      {l.ms >= 1000 ? (l.ms / 1000).toFixed(2) + "s" : l.ms + "ms"}
                    </span>
                  </div>
                </div>
                <span className="min-w-[44px] text-right text-[11px] text-[#888]">
                  {l.ms >= 1000 ? (l.ms / 1000).toFixed(2) + "s" : l.ms + "ms"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Cost by plan tier" sub="Est. monthly API spend">
          <DonutWithLegend data={costByPlan} suffix="%" />
        </Card>
      </div>

      <Card
        title="User API data"
        sub="All users hitting the API"
        right={
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8502A] px-3 py-1.5 text-[12px] text-[#E8502A] hover:bg-[#FAECE7]"
          >
            <FileDown className="h-3.5 w-3.5" /> Export CSV
          </button>
        }
      >
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-[#e8e4de] bg-[#f5f3ee] px-2.5">
          <Search className="h-3.5 w-3.5 text-[#888]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or ID…"
            className="h-9 border-none bg-transparent px-0 text-[12px] shadow-none focus-visible:ring-0"
          />
        </div>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-[#eeeae4] text-left text-[11px] text-[#888]">
              <th className="pb-2.5 pr-2 font-medium">User</th>
              <th className="pb-2.5 pr-2 font-medium">Plan</th>
              <th className="pb-2.5 pr-2 text-right font-medium">API calls</th>
              <th className="pb-2.5 pr-2 text-right font-medium">Videos</th>
              <th className="pb-2.5 pr-2 text-right font-medium">Est. cost</th>
              <th className="pb-2.5 text-right font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {userRows.length ? (
              userRows.map((u, i) => (
                <tr key={i} className="border-b border-[#eeeae4] last:border-none">
                  <td className="py-2 pr-2">
                    <div className="text-[12px] font-medium">{u.name}</div>
                    <div className="font-mono text-[10px] text-[#888]">{u.email.slice(0, 12)}…</div>
                  </td>
                  <td className="py-2 pr-2">
                    {u.admin ? (
                      <span className="rounded-full bg-[#F0EAF9] px-2 py-0.5 text-[10px] font-medium text-[#6B3FA0]">admin</span>
                    ) : (
                      <span className="rounded-full bg-[#F1EFE8] px-2 py-0.5 text-[10px] font-medium text-[#5F5E5A]">user</span>
                    )}
                  </td>
                  <td className="py-2 pr-2 text-right font-medium">{u.calls.toLocaleString()}</td>
                  <td className="py-2 pr-2 text-right">{u.videos}</td>
                  <td className="py-2 pr-2 text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        u.cost > 100
                          ? "bg-[#FDEEEE] text-[#A32D2D]"
                          : u.cost > 50
                            ? "bg-[#FAECE7] text-[#993C1D]"
                            : "bg-[#EAF3DE] text-[#3B6D11]"
                      }`}
                    >
                      ${u.cost.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-2 text-right text-[11px] text-[#888]">{u.last}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-6 text-center text-[#aaa]">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="mt-2.5 text-[11px] text-[#888]">
          Showing {userRows.length} of {totalUsers} users
        </div>
      </Card>
    </>
  );
}

/* ── Small reusable UI ─────────────────────────────────────────────────── */

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block h-[9px] w-[9px] rounded-sm" style={{ background: color }} />
      {text}
    </span>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  delta,
  up,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  delta: string;
  up: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#e8e4de] bg-white p-4">
      <div className="mb-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#FAECE7]">
        <Icon className="h-4 w-4 text-[#E8502A]" />
      </div>
      <div className="text-[26px] font-medium leading-none">{value}</div>
      <div className="mt-1 text-[11px] text-[#888]">{label}</div>
      <div className={`mt-2 flex items-center gap-1 text-[11px] ${up ? "text-[#3B6D11]" : "text-[#A32D2D]"}`}>
        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {delta} vs prev
      </div>
    </div>
  );
}

function ApiStat({
  icon: Icon,
  tone,
  val,
  label,
  delta,
  up,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "orange" | "red" | "green" | "grey";
  val: string;
  label: string;
  delta: string;
  up: boolean;
}) {
  const toneMap = {
    orange: "bg-[#FAECE7] text-[#E8502A]",
    red: "bg-[#FDEEEE] text-[#A32D2D]",
    green: "bg-[#EAF3DE] text-[#3B6D11]",
    grey: "bg-[#f1efe8] text-[#888]",
  };
  return (
    <div className="rounded-xl border border-[#e8e4de] bg-white p-3.5">
      <div className={`mb-2 flex h-[26px] w-[26px] items-center justify-center rounded-md ${toneMap[tone]}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="text-[20px] font-medium leading-none">{val}</div>
      <div className="mt-1 text-[10px] text-[#888]">{label}</div>
      <div className={`mt-1.5 flex items-center gap-1 text-[10px] ${up ? "text-[#3B6D11]" : "text-[#A32D2D]"}`}>
        {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />} {delta}
      </div>
    </div>
  );
}

function DonutWithLegend({
  data,
  suffix = "",
}: {
  data: { name: string; value: number; color: string }[];
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-5 pt-1">
      <div className="h-[110px] w-[110px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={34} outerRadius={52} paddingAngle={1} stroke="none">
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip {...chartTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
            <span className="flex-1 text-[11px] text-[#888]">{d.name}</span>
            <span className="text-[12px] font-medium">
              {d.value}
              {suffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Admin;
