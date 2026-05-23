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
    location text,
    manager text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 插入預設倉庫資料
INSERT INTO public.warehouses (id, name, location, manager)
VALUES 
    (1, '大安旗艦店', '台北市大安區', '系統預設'),
    (2, '新莊總部', '新北市新莊區', '系統預設'),
    (3, '草屯茶園總廠', '南投縣草屯鎮', '系統預設')
ON CONFLICT (id) DO NOTHING;

-- 4. 建立 ERP 專用資料表：Suppliers (廠商管理)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id serial PRIMARY KEY,
    name text NOT NULL,
    contact_person text,
    phone text,
    address text,
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 插入預設廠商資料
INSERT INTO public.suppliers (id, name, contact_person)
VALUES 
    (1, '初潤南投茶園總廠', '製茶廠長'),
    (2, '極萃生技研發中心', '研發部')
ON CONFLICT (id) DO NOTHING;

-- 5. 建立 ERP 專用資料表：Warehouse Inventory (各倉獨立庫存)
CREATE TABLE IF NOT EXISTS public.warehouse_inventory (
    id serial PRIMARY KEY,
    warehouse_id integer REFERENCES public.warehouses(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    stock integer DEFAULT 0,
    min_stock integer DEFAULT 10,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(warehouse_id, product_id)
);

-- 6. 建立 ERP 專用資料表：Inventory Logs (進銷存異動日誌)
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id serial PRIMARY KEY,
    product_name text,
    category text,
    quantity integer DEFAULT 0,
    unit_cost numeric DEFAULT 0,
    supplier text,
    type text, -- inbound(進貨), outbound(出貨), stock_check(盤點)
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- 執行完畢後，您的資料庫將具備完整的 ERP 運作能力！
-- ==========================================
