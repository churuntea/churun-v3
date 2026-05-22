-- ==========================================
-- 初潤製茶所 V2 - 修復資料關聯與遺失的資料表
-- ==========================================

-- 1. 會員表補齊團隊業績欄位
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS team_total_sales NUMERIC(10, 2) DEFAULT 0;

-- 2. 進銷存管理：倉庫表 (warehouses)
CREATE TABLE IF NOT EXISTS public.warehouses (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 預設倉庫資料
INSERT INTO public.warehouses (id, name, location) VALUES 
(1, '大安總倉', '台北市大安區'),
(2, '新莊出貨中心', '新北市新莊區'),
(3, '南投草屯廠', '南投縣草屯鎮')
ON CONFLICT DO NOTHING;

-- 3. 進銷存管理：供應商表 (suppliers)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    contact_person TEXT,
    phone TEXT,
    address TEXT,
    status TEXT DEFAULT 'active',
    category TEXT,
    payment_terms TEXT,
    bank_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 4. 進銷存管理：各倉分區庫存 (warehouse_inventory)
CREATE TABLE IF NOT EXISTS public.warehouse_inventory (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER REFERENCES public.warehouses(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    stock INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    UNIQUE(warehouse_id, product_id)
);

-- 5. 進銷存管理：進出貨日誌 (inventory_logs)
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_name TEXT NOT NULL,
    category TEXT DEFAULT '極萃系列',
    quantity INTEGER NOT NULL,
    unit_cost NUMERIC(10, 2) DEFAULT 0,
    supplier TEXT,
    type TEXT NOT NULL, -- 'inbound', 'outbound', 'stock_check'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 6. 開放權限
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on warehouses" ON public.warehouses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on warehouse_inventory" ON public.warehouse_inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on inventory_logs" ON public.inventory_logs FOR ALL USING (true) WITH CHECK (true);
