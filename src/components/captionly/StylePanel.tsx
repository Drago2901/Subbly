import { useEffect, useState } from "react";
import { type CaptionStyle, type Caption } from "@/lib/captions/types";
import { getCustomFonts } from "@/lib/captions/fontLoader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { BrandKitDialog, type BrandKit } from "./BrandKitDialog";
import { StyleTab } from "./StylePanel/StyleTab";
import { AnimationTab } from "./StylePanel/AnimationTab";
import { TemplatesTab } from "./StylePanel/TemplatesTab";
import { BrandKitTab } from "./StylePanel/BrandKitTab";
import { type Tab, type Preset } from "./StylePanel/stylePanelConstants";
import { Sliders, ChevronRight } from "lucide-react";

export { type Tab, type Preset } from "./StylePanel/stylePanelConstants";

type Props = {
  style: CaptionStyle;
  onChange: (s: CaptionStyle) => void;
  selectedCaption?: Caption | null;
  onCaptionChange?: (id: string, patch: Partial<Caption>) => void;
  isLocked?: boolean;
  activeTab?: Tab;
  showTabsHeader?: boolean;
  onOpenAdjustments?: () => void;
};

export function StylePanel({
  style,
  onChange,
  selectedCaption,
  onCaptionChange,
  isLocked,
  activeTab,
  showTabsHeader = true,
  onOpenAdjustments,
}: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>(activeTab || "style");
  const [customFonts, setCustomFonts] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [brandOpen, setBrandOpen] = useState(false);

  // Accordion Toggles for Desktop
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    caption: true,
    typography: true,
    background: false,
    strokePos: false,
    animations: false,
    templates: false,
    brand: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (activeTab) setTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    setCustomFonts(getCustomFonts());
    const favs = localStorage.getItem("subbly-template-favorites");
    if (favs) {
      try {
        setFavorites(JSON.parse(favs));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  useEffect(() => {
    const fetchPresets = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("style_presets")
        .select("id,name,style")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setPresets(data as Preset[]);
      }
    };

    const fetchBrandKit = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("brand_kits")
        .select("*")
        .maybeSingle();
      if (!error && data) {
        setBrandKit(data as BrandKit);
      }
    };

    fetchPresets();
    fetchBrandKit();
  }, [user]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = favorites.includes(id)
      ? favorites.filter((x) => x !== id)
      : [...favorites, id];
    setFavorites(next);
    localStorage.setItem("subbly-template-favorites", JSON.stringify(next));
  };

  const deletePreset = async (id: string) => {
    const { error } = await supabase.from("style_presets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPresets((p) => p.filter((x) => x.id !== id));
  };

  const savePreset = async (name: string) => {
    if (!user) return toast.error("Sign in to save presets");
    const { data, error } = await supabase
      .from("style_presets")
      .insert({ user_id: user.id, name, style: JSON.parse(JSON.stringify(style)) })
      .select("id,name,style")
      .single();
    if (error) return toast.error(error.message);
    setPresets((p) => [data as Preset, ...p]);
    toast.success(`Saved "${name}"`);
  };

  return (
    <div
      className="flex h-full flex-col bg-[#F8F9FB] dark:bg-[#181B22]"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Desktop / Accordions Wrapper */}
      {showTabsHeader ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin select-none">
          <StyleTab
            style={style}
            onChange={onChange}
            customFonts={customFonts}
            selectedCaption={selectedCaption}
            onCaptionChange={onCaptionChange}
            showTabsHeader={showTabsHeader}
            openSections={openSections}
            toggleSection={toggleSection}
          />
          <AnimationTab
            style={style}
            onChange={onChange}
            showTabsHeader={showTabsHeader}
            isOpen={openSections.animations}
            onToggle={() => toggleSection("animations")}
          />
          <TemplatesTab
            style={style}
            onChange={onChange}
            showTabsHeader={showTabsHeader}
            isOpen={openSections.templates}
            onToggle={() => toggleSection("templates")}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            presets={presets}
            onSavePreset={savePreset}
            onDeletePreset={deletePreset}
          />
          <BrandKitTab
            style={style}
            onChange={onChange}
            brandKit={brandKit}
            onOpenBrandDialog={() => setBrandOpen(true)}
            showTabsHeader={showTabsHeader}
            isOpen={openSections.brand}
            onToggle={() => toggleSection("brand")}
          />
        </div>
      ) : (
        /* Mobile / Selected tab view */
        <div
          className={`scrollbar-thin flex-1 overflow-y-auto p-4 ${
            isLocked ? "pointer-events-none opacity-50 select-none" : ""
          }`}
        >
          {tab === "style" && (
            <StyleTab
              style={style}
              onChange={onChange}
              customFonts={customFonts}
              selectedCaption={selectedCaption}
              onCaptionChange={onCaptionChange}
              showTabsHeader={showTabsHeader}
              openSections={openSections}
              toggleSection={toggleSection}
            />
          )}
          {tab === "anim" && (
            <AnimationTab
              style={style}
              onChange={onChange}
              showTabsHeader={showTabsHeader}
              isOpen={true}
              onToggle={() => {}}
            />
          )}
          {tab === "tmpl" && (
            <TemplatesTab
              style={style}
              onChange={onChange}
              showTabsHeader={showTabsHeader}
              isOpen={true}
              onToggle={() => {}}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              presets={presets}
              onSavePreset={savePreset}
              onDeletePreset={deletePreset}
            />
          )}
          {tab === "brand" && (
            <BrandKitTab
              style={style}
              onChange={onChange}
              brandKit={brandKit}
              onOpenBrandDialog={() => setBrandOpen(true)}
              showTabsHeader={showTabsHeader}
              isOpen={true}
              onToggle={() => {}}
            />
          )}
        </div>
      )}

      <BrandKitDialog
        open={brandOpen}
        onOpenChange={setBrandOpen}
        brandKit={brandKit}
        onSaved={(bk) => setBrandKit(bk)}
      />
    </div>
  );
}
