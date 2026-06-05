import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Loader2, Type } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Seo } from "@/components/Seo";

const Auth = () => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation() as { state?: { from?: string } };
  const redirectTo = location.state?.from || (isAdmin ? "/admin" : "/projects");

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    document.title = "Sign in — Subbly";
  }, []);

  if (!loading && user) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (tab === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/projects`,
            data: { full_name: name || undefined },
          },
        });
        if (error) throw error;
        toast.success("Check your inbox to confirm your email.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/projects",
      });
      if (result.error) {
        toast.error(result.error.message || "Google sign-in failed");
        return;
      }
    } catch (err: any) {
      toast.error(err?.message || "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-[9px] border border-[#e8e4de] bg-white px-3.5 py-2.5 text-[14px] text-[#1a1a1a] outline-none transition placeholder:text-[#b0aba4] focus:border-[#ff5c3a] focus:shadow-[0_0_0_3px_rgba(255,92,58,0.1)]";
  const labelCls = "mb-[7px] block text-[12.5px] font-medium text-[#333]";

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f3ee] text-[#1a1a1a]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <nav className="sticky top-0 z-[200] flex h-[62px] items-center justify-between border-b border-[#e8e4de] bg-white/95 px-6 backdrop-blur-xl md:px-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#ff5c3a]">
            <Type className="h-[17px] w-[17px] text-white" strokeWidth={2.2} />
          </div>
          <span className="font-serif-display text-[18px] tracking-[-0.2px]">Subbly</span>
        </Link>
        <Link to="/" className="text-[13.5px] text-[#666] transition hover:text-[#1a1a1a]">
          ← Back to home
        </Link>
      </nav>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px] rounded-[20px] border border-[#e8e4de] bg-white p-10 shadow-[0_4px_40px_rgba(26,26,26,0.07)] md:p-12">
          <div className="mb-8 flex items-center justify-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#ff5c3a]">
              <Type className="h-[17px] w-[17px] text-white" strokeWidth={2.2} />
            </div>
            <span className="font-serif-display text-[18px]">Subbly</span>
          </div>

          <h1 className="font-serif-display mb-2 text-center text-[30px] font-normal tracking-[-0.5px]">
            {tab === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mb-8 text-center text-[13.5px] text-[#b0aba4]">
            {tab === "signin"
              ? "Sign in to continue captioning"
              : "Start captioning videos for free"}
          </p>

          <div className="mb-7 flex gap-[3px] rounded-[9px] bg-[#f5f3ee] p-[3px]">
            <button
              type="button"
              onClick={() => setTab("signin")}
              className={`flex-1 rounded-[7px] px-2 py-2 text-[13px] transition ${
                tab === "signin"
                  ? "bg-white font-medium text-[#1a1a1a] shadow-[0_1px_4px_rgba(26,26,26,0.08)]"
                  : "text-[#666]"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className={`flex-1 rounded-[7px] px-2 py-2 text-[13px] transition ${
                tab === "signup"
                  ? "bg-white font-medium text-[#1a1a1a] shadow-[0_1px_4px_rgba(26,26,26,0.08)]"
                  : "text-[#666]"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {tab === "signup" && (
              <div className="mb-[18px]">
                <label htmlFor="name" className={labelCls}>Name</label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  placeholder="Your name"
                />
              </div>
            )}
            <div className="mb-[18px]">
              <label htmlFor="email" className={labelCls}>Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="you@example.com"
              />
            </div>
            <div className="mb-[18px]">
              <label htmlFor="password" className={labelCls}>Password</label>
              <input
                id="password"
                type="password"
                autoComplete={tab === "signin" ? "current-password" : "new-password"}
                minLength={tab === "signup" ? 6 : undefined}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-[9px] bg-[#ff5c3a] px-4 py-3 text-[14px] font-medium text-white transition hover:-translate-y-px hover:bg-[#ff7558] hover:shadow-[0_4px_16px_rgba(255,92,58,0.3)] disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {tab === "signin" ? "Continue" : "Create account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-[#b0aba4]">
            <div className="h-px flex-1 bg-[#e8e4de]" />
            or
            <div className="h-px flex-1 bg-[#e8e4de]" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-2.5 rounded-[9px] border border-[#e8e4de] bg-white px-4 py-2.5 text-[13.5px] text-[#666] transition hover:border-[#b0aba4] hover:text-[#1a1a1a] disabled:opacity-60"
          >
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
            Continue with Google
          </button>

          <p className="mt-5 text-center text-xs text-[#b0aba4]">
            By continuing you agree to our{" "}
            <a href="#" className="text-[#ff5c3a] hover:underline">Terms</a> and{" "}
            <a href="#" className="text-[#ff5c3a] hover:underline">Privacy Policy</a>
          </p>
        </div>
      </main>
    </div>
  );
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M15.68 8.18c0-.57-.05-1.12-.14-1.64H8v3.1h4.31a3.68 3.68 0 0 1-1.6 2.41v2h2.6c1.52-1.4 2.4-3.47 2.4-5.87z" fill="#4285F4" />
      <path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.6-2.02c-.72.48-1.63.77-2.7.77-2.08 0-3.84-1.4-4.47-3.29H.85v2.08A8 8 0 0 0 8 16z" fill="#34A853" />
      <path d="M3.53 9.52A4.8 4.8 0 0 1 3.28 8c0-.53.09-1.04.25-1.52V4.4H.85A8 8 0 0 0 0 8c0 1.29.31 2.51.85 3.6l2.68-2.08z" fill="#FBBC05" />
      <path d="M8 3.18c1.17 0 2.22.4 3.05 1.2l2.28-2.28C11.96.72 10.15 0 8 0A8 8 0 0 0 .85 4.4L3.53 6.48C4.16 4.59 5.92 3.18 8 3.18z" fill="#EA4335" />
    </svg>
  );
}

export default Auth;
