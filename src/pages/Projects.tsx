import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Download,
  FilmIcon,
  Loader2,
  LogOut,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type ProjectRow = {
  id: string;
  title: string;
  updated_at: string;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  source_video_path: string | null;
  exported_video_path: string | null;
};

const Projects = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProjectRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.title = "Your projects — Captionly";
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, title, updated_at, width, height, duration_seconds, source_video_path, exported_video_path",
        )
        .order("updated_at", { ascending: false });
      if (error) {
        toast.error(error.message);
        setProjects([]);
        return;
      }
      setProjects(data ?? []);
    })();
  }, [user]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const paths = [pendingDelete.source_video_path, pendingDelete.exported_video_path].filter(
        Boolean,
      ) as string[];
      if (paths.length) {
        const sourcePaths = paths.filter((p) => p === pendingDelete.source_video_path);
        const exportPaths = paths.filter((p) => p === pendingDelete.exported_video_path);
        if (sourcePaths.length) await supabase.storage.from("project-videos").remove(sourcePaths);
        if (exportPaths.length)
          await supabase.storage.from("project-exports").remove(exportPaths);
      }
      const { error } = await supabase.from("projects").delete().eq("id", pendingDelete.id);
      if (error) throw error;
      setProjects((prev) => prev?.filter((p) => p.id !== pendingDelete.id) ?? []);
      toast.success("Project deleted");
    } catch (err: any) {
      toast.error(err?.message || "Could not delete project");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <header className="flex items-center justify-between border-b border-border bg-surface/60 px-6 py-3 backdrop-blur">
        <Link to="/projects" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-none">Captionly</h1>
            <p className="text-[11px] text-muted-foreground">{user?.email}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button asChild variant="outline" size="sm">
              <Link to="/admin">Admin</Link>
            </Button>
          )}
          <Button onClick={() => navigate("/editor")} className="bg-gradient-primary text-primary-foreground hover:opacity-95">
            <Plus className="mr-1.5 h-4 w-4" /> New project
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-1.5 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Your projects</h2>
            <p className="text-sm text-muted-foreground">
              Pick up where you left off, or start a new captioning session.
            </p>
          </div>
        </div>

        {projects === null ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState onCreate={() => navigate("/editor")} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <li
                key={project.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition hover:border-primary/40 hover:shadow-elegant"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/editor?project=${project.id}`)}
                  className="flex flex-1 flex-col items-start gap-2 p-4 text-left"
                >
                  <div className="flex h-32 w-full items-center justify-center rounded-lg bg-gradient-primary/10">
                    <FilmIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="mt-2 flex w-full items-center justify-between gap-2">
                    <h3 className="line-clamp-1 font-medium">{project.title}</h3>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {project.width && project.height
                      ? `${project.width}×${project.height}`
                      : "No video saved"}
                    {project.duration_seconds
                      ? ` · ${project.duration_seconds.toFixed(1)}s`
                      : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Updated {new Date(project.updated_at).toLocaleString()}
                  </p>
                </button>
                <div className="flex items-center justify-between border-t border-border px-3 py-2">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    {project.exported_video_path ? (
                      <>
                        <Download className="h-3 w-3" /> Export saved
                      </>
                    ) : (
                      "Captions only"
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDelete(project);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the captions, style, and any saved videos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary/10">
        <FilmIcon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">No projects yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Upload a video, generate captions with AI, edit the styling, and we'll save it here.
      </p>
      <Button onClick={onCreate} className="mt-6 bg-gradient-primary text-primary-foreground hover:opacity-95">
        <Plus className="mr-1.5 h-4 w-4" /> Start a new project
      </Button>
    </div>
  );
}

export default Projects;
