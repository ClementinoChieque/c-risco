
DROP POLICY IF EXISTS "Public read trade-analyses" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read trade-analyses" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert trade-analyses" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete trade-analyses" ON storage.objects;

CREATE POLICY "Owner read trade-analyses"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'trade-analyses'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
