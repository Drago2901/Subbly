import { useState, useEffect } from "react";
import { 
  Shield, 
  Users, 
  Lock,
  ChevronRight,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { DEFAULT_ROLES, DEFAULT_PERMISSIONS, type RoleDefinition, useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface RbacSectionProps {
  profiles: {
    id: string;
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    created_at: string;
  }[];
  admins?: Set<string>;
  currentUserEmail?: string;
  onRefresh: () => void;
}

export default function RbacSection({ profiles, admins, currentUserEmail, onRefresh }: RbacSectionProps) {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<"roles" | "users">("roles");
  const [roles, setRoles] = useState<RoleDefinition[]>(DEFAULT_ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("super_admin");
  const [userSearch, setUserSearch] = useState("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Load roles configuration
  useEffect(() => {
    setRoles(DEFAULT_ROLES);
  }, []);

  // Get active role definition
  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  // User list generated directly from Supabase profiles and authoritative admins set
  const allUsers = profiles.map((pr) => {
    const isUserAdmin = admins?.has(pr.user_id) ?? false;
    return {
      id: pr.user_id,
      name: pr.display_name || "Database User",
      email: pr.user_id,
      role: isUserAdmin ? "admin" : "customer",
    };
  });

  const filteredUsers = allUsers.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    setIsUpdating(userId);
    try {
      if (newRole === "admin" || newRole === "super_admin") {
        const { error } = await supabase
          .from("user_roles")
          .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
        if (error) throw error;
        toast.success(`Promoted user to Admin in database`);
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");
        if (error) throw error;
        toast.success(`Revoked Admin role in database`);
      }
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update role in database";
      toast.error(msg);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* RBAC Header Controls */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#e8e4de] pb-5 dark:border-zinc-800 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Role-Based Access Control (RBAC)</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Authoritative server-enforced roles and permissions.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
          <button
            onClick={() => setActiveTab("roles")}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "roles"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            Roles & Permissions
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "users"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            User Assignments
          </button>
        </div>
      </div>

      {/* Tab Contents: Roles & Permissions */}
      {activeTab === "roles" && selectedRole && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Roles Selector Sidebar */}
          <div className="space-y-2 lg:col-span-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2 mb-3">Roles</h3>
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRoleId(r.id)}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all ${
                  selectedRoleId === r.id
                    ? "bg-[#ff5c3a] text-white shadow-lg shadow-[#ff5c3a]/15"
                    : "bg-white border border-[#e8e4de] text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                }`}
              >
                <div className="truncate">
                  <div className="text-[14px] font-bold">{r.name}</div>
                  <div className={`text-[11px] truncate mt-0.5 ${selectedRoleId === r.id ? "text-white/80" : "text-zinc-400 dark:text-zinc-500"}`}>
                    {r.permissions.length} permissions
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${selectedRoleId === r.id ? "translate-x-0.5" : "text-zinc-400"}`} />
              </button>
            ))}
          </div>

          {/* Permissions Matrix */}
          <Card className="lg:col-span-3 border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <CardHeader className="border-b border-[#e8e4de] dark:border-zinc-800">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[#ff5c3a]" />
                    {selectedRole.name} Permissions
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400 mt-1">{selectedRole.description}</CardDescription>
                </div>
                <Badge variant="outline" className="w-fit border-[#ff5c3a]/30 text-[#ff5c3a] bg-[#fff5f3] dark:bg-zinc-900 dark:border-[#ff5c3a]/50 text-xs">
                  Role ID: {selectedRole.id}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEFAULT_PERMISSIONS.map((perm) => {
                  const hasPerm = selectedRole.permissions.includes(perm);
                  const readableName = perm.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                  return (
                    <div 
                      key={perm}
                      className={`flex items-start gap-3.5 rounded-xl border p-4 transition-all duration-200 ${
                        hasPerm
                          ? "border-[#ff5c3a]/20 bg-[#fff5f3]/30 dark:border-[#ff5c3a]/30 dark:bg-zinc-900/40"
                          : "border-zinc-200 bg-white hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900/30"
                      }`}
                    >
                      <Checkbox
                        id={`perm-${perm}`}
                        checked={hasPerm}
                        disabled
                        className="mt-0.5 border-zinc-300 data-[state=checked]:bg-[#ff5c3a] data-[state=checked]:border-[#ff5c3a]"
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={`perm-${perm}`}
                          className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200"
                        >
                          {readableName}
                        </label>
                        <span className="text-[11px] text-zinc-400 leading-normal">
                          Allows {perm.replace("_", " ")} capabilities across application resources.
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Contents: User Assignments */}
      {activeTab === "users" && (
        <Card className="border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <CardHeader className="border-b border-[#e8e4de] dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white">User Role Management</CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-1">Assign database-enforced roles to platform users.</CardDescription>
            </div>
            
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                <Input
                  placeholder="Search user name or ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="h-9.5 pl-9 text-xs dark:bg-zinc-900 dark:border-zinc-800 bg-[#f9f8f5] dark:bg-zinc-950"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#e8e4de] dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
                    <TableHead className="w-[200px] text-zinc-500 font-bold text-xs py-4 px-6">Name</TableHead>
                    <TableHead className="text-zinc-500 font-bold text-xs py-4 px-6">Identifier / User ID</TableHead>
                    <TableHead className="w-[120px] text-zinc-500 font-bold text-xs py-4 px-6">Source</TableHead>
                    <TableHead className="w-[220px] text-zinc-500 font-bold text-xs py-4 px-6 text-right">Role Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((item) => (
                      <TableRow key={item.id} className="border-b border-[#e8e4de] dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                        <TableCell className="font-semibold text-[13.5px] py-4 px-6 text-zinc-800 dark:text-zinc-200">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-xs text-zinc-400 font-mono py-4 px-6">
                          {item.email}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-zinc-900 dark:border-emerald-800 text-[10.5px]">
                            Supabase Database
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <Select 
                              value={item.role} 
                              onValueChange={(val) => handleUpdateUserRole(item.id, val)}
                              disabled={isUpdating === item.id}
                            >
                              <SelectTrigger className="w-[140px] h-8.5 text-xs font-semibold dark:bg-zinc-900 dark:border-zinc-800">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-zinc-950 dark:border-zinc-800">
                                <SelectItem value="admin" className="text-xs">
                                  Admin
                                </SelectItem>
                                <SelectItem value="customer" className="text-xs">
                                  Customer (User)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-xs text-zinc-400 dark:text-zinc-500">
                        No operators found matching "{userSearch}".
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
