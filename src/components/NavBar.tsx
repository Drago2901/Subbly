import { Link, useNavigate } from "react-router-dom";
import { Film, Sparkles, LayoutGrid, Zap, Shield, Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { AvatarDropdown } from "@/components/AvatarDropdown";

interface NavBarProps {
  activeView?: string;
}

export function NavBar({ activeView }: NavBarProps) {
  const { user, userRole } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const isSystemAdmin = userRole === "super_admin" || userRole === "admin";

  const links = [
    { label: "Dashboard", path: "/projects", icon: LayoutGrid, active: activeView === "Dashboard" },
    { label: "Subscription", path: "/subscription", icon: Zap, active: activeView === "Subscription" },
    ...(isSystemAdmin ? [{ label: "Admin", path: "/admin", icon: Shield, active: activeView === "Admin" }] : []),
  ];

  return (
    <nav 
      className="sticky top-0 z-[100] flex h-[64px] items-center justify-between border-b border-[#e8e4de] dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 px-6 backdrop-blur-xl transition-all duration-300 md:px-12"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#ff5c3a] shadow-[0_2px_8px_rgba(255,92,58,0.2)] transition-transform duration-300 group-hover:scale-105">
          <span className="font-serif text-[22px] font-bold text-white leading-none select-none">S</span>
        </div>
        <span className="font-serif text-[18px] font-semibold tracking-[-0.2px] text-zinc-900 dark:text-white transition-colors duration-200 group-hover:text-[#ff5c3a]">
          Subbly
        </span>
      </Link>

      {/* Internal Navigation Links */}
      <div className="hidden items-center gap-1.5 md:flex">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              to={link.path}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13.5px] font-medium transition-all duration-200 ${
                link.active
                  ? "bg-[#fff5f3] dark:bg-zinc-800/80 text-[#ff5c3a] dark:text-[#ff7558]"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 ${link.active ? "text-[#ff5c3a] dark:text-[#ff7558]" : "text-zinc-400 dark:text-zinc-500"}`} />
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Actions (Theme toggle + User Avatar) */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-all duration-200 hover:text-zinc-900 dark:hover:text-white hover:border-[#b0aba4] dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
        </button>

        {user ? (
          <AvatarDropdown />
        ) : (
          <Link
            to="/auth"
            className="inline-flex items-center rounded-lg bg-[#ff5c3a] px-[16px] py-1.5 text-[13px] font-medium text-white shadow-[0_2px_8px_rgba(255,92,58,0.2)] transition-all duration-200 hover:-translate-y-px hover:bg-[#ff7558] hover:shadow-[0_4px_16px_rgba(255,92,58,0.3)]"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
