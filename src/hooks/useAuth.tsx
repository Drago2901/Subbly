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

  // Seed default configuration once on mount
  useEffect(() => {
    if (!localStorage.getItem("rbac_roles")) {
      localStorage.setItem("rbac_roles", JSON.stringify(DEFAULT_ROLES));
    }
    const existingUsers = localStorage.getItem("rbac_users");
    let needsSeed = false;
    if (!existingUsers) {
      needsSeed = true;
    } else {
      try {
        const parsed = JSON.parse(existingUsers);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          needsSeed = true;
        }
      } catch (e) {
        needsSeed = true;
      }
    }

    if (needsSeed) {
      const defaultUsers = [
        {
          name: "Super Admin",
          email: "superadmin@gmail.com",
          role: "super_admin",
          password: "SuperAdm@123",
          created_at: new Date().toLocaleDateString(),
        },
        {
          name: "Admin Operator",
          email: "admin@gmail.com",
          role: "admin",
          password: "password123",
          created_at: new Date().toLocaleDateString(),
        },
        {
          name: "Manager User",
          email: "manager@gmail.com",
          role: "manager",
          password: "password123",
          created_at: new Date().toLocaleDateString(),
        },
        {
          name: "Content Editor",
          email: "editor@gmail.com",
          role: "editor",
          password: "password123",
          created_at: new Date().toLocaleDateString(),
        },
        {
          name: "Moderator User",
          email: "moderator@gmail.com",
          role: "moderator",
          password: "password123",
          created_at: new Date().toLocaleDateString(),
        },
        {
          name: "Support Executive",
          email: "support@gmail.com",
          role: "support_agent",
          password: "password123",
          created_at: new Date().toLocaleDateString(),
        },
        {
          name: "Content Creator",
          email: "creator@gmail.com",
          role: "content_creator",
          password: "password123",
          created_at: new Date().toLocaleDateString(),
        },
        {
          name: "Viewer User",
          email: "viewer@gmail.com",
          role: "viewer",
          password: "password123",
          created_at: new Date().toLocaleDateString(),
        },
        {
          name: "Accountant User",
          email: "accountant@gmail.com",
          role: "accountant",
          password: "password123",
          created_at: new Date().toLocaleDateString(),
        },
        {
          name: "Marketing Manager",
          email: "marketing@gmail.com",
          role: "marketing_manager",
          password: "password123",
          created_at: new Date().toLocaleDateString(),
        },
        {
          name: "HR Manager",
          email: "hr@gmail.com",
          role: "hr_manager",
          password: "password123",
          created_at: new Date().toLocaleDateString(),
        },
        {
          name: "Regular Customer",
          email: "customer@gmail.com",
          role: "customer",
          password: "password123",
          created_at: new Date().toLocaleDateString(),
        },
      ];
      localStorage.setItem("rbac_users", JSON.stringify(defaultUsers));
    }
  }, []);

  // Compute permissions whenever role changes
  useEffect(() => {
    const rolesStr = localStorage.getItem("rbac_roles");
    const rolesList = rolesStr ? JSON.parse(rolesStr) as RoleDefinition[] : DEFAULT_ROLES;
    const roleDef = rolesList.find((r: RoleDefinition) => r.id === userRole) || DEFAULT_ROLES.find((r) => r.id === "customer");
    setPermissions(roleDef?.permissions || []);
  }, [userRole]);

  useEffect(() => {
    // 1. Check for mock session first
    const mockSessionStr = import.meta.env.DEV ? localStorage.getItem("mock_session") : null;
    if (mockSessionStr) {
      try {
        const mock = JSON.parse(mockSessionStr);
        const mockUser = {
          id: mock.email,
          email: mock.email,
          user_metadata: { full_name: mock.name },
        } as unknown as User;
        setSession({ access_token: "mock-token", user: mockUser } as unknown as Session);
        setUser(mockUser);
        
        // Force mock roles to default to customer except superadmin and admin
        const isSuper = mock.email === "superadmin@gmail.com" || mock.role === "super_admin";
        const isAdminRole = mock.role === "admin";
        const activeRole: string = isSuper ? "super_admin" : (isAdminRole ? "admin" : "customer");

        setUserRole(activeRole);
        setIsAdmin(activeRole !== "customer" && activeRole !== "guest");
        setLoading(false);
        return;
      } catch (err) {
        console.error("Failed to parse mock session:", err);
      }
    }

    // 2. Fall back to standard Supabase auth
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      if (nextSession?.user) {
        setTimeout(() => {
          void checkUserRole(nextSession.user);
        }, 0);
      } else {
        setUserRole("customer");
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user) {
        void checkUserRole(data.session.user);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function checkUserRole(currentUser: User) {
    // Force superadmin email directly to super_admin
    if (currentUser.email === "superadmin@gmail.com") {
      setUserRole("super_admin");
      setIsAdmin(true);
      return;
    }

    // Check local storage overrides first (Super Admin reassignments)
    try {
      const overridesStr = import.meta.env.DEV ? localStorage.getItem("rbac_user_roles") : null;
      if (overridesStr) {
        const overrides = JSON.parse(overridesStr);
        const customRole = overrides[currentUser.email || ""] || overrides[currentUser.id];
        if (customRole) {
          // Force override roles to default to customer except admin/superadmin
          const isSuper = currentUser.email === "superadmin@gmail.com" || customRole === "super_admin";
          const isAdminRole = customRole === "admin";
          const activeRole: string = isSuper ? "super_admin" : (isAdminRole ? "admin" : "customer");
          setUserRole(activeRole);
          setIsAdmin(activeRole !== "customer" && activeRole !== "guest");
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Check DB roles table
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
      localStorage.removeItem("mock_session");
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
