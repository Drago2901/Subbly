import { Link } from "react-router-dom";

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
      gap: "gap-2"
    },
    md: {
      box: "h-9 w-9 rounded-[10px]",
      text: "text-[16px] tracking-wider",
      play: "h-4.5 w-4.5",
      gap: "gap-2.5"
    },
    lg: {
      box: "h-16 w-16 rounded-[16px]",
      text: "text-[28px] tracking-widest",
      play: "h-7 w-7",
      gap: "gap-4"
    }
  };

  const preset = sizeClasses[size];

  return (
    <Link to="/" className={`flex items-center ${preset.gap} group select-none`}>
      {/* App Icon Rounded Squircle Vector */}
      <div className={`relative flex flex-shrink-0 items-center justify-center ${preset.box} shadow-[0_3px_10px_rgba(255,107,44,0.25)] transition-transform duration-300 group-hover:scale-105`}>
        <svg viewBox="0 0 100 100" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Gradient Squircle Background */}
          <rect width="100" height="100" rx="28" fill="url(#orange-grad)"/>
          {/* Main Sparkle path */}
          <path d="M50 22C50 37.464 41.464 46 26 46C41.464 46 50 54.536 50 70C50 54.536 58.536 46 74 46C58.536 46 50 37.464 50 22Z" fill="white"/>
          {/* Small plus sign top right */}
          <path d="M72 24H78M75 21V27" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Small dot bottom left */}
          <circle cx="27" cy="65" r="3.5" fill="white"/>
          {/* Defs Gradient */}
          <defs>
            <linearGradient id="orange-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF5C3A" />
              <stop offset="100%" stopColor="#FF8A00" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* SUBB▶LY Logo Text */}
      {!hideText && (
        <span className={`font-sans font-extrabold flex items-center ${preset.text} text-zinc-900 dark:text-white transition-colors duration-200`}>
          <span>SUBB</span>
          <svg viewBox="0 0 24 24" className={`${preset.play} mx-0.5 fill-[#FF6B2C] drop-shadow-[0_0_8px_rgba(255,107,44,0.3)]`} style={{ display: 'inline-block', verticalAlign: 'middle' }} xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>LY</span>
        </span>
      )}
    </Link>
  );
}
