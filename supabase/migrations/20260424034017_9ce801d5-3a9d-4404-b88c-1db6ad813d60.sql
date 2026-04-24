-- Style presets: named, reusable caption styles per user
CREATE TABLE public.style_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  style JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.style_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own presets" ON public.style_presets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own presets" ON public.style_presets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own presets" ON public.style_presets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own presets" ON public.style_presets
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins view all presets" ON public.style_presets
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update all presets" ON public.style_presets
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete all presets" ON public.style_presets
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_style_presets_updated_at
  BEFORE UPDATE ON public.style_presets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Brand kits: one per user
CREATE TABLE public.brand_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  primary_color TEXT,
  secondary_color TEXT,
  heading_font TEXT,
  body_font TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own brand kit" ON public.brand_kits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own brand kit" ON public.brand_kits
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own brand kit" ON public.brand_kits
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own brand kit" ON public.brand_kits
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins view all brand kits" ON public.brand_kits
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update all brand kits" ON public.brand_kits
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete all brand kits" ON public.brand_kits
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_brand_kits_updated_at
  BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for brand logos (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Brand logos public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'brand-logos');
CREATE POLICY "Users upload own brand logo" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own brand logo" ON storage.objects
  FOR UPDATE USING (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own brand logo" ON storage.objects
  FOR DELETE USING (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);