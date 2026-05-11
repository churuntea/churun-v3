-- ==========================================
-- 初潤製茶所 V2 數位系統 - 人事、自訂密碼與系統軌跡審計資料表
-- ==========================================

-- 1. 職員人事與自訂密碼資料表
CREATE TABLE IF NOT EXISTS public.hr_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id TEXT UNIQUE NOT NULL,                                   -- 員工編號 (如: CR_ST001)
    name TEXT NOT NULL,                                              -- 姓名
    phone TEXT NOT NULL,                                             -- 手機號碼 (用於授權比對)
    department TEXT NOT NULL,                                        -- 部門 (如: 財務部、營運部)
    title TEXT NOT NULL,                                             -- 職稱 (如: 經理、專員)
    password TEXT DEFAULT 'admin123' NOT NULL,                       -- 職員自定義登入密碼 (預設值為 admin123)
    status TEXT DEFAULT 'active' NOT NULL,                           -- 在職狀態 (active: 在職 / suspended: 停權 / left: 離職)
    hire_date DATE DEFAULT CURRENT_DATE NOT NULL,                    -- 入職日期
    permissions JSONB NOT NULL DEFAULT '{
        "coupons": false,
        "posters": false,
        "members": false,
        "evaluation": false,
        "orders": false,
        "settlement": false,
        "products": false,
        "backup": false,
        "withdrawals": false
    }'::jsonb,                                                       -- 系統模組授權清單
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 啟用 RLS (Row Level Security)
ALTER TABLE public.hr_profiles ENABLE ROW LEVEL SECURITY;

-- 建立測試環境完全讀寫權限 RLS 政策
DROP POLICY IF EXISTS "Allow public select access on hr_profiles" ON public.hr_profiles;
DROP POLICY IF EXISTS "Allow public insert access on hr_profiles" ON public.hr_profiles;
DROP POLICY IF EXISTS "Allow public update access on hr_profiles" ON public.hr_profiles;
DROP POLICY IF EXISTS "Allow public delete access on hr_profiles" ON public.hr_profiles;

CREATE POLICY "Allow public select access on hr_profiles" ON public.hr_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on hr_profiles" ON public.hr_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on hr_profiles" ON public.hr_profiles FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on hr_profiles" ON public.hr_profiles FOR DELETE USING (true);


-- 2. 系統使用軌跡審計日誌資料表 (僅限總經理開放權限)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id TEXT NOT NULL,                                          -- 員工工號
    name TEXT NOT NULL,                                              -- 員工姓名
    department TEXT NOT NULL,                                        -- 部門
    title TEXT NOT NULL,                                             -- 職稱 (可用於驗證總經理)
    login_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL, -- 登入時間
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL, -- 最後活動時間
    duration INTEGER DEFAULT 0 NOT NULL,                            -- 使用系統時長 (單位: 秒)
    features_accessed JSONB NOT NULL DEFAULT '[]'::jsonb,            -- 訪問/點擊過哪些系統功能模組 (如: ["商品管理", "全體階級考核"])
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 啟用 RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 建立讀寫 RLS 政策
DROP POLICY IF EXISTS "Allow public select access on admin_audit_logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Allow public insert access on admin_audit_logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Allow public update access on admin_audit_logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Allow public delete access on admin_audit_logs" ON public.admin_audit_logs;

CREATE POLICY "Allow public select access on admin_audit_logs" ON public.admin_audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on admin_audit_logs" ON public.admin_audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on admin_audit_logs" ON public.admin_audit_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on admin_audit_logs" ON public.admin_audit_logs FOR DELETE USING (true);


-- 預置一些擬真的人事種子資料 (包含密碼)
INSERT INTO public.hr_profiles (staff_id, name, phone, department, title, password, status, hire_date, permissions)
VALUES 
('CR_ST001', '陳總經理', '0912345678', '總經理室', '總經理', 'admin123', 'active', '2025-01-01', '{
    "coupons": true,
    "posters": true,
    "members": true,
    "evaluation": true,
    "orders": true,
    "settlement": true,
    "products": true,
    "backup": true,
    "withdrawals": true
}'),
('CR_ST002', '王副總', '0987654321', '營運部', '副總經理', 'admin123', 'active', '2025-02-15', '{
    "coupons": true,
    "posters": true,
    "members": true,
    "evaluation": true,
    "orders": true,
    "settlement": false,
    "products": true,
    "backup": false,
    "withdrawals": true
}'),
('CR_ST003', '張會計', '0911222333', '財務部', '財務主管', 'admin123', 'active', '2025-03-01', '{
    "coupons": false,
    "posters": false,
    "members": true,
    "evaluation": false,
    "orders": false,
    "settlement": true,
    "products": false,
    "backup": false,
    "withdrawals": true
}')
ON CONFLICT (staff_id) DO NOTHING;
