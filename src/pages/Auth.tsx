import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Loader2, Type } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation() as { state?: { from?: string } };
  const redirectTo = location.state?.from || (isAdmin ? "/admin" : "/projects");

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

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err?.message || "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
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
    } catch (err: any) {
      toast.error(err?.message || "Sign up failed");
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
    "w-full rounded-md border border-[#e0dbd4] bg-white px-3 py-2.5 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-[#ff5c3a] focus:outline-none focus:ring-2 focus:ring-[#ffd5cc]";
  const labelCls = "mb-1.5 block text-[12px] font-medium text-[#555]";

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f3ee] text-[#1a1a1a]">
      <nav className="flex items-center justify-between border-b border-[#e8e4de] bg-white px-6 py-4 md:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff5c3a]">
            <Type className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <span className="text-[15px] font-medium">Subbly</span>
        </Link>
        <Link
          to="/"
          className="text-[13px] text-[#888] hover:text-[#1a1a1a]"
        >
          ← Back to home
        </Link>
      </nav>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#ffd5cc] bg-[#fff5f3] px-3.5 py-1.5 text-xs text-[#ff5c3a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff5c3a]" />
              Welcome to Subbly
            </div>
            <h1 className="text-[28px] font-medium leading-tight tracking-[-0.02em]">
              Sign in to start captioning
            </h1>
            <p className="mt-2 text-[13px] text-[#888]">
              Save your projects and pick up where you left off.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e8e4de] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-md border border-[#e0dbd4] bg-white px-4 py-2.5 text-[13px] text-[#555] hover:bg-[#faf9f7] disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon className="h-4 w-4" />
              )}
              Continue with Google
            </button>

            <div className="relative my-4 flex items-center">
              <div className="h-px flex-1 bg-[#eeeae4]" />
              <span className="px-3 text-[10px] uppercase tracking-[0.09em] text-[#bbb]">
                or
              </span>
              <div className="h-px flex-1 bg-[#eeeae4]" />
            </div>

            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2 bg-[#faf9f7]">
                <TabsTrigger value="signin" className="text-[12px]">Sign in</TabsTrigger>
                <TabsTrigger value="signup" className="text-[12px]">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-3 pt-4">
                  <div>
                    <label htmlFor="signin-email" className={labelCls}>Email</label>
                    <input
                      id="signin-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="signin-password" className={labelCls}>Password</label>
                    <input
                      id="signin-password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-[#ff5c3a] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#ee4f2e] disabled:opacity-60"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Sign in
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-3 pt-4">
                  <div>
                    <label htmlFor="signup-name" className={labelCls}>Name</label>
                    <input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="signup-email" className={labelCls}>Email</label>
                    <input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="signup-password" className={labelCls}>Password</label>
                    <input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={6}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-[#ff5c3a] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#ee4f2e] disabled:opacity-60"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create account
                  </button>
                  <p className="text-center text-[11px] text-[#aaa]">
                    We'll send you a confirmation email.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <p className="mt-6 text-center text-[11px] text-[#bbb]">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </main>
    </div>
  );
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.42-1.7 4.16-5.5 4.16-3.31 0-6.01-2.74-6.01-6.13S8.69 5.99 12 5.99c1.88 0 3.14.8 3.86 1.49l2.63-2.54C16.84 3.43 14.65 2.5 12 2.5 6.76 2.5 2.5 6.76 2.5 12s4.26 9.5 9.5 9.5c5.48 0 9.11-3.85 9.11-9.27 0-.62-.07-1.09-.16-1.55H12z"
      />
    </svg>
  );
}

export default Auth;
