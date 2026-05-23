-- ==========================================
-- 初潤製茶所 ERP 進銷存與資料庫欄位補齊補丁
-- 請在 Supabase 的 SQL Editor 中貼上並執行此腳本
-- ==========================================

-- 1. 補齊 products (商品資料表) 的庫存相關欄位
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock integer DEFAULT 10;

-- 2. 補齊 orders (訂單資料表) 的缺漏欄位 (解決無法完整存檔的問題)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number text,
ADD COLUMN IF NOT EXISTS b2b_commission numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS reward_points numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_info jsonb;

-- 3. 建立 ERP 專用資料表：Warehouses (倉庫管理)
CREATE TABLE IF NOT EXISTS public.warehouses (
    id serial PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 確保 warehouses 擁有必要的擴充欄位
ALTER TABLE public.warehouses 
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS manager text;

-- 4. 建立 ERP 專用資料表：Suppliers (廠商管理)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id serial PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 確保 suppliers 擁有必要的擴充欄位
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS contact_person text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- 插入預設廠商與倉庫請至後台系統操作，此處略過以避免 id 型別衝突 (uuid vs integer)

-- 5. 建立 ERP 專用資料表：Warehouse Inventory (各倉獨立庫存)
CREATE TABLE IF NOT EXISTS public.warehouse_inventory (
    id serial PRIMARY KEY,
    warehouse_id integer REFERENCES public.warehouses(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(warehouse_id, product_id)
);

-- 確保 warehouse_inventory 擁有必要的擴充欄位
ALTER TABLE public.warehouse_inventory 
ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock integer DEFAULT 10;

-- 6. 建立 ERP 專用資料表：Inventory Logs (進銷存異動日誌)
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id serial PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 因為原始設計 id 可能是 uuid，為了相容，我們先嘗試建立文字欄位
ALTER TABLE public.inventory_logs 
ADD COLUMN IF NOT EXISTS product_name text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS supplier text,
ADD COLUMN IF NOT EXISTS type text,
ADD COLUMN IF NOT EXISTS notes text;

-- ==========================================
-- 執行完畢後，您的資料庫將具備完整的 ERP 運作能力！
-- ==========================================
