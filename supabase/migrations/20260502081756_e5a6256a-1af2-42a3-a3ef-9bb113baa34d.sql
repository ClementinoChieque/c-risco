
-- Add DELETE policies for risk_settings and propfirm_settings
CREATE POLICY "Users can delete own risk_settings"
ON public.risk_settings FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own propfirm_settings"
ON public.propfirm_settings FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Tighten storage policies on trade-analyses bucket.
-- Drop old permissive public policies.
DROP POLICY IF EXISTS "Allow public insert trade-analyses" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete trade-analyses" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read trade-analyses" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update trade-analyses" ON storage.objects;

-- Public read remains (bucket is public; image URLs are referenced from DB).
CREATE POLICY "Public read trade-analyses"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'trade-analyses');

-- Authenticated users can only upload under their own uid/ folder prefix.
CREATE POLICY "Owner insert trade-analyses"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'trade-analyses'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can only delete files under their own uid/ folder prefix.
CREATE POLICY "Owner delete trade-analyses"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'trade-analyses'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can only update files under their own uid/ folder prefix.
CREATE POLICY "Owner update trade-analyses"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'trade-analyses'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
