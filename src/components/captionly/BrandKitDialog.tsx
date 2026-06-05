import { useEffect, useId, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { FONT_OPTIONS } from "@/lib/captions/types";

export type BrandKit = {
  id?: string;
  user_id?: string;
  primary_color: string | null;
  secondary_color: string | null;
  heading_font: string | null;
  body_font: string | null;
  logo_url: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  brandKit: BrandKit | null;
  onSaved: (bk: BrandKit) => void;
};

const empty: BrandKit = {
  primary_color: "#22D3EE",
  secondary_color: "#FFFFFF",
  heading_font: "Inter",
  body_font: "Inter",
  logo_url: null,
};

export function BrandKitDialog({ open, onOpenChange, brandKit, onSaved }: Props) {
  const { user } = useAuth();
  const [draft, setDraft] = useState<BrandKit>(brandKit ?? empty);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(brandKit ?? empty);
  }, [brandKit, open]);

  const set = <K extends keyof BrandKit>(k: K, v: BrandKit[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const uploadLogo = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("brand-logos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("brand-logos").getPublicUrl(path);
      set("logo_url", data.publicUrl);
      toast.success("Logo uploaded");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = { ...draft, user_id: user.id };
      delete (payload as any).id;
      const { data, error } = await supabase
        .from("brand_kits")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single();
      if (error) throw error;
      onSaved(data as BrandKit);
      toast.success("Brand kit saved");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Brand kit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <ColorBox label="Primary color" value={draft.primary_color || "#000000"}
              onChange={(v) => set("primary_color", v)} />
            <ColorBox label="Secondary color" value={draft.secondary_color || "#FFFFFF"}
              onChange={(v) => set("secondary_color", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FontBox label="Heading font" value={draft.heading_font || "Inter"}
              onChange={(v) => set("heading_font", v)} />
            <FontBox label="Body font" value={draft.body_font || "Inter"}
              onChange={(v) => set("body_font", v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Logo</Label>
            <div className="flex items-center gap-3 rounded-md border border-border bg-surface-2 p-3">
              {draft.logo_url ? (
                <img src={draft.logo_url} alt="Logo" className="h-12 w-12 rounded bg-black/30 object-contain p-1" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded bg-surface-3 text-muted-foreground">
                  <Upload className="h-5 w-5" />
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:border-primary">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {draft.logo_url ? "Replace" : "Upload"}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
              </label>
              {draft.logo_url && (
                <button onClick={() => set("logo_url", null)}
                  className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save brand kit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ColorBox({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void; }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-2 py-1.5">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent" />
        <Input value={value.toUpperCase()} onChange={(e) => onChange(e.target.value)}
          className="h-7 border-0 bg-transparent px-1 font-mono text-xs" />
      </div>
    </div>
  );
}

function FontBox({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void; }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
        style={{ fontFamily: `"${value}", sans-serif` }}>
        {FONT_OPTIONS.map((f) => (
          <option key={f} value={f} style={{ fontFamily: `"${f}", sans-serif` }}>{f}</option>
        ))}
      </select>
    </div>
  );
}
