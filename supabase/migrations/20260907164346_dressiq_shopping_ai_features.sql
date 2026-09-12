/*
# DressIQ Shopping & AI Features Migration

1. Changes
- Update app_settings default currency_symbol from '$' to '₹'
- Create wishlists table for storing wishlist items (browser-session based, no auth required)
- Create ai_recommendations table to store AI size/outfit/try-on results

2. New Tables
- wishlists: id, session_id (text), product_id (uuid FK→products), size, color, created_at
- ai_recommendations: id, session_id, type (size/outfit/tryon), input (jsonb), result (jsonb), created_at

3. Security
- wishlists: anon+authenticated CRUD (browser-local session, no auth)
- ai_recommendations: anon+authenticated INSERT+SELECT (no sensitive data)
*/

-- Update currency default
UPDATE app_settings SET currency_symbol = '₹' WHERE currency_symbol = '$';

-- Wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size text,
  color text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_wishlists" ON wishlists;
CREATE POLICY "anon_select_wishlists" ON wishlists FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_wishlists" ON wishlists;
CREATE POLICY "anon_insert_wishlists" ON wishlists FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_wishlists" ON wishlists;
CREATE POLICY "anon_delete_wishlists" ON wishlists FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_wishlists_session ON wishlists(session_id);

-- AI Recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  type text NOT NULL DEFAULT 'chat',
  input jsonb,
  result jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ai_recs" ON ai_recommendations;
CREATE POLICY "anon_select_ai_recs" ON ai_recommendations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ai_recs" ON ai_recommendations;
CREATE POLICY "anon_insert_ai_recs" ON ai_recommendations FOR INSERT
  TO anon, authenticated WITH CHECK (true);
