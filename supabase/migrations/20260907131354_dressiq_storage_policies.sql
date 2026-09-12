/*
# Storage policies for dressiq-assets bucket

## Overview
Allow public read access to the dressiq-assets storage bucket.
Allow authenticated users (admin) to upload/update/delete files.
*/

DROP POLICY IF EXISTS "public_read_dressiq_assets" ON storage.objects;
CREATE POLICY "public_read_dressiq_assets" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'dressiq-assets');

DROP POLICY IF EXISTS "admin_upload_dressiq_assets" ON storage.objects;
CREATE POLICY "admin_upload_dressiq_assets" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'dressiq-assets');

DROP POLICY IF EXISTS "admin_update_dressiq_assets" ON storage.objects;
CREATE POLICY "admin_update_dressiq_assets" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'dressiq-assets') WITH CHECK (bucket_id = 'dressiq-assets');

DROP POLICY IF EXISTS "admin_delete_dressiq_assets" ON storage.objects;
CREATE POLICY "admin_delete_dressiq_assets" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'dressiq-assets');
