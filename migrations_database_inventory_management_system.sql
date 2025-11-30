/*
  # Inventory Management System - Database Schema
  
  ## Overview
  This migration creates a comprehensive inventory management system similar to Sage 300,
  including products, categories, warehouses, stock movements, and suppliers.
  
  ## 1. New Tables
  
  ### `categories`
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Category name
  - `description` (text) - Category description
  - `parent_id` (uuid, nullable) - For hierarchical categories
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `suppliers`
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Supplier name
  - `contact_name` (text) - Contact person
  - `email` (text) - Email address
  - `phone` (text) - Phone number
  - `address` (text) - Physical address
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `warehouses`
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Warehouse name
  - `location` (text) - Warehouse location
  - `capacity` (integer) - Storage capacity
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `products`
  - `id` (uuid, primary key) - Unique identifier
  - `sku` (text, unique) - Stock Keeping Unit
  - `name` (text) - Product name
  - `description` (text) - Product description
  - `category_id` (uuid) - Foreign key to categories
  - `supplier_id` (uuid) - Foreign key to suppliers
  - `unit_price` (decimal) - Unit price
  - `cost_price` (decimal) - Cost price
  - `reorder_level` (integer) - Minimum stock level
  - `reorder_quantity` (integer) - Quantity to reorder
  - `unit_of_measure` (text) - Unit (pcs, kg, liters, etc.)
  - `barcode` (text) - Product barcode
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `stock_levels`
  - `id` (uuid, primary key) - Unique identifier
  - `product_id` (uuid) - Foreign key to products
  - `warehouse_id` (uuid) - Foreign key to warehouses
  - `quantity` (integer) - Current quantity in stock
  - `reserved_quantity` (integer) - Reserved quantity
  - `available_quantity` (integer, generated) - Available quantity
  - `last_counted_at` (timestamptz) - Last physical count
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `stock_movements`
  - `id` (uuid, primary key) - Unique identifier
  - `product_id` (uuid) - Foreign key to products
  - `warehouse_id` (uuid) - Foreign key to warehouses
  - `movement_type` (text) - Type: IN, OUT, TRANSFER, ADJUSTMENT
  - `quantity` (integer) - Quantity moved (positive or negative)
  - `reference_number` (text) - Reference document number
  - `notes` (text) - Additional notes
  - `created_by` (uuid) - User who created the movement
  - `created_at` (timestamptz) - Movement timestamp
  
  ### `purchase_orders`
  - `id` (uuid, primary key) - Unique identifier
  - `po_number` (text, unique) - Purchase order number
  - `supplier_id` (uuid) - Foreign key to suppliers
  - `warehouse_id` (uuid) - Foreign key to warehouses
  - `order_date` (date) - Order date
  - `expected_date` (date) - Expected delivery date
  - `status` (text) - Status: DRAFT, PENDING, RECEIVED, CANCELLED
  - `total_amount` (decimal) - Total order amount
  - `notes` (text) - Additional notes
  - `created_by` (uuid) - User who created the order
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `purchase_order_items`
  - `id` (uuid, primary key) - Unique identifier
  - `purchase_order_id` (uuid) - Foreign key to purchase_orders
  - `product_id` (uuid) - Foreign key to products
  - `quantity_ordered` (integer) - Quantity ordered
  - `quantity_received` (integer) - Quantity received
  - `unit_price` (decimal) - Unit price
  - `total_price` (decimal, generated) - Total line price
  - `created_at` (timestamptz) - Creation timestamp
  
  ## 2. Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage inventory data
  
  ## 3. Important Notes
  - All tables use UUID primary keys with automatic generation
  - Timestamps are automatically managed with triggers
  - Stock levels are calculated automatically
  - All monetary values use decimal type for precision
  - Comprehensive foreign key constraints ensure data integrity
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text DEFAULT '',
  capacity integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  unit_price decimal(10,2) DEFAULT 0,
  cost_price decimal(10,2) DEFAULT 0,
  reorder_level integer DEFAULT 0,
  reorder_quantity integer DEFAULT 0,
  unit_of_measure text DEFAULT 'pcs',
  barcode text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stock_levels table
CREATE TABLE IF NOT EXISTS stock_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity integer DEFAULT 0,
  reserved_quantity integer DEFAULT 0,
  available_quantity integer GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  last_counted_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, warehouse_id)
);

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT')),
  quantity integer NOT NULL,
  reference_number text DEFAULT '',
  notes text DEFAULT '',
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text UNIQUE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE RESTRICT,
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE RESTRICT,
  order_date date DEFAULT CURRENT_DATE,
  expected_date date,
  status text DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'RECEIVED', 'CANCELLED')),
  total_amount decimal(10,2) DEFAULT 0,
  notes text DEFAULT '',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchase_order_items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT,
  quantity_ordered integer NOT NULL DEFAULT 0,
  quantity_received integer DEFAULT 0,
  unit_price decimal(10,2) DEFAULT 0,
  total_price decimal(10,2) GENERATED ALWAYS AS (quantity_ordered * unit_price) STORED,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_stock_levels_product ON stock_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_warehouse ON stock_levels(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_levels_updated_at BEFORE UPDATE ON stock_levels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for categories
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for suppliers
CREATE POLICY "Anyone can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for warehouses
CREATE POLICY "Anyone can view warehouses"
  ON warehouses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert warehouses"
  ON warehouses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update warehouses"
  ON warehouses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete warehouses"
  ON warehouses FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for products
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for stock_levels
CREATE POLICY "Anyone can view stock levels"
  ON stock_levels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert stock levels"
  ON stock_levels FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stock levels"
  ON stock_levels FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete stock levels"
  ON stock_levels FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for stock_movements
CREATE POLICY "Anyone can view stock movements"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert stock movements"
  ON stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stock movements"
  ON stock_movements FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete stock movements"
  ON stock_movements FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for purchase_orders
CREATE POLICY "Anyone can view purchase orders"
  ON purchase_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert purchase orders"
  ON purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update purchase orders"
  ON purchase_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete purchase orders"
  ON purchase_orders FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for purchase_order_items
CREATE POLICY "Anyone can view purchase order items"
  ON purchase_order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert purchase order items"
  ON purchase_order_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update purchase order items"
  ON purchase_order_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete purchase order items"
  ON purchase_order_items FOR DELETE
  TO authenticated
  USING (true);