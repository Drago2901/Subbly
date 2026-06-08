ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS thumbnail_path text;

CREATE POLICY "Users can view their own thumbnails"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'project-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own thumbnails"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own thumbnails"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'project-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own thumbnails"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'project-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);