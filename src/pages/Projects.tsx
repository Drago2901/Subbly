import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Download,
  FilmIcon,
  Loader2,
  LogOut,
  Plus,
  Trash2,
  Type,
  ArrowUpRight,
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
import { Seo } from "@/components/Seo";

type ProjectRow = {
  id: string;
  title: string;
  updated_at: string;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  source_video_path: string | null;
  exported_video_path: string | null;
  thumbnail_path: string | null;
};

const THUMBNAIL_BUCKET_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/project-thumbnails`;

const Projects = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProjectRow | null>(null);
  const [deleting, setDeleting] = useState(false);



  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, title, updated_at, width, height, duration_seconds, source_video_path, exported_video_path, thumbnail_path",
        )
        .order("updated_at", { ascending: false });
      if (error) {
        toast.error(error.message);
        setProjects([]);
        return;
      }
      setProjects((data as unknown as ProjectRow[]) ?? []);
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
      const thumbnailPath = pendingDelete.thumbnail_path;
      if (sourcePath) await supabase.storage.from("project-videos").remove([sourcePath]);
      if (exportPath) await supabase.storage.from("project-exports").remove([exportPath]);
      if (thumbnailPath) await supabase.storage.from("project-thumbnails").remove([thumbnailPath]);
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

  const userName = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "Account";

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#1a1a1a]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Seo
        title="Your projects — Subbly"
        description="Manage your Subbly captioning projects — pick up where you left off or start a new AI captioning session."
        path="/projects"
        noIndex
      />
      <nav className="sticky top-0 z-[200] flex h-[62px] items-center justify-between gap-2 border-b border-[#e8e4de] bg-white/95 px-4 backdrop-blur-xl md:px-12">
        <Link to="/projects" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#ff5c3a]">
            <Type className="h-[17px] w-[17px] text-white" strokeWidth={2.2} />
          </div>
          <span className="font-serif-display text-[18px] tracking-[-0.2px]">Subbly</span>
        </Link>
        <div className="hidden items-center gap-[26px] md:flex">
          <span className="text-[13.5px] font-medium text-[#1a1a1a]">Projects</span>
          <Link to="/pricing" className="text-[13.5px] text-[#666] hover:text-[#1a1a1a]">Pricing</Link>
          <Link to="/subscription" className="text-[13.5px] text-[#666] hover:text-[#1a1a1a]">Subscription</Link>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden flex-col text-right leading-tight sm:flex">
            <span className="text-[13px] font-medium">{userName}</span>
            <span className="text-[11px] text-[#b0aba4]">{user?.email}</span>
          </div>
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden rounded-lg border border-[#e8e4de] bg-transparent px-[18px] py-2 text-[13px] text-[#666] transition hover:border-[#b0aba4] hover:text-[#1a1a1a] sm:inline-flex"
            >
              Admin
            </Link>
          )}
          <button
            onClick={() => navigate("/editor")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#ff5c3a] px-3 py-2 text-[13px] font-medium text-white shadow-[0_2px_8px_rgba(255,92,58,0.2)] transition hover:-translate-y-px hover:bg-[#ff7558] hover:shadow-[0_4px_16px_rgba(255,92,58,0.3)] md:px-[18px]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
            <span className="hidden sm:inline">New project</span>
          </button>
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-transparent px-3 py-2 text-[13px] text-[#666] transition hover:border-[#b0aba4] hover:text-[#1a1a1a]"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Sign out</span>
          </button>
        </div>
      </nav>

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
            <div className="h-9 w-px bg-[#e8e4de]" />
            <div className="text-right">
              <div className="font-serif-display text-[28px] tracking-[-0.5px]">
                {projects ? exportedCount : "—"}
              </div>
              <div className="mt-0.5 text-[11px] text-[#b0aba4]">Exports saved</div>
            </div>
          </div>
        </div>
        <div className="mb-8 h-px bg-[#e8e4de]" />

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
                className="group cursor-pointer overflow-hidden rounded-[14px] border border-[#e8e4de] bg-white shadow-[0_1px_3px_rgba(26,26,26,0.05),0_4px_16px_rgba(26,26,26,0.03)] transition hover:-translate-y-0.5 hover:border-[#ffd5cc] hover:shadow-[0_4px_20px_rgba(26,26,26,0.1),0_16px_40px_rgba(26,26,26,0.06)]"
                style={{ animation: `slideUp .35s both`, animationDelay: `${0.04 + idx * 0.05}s` }}
              >
                <div className="relative flex h-[150px] items-center justify-center overflow-hidden border-b border-[#e8e4de] bg-[#f5f3ee]">
                  {project.thumbnail_path ? (
                    <img
                      src={`${THUMBNAIL_BUCKET_URL}/${project.thumbnail_path}`}
                      alt={`Thumbnail for ${project.title}`}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-[1.03]"
                    />
                  ) : (
                    <>
                      <div
                        className="absolute inset-0 opacity-[0.35]"
                        style={{
                          background:
                            "repeating-linear-gradient(90deg,transparent,transparent 39px,#e8e4de 39px,#e8e4de 40px),repeating-linear-gradient(180deg,transparent,transparent 39px,#e8e4de 39px,#e8e4de 40px)",
                        }}
                      />
                      <div className="relative z-[1] flex h-[46px] w-[46px] items-center justify-center rounded-[11px] border border-[#e8e4de] bg-white shadow-[0_2px_8px_rgba(26,26,26,0.08)]">
                        <FilmIcon className="h-5 w-5 text-[#ff5c3a]" strokeWidth={1.6} />
                      </div>
                    </>
                  )}
                  {project.exported_video_path && (
                    <div className="absolute right-2.5 top-2.5 z-[2] inline-flex items-center gap-1.5 rounded-full border border-[#ffd5cc] bg-[#fff5f3] px-2.5 py-1 text-[10px] font-medium text-[#ff5c3a]">
                      <span className="h-[5px] w-[5px] rounded-full bg-[#ff5c3a]" />
                      Export saved
                    </div>
                  )}
                </div>
                <div className="px-5 py-4">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="line-clamp-1 flex-1 text-[13.5px] font-medium">
                      {project.title}
                    </span>
                    <div className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-md bg-[#f5f3ee] transition group-hover:bg-[#ff5c3a]">
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
                <div className="flex items-center justify-between border-t border-[#f5f3ee] bg-[#faf9f7] px-5 py-2.5">
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
                    className="rounded-md p-1.5 text-[#b0aba4] transition hover:bg-[#fff5f3] hover:text-[#ff5c3a]"
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
    <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-[#e8e4de] bg-white px-6 py-24 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[14px] border border-[#ffd5cc] bg-[#fff5f3]">
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
