-- Prevent anonymous listing of all files in the public brand-logos bucket.
-- Files remain reachable via their public CDN URL; only enumeration is blocked.
DROP POLICY IF EXISTS "Brand logos public read" ON storage.objects;
CREATE POLICY "Users read own brand logo"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'brand-logos' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Trigger-only SECURITY DEFINER functions never need to be directly callable by API roles.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;