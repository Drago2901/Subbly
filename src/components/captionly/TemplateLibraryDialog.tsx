import { useState, useMemo, useEffect } from "react";
import { 
  Star, 
  Check, 
  Search, 
  Upload, 
  X, 
  ChevronDown, 
  Eye, 
  Plus,
  Layers,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  CAPTION_TEMPLATES, 
  type CaptionTemplate, 
  type CaptionStyle 
} from "@/lib/captions/types";

export interface ExtendedCaptionTemplate extends CaptionTemplate {
  badge?: "New" | "Pro" | null;
  categories?: string[];
  tags?: string[];
}

interface TemplateLibraryDialogProps {
  currentStyle: CaptionStyle;
  onApplyTemplate: (t: CaptionTemplate) => void;
  customTemplates?: CaptionTemplate[];
  onImportClick?: () => void;
}

const CATEGORIES = [
  "All Templates",
  "Trending",
  "Minimal",
  "Bold",
  "Dynamic",
  "Elegant",
  "Gaming",
  "Social Media",
];

// Rich mockup details for the 8 featured templates
const FEATURED_DETAILS: Record<string, { badge: "New" | "Pro" | null; categories: string[]; tags: string[] }> = {
  "modern-clean": { badge: "New", categories: ["Trending", "Minimal", "Social Media"], tags: ["Text", "Accent", "Fade"] },
  "gradient-pop": { badge: "Pro", categories: ["Trending", "Bold", "Dynamic"], tags: ["Text", "Accent", "Scale"] },
  "bold-impact": { badge: "Pro", categories: ["Trending", "Bold", "Social Media"], tags: ["Text", "Accent", "Pop"] },
  "neon-glow-premium": { badge: "Pro", categories: ["Dynamic", "Gaming"], tags: ["Text", "Accent", "Glow"] },
  "minimal-box": { badge: "New", categories: ["Minimal"], tags: ["Text", "Accent", "Slide"] },
  "wave-style-premium": { badge: "Pro", categories: ["Elegant", "Social Media"], tags: ["Text", "Accent", "Wave"] },
  "street-vibe-premium": { badge: "Pro", categories: ["Bold", "Gaming"], tags: ["Text", "Accent", "Shake"] },
  "luxury-gold-premium": { badge: "Pro", categories: ["Elegant"], tags: ["Text", "Accent", "Fade"] },
};

function TemplateCardPreview({ template }: { template: CaptionTemplate }) {
  switch (template.id) {
    case "modern-clean":
      return (
        <div className="w-full h-full bg-[#0d0d0f] relative overflow-hidden flex flex-col items-center justify-center p-3 select-none">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent pointer-events-none" />
          <div className="text-center font-sans tracking-tight">
            <span className="block text-[14px] font-semibold text-white">Your captions</span>
            <span className="inline-block mt-1.5 px-3 py-1 text-[13px] font-extrabold bg-[#FF5C3A] text-white rounded-[4px] shadow-sm">here</span>
          </div>
        </div>
      );
      
    case "gradient-pop":
      return (
        <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-950 relative overflow-hidden flex items-center justify-center p-3 select-none">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C084FC_1px,transparent_1px)] [background-size:12px_12px]" />
          <div className="text-center">
            <span className="block text-[13px] font-black tracking-wider text-white uppercase">YOUR CAPTIONS</span>
            <span className="inline-block mt-2 px-3 py-1 text-[13px] font-black uppercase text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-[6px] shadow-md shadow-purple-500/20">HERE</span>
          </div>
        </div>
      );
      
    case "bold-impact":
      return (
        <div className="w-full h-full bg-[#0a0a0b] relative overflow-hidden flex items-center justify-center p-3 select-none">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
            <span className="font-extrabold text-[44px] text-zinc-900 tracking-wider uppercase opacity-30 select-none scale-125">BOLD</span>
          </div>
          <div className="text-center relative z-10">
            <span className="block text-[15px] font-black italic text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] [text-shadow:_1px_1px_0_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000]">Your captions</span>
            <span className="inline-block text-[16px] font-black italic text-[#FACC15] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] [text-shadow:_1px_1px_0_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000] transform -rotate-2">here</span>
          </div>
        </div>
      );
      
    case "neon-glow-premium":
      return (
        <div className="w-full h-full bg-[#09090b] relative overflow-hidden flex items-center justify-center p-3 select-none">
          <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:14px_24px]" />
          <div className="text-center">
            <span className="block text-[13px] font-bold tracking-wide text-white uppercase drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]">Your Captions</span>
            <span className="inline-block mt-1 text-[15px] font-bold text-cyan-400 uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.9)]">Here</span>
          </div>
        </div>
      );
      
    case "minimal-box":
      return (
        <div className="w-full h-full bg-[#0c0c0d] relative overflow-hidden flex items-center justify-center p-4 select-none">
          <div className="border border-pink-500/80 px-4 py-2 relative bg-black/45">
            <span className="absolute -top-1.5 -left-1 text-[9px] font-bold text-pink-500">+</span>
            <span className="absolute -top-1.5 -right-1 text-[9px] font-bold text-pink-500">+</span>
            <span className="absolute -bottom-2 -left-1 text-[9px] font-bold text-pink-500">+</span>
            <span className="absolute -bottom-2 -right-1 text-[9px] font-bold text-pink-500">+</span>
            <span className="text-[11px] font-bold tracking-widest text-white uppercase">YOUR CAPTIONS HERE</span>
          </div>
        </div>
      );
      
    case "wave-style-premium":
      return (
        <div className="w-full h-full bg-[#07080a] relative overflow-hidden flex items-center justify-center p-3 select-none">
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,50 C30,40 70,60 100,50 L100,100 L0,100 Z" fill="none" stroke="#06B6D4" strokeWidth="0.5" />
              <path d="M0,60 C40,45 60,75 100,60 L100,100 L0,100 Z" fill="none" stroke="#0891B2" strokeWidth="0.5" />
            </svg>
          </div>
          <div className="text-center">
            <span className="block text-[13px] font-semibold text-white">Your captions</span>
            <span className="inline-block mt-1 px-2.5 py-0.5 text-[12px] font-bold bg-cyan-500 text-white rounded-[3px]">here</span>
          </div>
        </div>
      );
      
    case "street-vibe-premium":
      return (
        <div className="w-full h-full bg-[#0a0a0b] relative overflow-hidden flex items-center justify-center p-3 select-none">
          <div className="absolute h-10 w-32 bg-zinc-800 rounded-sm opacity-50 filter blur-xs transform -rotate-1 pointer-events-none" />
          <div className="text-center relative z-10 font-mono">
            <span className="block text-[13px] font-extrabold text-yellow-400 uppercase tracking-tight">YOUR CAPTIONS</span>
            <span className="inline-block px-1.5 py-0.5 bg-white text-black text-[12px] font-black uppercase transform rotate-1">HERE</span>
          </div>
        </div>
      );
      
    case "luxury-gold-premium":
      return (
        <div className="w-full h-full bg-[#080809] border border-amber-500/10 relative overflow-hidden flex items-center justify-center p-3 select-none">
          <div className="absolute inset-1 border border-amber-500/20 pointer-events-none" />
          <div className="absolute top-2 left-2 text-[8px] text-amber-500/40">⚜</div>
          <div className="absolute top-2 right-2 text-[8px] text-amber-500/40">⚜</div>
          <div className="absolute bottom-2 left-2 text-[8px] text-amber-500/40">⚜</div>
          <div className="absolute bottom-2 right-2 text-[8px] text-amber-500/40">⚜</div>
          <div className="text-center font-serif">
            <span className="block text-[14px] italic text-[#FCD34D] font-medium">Your captions</span>
            <span className="inline-block mt-1 px-3 py-0.5 text-[11px] uppercase border border-amber-500/40 text-amber-400 font-semibold bg-amber-950/20">here</span>
          </div>
        </div>
      );
      
    default: {
      const s = template.style || {};
      const fontFamily = s.fontFamily || "Inter";
      const uppercase = s.uppercase || false;
      return (
        <div className="w-full h-full bg-gradient-to-tr from-[#0e0f12] to-[#16171c] relative overflow-hidden flex items-center justify-center p-3 select-none">
          <span 
            className="text-[12px] text-center font-bold px-2 py-1 rounded"
            style={{ 
              fontFamily: `"${fontFamily}", sans-serif`,
              color: s.color || "#FFFFFF",
              backgroundColor: s.bgColor ? `${s.bgColor}${Math.round((s.bgOpacity ?? 1) * 255).toString(16).padStart(2, "0")}` : "transparent",
              textShadow: s.strokeWidth ? `0 0 ${s.strokeWidth}px ${s.strokeColor || "#000"}` : "none",
            }}
          >
            {uppercase ? "YOUR CAPTIONS HERE" : "Your captions here"}
          </span>
        </div>
      );
    }
  }
}

export function TemplateLibraryDialog({ 
  currentStyle, 
  onApplyTemplate,
  customTemplates = [],
  onImportClick
}: TemplateLibraryDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All Templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loadMoreCount, setLoadMoreCount] = useState(8);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("subbly.favoriteTemplates");
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = favorites.includes(id) 
      ? favorites.filter(f => f !== id) 
      : [...favorites, id];
    setFavorites(next);
    localStorage.setItem("subbly.favoriteTemplates", JSON.stringify(next));
    toast.success(favorites.includes(id) ? "Removed from favorites" : "Added to favorites");
  };

  // Compile all available templates
  const allTemplates = useMemo(() => {
    const list: ExtendedCaptionTemplate[] = [];

    // Prepend the 8 primary featured templates from screenshot matching CAPTION_TEMPLATES ids
    const featuredIds = [
      "modern-clean",
      "gradient-pop",
      "bold-impact",
      "neon-glow-premium",
      "minimal-box",
      "wave-style-premium",
      "street-vibe-premium",
      "luxury-gold-premium",
    ];

    // Find and map existing or customized templates
    featuredIds.forEach((fid) => {
      const existing = CAPTION_TEMPLATES.find(t => t.id === fid || t.id === fid.replace("-premium", ""));
      const details = FEATURED_DETAILS[fid] || { badge: null, categories: ["Trending"], tags: ["Text"] };
      
      if (existing) {
        list.push({
          ...existing,
          id: fid, // keep standard id
          badge: details.badge,
          categories: details.categories,
          tags: details.tags
        });
      } else {
        // Fallbacks for demo consistency
        list.push({
          id: fid,
          name: fid.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
          description: "Stunning template designed for professional look",
          badge: details.badge,
          categories: details.categories,
          tags: details.tags,
          style: { fontFamily: "Inter", fontSize: 50, color: "#FFFFFF" }
        });
      }
    });

    // Append rest of default templates
    CAPTION_TEMPLATES.forEach((t) => {
      if (!featuredIds.some(fid => fid === t.id || fid.replace("-premium", "") === t.id)) {
        list.push({
          ...t,
          badge: null,
          categories: ["Trending", "Social Media"],
          tags: ["Text", "Accent"]
        });
      }
    });

    // Append custom imported ones
    (customTemplates || []).forEach((ct) => {
      list.push({
        ...ct,
        badge: "New",
        categories: ["Social Media"],
        tags: ["Custom"]
      });
    });

    return list;
  }, [customTemplates]);

  // Determine if a template is active
  const isTemplateActive = (t: CaptionTemplate) => {
    return Object.entries(t.style).every(([key, value]) => {
      return currentStyle[key as keyof CaptionStyle] === value;
    });
  };

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(query);
        const matchesDesc = t.description.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }

      // 2. Category Filter
      if (activeCategory !== "All Templates") {
        if (!t.categories?.includes(activeCategory)) return false;
      }

      return true;
    });
  }, [allTemplates, activeCategory, searchQuery]);

  const displayedTemplates = useMemo(() => {
    return filteredTemplates.slice(0, loadMoreCount);
  }, [filteredTemplates, loadMoreCount]);

  const handleApply = (t: CaptionTemplate) => {
    onApplyTemplate(t);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#e8e4de] bg-[#f5f3ee]/40 py-4 text-[13px] font-semibold text-zinc-600 hover:bg-[#fff5f3] hover:border-[#ff5c3a]/50 hover:text-[#ff5c3a] transition-all cursor-pointer">
          <Sparkles className="h-4 w-4" />
          ✨ Open Premium Template Library
        </button>
      </DialogTrigger>

      <DialogContent 
        className="max-w-4xl max-h-[85vh] bg-[#0c0c0e] border-[#1f1f23] text-white p-6 rounded-2xl overflow-y-auto scrollbar-thin md:max-w-4xl"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <DialogHeader className="flex flex-row items-start justify-between border-b border-zinc-800/80 pb-4">
          <div>
            <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#ff5c3a]" />
              Caption Templates
            </DialogTitle>
            <p className="text-[12.5px] text-zinc-400 mt-1">
              Choose a template to style your captions. Each template has a unique look and animation.
            </p>
          </div>
          <div className="flex items-center gap-2.5 mr-6">
            {onImportClick && (
              <button
                onClick={() => {
                  onImportClick();
                  setOpen(false);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#161619] px-3.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/80 transition-all cursor-pointer shadow-sm"
              >
                <Upload className="h-3.5 w-3.5" />
                Import Template
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Filters and Search Bar */}
        <div className="my-5 flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
          {/* Scrollable Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setLoadMoreCount(8);
                  }}
                  className={`flex-shrink-0 px-3.5 py-1.5 text-[12px] font-semibold rounded-lg transition-all cursor-pointer ${
                    active
                      ? "bg-[#ff5c3a] text-white shadow-[0_2px_8px_rgba(255,92,58,0.25)]"
                      : "bg-[#161619] border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-[220px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8.5 rounded-lg border border-zinc-800 bg-[#121215] pl-8.5 pr-3 text-[12px] text-white placeholder-zinc-500 outline-none transition focus:border-[#ff5c3a] focus:ring-0"
            />
          </div>
        </div>

        {/* Templates Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedTemplates.map((t) => {
            const active = isTemplateActive(t);
            const isFav = favorites.includes(t.id);

            return (
              <div
                key={t.id}
                onClick={() => handleApply(t)}
                className={`flex h-[110px] rounded-xl overflow-hidden bg-[#161619] border transition-all cursor-pointer duration-200 group relative ${
                  active
                    ? "border-[#ff5c3a] ring-1 ring-[#ff5c3a]/50 shadow-[0_4px_20px_rgba(255,92,58,0.1)]"
                    : "border-zinc-800/80 hover:border-zinc-700/80 hover:bg-[#1a1a1e]"
                }`}
              >
                {/* Left Side: Visual Preview Mockup Box (16:9 Aspect ratio) */}
                <div className="w-[145px] h-full border-r border-zinc-800 flex-shrink-0 overflow-hidden bg-black">
                  <TemplateCardPreview template={t} />
                </div>

                {/* Right Side: Details and Actions */}
                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                  <div className="space-y-1">
                    {/* Title + Badges */}
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold text-[13.5px] text-white truncate">{t.name}</span>
                        {t.badge && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide uppercase select-none ${
                            t.badge === "New" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" 
                              : "bg-purple-500/10 text-purple-400 border border-purple-500/25"
                          }`}>
                            {t.badge}
                          </span>
                        )}
                      </div>

                      {/* Favorite Toggle Star */}
                      <button
                        onClick={(e) => toggleFavorite(t.id, e)}
                        className="text-zinc-500 hover:text-amber-500 transition-colors p-0.5"
                        title={isFav ? "Remove from favorites" : "Favorite template"}
                      >
                        <Star className={`h-4 w-4 ${isFav ? "fill-amber-500 text-amber-500" : ""}`} />
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-snug">
                      {t.description}
                    </p>
                  </div>

                  {/* Badges / Tags & Apply indicator */}
                  <div className="flex items-center justify-between mt-1">
                    {/* Tags */}
                    <div className="flex items-center gap-1 overflow-hidden">
                      {t.tags?.map((tag) => (
                        <span 
                          key={tag} 
                          className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[9px] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Select indicator */}
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-[#ff5c3a] opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Apply</span>
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </div>
                  </div>
                </div>

                {/* Checked Badge Overlay (selected indicator) */}
                {active && (
                  <div className="absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff5c3a] text-white shadow-sm border border-black/30">
                    <Check className="h-3 w-3" strokeWidth={3.5} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Load More Option */}
        {filteredTemplates.length > loadMoreCount && (
          <div className="mt-5 flex justify-center border-t border-zinc-800/80 pt-4">
            <button
              onClick={() => setLoadMoreCount((prev) => prev + 6)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#161619] px-4 text-[12px] font-semibold text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Load More Templates
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Layers className="h-10 w-10 text-zinc-700 mb-3" />
            <span className="font-semibold text-zinc-400 text-[13.5px]">No templates found</span>
            <span className="text-[11.5px] text-zinc-500 mt-1">Try searching for something else or change categories.</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
