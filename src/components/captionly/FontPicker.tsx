import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, ChevronDown, Check, X, Sparkles } from "lucide-react";
import { FONT_OPTIONS } from "@/lib/captions/types";
import {
  getCustomFonts,
  loadGoogleFont,
  ensureFontsLoaded,
  getFontFallback,
  getFontCategory,
  FONT_CATEGORIES,
  type FontCategory,
} from "@/lib/captions/fontLoader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface FontPickerProps {
  value: string;
  onChange: (font: string) => void;
  customFonts?: string[];
  className?: string;
  triggerClassName?: string;
}

export function FontPicker({
  value,
  onChange,
  customFonts: passedCustomFonts,
  className,
  triggerClassName,
}: FontPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<FontCategory>("All");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load custom fonts from props or localStorage
  const storedCustom = getCustomFonts();
  const customFonts = passedCustomFonts ?? storedCustom;

  const allFonts = useMemo(() => {
    if (customFonts.length > 0) {
      return [...customFonts, ...FONT_OPTIONS.filter((f) => !customFonts.includes(f))];
    }
    return FONT_OPTIONS;
  }, [customFonts]);

  // Preload fonts once mounted or opened
  useEffect(() => {
    ensureFontsLoaded(allFonts);
  }, [allFonts]);

  // Focus search input when popover opens
  useEffect(() => {
    if (open) {
      ensureFontsLoaded(allFonts);
      const timer = setTimeout(() => searchInputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    } else {
      setSearch("");
      setActiveCategory("All");
    }
  }, [open, allFonts]);

  // Filter fonts based on search and category
  const filteredFonts = useMemo(() => {
    return allFonts.filter((font) => {
      const matchesSearch =
        !search.trim() || font.toLowerCase().includes(search.trim().toLowerCase());
      if (!matchesSearch) return false;

      if (activeCategory === "All") return true;
      const cat = getFontCategory(font);
      return cat === activeCategory;
    });
  }, [allFonts, search, activeCategory]);

  const handleSelect = (font: string) => {
    loadGoogleFont(font);
    onChange(font);
    setOpen(false);
  };

  const selectedFallback = getFontFallback(value);
  const selectedCategory = getFontCategory(value);

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-all cursor-pointer select-none",
              "border border-[#E8E4DE] dark:border-[#2C313C] bg-white dark:bg-[#181B22]",
              "hover:border-[#FF6B2C]/70 focus:border-[#FF6B2C] focus:outline-none focus:ring-1 focus:ring-[#FF6B2C]",
              triggerClassName
            )}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span
                className="text-[14px] text-[#1a1a1a] dark:text-white truncate font-medium"
                style={{ fontFamily: `"${value}", ${selectedFallback}` }}
              >
                {value}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 flex-shrink-0 font-sans">
                {selectedCategory}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0 transition-transform duration-200",
                open && "rotate-180 text-[#FF6B2C]"
              )}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[300px] p-0 z-50 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#181B22] shadow-2xl overflow-hidden font-sans"
          align="start"
          sideOffset={6}
        >
          {/* Header & Search */}
          <div className="p-2.5 border-b border-neutral-100 dark:border-neutral-800/80 space-y-2">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fonts..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-[#FF6B2C]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {FONT_CATEGORIES.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-2 py-0.5 text-[10.5px] font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer",
                      active
                        ? "bg-[#FF6B2C] text-white"
                        : "bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font List */}
          <div className="max-h-[280px] overflow-y-auto p-1 divide-y divide-neutral-100 dark:divide-neutral-800/40">
            {filteredFonts.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
                No fonts found matching "{search}"
              </div>
            ) : (
              filteredFonts.map((font) => {
                const isSelected = font === value;
                const fallback = getFontFallback(font);
                const category = getFontCategory(font);
                const isCustom = customFonts.includes(font) && !FONT_OPTIONS.includes(font);

                return (
                  <button
                    key={font}
                    type="button"
                    onClick={() => handleSelect(font)}
                    onMouseEnter={() => loadGoogleFont(font)}
                    className={cn(
                      "w-full px-3 py-2.5 flex items-center justify-between text-left rounded-lg transition-colors group cursor-pointer border-none outline-none",
                      isSelected
                        ? "bg-[#FF6B2C]/10 text-[#FF6B2C] dark:bg-[#FF6B2C]/15"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100"
                    )}
                  >
                    <div className="flex flex-col min-w-0 pr-2 flex-1">
                      {/* Font display in its ACTUAL font family */}
                      <span
                        className="text-[17px] leading-tight truncate"
                        style={{ fontFamily: `"${font}", ${fallback}` }}
                      >
                        {font}
                      </span>
                      {/* Secondary metadata & sample preview */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-sans">
                          {isCustom ? "Custom" : category}
                        </span>
                        <span className="text-[10px] text-neutral-300 dark:text-neutral-600 font-sans">•</span>
                        <span
                          className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate opacity-80"
                          style={{ fontFamily: `"${font}", ${fallback}` }}
                        >
                          The quick brown fox
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 text-[#FF6B2C] flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
