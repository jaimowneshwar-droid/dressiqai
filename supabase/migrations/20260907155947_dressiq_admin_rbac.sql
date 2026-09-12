/*
# Role-based admin access control

## Overview
Replaces the previous "any authenticated user can write" model with an
explicit admins allowlist. Only users whose auth.uid() appears in the
`admins` table can perform INSERT/UPDATE/DELETE on store management tables.

## Changes
1. New table: `admins` — maps auth users to admin status
2. SECURITY DEFINER function `is_admin()` — checks if current user is an admin
3. All admin write policies (INSERT/UPDATE/DELETE) on banners, categories,
   products, orders, customers, reviews, app_settings, and storage.objects
   now require `is_admin()` instead of just `authenticated`
4. Public read policies (anon) remain unchanged
5. anon INSERT on orders, customers, and reviews remains unchanged (storefront needs these)

## Security
- Admin writes: require is_admin() which checks the admins table
- Storefront reads: anon + authenticated (unchanged)
- Checkout writes (orders, customers): anon + authenticated (unchanged)
- Review submission: anon + authenticated (unchanged)
*/

-- ============================================================
-- ADMINS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Admins can read the admin list (to know who other admins are)
DROP POLICY IF EXISTS "admins_read_own" ON admins;
CREATE POLICY "admins_read_own" ON admins FOR SELECT
  TO authenticated USING (true);

-- Only existing admins can add new admins
DROP POLICY IF EXISTS "admins_insert_by_admin" ON admins;
CREATE POLICY "admins_insert_by_admin" ON admins FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid())
  );

-- Only existing admins can delete admins
DROP POLICY IF EXISTS "admins_delete_by_admin" ON admins;
CREATE POLICY "admins_delete_by_admin" ON admins FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid())
  );

-- ============================================================
-- IS_ADMIN function (SECURITY DEFINER for policy use)
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
$$;

-- ============================================================
-- APP_SETTINGS: tighten admin writes
-- ============================================================
DROP POLICY IF EXISTS "admin_insert_app_settings" ON app_settings;
CREATE POLICY "admin_insert_app_settings" ON app_settings FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_app_settings" ON app_settings;
CREATE POLICY "admin_update_app_settings" ON app_settings FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_app_settings" ON app_settings;
CREATE POLICY "admin_delete_app_settings" ON app_settings FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- BANNERS: tighten admin writes
-- ============================================================
DROP POLICY IF EXISTS "admin_insert_banners" ON banners;
CREATE POLICY "admin_insert_banners" ON banners FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_banners" ON banners;
CREATE POLICY "admin_update_banners" ON banners FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_banners" ON banners;
CREATE POLICY "admin_delete_banners" ON banners FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- CATEGORIES: tighten admin writes
-- ============================================================
DROP POLICY IF EXISTS "admin_insert_categories" ON categories;
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_categories" ON categories;
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_categories" ON categories;
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- PRODUCTS: tighten admin writes
-- ============================================================
DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products" ON products FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products" ON products FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- ORDERS: tighten admin writes (anon insert stays for checkout)
-- ============================================================
DROP POLICY IF EXISTS "admin_update_orders" ON orders;
CREATE POLICY "admin_update_orders" ON orders FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_orders" ON orders;
CREATE POLICY "admin_delete_orders" ON orders FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- CUSTOMERS: tighten admin writes (anon insert stays for checkout)
-- ============================================================
DROP POLICY IF EXISTS "admin_update_customers" ON customers;
CREATE POLICY "admin_update_customers" ON customers FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_customers" ON customers;
CREATE POLICY "admin_delete_customers" ON customers FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- REVIEWS: tighten admin writes (anon insert stays for submissions)
-- ============================================================
DROP POLICY IF EXISTS "admin_update_reviews" ON reviews;
CREATE POLICY "admin_update_reviews" ON reviews FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_reviews" ON reviews;
CREATE POLICY "admin_delete_reviews" ON reviews FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- STORAGE: tighten admin writes
-- ============================================================
DROP POLICY IF EXISTS "admin_upload_dressiq_assets" ON storage.objects;
CREATE POLICY "admin_upload_dressiq_assets" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'dressiq-assets' AND is_admin());

DROP POLICY IF EXISTS "admin_update_dressiq_assets" ON storage.objects;
CREATE POLICY "admin_update_dressiq_assets" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'dressiq-assets' AND is_admin())
  WITH CHECK (bucket_id = 'dressiq-assets' AND is_admin());

DROP POLICY IF EXISTS "admin_delete_dressiq_assets" ON storage.objects;
CREATE POLICY "admin_delete_dressiq_assets" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'dressiq-assets' AND is_admin());
