import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Download,
  FilmIcon,
  Loader2,
  Plus,
  Trash2,
  ArrowUpRight,
  Sun,
  Moon,
  ArrowLeft,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
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
import { Seo } from "@/components/Seo";
import { AvatarDropdown } from "@/components/AvatarDropdown";
import { NavBar } from "@/components/NavBar";


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
  const { theme, toggle } = useTheme();
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProjectRow | null>(null);
  const [deleting, setDeleting] = useState(false);



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

  const exportedCount = useMemo(
    () => (projects ?? []).filter((p) => !!p.exported_video_path).length,
    [projects],
  );

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const sourcePath = pendingDelete.source_video_path;
      const exportPath = pendingDelete.exported_video_path;
      if (sourcePath) await supabase.storage.from("project-videos").remove([sourcePath]);
      if (exportPath) await supabase.storage.from("project-exports").remove([exportPath]);
      const { error } = await supabase.from("projects").delete().eq("id", pendingDelete.id);
      if (error) throw error;
      setProjects((prev) => prev?.filter((p) => p.id !== pendingDelete.id) ?? []);
      toast.success("Project deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete project");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const userName = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "Account";

  return (
    <div className="min-h-screen bg-[#f5f3ee] dark:bg-zinc-950 text-[#1a1a1a] dark:text-zinc-50 transition-colors duration-300" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Seo
        title="Your projects — Subbly"
        description="Manage your Subbly captioning projects — pick up where you left off or start a new AI captioning session."
        path="/projects"
        noIndex
      />
      <NavBar activeView="Dashboard" />

      <main className="mx-auto w-full max-w-[1100px] px-4 py-10 md:px-12 md:py-[52px]">
        <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#ff5c3a]">
              Workspace
            </div>
            <h1 className="font-serif-display text-[38px] font-normal leading-none tracking-[-1px]">
              Your projects
            </h1>
            <p className="mt-2 text-[14px] text-[#b0aba4]">
              Pick up where you left off, or start a new captioning session.
            </p>
          </div>
          <div className="flex items-end gap-6">
            <div className="text-right">
              <div className="font-serif-display text-[28px] tracking-[-0.5px]">
                {projects?.length ?? "—"}
              </div>
              <div className="mt-0.5 text-[11px] text-[#b0aba4]">Total projects</div>
            </div>
            <div className="h-9 w-px bg-[#e8e4de] dark:bg-zinc-800" />
            <div className="text-right">
              <div className="font-serif-display text-[28px] tracking-[-0.5px]">
                {projects ? exportedCount : "—"}
              </div>
              <div className="mt-0.5 text-[11px] text-[#b0aba4]">Exports saved</div>
            </div>
          </div>
        </div>
        <div className="mb-8 h-px bg-[#e8e4de] dark:bg-zinc-800" />

        {projects === null ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-[#ff5c3a]" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState onCreate={() => navigate("/editor")} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, idx) => (
              <li
                key={project.id}
                onClick={() => navigate(`/editor?project=${project.id}`)}
                className="group cursor-pointer overflow-hidden rounded-[14px] border border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_1px_3px_rgba(26,26,26,0.05),0_4px_16px_rgba(26,26,26,0.03)] transition hover:-translate-y-0.5 hover:border-[#ffd5cc] dark:hover:border-[#ff5c3a]/50 hover:shadow-[0_4px_20px_rgba(26,26,26,0.1),0_16px_40px_rgba(26,26,26,0.06)]"
                style={{ animation: `slideUp .35s both`, animationDelay: `${0.04 + idx * 0.05}s` }}
              >
                <div className="relative flex h-[150px] items-center justify-center overflow-hidden border-b border-[#e8e4de] dark:border-zinc-800 bg-[#f5f3ee] dark:bg-zinc-950">
                  <div
                    className="absolute inset-0 opacity-[0.35] dark:opacity-[0.1]"
                    style={{
                      background:
                        "repeating-linear-gradient(90deg,transparent,transparent 39px,#e8e4de 39px,#e8e4de 40px),repeating-linear-gradient(180deg,transparent,transparent 39px,#e8e4de 39px,#e8e4de 40px)",
                    }}
                  />
                  {project.exported_video_path && (
                    <div className="absolute right-2.5 top-2.5 z-[2] inline-flex items-center gap-1.5 rounded-full border border-[#ffd5cc] bg-[#fff5f3] px-2.5 py-1 text-[10px] font-medium text-[#ff5c3a]">
                      <span className="h-[5px] w-[5px] rounded-full bg-[#ff5c3a]" />
                      Export saved
                    </div>
                  )}
                  <div className="relative z-[1] flex h-[46px] w-[46px] items-center justify-center rounded-[11px] border border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_2px_8px_rgba(26,26,26,0.08)]">
                    <FilmIcon className="h-5 w-5 text-[#ff5c3a]" strokeWidth={1.6} />
                  </div>
                </div>
                <div className="px-5 py-4">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="line-clamp-1 flex-1 text-[13.5px] font-medium">
                      {project.title}
                    </span>
                    <div className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-md bg-[#f5f3ee] dark:bg-zinc-800 transition group-hover:bg-[#ff5c3a]">
                      <ArrowUpRight
                        className="h-2.5 w-2.5 text-[#b0aba4] transition group-hover:text-white"
                        strokeWidth={2.2}
                      />
                    </div>
                  </div>
                  <div className="font-mono-jb mb-0.5 text-[10.5px] tracking-[-0.02em] text-[#b0aba4]">
                    {project.width && project.height
                      ? `${project.width} × ${project.height}`
                      : "No video saved"}
                    {project.duration_seconds ? ` · ${project.duration_seconds.toFixed(1)}s` : ""}
                  </div>
                  <div className="text-[11.5px] text-[#b0aba4]">
                    Updated {new Date(project.updated_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[#f5f3ee] dark:border-zinc-800 bg-[#faf9f7] dark:bg-zinc-900/60 px-5 py-2.5">
                  <span className="flex items-center gap-1.5 text-[11.5px] font-medium">
                    {project.exported_video_path ? (
                      <>
                        <Download className="h-3 w-3 text-[#ff5c3a]" strokeWidth={2} />
                        <span className="text-[#ff5c3a]">Export saved</span>
                      </>
                    ) : (
                      <span className="text-[#b0aba4]">Captions only</span>
                    )}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDelete(project);
                    }}
                    className="rounded-md p-1.5 text-[#b0aba4] transition hover:bg-[#fff5f3] dark:hover:bg-zinc-800 hover:text-[#ff5c3a]"
                    aria-label="Delete project"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

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
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-[#ff5c3a] hover:bg-[#ff7558]"
            >
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
    <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-24 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[14px] border border-[#ffd5cc] dark:border-zinc-800 bg-[#fff5f3] dark:bg-zinc-800/60">
        <FilmIcon className="h-6 w-6 text-[#ff5c3a]" strokeWidth={1.7} />
      </div>
      <h3 className="font-serif-display text-[24px] font-normal tracking-[-0.5px]">
        No projects yet
      </h3>
      <p className="mt-2 max-w-sm text-[13.5px] text-[#b0aba4]">
        Upload a video, generate captions with AI, edit the styling, and we'll save it here.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-[10px] bg-[#ff5c3a] px-7 py-3 text-[14px] font-medium text-white transition hover:-translate-y-0.5 hover:bg-[#ff7558] hover:shadow-[0_6px_24px_rgba(255,92,58,0.32)]"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.2} /> Start a new project
      </button>
    </div>
  );
}

export default Projects;
