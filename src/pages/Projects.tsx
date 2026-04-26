import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Download,
  FilmIcon,
  Loader2,
  LogOut,
  Plus,
  Trash2,
  Type,
} from "lucide-react";
import { toast } from "sonner";
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
    document.title = "Your projects — Subbly";
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
    <div className="min-h-screen bg-[#f5f3ee] text-[#1a1a1a]">
      <nav className="flex items-center justify-between border-b border-[#e8e4de] bg-white px-6 py-4 md:px-10">
        <Link to="/projects" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff5c3a]">
            <Type className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[15px] font-medium leading-none">Subbly</h1>
            <p className="mt-0.5 text-[11px] text-[#aaa]">{user?.email}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin"
              className="rounded-md border border-[#ddd] bg-white px-4 py-1.5 text-[13px] text-[#555] hover:bg-[#faf9f7]"
            >
              Admin
            </Link>
          )}
          <button
            onClick={() => navigate("/editor")}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#ff5c3a] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#ee4f2e]"
          >
            <Plus className="h-3.5 w-3.5" /> New project
          </button>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] text-[#888] hover:bg-[#faf9f7] hover:text-[#1a1a1a]"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl px-6 py-12 md:px-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="mb-2 text-[11px] tracking-[0.09em] text-[#ff5c3a]">YOUR LIBRARY</div>
            <h2 className="text-[30px] font-medium tracking-[-0.5px]">Your projects</h2>
            <p className="mt-1.5 text-sm text-[#888]">
              Pick up where you left off, or start a new captioning session.
            </p>
          </div>
        </div>

        {projects === null ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-[#ff5c3a]" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState onCreate={() => navigate("/editor")} />
        ) : (
          <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <li
                key={project.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-[#e8e4de] bg-white transition hover:border-[#ffd5cc] hover:shadow-[0_4px_16px_rgba(255,92,58,0.08)]"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/editor?project=${project.id}`)}
                  className="flex flex-1 flex-col items-start gap-3 p-4 text-left"
                >
                  <div className="flex h-32 w-full items-center justify-center rounded-lg border border-[#eeeae4] bg-[#faf9f7]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#ffd5cc] bg-[#fff5f3]">
                      <FilmIcon className="h-5 w-5 text-[#ff5c3a]" strokeWidth={1.8} />
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-between gap-2">
                    <h3 className="line-clamp-1 text-[14px] font-medium">{project.title}</h3>
                    <ArrowRight className="h-3.5 w-3.5 text-[#bbb] transition group-hover:translate-x-0.5 group-hover:text-[#ff5c3a]" />
                  </div>
                  <div className="flex w-full flex-col gap-0.5">
                    <p className="text-[11px] text-[#999]">
                      {project.width && project.height
                        ? `${project.width}×${project.height}`
                        : "No video saved"}
                      {project.duration_seconds
                        ? ` · ${project.duration_seconds.toFixed(1)}s`
                        : ""}
                    </p>
                    <p className="text-[11px] text-[#bbb]">
                      Updated {new Date(project.updated_at).toLocaleString()}
                    </p>
                  </div>
                </button>
                <div className="flex items-center justify-between border-t border-[#eeeae4] px-3 py-2">
                  <span className="flex items-center gap-1 text-[11px] text-[#aaa]">
                    {project.exported_video_path ? (
                      <>
                        <Download className="h-3 w-3" /> Export saved
                      </>
                    ) : (
                      "Captions only"
                    )}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDelete(project);
                    }}
                    className="rounded-md p-1.5 text-[#bbb] hover:bg-[#fff5f3] hover:text-[#ff5c3a]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
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
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-[#ff5c3a] hover:bg-[#ee4f2e]">
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e0dbd4] bg-white px-6 py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#ffd5cc] bg-[#fff5f3]">
        <FilmIcon className="h-6 w-6 text-[#ff5c3a]" strokeWidth={1.8} />
      </div>
      <h3 className="text-[18px] font-medium tracking-[-0.3px]">No projects yet</h3>
      <p className="mt-1.5 max-w-sm text-sm text-[#888]">
        Upload a video, generate captions with AI, edit the styling, and we'll save it here.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-[#ff5c3a] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#ee4f2e]"
      >
        <Plus className="h-3.5 w-3.5" /> Start a new project
      </button>
    </div>
  );
}

export default Projects;
