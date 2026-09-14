import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { type CaptionStyle } from "@/lib/captions/types";
import { AccordionCard, SliderRow, ColorField, ToggleRow } from "./stylePanelControls";
import { ANIM_STYLES } from "./stylePanelConstants";

interface AnimationTabProps {
  style: CaptionStyle;
  onChange: (s: CaptionStyle) => void;
  showTabsHeader?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const animCategories = [
  { name: "Social Media", icon: "✨" },
  { name: "Cinematic", icon: "🎬" },
  { name: "Handwritten", icon: "✍️" },
  { name: "Creative Effects", icon: "🔥" },
] as const;

export function AnimationTab({
  style,
  onChange,
  showTabsHeader = true,
  isOpen,
  onToggle,
}: AnimationTabProps) {
  const [animSearchQuery, setAnimSearchQuery] = useState("");
  const [animFilter, setAnimFilter] = useState<"all" | "popular" | "trending" | "new" | "pro">("all");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    "Social Media": false,
    "Cinematic": false,
    "Handwritten": false,
    "Creative Effects": false,
  });

  const set = <K extends keyof CaptionStyle>(key: K, val: CaptionStyle[K]) => {
    onChange({ ...style, [key]: val });
  };

  const filteredAnimations = useMemo(() => {
    return ANIM_STYLES.filter((anim) => {
      const matchSearch =
        anim.title.toLowerCase().includes(animSearchQuery.toLowerCase()) ||
        anim.description.toLowerCase().includes(animSearchQuery.toLowerCase());
      const matchFilter = animFilter === "all" || anim.filterTags.includes(animFilter);
      return matchSearch && matchFilter;
    });
  }, [animSearchQuery, animFilter]);

  return (
    <AccordionCard
      title="Animation Styles"
      isOpen={!showTabsHeader || isOpen}
      onToggle={onToggle}
      icon="✨"
      isCollapsible={showTabsHeader}
    >
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search animations..."
            value={animSearchQuery}
            onChange={(e) => setAnimSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#E8E8E8] dark:border-[#2C313C] bg-white dark:bg-[#181B22] pl-10 pr-4 py-2 text-xs text-[#111827] dark:text-white placeholder-[#999] focus:border-[#FF6B2C] focus:outline-none transition-colors"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 text-[11px]">
            🔍
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-1.5 pb-1">
          {([
            { id: "all", label: "All" },
            { id: "popular", label: "Popular" },
            { id: "trending", label: "Trending" },
            { id: "new", label: "New" },
            { id: "pro", label: "Pro" },
          ] as const).map((chip) => {
            const active = animFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setAnimFilter(chip.id)}
                className={`rounded-full px-3 py-1 text-[10px] font-bold border transition-all cursor-pointer ${
                  active
                    ? "bg-[#FF6B2C] text-white border-[#FF6B2C] shadow-sm"
                    : "bg-white dark:bg-[#181B22] text-[#6B7280] dark:text-[#A1A8B5] border-[#E8E8E8] dark:border-[#2C313C] hover:border-[#FF6B2C]/40 hover:text-[#111827] dark:hover:text-white"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Collapsible Categories list */}
        <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin select-none">
          {animCategories.map((cat) => {
            const catAnims = filteredAnimations.filter((a) => a.category === cat.name);
            if (catAnims.length === 0) return null;

            const isCollapsed = collapsedCategories[cat.name] || false;

            return (
              <div key={cat.name} className="space-y-2 border-b border-neutral-100 dark:border-neutral-900/60 pb-3 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setCollapsedCategories((prev) => ({ ...prev, [cat.name]: !isCollapsed }))}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-neutral-500 dark:text-[#A1A8B5] hover:text-[#FF6B2C] py-1 focus:outline-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                    <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 ml-1">
                      ({catAnims.length})
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      isCollapsed ? "-rotate-90 text-neutral-400" : "text-[#FF6B2C]"
                    }`}
                  />
                </button>

                <div
                  className={`space-y-2 transition-all duration-300 ease-in-out ${
                    isCollapsed ? "h-0 overflow-hidden opacity-0" : "opacity-100"
                  }`}
                >
                  {catAnims.map((opt) => {
                    const active = opt.isActive(style);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange(opt.apply(style))}
                        className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all duration-200 hover:-translate-y-[1px] hover:shadow-sm cursor-pointer ${
                          active
                            ? "border-[#FF6B2C] bg-[#FF6B2C]/5 shadow-[0_0_12px_rgba(255,107,44,0.06)]"
                            : "border-[#E8E8E8] dark:border-[#2C313C] bg-white dark:bg-[#1F232D] hover:border-[#FF6B2C]/40"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-base font-bold ${
                            active
                              ? "bg-[#FF6B2C] text-white"
                              : "bg-[#F5F5F5] dark:bg-[#181B22] text-[#6B7280] dark:text-[#A1A8B5]"
                          }`}
                        >
                          {opt.iconText}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[12px] font-bold truncate ${active ? "text-[#FF6B2C]" : "text-[#111827] dark:text-white"}`}>
                              {opt.title}
                            </span>
                            {opt.badge && (
                              <span
                                className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded leading-none ${
                                  opt.badge === "NEW"
                                    ? "bg-green-500/10 text-green-500 dark:bg-green-500/20"
                                    : "bg-[#FF6B2C]/10 text-[#FF6B2C] dark:bg-[#FF6B2C]/20"
                                }`}
                              >
                                {opt.badge}
                              </span>
                            )}
                            {opt.isPro && (
                              <span className="text-[8px] font-extrabold bg-[#FF6B2C]/15 text-[#FF6B2C] px-1.5 py-0.5 rounded leading-none">
                                PRO
                              </span>
                            )}
                          </div>
                          <div className="text-[10.5px] text-[#6B7280] dark:text-[#A1A8B5] truncate mt-0.5">
                            {opt.description}
                          </div>
                        </div>

                        {active && (
                          <div className="flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded-full bg-[#FF6B2C] text-white">
                            <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {style.animation === "typewriter" && (
          <div className="mt-4 space-y-4 border-t border-[#E8E8E8] dark:border-[#2C313C] pt-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A1A8B5] mb-1">
              Typewriter Settings
            </div>

            <SliderRow
              label="Typing Speed"
              value={style.typewriterSpeed || 80}
              min={30}
              max={300}
              step={10}
              onChange={(v) => set("typewriterSpeed", v)}
              suffix=" ms"
              compact
            />

            <SliderRow
              label="Deleting Speed"
              value={style.typewriterDeleteSpeed || 40}
              min={10}
              max={200}
              step={10}
              onChange={(v) => set("typewriterDeleteSpeed", v)}
              suffix=" ms"
              compact
            />

            <SliderRow
              label="Delay Pause"
              value={style.typewriterDelay || 1500}
              min={500}
              max={4000}
              step={100}
              onChange={(v) => set("typewriterDelay", v)}
              suffix=" ms"
              compact
            />

            <ColorField
              label="Cursor Color"
              value={style.typewriterCursorColor || "#FF6B2C"}
              onChange={(v) => set("typewriterCursorColor", v)}
            />

            <div className="rounded-lg border border-[#E8E8E8] dark:border-[#2C313C] bg-white dark:bg-[#181B22] overflow-hidden">
              <ToggleRow
                icon="🔁"
                label="Loop Mode"
                checked={style.typewriterLoop !== false}
                onChange={(v) => set("typewriterLoop", v)}
                last
              />
            </div>
          </div>
        )}
      </div>
    </AccordionCard>
  );
}
