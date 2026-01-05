-- ==================== Enable UUID Extension ====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== Tables ====================

-- 1. Restaurants Table
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_en TEXT,
  logo TEXT,
  admin_email TEXT UNIQUE NOT NULL, -- Keep for backwards compatibility/migration
  default_language TEXT DEFAULT 'ar',
  working_hours JSONB DEFAULT '{"open": "09:00", "close": "23:00"}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.1 Restaurant Admins Table (New for Multi-User)
CREATE TABLE restaurant_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'editor', -- 'owner', 'manager', 'editor'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, email)
);

-- 2. Categories Table
-- ... (rest of categories table)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  description_en TEXT,
  image TEXT,
  price DECIMAL(10, 2) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== Indexes ====================
CREATE INDEX idx_categories_restaurant ON categories(restaurant_id);
CREATE INDEX idx_categories_order ON categories(restaurant_id, display_order);
CREATE INDEX idx_products_restaurant ON products(restaurant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_available ON products(restaurant_id, is_available);
CREATE INDEX idx_admins_email ON restaurant_admins(email);

-- ==================== Row Level Security ====================

-- Enable RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- restaurant_admins Policies
CREATE POLICY "Admins can view colleagues"
ON restaurant_admins FOR SELECT
USING (
  auth.jwt() ->> 'email' IN (
    SELECT email FROM restaurant_admins WHERE restaurant_id = restaurant_admins.restaurant_id
  )
);

CREATE POLICY "Owners can manage admins"
ON restaurant_admins FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM restaurant_admins AS ra
    WHERE ra.restaurant_id = restaurant_admins.restaurant_id 
    AND ra.email = auth.jwt() ->> 'email' 
    AND ra.role = 'owner'
  )
);

-- Restaurants Policies
CREATE POLICY "Allow public read restaurants"
ON restaurants FOR SELECT
USING (true);

CREATE POLICY "Admins can update their restaurant"
ON restaurants FOR UPDATE
USING (
  auth.jwt() ->> 'email' IN (
    SELECT email FROM restaurant_admins WHERE restaurant_id = id
  )
);

-- Categories Policies
CREATE POLICY "Allow public read categories"
ON categories FOR SELECT
USING (true);

CREATE POLICY "Admins can manage categories"
ON categories FOR ALL
USING (
  auth.jwt() ->> 'email' IN (
    SELECT email FROM restaurant_admins WHERE restaurant_id = categories.restaurant_id
  )
);

-- Products Policies
CREATE POLICY "Allow public read products"
ON products FOR SELECT
USING (true);

CREATE POLICY "Admins can manage products"
ON products FOR ALL
USING (
  auth.jwt() ->> 'email' IN (
    SELECT email FROM restaurant_admins WHERE restaurant_id = products.restaurant_id
  )
);

-- ==================== Functions & Triggers ====================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER restaurants_updated_at
BEFORE UPDATE ON restaurants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
