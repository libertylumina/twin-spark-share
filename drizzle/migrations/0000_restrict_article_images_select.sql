DROP POLICY IF EXISTS "Anyone can view article images" ON storage.objects;
CREATE POLICY "Admins can view article images" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));