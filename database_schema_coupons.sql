-- ==========================================
-- 初潤製茶所 - 優惠券系統資料表結構
-- 請在 Supabase 專案的 SQL Editor 中貼上並執行此腳本
-- ==========================================

-- 1. 建立優惠券定義表 (Coupons Library)
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,                       -- 優惠折扣碼 (英文大寫，如 WELCOME100, VIP50)
    name TEXT NOT NULL,                             -- 顯示名稱
    discount_type TEXT DEFAULT 'fixed' NOT NULL,    -- 折扣類型: 'fixed' (固定減免) 或 'percent' (比例打折)
    value NUMERIC(10, 2) NOT NULL,                  -- 折減值 (如果是固定則為減額如 100，如果是比例則為打折如 12 代表 12% off)
    min_spend NUMERIC(10, 2) DEFAULT 0 NOT NULL,    -- 最低消費限制金額
    description TEXT,                               -- 活動備註與說明
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. 建立會員個人券包 (Member Coupons Inventory)
CREATE TABLE IF NOT EXISTS public.member_coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL, -- 所屬會員
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL, -- 對應優惠券
    is_used BOOLEAN DEFAULT false NOT NULL,                                  -- 是否已使用
    used_at TIMESTAMP WITH TIME ZONE,                                        -- 使用時間
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 3. 開啟資料表之 RLS (安全控制模式)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_coupons ENABLE ROW LEVEL SECURITY;

-- 4. 建立 RLS 原則 (RLS Policies)
DROP POLICY IF EXISTS "Allow public read access on coupons" ON public.coupons;
CREATE POLICY "Allow public read access on coupons" ON public.coupons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access on coupons" ON public.coupons;
CREATE POLICY "Allow public insert access on coupons" ON public.coupons FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on coupons" ON public.coupons;
CREATE POLICY "Allow public update access on coupons" ON public.coupons FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access on coupons" ON public.coupons;
CREATE POLICY "Allow public delete access on coupons" ON public.coupons FOR DELETE USING (true);


DROP POLICY IF EXISTS "Allow public read access on member_coupons" ON public.member_coupons;
CREATE POLICY "Allow public read access on member_coupons" ON public.member_coupons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access on member_coupons" ON public.member_coupons;
CREATE POLICY "Allow public insert access on member_coupons" ON public.member_coupons FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on member_coupons" ON public.member_coupons;
CREATE POLICY "Allow public update access on member_coupons" ON public.member_coupons FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access on member_coupons" ON public.member_coupons;
CREATE POLICY "Allow public delete access on member_coupons" ON public.member_coupons FOR DELETE USING (true);

-- 5. 預置「新會員迎新折價券 (WELCOME100)」
INSERT INTO public.coupons (code, name, discount_type, value, min_spend, description)
VALUES ('WELCOME100', '新會員迎新折價券', 'fixed', 100.00, 500.00, '歡迎加入初潤！消費滿 $500 現折 $100')
ON CONFLICT (code) DO NOTHING;
