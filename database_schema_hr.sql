-- ==========================================
-- 初潤製茶所 V2 數位系統 - 人事與系統權限授權資料表
-- ==========================================

CREATE TABLE IF NOT EXISTS public.hr_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id TEXT UNIQUE NOT NULL,                                   -- 員工編號 (如: CR_ST001)
    name TEXT NOT NULL,                                              -- 姓名
    phone TEXT NOT NULL,                                             -- 手機號碼 (用於授權比對)
    department TEXT NOT NULL,                                        -- 部門 (如: 財務部、營運部)
    title TEXT NOT NULL,                                             -- 職稱 (如: 經理、專員)
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

-- 預置一些擬真的人事種子資料
INSERT INTO public.hr_profiles (staff_id, name, phone, department, title, status, hire_date, permissions)
VALUES 
('CR_ST001', '陳總經理', '0912345678', '總經理室', '總經理', 'active', '2025-01-01', '{
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
('CR_ST002', '王副總', '0987654321', '營運部', '副總經理', 'active', '2025-02-15', '{
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
('CR_ST003', '張會計', '0911222333', '財務部', '財務主管', 'active', '2025-03-01', '{
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
