import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  userRole: string;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const DEFAULT_PERMISSIONS = [
  "manage_users",
  "create_users",
  "delete_users",
  "view_analytics",
  "export_reports",
  "manage_billing",
  "manage_plans",
  "manage_api_keys",
  "manage_templates",
  "manage_videos",
  "view_logs",
  "manage_feedback",
  "manage_affiliates",
];

export const DEFAULT_ROLES = [
  {
    id: "super_admin",
    name: "Super Admin",
    description: "Full access to everything, billing, settings, users, roles, analytics, delete data",
    permissions: DEFAULT_PERMISSIONS,
  },
  {
    id: "admin",
    name: "Admin",
    description: "Manage users, content, reports, settings (except super admin controls)",
    permissions: DEFAULT_PERMISSIONS.filter((p) => p !== "delete_users"),
  },
  {
    id: "manager",
    name: "Manager",
    description: "Manage team members, review work, approve requests",
    permissions: ["view_analytics", "export_reports", "manage_videos", "view_logs", "manage_feedback"],
  },
  {
    id: "editor",
    name: "Editor",
    description: "Create, edit, and publish content",
    permissions: ["manage_templates", "manage_videos"],
  },
  {
    id: "moderator",
    name: "Content Moderator",
    description: "Review comments, user-generated content, and abuse reports",
    permissions: ["manage_videos", "manage_feedback", "view_logs"],
  },
  {
    id: "support_agent",
    name: "Support Executive",
    description: "Handle customer queries, tickets, and chat support",
    permissions: ["view_logs", "manage_feedback"],
  },
  {
    id: "content_creator",
    name: "Content Creator",
    description: "Create content but cannot publish without approval",
    permissions: ["manage_videos"],
  },
  {
    id: "viewer",
    name: "Viewer / Read Only",
    description: "View dashboards and reports only",
    permissions: ["view_analytics"],
  },
  {
    id: "accountant",
    name: "Accountant",
    description: "Access invoices, payments, subscriptions, and financial reports",
    permissions: ["manage_billing", "manage_plans", "export_reports"],
  },
  {
    id: "marketing_manager",
    name: "Marketing Manager",
    description: "Manage campaigns, emails, analytics, and referrals",
    permissions: ["view_analytics", "manage_affiliates"],
  },
  {
    id: "hr_manager",
    name: "HR Manager",
    description: "Manage employees, recruitment, and attendance",
    permissions: ["manage_users"],
  },
  {
    id: "customer",
    name: "Customer",
    description: "End-user access to their own data only",
    permissions: ["manage_videos"],
  },
  {
    id: "guest",
    name: "Guest",
    description: "Limited temporary access",
    permissions: [],
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string>("customer");
  const [permissions, setPermissions] = useState<string[]>([]);

  // Compute permissions whenever role changes
  useEffect(() => {
    if (userRole === "admin" || userRole === "super_admin") {
      setPermissions(DEFAULT_PERMISSIONS);
    } else {
      setPermissions(["manage_videos"]);
    }
  }, [userRole]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        try {
          await checkUserRole(nextSession.user);
        } catch (err) {
          console.error("Failed to check user role:", err);
          setUserRole("customer");
          setIsAdmin(false);
        } finally {
          setLoading(false);
        }
      } else {
        setUserRole("customer");
        setIsAdmin(false);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        try {
          await checkUserRole(data.session.user);
        } catch (err) {
          console.error("Failed to check user role:", err);
          setUserRole("customer");
          setIsAdmin(false);
        } finally {
          setLoading(false);
        }
      } else {
        setUserRole("customer");
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function checkUserRole(currentUser: User) {
    // Check authoritative Supabase user_roles table
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (error || !data) {
      setUserRole("customer");
      setIsAdmin(false);
      return;
    }

    setUserRole("admin");
    setIsAdmin(true);
  }

  const hasPermission = (permissionKey: string) => {
    return permissions.includes(permissionKey);
  };

  const value: AuthContextValue = {
    session,
    user,
    loading,
    isAdmin,
    userRole,
    permissions,
    hasPermission,
    signOut: async () => {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserRole("customer");
      setIsAdmin(false);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
