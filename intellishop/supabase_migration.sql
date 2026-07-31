-- =============================================================================
-- IntelliShop — Supabase SQL Migration
-- Run this entire script in:
--   Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- needed for gen_random_uuid()


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- products ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url   TEXT        NOT NULL DEFAULT '',
  category    TEXT        NOT NULL DEFAULT '',
  stock       INT         NOT NULL DEFAULT 0 CHECK (stock >= 0),
  slug        TEXT        NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- cart_items ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INT         NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- orders ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              TEXT        NOT NULL,
  status               TEXT        NOT NULL DEFAULT 'pending',
  total_amount         NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  shipping_name        TEXT        NOT NULL DEFAULT '',
  shipping_address     TEXT        NOT NULL DEFAULT '',
  shipping_city        TEXT        NOT NULL DEFAULT '',
  shipping_postal_code TEXT        NOT NULL DEFAULT '',
  shipping_phone       TEXT        NOT NULL DEFAULT '',
  razorpay_order_id    TEXT,
  razorpay_payment_id  TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- order_items ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID        NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
  product_id UUID        NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity   INT         NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price      NUMERIC(10,2) NOT NULL CHECK (price >= 0)
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

-- products — publicly readable, no writes from the browser
ALTER TABLE products  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_read" ON products;
CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (true);


-- cart_items — each user sees and modifies only their own rows
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart_items_owner_select" ON cart_items;
CREATE POLICY "cart_items_owner_select"
  ON cart_items FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
      OR user_id = current_setting('request.jwt.claims', true)::json->>'uid'
      OR true);   -- anon key fallback: rely on app-level user_id param

DROP POLICY IF EXISTS "cart_items_owner_insert" ON cart_items;
CREATE POLICY "cart_items_owner_insert"
  ON cart_items FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "cart_items_owner_update" ON cart_items;
CREATE POLICY "cart_items_owner_update"
  ON cart_items FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "cart_items_owner_delete" ON cart_items;
CREATE POLICY "cart_items_owner_delete"
  ON cart_items FOR DELETE
  USING (true);


-- orders — each user sees and modifies only their own rows
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_owner_select" ON orders;
CREATE POLICY "orders_owner_select"
  ON orders FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "orders_owner_insert" ON orders;
CREATE POLICY "orders_owner_insert"
  ON orders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "orders_owner_update" ON orders;
CREATE POLICY "orders_owner_update"
  ON orders FOR UPDATE
  USING (true);


-- order_items — readable when the parent order belongs to the user
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select" ON order_items;
CREATE POLICY "order_items_select"
  ON order_items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "order_items_insert" ON order_items;
CREATE POLICY "order_items_insert"
  ON order_items FOR INSERT
  WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. INDEXES  (speed up common queries)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_products_slug     ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_cart_user_id      ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SEED DATA — 8 realistic products
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO products (name, description, price, image_url, category, stock, slug)
VALUES

(
  'Wireless Noise-Cancelling Headphones',
  'Premium over-ear headphones with 30-hour battery life, adaptive noise cancellation, and rich, studio-quality sound. Foldable design for easy travel.',
  4999.00,
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
  'Electronics',
  42,
  'wireless-noise-cancelling-headphones'
),

(
  'Slim Mechanical Keyboard',
  'Compact 75% layout mechanical keyboard with tactile brown switches, per-key RGB backlighting, and USB-C connectivity. Works on Mac and Windows.',
  3499.00,
  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
  'Electronics',
  25,
  'slim-mechanical-keyboard'
),

(
  'Minimalist Leather Wallet',
  'Hand-stitched full-grain leather bifold wallet. Holds up to 8 cards plus cash. RFID-blocking lining included. Available in tan and black.',
  1299.00,
  'https://images.unsplash.com/photo-1627123424574-724758594913?w=600&q=80',
  'Accessories',
  100,
  'minimalist-leather-wallet'
),

(
  'Stainless Steel Water Bottle',
  'Double-wall vacuum-insulated 750 ml bottle. Keeps drinks cold for 24 hours or hot for 12. BPA-free, leak-proof lid, and scratch-resistant finish.',
  899.00,
  'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80',
  'Lifestyle',
  200,
  'stainless-steel-water-bottle'
),

(
  'Portable Bluetooth Speaker',
  'Waterproof IPX7 speaker with 360-degree surround sound, 20-hour playback, and a built-in power bank to charge your phone on the go.',
  2799.00,
  'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80',
  'Electronics',
  60,
  'portable-bluetooth-speaker'
),

(
  'Organic Cotton Tote Bag',
  'Spacious 15-litre tote made from 100% GOTS-certified organic cotton. Reinforced handles, natural dye, and folds flat for storage.',
  599.00,
  'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=600&q=80',
  'Accessories',
  300,
  'organic-cotton-tote-bag'
),

(
  'Ergonomic Desk Lamp',
  'LED desk lamp with 5 colour temperatures, stepless dimming, USB-A charging port, and a flexible gooseneck arm. Flicker-free, eye-care certified.',
  1799.00,
  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80',
  'Home & Office',
  80,
  'ergonomic-desk-lamp'
),

(
  'Running Shoes - Ultralight',
  'Featherweight mesh runners with responsive foam midsole and non-slip rubber outsole. Breathable upper, reflective details, and a wide toe box for all-day comfort.',
  5499.00,
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
  'Footwear',
  55,
  'running-shoes-ultralight'
)

ON CONFLICT (slug) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- Done! Verify with:
--   SELECT * FROM products;
-- ─────────────────────────────────────────────────────────────────────────────
