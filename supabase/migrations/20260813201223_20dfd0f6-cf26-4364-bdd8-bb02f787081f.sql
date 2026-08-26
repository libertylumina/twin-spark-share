DROP POLICY IF EXISTS "Anyone can read published articles" ON public.articles;
CREATE POLICY "Anyone can read published articles"
ON public.articles
FOR SELECT
TO public
USING (published = true AND published_at <= now());