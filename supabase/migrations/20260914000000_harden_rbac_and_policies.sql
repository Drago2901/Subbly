-- 1. Add missing admin policies on newsletter_subscribers
CREATE POLICY "Admins can view newsletter subscribers"
  ON public.newsletter_subscribers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete newsletter subscribers"
  ON public.newsletter_subscribers FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Performance indexes for frequent joins and RLS checks
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS style_presets_user_id_idx ON public.style_presets (user_id);
CREATE INDEX IF NOT EXISTS brand_kits_user_id_idx ON public.brand_kits (user_id);
