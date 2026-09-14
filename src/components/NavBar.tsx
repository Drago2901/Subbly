import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Film, Sparkles, LayoutGrid, Zap, Shield, Moon, Sun, Menu as MenuIcon, X, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { AvatarDropdown } from "@/components/AvatarDropdown";
import { BrandLogo } from "@/components/BrandLogo";

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
        className={`sticky top-0 z-[100] flex items-center justify-between px-6 md:px-12 font-outfit transition-all duration-300 ${
          scrolled 
            ? "h-[56px] border-b border-border/70 bg-background/80 backdrop-blur-md shadow-sm" 
            : "h-[68px] border-b border-transparent bg-background/90"
        }`}
      >
        <BrandLogo size="md" />

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
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                } group`}
              >
                {link.label}
                <span className={`absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100 ${
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
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {Icon && <Icon className={`h-4 w-4 ${link.active ? "text-primary" : "text-muted-foreground"}`} />}
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* AE Extension Download */}
          <a
            href="/subbly-ae-extension.zip"
            download="subbly-ae-extension.zip"
            className="hidden items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12.5px] font-semibold text-foreground/80 transition-all duration-200 hover:text-primary hover:border-primary/50 md:inline-flex cursor-pointer shadow-sm"
            title="Download After Effects Extension"
          >
            <Film className="h-4 w-4 text-primary" />
            <span>AE Extension</span>
          </a>

          {/* Theme Toggle */}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all duration-200 hover:text-foreground hover:border-border/80 hover:bg-muted cursor-pointer"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* User Sign-In or Avatar Menu */}
          {user ? (
            <AvatarDropdown />
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-1.5 text-[13px] font-medium text-foreground/80 transition-all duration-200 hover:text-foreground hover:border-foreground/30"
            >
              Sign In
            </Link>
          )}

          {/* CTA Link (Public Mode only) */}
          {isPublic && (
            <Link
              to="/editor"
              className="hidden items-center gap-1.5 rounded-lg bg-gradient-primary px-4 py-1.5 text-[13px] font-semibold text-primary-foreground shadow-glow transition-all duration-200 hover:-translate-y-px hover:opacity-95 md:inline-flex"
            >
              Open Editor <ArrowRight className="h-3 w-3" strokeWidth={2.2} />
            </Link>
          )}

          {/* Collapsible Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all duration-200 md:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Collapsible Mobile Drawer */}
      {mobileOpen && (
        <div className="sticky top-[56px] z-[99] border-b border-border bg-background/95 backdrop-blur-md px-6 py-4 md:hidden flex flex-col gap-2.5 transition-all duration-300 shadow-lg font-outfit">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] font-semibold transition-colors ${
                  link.active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {link.label}
              </a>
            );
          })}
          {isPublic && (
            <>
              <div className="my-1.5 h-px bg-border" />
              <Link
                to="/editor"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg bg-gradient-primary px-3 py-3 text-center text-[14px] font-semibold text-primary-foreground shadow-glow"
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

