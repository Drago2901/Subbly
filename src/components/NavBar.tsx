import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Film, Sparkles, LayoutGrid, Zap, Shield, Moon, Sun, Menu as MenuIcon, X, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { AvatarDropdown } from "@/components/AvatarDropdown";

interface NavBarProps {
  activeView?: string;
  isPublic?: boolean;
}

export function NavBar({ activeView, isPublic = false }: NavBarProps) {
  const { user, userRole } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isSystemAdmin = userRole === "super_admin" || userRole === "admin";

  interface NavLink {
    label: string;
    path: string;
    icon?: React.ComponentType<{ className?: string }>;
    active: boolean;
  }

  const links: NavLink[] = isPublic
    ? [
        { label: "Features", path: "/#features", active: activeView === "Features" },
        { label: "How it works", path: "/#how", active: activeView === "How" },
        { label: "Pricing", path: "/pricing", active: activeView === "Pricing" },
      ]
    : [
        { label: "Dashboard", path: "/projects", icon: LayoutGrid, active: activeView === "Dashboard" },
        { label: "Subscription", path: "/subscription", icon: Zap, active: activeView === "Subscription" },
        ...(isSystemAdmin ? [{ label: "Admin", path: "/admin", icon: Shield, active: activeView === "Admin" }] : []),
      ];

  return (
    <>
      <nav 
        className={`sticky top-0 z-[100] flex items-center justify-between px-6 md:px-12 transition-all duration-300 ${
          scrolled 
            ? "h-[56px] border-b border-[#e8e4de]/60 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shadow-sm" 
            : "h-[68px] border-b border-transparent bg-white/95 dark:bg-zinc-950/95"
        }`}
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#ff5c3a] to-[#ff8c73] p-[2px] shadow-[0_4px_12px_rgba(255,92,58,0.2)] transition-transform duration-300 group-hover:scale-105">
            <img
              src="/logo.png"
              alt="Subbly Logo"
              className="h-full w-full object-contain rounded-[9px]"
            />
          </div>
          <span className="font-serif text-[18px] font-bold tracking-tight text-zinc-900 dark:text-white transition-colors duration-200 group-hover:text-[#ff5c3a]">
            Subbly
          </span>
        </Link>

        {/* Middle Navigation Links */}
        {isPublic ? (
          /* Public Centered Links */
          <div className="hidden items-center gap-8 md:flex md:absolute md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.path}
                className={`relative text-[13.5px] font-medium transition-colors duration-200 py-1.5 ${
                  link.active
                    ? "text-[#ff5c3a] dark:text-[#ff7558]"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                } group`}
              >
                {link.label}
                <span className={`absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-[#ff5c3a] transition-transform duration-300 group-hover:scale-x-100 ${
                  link.active ? "scale-x-100" : ""
                }`} />
              </a>
            ))}
          </div>
        ) : (
          /* App Sidebar Navigation Links */
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
                  {Icon && <Icon className={`h-4 w-4 ${link.active ? "text-[#ff5c3a] dark:text-[#ff7558]" : "text-zinc-400 dark:text-zinc-500"}`} />}
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-all duration-200 hover:text-zinc-900 dark:hover:text-white hover:border-[#b0aba4] dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* User Sign-In or Avatar Menu */}
          {user ? (
            <AvatarDropdown />
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center rounded-lg border border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-1.5 text-[13px] font-medium text-zinc-600 dark:text-zinc-300 transition-all duration-200 hover:text-zinc-900 dark:hover:text-white hover:border-[#b0aba4] dark:hover:border-zinc-700"
            >
              Sign In
            </Link>
          )}

          {/* CTA Link (Public Mode only) */}
          {isPublic && (
            <Link
              to="/editor"
              className="hidden items-center gap-1.5 rounded-lg bg-[#ff5c3a] px-4 py-1.5 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(255,92,58,0.2)] transition-all duration-200 hover:-translate-y-px hover:bg-[#ff7558] hover:shadow-[0_4px_16px_rgba(255,92,58,0.3)] md:inline-flex"
            >
              Open Editor <ArrowRight className="h-3 w-3" strokeWidth={2.2} />
            </Link>
          )}

          {/* Collapsible Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-all duration-200 md:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Collapsible Mobile Drawer */}
      {mobileOpen && (
        <div className="sticky top-[56px] z-[99] border-b border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-4 md:hidden flex flex-col gap-2.5 transition-all duration-300 shadow-lg">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] font-semibold transition-colors ${
                  link.active
                    ? "bg-[#fff5f3] dark:bg-zinc-900 text-[#ff5c3a] dark:text-[#ff7558]"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {link.label}
              </a>
            );
          })}
          {isPublic && (
            <>
              <div className="my-1.5 h-px bg-[#e8e4de] dark:bg-zinc-800" />
              <Link
                to="/editor"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg bg-[#ff5c3a] px-3 py-3 text-center text-[14px] font-semibold text-white shadow-[0_2px_8px_rgba(255,92,58,0.2)] hover:bg-[#ff7558]"
              >
                Open Editor
              </Link>
            </>
          )}
        </div>
      )}
    </>
  );
}

