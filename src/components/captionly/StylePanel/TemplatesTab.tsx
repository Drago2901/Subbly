import React, { useMemo, useState } from "react";
import { Search, Check, Star, ChevronDown, Save, Trash2 } from "lucide-react";
import { type CaptionStyle } from "@/lib/captions/types";
import { loadGoogleFont } from "@/lib/captions/fontLoader";
import { toast } from "sonner";
import { AccordionCard } from "./stylePanelControls";
import {
  TEMPLATES,
  buildCategories,
  mapTemplateToStyle,
  type Preset,
} from "./stylePanelConstants";
import { CaptionPreview } from "./CaptionPreview";

interface TemplatesTabProps {
  style: CaptionStyle;
  onChange: (s: CaptionStyle) => void;
  showTabsHeader?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  favorites: string[];
  toggleFavorite: (id: string, e: React.MouseEvent) => void;
  presets: Preset[];
  onSavePreset: (name: string) => void;
  onDeletePreset: (id: string) => void;
}

export function TemplatesTab({
  style,
  onChange,
  showTabsHeader = true,
  isOpen,
  onToggle,
  favorites,
  toggleFavorite,
  presets,
  onSavePreset,
  onDeletePreset,
}: TemplatesTabProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadMoreCount, setLoadMoreCount] = useState(8);
  const [presetName, setPresetName] = useState("");

  const isTemplateActive = (t: typeof TEMPLATES[number]) => {
    const target = mapTemplateToStyle(t);
    return Object.keys(target).every((key) => {
      const k = key as keyof CaptionStyle;
      return style[k] === target[k];
    });
  };

  const filteredTemplates = useMemo(() => {
    let result = TEMPLATES;
    if (activeCategory !== "All") {
      result = result.filter((item) => item.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.text.toLowerCase().includes(query) ||
          item.highlight.toLowerCase().includes(query)
      );
    }
    return result;
  }, [activeCategory, searchQuery]);

  const displayedTemplates = useMemo(() => {
    return filteredTemplates.slice(0, loadMoreCount);
  }, [filteredTemplates, loadMoreCount]);

  const applyTemplate = (t: typeof TEMPLATES[number]) => {
    const mapped = mapTemplateToStyle(t);
    onChange({ ...style, ...mapped });
    if (mapped.fontFamily) loadGoogleFont(mapped.fontFamily);
    toast.success(`Applied "${t.name}"`);
  };

  const handleSave = () => {
    if (!presetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }
    onSavePreset(presetName.trim());
    setPresetName("");
  };

  return (
    <AccordionCard
      title="Caption Templates"
      isOpen={!showTabsHeader || isOpen}
      onToggle={onToggle}
      icon="🎨"
      isCollapsible={showTabsHeader}
    >
      <div className="space-y-4">
        {/* Filter categories */}
        <div className="flex flex-wrap gap-1.5">
          {buildCategories().map((c) => {
            const active = activeCategory === c.name;
            return (
              <button
                key={c.name}
                onClick={() => {
                  setActiveCategory(c.name);
                  setLoadMoreCount(8);
                }}
                type="button"
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                  active
                    ? "bg-[#FF6B2C] text-white border-[#FF6B2C] shadow-sm"
                    : "bg-white dark:bg-[#181B22] text-[#6B7280] dark:text-[#A1A8B5] border-[#E8E8E8] dark:border-[#2C313C] hover:border-[#FF6B2C]/40 hover:text-[#111827] dark:hover:text-white"
                }`}
              >
                {c.name}
                <span
                  className={`text-[9.5px] ${
                    active ? "text-white/80" : "text-[#999] dark:text-[#A1A8B5]/65"
                  }`}
                >
                  {c.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search templates */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#999] dark:text-[#A1A8B5]" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#E8E8E8] dark:border-[#2C313C] bg-white dark:bg-[#181B22] pl-9 pr-3 py-2 text-[12.5px] text-[#111827] dark:text-white placeholder-[#999] dark:placeholder-[#A1A8B5] outline-none transition focus:border-[#FF6B2C]"
          />
        </div>

        {/* Template card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
          {displayedTemplates.map((t) => {
            const active = isTemplateActive(t);
            const isFav = favorites.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className={`group relative flex flex-col rounded-xl border overflow-hidden text-left transition-all cursor-pointer ${
                  active
                    ? "border-[#FF6B2C] ring-1 ring-[#FF6B2C]/30 shadow-md shadow-orange-500/5"
                    : "border-[#E8E8E8] dark:border-[#2C313C] bg-white dark:bg-[#181B22] hover:border-[#FF6B2C]/40 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                }`}
                type="button"
              >
                {/* Visual Treatment Preview */}
                <div className="h-20 w-full flex items-center justify-center px-4 bg-[#111] dark:bg-[#0a0a0a] relative">
                  <CaptionPreview t={t} />

                  {active && (
                    <div className="absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B2C] text-white shadow-md">
                      <Check className="h-3 w-3" strokeWidth={3.5} />
                    </div>
                  )}

                  <button
                    onClick={(e) => toggleFavorite(t.id, e)}
                    className="absolute top-2 right-2 text-zinc-550 hover:text-amber-500 transition-colors p-1 bg-black/45 hover:bg-black/60 rounded-full"
                  >
                    <Star className={`h-3.5 w-3.5 ${isFav ? "fill-amber-500 text-amber-500" : "text-white/70"}`} />
                  </button>
                </div>

                {/* Details Bottom Bar */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-[#E8E8E8] dark:border-[#2C313C] bg-[#F8F9FB] dark:bg-[#1F232D] w-full text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-[#111827] dark:text-white truncate">{t.name}</span>
                    {t.badge && (
                      <span className="text-[8px] font-extrabold tracking-wide px-1 py-0.5 rounded bg-[#FF6B2C]/10 text-[#FF6B2C] border border-[#FF6B2C]/20 uppercase">
                        {t.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[9.5px] text-[#6B7280] dark:text-[#A1A8B5] flex-shrink-0">{t.category}</span>
                </div>
              </button>
            );
          })}
        </div>

        {filteredTemplates.length > loadMoreCount && (
          <div className="flex justify-center pt-1.5">
            <button
              type="button"
              onClick={() => setLoadMoreCount((prev) => prev + 6)}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E8E8E8] dark:border-[#2C313C] bg-white dark:bg-[#1F232D] px-3.5 text-[11.5px] font-bold text-[#6B7280] dark:text-[#A1A8B5] hover:text-[#111827] dark:hover:text-white hover:border-[#FF6B2C] transition-all cursor-pointer"
            >
              Load More
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Saved Presets */}
        <div className="border-t border-[#E8E8E8] dark:border-[#2C313C] pt-4.5">
          <div className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A1A8B5]">
            My Saved Presets
          </div>
          <div className="mb-3 flex gap-2">
            <input
              aria-label="Preset name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Enter preset name..."
              className="flex-1 rounded-lg border border-[#E8E8E8] dark:border-[#2C313C] bg-white dark:bg-[#181B22] px-3 py-2 text-[12.5px] text-[#111827] dark:text-white placeholder-[#999] dark:placeholder-[#A1A8B5] outline-none focus:border-[#FF6B2C] transition"
            />
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#FF6B2C] px-3.5 py-2 text-[12.5px] font-bold text-white transition-all hover:bg-[#FF874D] cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
          </div>

          {presets.length === 0 ? (
            <div className="text-[11.5px] text-[#A1A8B5]">No saved presets yet.</div>
          ) : (
            <div className="space-y-1.5">
              {presets.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-[#E8E4DE] dark:border-[#2C313C] bg-[#F9F8F5] dark:bg-[#181B22] px-3 py-2 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ ...style, ...p.style });
                      toast.success(`Applied "${p.name}"`);
                    }}
                    className="flex-1 truncate text-left font-semibold text-[#555] dark:text-[#A1A8B5] hover:text-[#FF6B2C] transition-colors"
                  >
                    {p.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePreset(p.id)}
                    aria-label={`Delete preset ${p.name}`}
                    className="text-[#A1A8B5]/60 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AccordionCard>
  );
}
