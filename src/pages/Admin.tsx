import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, LogOut, Shield, Trash2, Users, FolderOpen, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";

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

type AdminRow = {
  user_id: string;
};

const Admin = () => {
  const { user, signOut } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[] | null>(null);
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeleteProject, setPendingDeleteProject] = useState<ProjectRow | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    document.title = "Admin dashboard — Captionly";
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
    else setProfiles(profilesRes.data as ProfileRow[]);

    if (projectsRes.error) toast.error(`Failed to load projects: ${projectsRes.error.message}`);
    else setProjects(projectsRes.data as ProjectRow[]);

    if (!adminsRes.error && adminsRes.data) setAdmins(adminsRes.data as AdminRow[]);

    setLoading(false);
  }

  const projectCountByUser = useMemo(() => {
    const map = new Map<string, number>();
    (projects ?? []).forEach((p) => map.set(p.user_id, (map.get(p.user_id) ?? 0) + 1));
    return map;
  }, [projects]);

  const adminUserIds = useMemo(() => new Set(admins.map((a) => a.user_id)), [admins]);

  const exportedCount = useMemo(
    () => (projects ?? []).filter((p) => !!p.exported_video_path).length,
    [projects],
  );

  async function handleDeleteProject() {
    if (!pendingDeleteProject) return;
    setWorking(true);
    try {
      const paths = [
        pendingDeleteProject.source_video_path,
        pendingDeleteProject.exported_video_path,
      ].filter(Boolean) as string[];

      // Best-effort storage cleanup
      const sourcePath = pendingDeleteProject.source_video_path;
      const exportPath = pendingDeleteProject.exported_video_path;
      if (sourcePath) await supabase.storage.from("project-videos").remove([sourcePath]);
      if (exportPath) await supabase.storage.from("project-exports").remove([exportPath]);

      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", pendingDeleteProject.id);
      if (error) throw error;

      setProjects((prev) => prev?.filter((p) => p.id !== pendingDeleteProject.id) ?? null);
      toast.success("Project deleted");
      setPendingDeleteProject(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete project");
    } finally {
      setWorking(false);
    }
  }

  function userLabel(userId: string) {
    const p = profiles?.find((pr) => pr.user_id === userId);
    return p?.display_name || userId.slice(0, 8);
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold">Admin Dashboard</span>
            <Badge variant="secondary" className="ml-2">
              {user?.email}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/projects">My projects</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Stats */}
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Users"
            value={profiles?.length ?? "—"}
          />
          <StatCard
            icon={<FolderOpen className="h-5 w-5" />}
            label="Projects"
            value={projects?.length ?? "—"}
          />
          <StatCard
            icon={<Download className="h-5 w-5" />}
            label="Exports"
            value={projects ? exportedCount : "—"}
          />
        </section>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Users */}
            <Card>
              <CardHeader>
                <CardTitle>All users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles?.length ? (
                      profiles.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            {p.display_name || "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {p.user_id.slice(0, 8)}…
                          </TableCell>
                          <TableCell>
                            {adminUserIds.has(p.user_id) ? (
                              <Badge>admin</Badge>
                            ) : (
                              <Badge variant="secondary">user</Badge>
                            )}
                          </TableCell>
                          <TableCell>{projectCountByUser.get(p.user_id) ?? 0}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No users yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Projects */}
            <Card>
              <CardHeader>
                <CardTitle>All projects</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Exported</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects?.length ? (
                      projects.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.title}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {userLabel(p.user_id)}
                          </TableCell>
                          <TableCell>
                            {p.exported_video_path ? (
                              <Badge>yes</Badge>
                            ) : (
                              <Badge variant="secondary">no</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(p.updated_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPendingDeleteProject(p)}
                              aria-label="Delete project"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No projects yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <AlertDialog
        open={!!pendingDeleteProject}
        onOpenChange={(open) => !open && setPendingDeleteProject(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the project and any uploaded or exported videos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} disabled={working}>
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold mt-1">{value}</p>
        </div>
        <div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div>
      </CardContent>
    </Card>
  );
}

export default Admin;
