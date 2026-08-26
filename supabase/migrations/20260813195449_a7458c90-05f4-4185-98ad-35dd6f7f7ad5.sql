ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS share_facebook TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS share_twitter TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS share_whatsapp TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS share_linkedin TEXT NOT NULL DEFAULT '';

CREATE POLICY "Anyone can view article images"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

CREATE POLICY "Admins can upload article images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update article images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete article images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'));