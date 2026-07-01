import { useRef, useState } from "react";
import { LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAvatar, buildSpriteStyle } from "@/hooks/useAvatar";

/**
 * Top-right avatar button with dropdown menu.
 * Shows the selected anime avatar (or a fallback initial).
 */
export function AvatarDropdown() {
  const { user, signOut } = useAuth();
  const { selection } = useAvatar();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  const initials = (user.email ?? "U").charAt(0).toUpperCase();

  const renderAvatar = (size = 36) => {
    if (selection?.type === "sprite") {
      return (
        <div
          className="rounded-full border-2 border-orange-400/50"
          style={buildSpriteStyle(selection.col, selection.row, selection.sprite, size)}
        />
      );
    }
    if (selection?.type === "custom") {
      return (
        <img
          src={selection.url}
          alt="Avatar"
          className="rounded-full border-2 border-orange-400/50 object-cover"
          style={{ width: size, height: size }}
        />
      );
    }
    // Fallback: letter initial
    return (
      <div
        className="flex items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-rose-500 font-bold text-white"
        style={{ width: size, height: size, fontSize: size * 0.42 }}
      >
        {initials}
      </div>
    );
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="group relative flex items-center justify-center rounded-full transition hover:ring-2 hover:ring-orange-400/40 focus:outline-none focus:ring-2 focus:ring-orange-400/60"
          aria-label="Account menu"
        >
          {/* subtle glow on hover */}
          <div className="absolute -inset-1 rounded-full bg-orange-400/0 transition group-hover:bg-orange-400/10" />
          {renderAvatar(36)}
        </button>

        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            {/* Dropdown */}
            <div
              ref={menuRef}
              className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a22] shadow-2xl"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {/* User info */}
              <div className="border-b border-white/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  {renderAvatar(32)}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">
                      {user.user_metadata?.display_name || user.email?.split("@")[0] || "User"}
                    </div>
                    <div className="truncate text-[11px] text-white/40">{user.email}</div>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <MenuItem
                  icon={Settings}
                  label="Profile"
                  onClick={() => {
                    setOpen(false);
                    navigate("/profile");
                  }}
                />
                <div className="my-1 border-t border-white/5" />
                <MenuItem
                  icon={LogOut}
                  label="Sign Out"
                  onClick={() => {
                    setOpen(false);
                    signOut();
                  }}
                  danger
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-white/70 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {label}
    </button>
  );
}
