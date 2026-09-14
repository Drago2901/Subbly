import { Check, Pencil, Palette, Plus } from "lucide-react";
import { type CaptionStyle } from "@/lib/captions/types";
import { toast } from "sonner";
import { AccordionCard } from "./stylePanelControls";
import { type BrandKit } from "../BrandKitDialog";

interface BrandKitTabProps {
  style: CaptionStyle;
  onChange: (s: CaptionStyle) => void;
  brandKit: BrandKit | null;
  onOpenBrandDialog: () => void;
  showTabsHeader?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export function BrandKitTab({
  style,
  onChange,
  brandKit,
  onOpenBrandDialog,
  showTabsHeader = true,
  isOpen,
  onToggle,
}: BrandKitTabProps) {
  const applyBrand = () => {
    if (!brandKit) return;
    const next = { ...style };
    if (brandKit.primary_color) next.highlightColor = brandKit.primary_color;
    if (brandKit.secondary_color) next.color = brandKit.secondary_color;
    if (brandKit.heading_font) next.fontFamily = brandKit.heading_font;
    onChange(next);
    toast.success("Brand kit applied");
  };

  return (
    <AccordionCard
      title="Brand Kit Settings"
      isOpen={!showTabsHeader || isOpen}
      onToggle={onToggle}
      icon="💼"
      isCollapsible={showTabsHeader}
    >
      <div className="space-y-4">
        {brandKit ? (
          <div className="overflow-hidden rounded-xl border border-[#E8E4DE] dark:border-[#2C313C] bg-[#F9F8F5] dark:bg-[#181B22]">
            <div className="flex items-center justify-between p-3.5 border-b border-[#E8E4DE] dark:border-[#2C313C]">
              <div className="flex gap-1.5">
                {brandKit.primary_color && (
                  <div
                    className="h-6 w-6 rounded border border-black/10 dark:border-white/10"
                    style={{ background: brandKit.primary_color }}
                  />
                )}
                {brandKit.secondary_color && (
                  <div
                    className="h-6 w-6 rounded border border-black/10 dark:border-white/10"
                    style={{ background: brandKit.secondary_color }}
                  />
                )}
              </div>
              <span className="text-[11.5px] font-bold text-[#1a1a1a] dark:text-white truncate max-w-[120px]">
                {brandKit.heading_font || "—"}
              </span>
            </div>
            {brandKit.logo_url && (
              <div className="p-3 bg-[#F0EDE8] dark:bg-[#0a0a0a] flex items-center justify-center">
                <img
                  src={brandKit.logo_url}
                  alt={`${brandKit.heading_font || "Your"} logo`}
                  className="max-h-12 w-auto object-contain rounded p-1 bg-black/5"
                />
              </div>
            )}
            <div className="flex">
              <button
                type="button"
                onClick={applyBrand}
                className="flex flex-1 items-center justify-center gap-1.5 bg-[#FF6B2C] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#FF874D]"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                Apply Kit
              </button>
              <button
                type="button"
                onClick={onOpenBrandDialog}
                className="flex items-center gap-1.5 border-l border-[#E8E4DE] dark:border-[#2C313C] bg-[#F0EDE8] dark:bg-[#1F232D] px-4 py-2.5 text-xs font-bold text-[#666] dark:text-[#A1A8B5] hover:text-[#1a1a1a] dark:hover:text-white transition"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-[#E8E4DE] dark:border-[#2C313C] bg-[#F9F8F5] dark:bg-[#181B22] p-6 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#1F232D]">
              <Palette className="h-5 w-5 text-[#999] dark:text-[#A1A8B5]" strokeWidth={1.8} />
            </div>
            <div className="text-[13px] font-bold text-[#1a1a1a] dark:text-white">No brand kit created</div>
            <div className="text-[11.5px] leading-relaxed text-[#666] dark:text-[#A1A8B5] max-w-[180px]">
              Store colors and custom typography for fast unified formatting.
            </div>
            <button
              type="button"
              onClick={onOpenBrandDialog}
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#1F232D] px-4 py-2 text-[12px] font-bold text-[#666] dark:text-[#A1A8B5] hover:text-[#1a1a1a] dark:hover:text-white hover:border-[#FF6B2C] transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.8} />
              New Brand Kit
            </button>
          </div>
        )}
      </div>
    </AccordionCard>
  );
}
