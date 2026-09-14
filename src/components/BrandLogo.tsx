import { Link } from "react-router-dom";

export function SubblyLogoIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Gradient Squircle Background */}
      <rect width="100" height="100" rx="28" fill="url(#subbly-logo-gradient)" />
      {/* Main Center 4-Point Sparkle */}
      <path
        d="M50 20C50 36.5 40 47 22 47C40 47 50 57.5 50 74C50 57.5 60 47 78 47C60 47 50 36.5 50 20Z"
        fill="white"
      />
      {/* Small Top-Right 4-Point Sparkle */}
      <path
        d="M74 18C74 22.5 71 24.5 67 24.5C71 24.5 74 26.5 74 31C74 26.5 77 24.5 81 24.5C77 24.5 74 22.5 74 18Z"
        fill="white"
      />
      {/* Small Dot Bottom Left */}
      <circle cx="28" cy="64" r="3.5" fill="white" />
      <defs>
        <linearGradient id="subbly-logo-gradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  hideText?: boolean;
}

export function BrandLogo({ size = "md", hideText = false }: BrandLogoProps) {
  // Size configurations matching each layout area
  const sizeClasses = {
    sm: {
      box: "h-7 w-7 rounded-[8px]",
      text: "text-[14px] tracking-wider",
      play: "h-3.5 w-3.5",
      gap: "gap-2",
    },
    md: {
      box: "h-9 w-9 rounded-[10px]",
      text: "text-[16px] tracking-wider",
      play: "h-4.5 w-4.5",
      gap: "gap-2.5",
    },
    lg: {
      box: "h-16 w-16 rounded-[16px]",
      text: "text-[28px] tracking-widest",
      play: "h-7 w-7",
      gap: "gap-4",
    },
  };

  const preset = sizeClasses[size];

  return (
    <Link to="/" className={`flex items-center ${preset.gap} group select-none`}>
      {/* App Icon Rounded Squircle Vector */}
      <div
        className={`relative flex flex-shrink-0 items-center justify-center ${preset.box} shadow-glow transition-transform duration-300 group-hover:scale-105`}
      >
        <SubblyLogoIcon />
      </div>

      {/* SUBB▶LY Logo Text */}
      {!hideText && (
        <span
          className={`font-outfit font-extrabold flex items-center ${preset.text} text-foreground transition-colors duration-200`}
        >
          <span>SUBB</span>
          <svg
            viewBox="0 0 24 24"
            className={`${preset.play} mx-0.5 fill-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.35)]`}
            style={{ display: "inline-block", verticalAlign: "middle" }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>LY</span>
        </span>
      )}
    </Link>
  );
}
