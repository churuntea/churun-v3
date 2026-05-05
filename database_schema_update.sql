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
