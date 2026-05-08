-- ==========================================
-- 初潤製茶所 V2 - 補齊缺失的資料表
-- ==========================================

-- 1. 訂單明細 (Order Items)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. 系統通知 (Notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 3. 品牌快訊 (Announcements)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    tag TEXT DEFAULT 'NEW' NOT NULL,
    content TEXT,
    color TEXT DEFAULT 'bg-emerald-900' NOT NULL,
    image_url TEXT,
    action_label TEXT,
    action_href TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 4. 宣傳素材 (Materials)
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- '品牌主視覺', '商品宣傳圖', '社群分享文案'
    url TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'image', 'video', 'pdf', 'text'
    thumbnail_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 開放 RLS (測試環境)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);

-- 5. 擴充訂單表以記錄預計發放的點數與退傭
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS b2b_commission NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS bank_last_five TEXT; -- 匯款帳號末五碼（選填）
-- 10. 會員大頭貼與個人化設定功能
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS avatar_settings JSONB DEFAULT '{"zoom": 1, "offset": 0}'::jsonb;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS motto TEXT DEFAULT '以初心、致潤澤';
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS bank_branch TEXT;

-- 11. 海報產生器樣板 (Poster Templates)
CREATE TABLE IF NOT EXISTS public.poster_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{
        "qr": {"x": 800, "y": 1100, "size": 160},
        "name": {"x": 380, "y": 1120, "size": 28, "color": "#ffffff"},
        "phone": {"x": 380, "y": 1155, "size": 24, "color": "#ffffff"}
    }'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.poster_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on poster_templates" ON public.poster_templates FOR ALL USING (true) WITH CHECK (true);

-- 預置一個預設樣板 (即原本的 DM)
INSERT INTO public.poster_templates (name, url, config)
VALUES (
    '尊榮禮盒系列', 
    'https://i.ibb.co/Vp8nF6Y/dm-template.jpg', 
    '{"qr": {"x": 800, "y": 1100, "size": 160}, "name": {"x": 380, "y": 1120, "size": 28, "color": "#ffffff"}, "phone": {"x": 380, "y": 1155, "size": 24, "color": "#ffffff"}}'::jsonb
) ON CONFLICT DO NOTHING;

-- 12. 擴充商品資料表以支援商品特色描述欄位 (Product Description)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
