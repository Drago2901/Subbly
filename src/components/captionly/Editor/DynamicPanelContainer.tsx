import React from "react";
import { ArrowLeft, X } from "lucide-react";

interface DynamicPanelContainerProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  width?: number | string;
  onClose?: () => void;
  onBack?: () => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const DynamicPanelContainer: React.FC<DynamicPanelContainerProps> = ({
  title,
  subtitle,
  icon: Icon,
  width = 310,
  onClose,
  onBack,
  headerActions,
  children,
  className = "",
}) => {
  const widthStyle = typeof width === "number" ? `${width}px` : width;

  return (
    <div
      style={{ width: widthStyle }}
      className={`flex-shrink-0 h-full border-r border-border bg-card flex flex-col overflow-hidden select-none z-20 shadow-xl transition-all duration-300 ease-in-out animate-in slide-in-from-left-3 ${className}`}
    >
      {/* Panel Header */}
      <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border px-3 bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition cursor-pointer flex-shrink-0"
              title="Back"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}

          {Icon && (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <Icon className="h-4 w-4" />
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-extrabold text-foreground truncate tracking-tight">
              {title}
            </span>
            {subtitle && (
              <span className="text-[10px] text-muted-foreground font-medium truncate -mt-0.5">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {headerActions}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition cursor-pointer"
              title="Close panel"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {children}
      </div>
    </div>
  );
};
