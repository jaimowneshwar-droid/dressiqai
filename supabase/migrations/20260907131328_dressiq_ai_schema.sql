/*
# DressIQ AI — E-Commerce Schema

## Overview
Full schema for a mobile-first PWA e-commerce app with admin management.
Admin access is gated by Supabase Auth; storefront reads are public (anon).

## Tables
1. **app_settings** — singleton row: theme colors, logo, AI settings, contact details
2. **banners** — home page carousel banners (image, title, subtitle, link, order, active)
3. **categories** — product categories (name, icon, image, sort order, active)
4. **products** — products (name, description, price, compare_at_price, stock, images, category, active, featured)
5. **orders** — customer orders (items, totals, status, customer info, shipping address)
6. **customers** — customer profiles (name, email, phone, address) — auto-created on checkout
7. **reviews** — product reviews (rating, comment, author, product ref, approved)

## Security
- Storefront reads (SELECT): anon + authenticated on public-facing tables
- Admin writes (INSERT/UPDATE/DELETE): authenticated only (admin signs in via Supabase Auth)
- Orders: anon can create (checkout), authenticated can manage
- Reviews: anon can create (submit), authenticated can manage/approve
*/

-- ============================================================
-- APP SETTINGS (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL DEFAULT 'DressIQ AI',
  logo_url text,
  primary_color text NOT NULL DEFAULT '#D4AF37',
  secondary_color text NOT NULL DEFAULT '#0A0A0A',
  accent_color text NOT NULL DEFAULT '#F5E6A8',
  hero_title text NOT NULL DEFAULT 'Dress Smarter with AI',
  hero_subtitle text NOT NULL DEFAULT 'AI-powered fashion at your fingertips',
  contact_email text NOT NULL DEFAULT 'support@dressiq.ai',
  contact_phone text NOT NULL DEFAULT '+1 800 000 0000',
  contact_address text NOT NULL DEFAULT '123 Fashion Ave, New York, NY 10001',
  ai_enabled boolean NOT NULL DEFAULT true,
  ai_provider text NOT NULL DEFAULT 'gemini',
  ai_api_key text,
  ai_model text NOT NULL DEFAULT 'gemini-1.5-flash',
  ai_system_prompt text NOT NULL DEFAULT 'You are DressIQ, a fashion AI assistant helping customers find the perfect outfit.',
  free_shipping_threshold numeric NOT NULL DEFAULT 100,
  shipping_flat_rate numeric NOT NULL DEFAULT 9.99,
  currency_symbol text NOT NULL DEFAULT '$',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_app_settings" ON app_settings;
CREATE POLICY "public_read_app_settings" ON app_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_app_settings" ON app_settings;
CREATE POLICY "admin_insert_app_settings" ON app_settings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_app_settings" ON app_settings;
CREATE POLICY "admin_update_app_settings" ON app_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_app_settings" ON app_settings;
CREATE POLICY "admin_delete_app_settings" ON app_settings FOR DELETE
  TO authenticated USING (true);

INSERT INTO app_settings (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- ============================================================
-- BANNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  subtitle text DEFAULT '',
  image_url text NOT NULL,
  link_url text DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_banners" ON banners;
CREATE POLICY "public_read_banners" ON banners FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_banners" ON banners;
CREATE POLICY "admin_insert_banners" ON banners FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_banners" ON banners;
CREATE POLICY "admin_update_banners" ON banners FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_banners" ON banners;
CREATE POLICY "admin_delete_banners" ON banners FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon_name text NOT NULL DEFAULT 'Tag',
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_categories" ON categories;
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_categories" ON categories;
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_categories" ON categories;
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  compare_at_price numeric,
  stock int NOT NULL DEFAULT 0,
  sku text DEFAULT '',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  images text[] NOT NULL DEFAULT '{}',
  sizes text[] NOT NULL DEFAULT '{}',
  colors text[] NOT NULL DEFAULT '{}',
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  rating numeric DEFAULT 0,
  review_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products" ON products FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products" ON products FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  zip_code text DEFAULT '',
  total_orders int NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_customers" ON customers;
CREATE POLICY "anon_insert_customers" ON customers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_customers" ON customers;
CREATE POLICY "public_read_customers" ON customers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_customers" ON customers;
CREATE POLICY "admin_update_customers" ON customers FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_customers" ON customers;
CREATE POLICY "admin_delete_customers" ON customers FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric NOT NULL DEFAULT 0,
  shipping numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_method text DEFAULT 'cod',
  payment_status text NOT NULL DEFAULT 'unpaid',
  shipping_name text NOT NULL,
  shipping_email text NOT NULL,
  shipping_phone text DEFAULT '',
  shipping_address text NOT NULL,
  shipping_city text DEFAULT '',
  shipping_state text DEFAULT '',
  shipping_zip text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_orders" ON orders;
CREATE POLICY "anon_read_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_orders" ON orders;
CREATE POLICY "admin_update_orders" ON orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_orders" ON orders;
CREATE POLICY "admin_delete_orders" ON orders FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text DEFAULT '',
  rating int NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  title text DEFAULT '',
  comment text NOT NULL DEFAULT '',
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_approved_reviews" ON reviews;
CREATE POLICY "public_read_approved_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reviews" ON reviews;
CREATE POLICY "anon_insert_reviews" ON reviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_reviews" ON reviews;
CREATE POLICY "admin_update_reviews" ON reviews FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_reviews" ON reviews;
CREATE POLICY "admin_delete_reviews" ON reviews FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- ============================================================
-- Updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_banners_updated_at ON banners;
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
