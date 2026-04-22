import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    document.title = "Captionly — AI Video Caption Editor";
    const desc =
      "Upload a video, auto-generate captions with AI, edit text and styling, then export a captioned video — all in your browser.";
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
    }
    m.setAttribute("content", desc);
  }, []);

  if (!loading && user) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-surface">
      <header className="flex items-center justify-between border-b border-border bg-surface/60 px-6 py-3 backdrop-blur">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-none">Captionly</h1>
            <p className="text-[11px] text-muted-foreground">AI caption editor</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-95">
              Get started
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 animate-fade-in flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-surface px-3 py-1 text-xs text-primary">
          <Wand2 className="h-3.5 w-3.5" /> Word-perfect AI captions
        </div>
        <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
          Caption your videos in{" "}
          <span className="bg-gradient-primary bg-clip-text text-transparent">seconds</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Upload, auto-transcribe, restyle, and export a captioned video. Sign in to save your
          projects and pick up right where you left off.
        </p>
        <Link to="/auth" className="mt-8">
          <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-95">
            Start captioning <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </Link>
      </main>
    </div>
  );
};

export default Index;
