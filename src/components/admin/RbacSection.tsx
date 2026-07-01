import { useState, useEffect } from "react";
import { 
  Shield, 
  Users, 
  Plus, 
  Trash2, 
  Check, 
  Edit3, 
  Save, 
  UserPlus, 
  Key, 
  Lock,
  ChevronRight,
  Info,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { DEFAULT_ROLES, DEFAULT_PERMISSIONS, type RoleDefinition, useAuth } from "@/hooks/useAuth";

interface RbacSectionProps {
  profiles: {
    id: string;
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    created_at: string;
  }[];
  currentUserEmail?: string;
  onRefresh: () => void;
}

export default function RbacSection({ profiles, currentUserEmail, onRefresh }: RbacSectionProps) {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<"roles" | "users">("roles");
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("super_admin");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  // New mock user fields
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("customer");

  // Load roles configuration
  useEffect(() => {
    const rolesStr = localStorage.getItem("rbac_roles");
    if (rolesStr) {
      setRoles(JSON.parse(rolesStr));
    } else {
      setRoles(DEFAULT_ROLES);
    }
  }, []);

  const saveRoles = (updatedRoles: RoleDefinition[]) => {
    localStorage.setItem("rbac_roles", JSON.stringify(updatedRoles));
    setRoles(updatedRoles);
    toast.success("Role permissions saved successfully!");
    onRefresh();
  };

  const handleTogglePermission = (roleId: string, permission: string) => {
    const updated = roles.map((r) => {
      if (r.id === roleId) {
        const hasPerm = r.permissions.includes(permission);
        const newPerms = hasPerm
          ? r.permissions.filter((p) => p !== permission)
          : [...r.permissions, permission];
        return { ...r, permissions: newPerms };
      }
      return r;
    });
    saveRoles(updated);
  };

  // Get active role definition
  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  // User list generation (mirroring Admin.tsx user rows calculation)
  const overrides = JSON.parse(localStorage.getItem("rbac_user_roles") || "{}");
  const customUsers = JSON.parse(localStorage.getItem("rbac_users") || "[]");

  const systemUsers = profiles.map((pr) => {
    const roleId = overrides[pr.user_id] || "customer";
    return {
      id: pr.user_id,
      name: pr.display_name || "Database User",
      email: pr.user_id, // stored as user_id or email
      role: roleId,
      isCustom: false,
    };
  });

  const allUsers = [...systemUsers];
  customUsers.forEach((cu: any) => {
    const roleId = overrides[cu.email] || cu.role;
    allUsers.push({
      id: cu.email,
      name: cu.name,
      email: cu.email,
      role: roleId,
      isCustom: true,
    });
  });

  const filteredUsers = allUsers.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const handleUpdateUserRole = (userIdOrEmail: string, roleId: string) => {
    const targetUser = allUsers.find((u) => u.id === userIdOrEmail);
    if (targetUser?.role === "super_admin" && userRole !== "super_admin") {
      toast.error("Access Denied: Only a Super Admin can change a Super Admin's role.");
      return;
    }
    if (roleId === "super_admin" && userRole !== "super_admin") {
      toast.error("Access Denied: Only a Super Admin can promote a user to Super Admin.");
      return;
    }
    const updatedOverrides = { ...overrides, [userIdOrEmail]: roleId };
    localStorage.setItem("rbac_user_roles", JSON.stringify(updatedOverrides));
    toast.success(`Role updated for ${userIdOrEmail}`);
    onRefresh();
  };

  const handleCreateMockUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    const newUser = {
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      created_at: new Date().toLocaleDateString(),
    };

    const existingUsers = JSON.parse(localStorage.getItem("rbac_users") || "[]");
    localStorage.setItem("rbac_users", JSON.stringify([...existingUsers, newUser]));

    // Save initial override role
    const updatedOverrides = { ...overrides, [newUserEmail]: newUserRole };
    localStorage.setItem("rbac_user_roles", JSON.stringify(updatedOverrides));

    toast.success(`Created mock user ${newUserName}`);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserRole("customer");
    setIsCreateUserOpen(false);
    onRefresh();
  };

  const handleDeleteMockUser = (email: string) => {
    const existingUsers = JSON.parse(localStorage.getItem("rbac_users") || "[]");
    const targetUser = existingUsers.find((u: any) => u.email === email);
    if (targetUser?.role === "super_admin" && userRole !== "super_admin") {
      toast.error("Access Denied: Only a Super Admin can delete a Super Admin account.");
      return;
    }
    const updated = existingUsers.filter((u: any) => u.email !== email);
    localStorage.setItem("rbac_users", JSON.stringify(updated));

    // Cleanup overrides
    const updatedOverrides = { ...overrides };
    delete updatedOverrides[email];
    localStorage.setItem("rbac_user_roles", JSON.stringify(updatedOverrides));

    toast.success(`Deleted mock user ${email}`);
    onRefresh();
  };

  return (
    <div className="space-y-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* RBAC Header Controls */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#e8e4de] pb-5 dark:border-zinc-800 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Role-Based Access Control (RBAC)</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Configure global permissions and assign roles to users.</p>
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
                        onCheckedChange={() => handleTogglePermission(selectedRole.id, perm)}
                        className="mt-0.5 border-zinc-300 data-[state=checked]:bg-[#ff5c3a] data-[state=checked]:border-[#ff5c3a]"
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={`perm-${perm}`}
                          className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer"
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
              <CardDescription className="text-xs text-zinc-400 mt-1">Assign custom access levels to platform operators.</CardDescription>
            </div>
            
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                <Input
                  placeholder="Search operator name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="h-9.5 pl-9 text-xs dark:bg-zinc-900 dark:border-zinc-800 bg-[#f9f8f5] dark:bg-zinc-950"
                />
              </div>

              {/* Create Mock User Dialog */}
              <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#ff5c3a] hover:bg-[#ff7558] text-white flex items-center gap-1.5 text-xs font-semibold px-4 py-2">
                    <UserPlus className="h-4 w-4" />
                    Add Mock User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] border-[#e8e4de] bg-white dark:bg-zinc-950 dark:border-zinc-800">
                  <form onSubmit={handleCreateMockUser}>
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">Add Mock Operator</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-6">
                      <div className="grid gap-2">
                        <label className="text-xs font-semibold text-zinc-500">Name</label>
                        <Input
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="John Doe"
                          className="h-10 dark:bg-zinc-900 dark:border-zinc-800"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-semibold text-zinc-500">Email (Unique ID)</label>
                        <Input
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="h-10 dark:bg-zinc-900 dark:border-zinc-800"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-semibold text-zinc-500">Assign Role</label>
                        <Select value={newUserRole} onValueChange={setNewUserRole}>
                          <SelectTrigger className="h-10 dark:bg-zinc-900 dark:border-zinc-800">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-zinc-950 dark:border-zinc-800">
                            {roles.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateUserOpen(false)} className="dark:border-zinc-800">
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-[#ff5c3a] hover:bg-[#ff7558] text-white">
                        Create Operator
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#e8e4de] dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
                    <TableHead className="w-[200px] text-zinc-500 font-bold text-xs py-4 px-6">Name</TableHead>
                    <TableHead className="text-zinc-500 font-bold text-xs py-4 px-6">Identifier / Email</TableHead>
                    <TableHead className="w-[120px] text-zinc-500 font-bold text-xs py-4 px-6">Source</TableHead>
                    <TableHead className="w-[220px] text-zinc-500 font-bold text-xs py-4 px-6 text-right">Role Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-b border-[#e8e4de] dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                        <TableCell className="font-semibold text-[13.5px] py-4 px-6 text-zinc-800 dark:text-zinc-200">
                          {user.name}
                        </TableCell>
                        <TableCell className="text-xs text-zinc-400 font-mono py-4 px-6">
                          {user.email}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {user.isCustom ? (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none text-[10.5px]">
                              Mock User
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-zinc-900 dark:border-emerald-800 text-[10.5px]">
                              Real Database
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <Select 
                              value={user.role} 
                              onValueChange={(val) => handleUpdateUserRole(user.id, val)}
                              disabled={user.role === "super_admin" && userRole !== "super_admin"}
                            >
                              <SelectTrigger className="w-[160px] h-8.5 text-xs font-semibold dark:bg-zinc-900 dark:border-zinc-800">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-zinc-950 dark:border-zinc-800">
                                {roles.map((r) => (
                                  <SelectItem key={r.id} value={r.id} className="text-xs">
                                    {r.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {user.isCustom && !(user.role === "super_admin" && userRole !== "super_admin") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMockUser(user.email)}
                                className="h-8.5 w-8.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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
