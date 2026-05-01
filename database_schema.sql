-- ==========================================
-- 初潤製茶所 V2 數位系統 - Supabase 資料庫綱要
-- ==========================================

DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.point_transactions CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;

-- 1. 會員資料表 (Members)
CREATE TABLE public.members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    upline_id UUID REFERENCES public.members(id) ON DELETE SET NULL, 
    name TEXT NOT NULL,                                              
    phone TEXT UNIQUE NOT NULL,                                      
    tier TEXT DEFAULT '初潤寶寶' NOT NULL,                             -- 八階會員制度 (初潤寶寶...初潤靈魂伴侶)
    referral_code TEXT UNIQUE NOT NULL,                              
    member_code TEXT UNIQUE,                                         -- 內部管理 UID (CR26M040001)
    status TEXT DEFAULT 'active' NOT NULL,                           -- 帳號狀態 (active, exit_pending, exited)
    is_b2b BOOLEAN DEFAULT false NOT NULL,                           -- 是否為 B2B 創業夥伴
    points_balance INTEGER DEFAULT 0 NOT NULL,                       -- B2C 積分餘額
    virtual_balance NUMERIC(10, 2) DEFAULT 0 NOT NULL,               -- B2B 虛擬帳戶預收款餘額
    initial_deposit NUMERIC(10, 2) DEFAULT 0 NOT NULL,               -- B2B 初始儲值額 (用於 30% 鎖倉判定)
    lifetime_spend NUMERIC(10, 2) DEFAULT 0 NOT NULL,                -- 終身累積消費 (用於升級初潤青少年以下)
    quarterly_spend NUMERIC(10, 2) DEFAULT 0 NOT NULL,               -- 當季累積消費 (用於升級初潤好朋友以上)
    referral_count INTEGER DEFAULT 0 NOT NULL,                       -- 有效推薦人數 (人頭抵扣機制)
    bank_code TEXT,                                                  -- 綁定銀行代碼
    bank_account TEXT,                                               -- 綁定銀行帳號
    email TEXT,                                                      -- 電子信箱
    id_card_number TEXT,                                             -- 身分證字號 (報稅/身分核實用)
    address TEXT,                                                    -- 通訊地址 (預設收件)
    line_id TEXT,                                                    -- LINE ID (聯絡/社群用)
    beneficiary TEXT,                                                -- 法定繼承人/受益人 (直銷世襲用)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

COMMENT ON TABLE public.members IS '會員與組織關係表 (V2 混合型)';
COMMENT ON COLUMN public.members.tier IS '八階會員等級';

-- 2. 訂單資料表 (Orders)
CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES public.members(id) ON DELETE RESTRICT NOT NULL, 
    total_amount NUMERIC(10, 2) NOT NULL,                                     -- 實際結帳總金額
    original_amount NUMERIC(10, 2) NOT NULL,                                  -- 原價總金額 (用於計算退傭)
    status TEXT DEFAULT 'pending' NOT NULL,                                   
    paid_at TIMESTAMP WITH TIME ZONE,                                         
    completed_at TIMESTAMP WITH TIME ZONE,                                    
    custom_logo_url TEXT,                                                     -- 300盒客製化 LOGO 或備註
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

COMMENT ON TABLE public.orders IS '訂單表';

-- 3. 積分交易紀錄 (Point Transactions) - B2C 專用
CREATE TABLE public.point_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,                                                  -- 正數為獲得，負數為消耗
    transaction_type TEXT NOT NULL,                                           -- 'earned_from_order', 'redeemed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

COMMENT ON TABLE public.point_transactions IS 'B2C 積分獲得與消耗紀錄';

-- 4. 虛擬帳戶交易紀錄 (Wallet Transactions) - B2B 專用
CREATE TABLE public.wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,                                           -- 正數為入帳(儲值/退傭)，負數為扣款
    transaction_type TEXT NOT NULL,                                           -- 'deposit'(儲值), 'order_deduction'(下單扣款), 'commission_refund'(自動退傭), 'withdrawal'(提領)
    status TEXT DEFAULT 'completed' NOT NULL,                                 -- 'pending' (尚未結算), 'completed' (已結算匯款)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

COMMENT ON TABLE public.wallet_transactions IS 'B2B 創業夥伴虛擬帳戶進出明細與退傭紀錄';

-- ==========================================
-- RLS 政策設定
-- ==========================================
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on members" ON public.members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on members" ON public.members FOR UPDATE USING (true);

-- 6. 商品 (Products)
DROP TABLE IF EXISTS products;
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,                                              -- 品名
    original_price INTEGER,                                          -- 售價 (原價)
    price INTEGER NOT NULL,                                          -- 嘗鮮價 (實際結帳價)
    image_url TEXT,                                                  -- 商品照片 (Base64 或 URL)
    creator TEXT,                                                    -- 建檔者
    b2c_reward_percent INTEGER DEFAULT 0 NOT NULL,                   -- B2C 消費回饋點數比例 (%)
    b2b_commission_percent INTEGER DEFAULT 0 NOT NULL,               -- B2B 創業夥伴直推退傭比例 (%)
    status TEXT DEFAULT 'active',                                    -- 狀態 (active / inactive)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 設定 Products 的 RLS (全部開放讀寫，以利測試環境快速建立)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select access on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow public read access on orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public read access on point_transactions" ON public.point_transactions FOR SELECT USING (true);
CREATE POLICY "Allow public read access on wallet_transactions" ON public.wallet_transactions FOR SELECT USING (true);
