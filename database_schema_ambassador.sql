-- ==========================================
-- 初潤製茶所 - 品牌大使申請系統 Migration
-- 2026-05-21 更新
-- ==========================================

-- 1. 更新 members 表：新增品牌大使相關欄位
ALTER TABLE public.members 
  ADD COLUMN IF NOT EXISTS ambassador_type TEXT DEFAULT NULL,     -- 'paid' 或 'free_performance'
  ADD COLUMN IF NOT EXISTS ambassador_since TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- 品牌大使起始日
  ADD COLUMN IF NOT EXISTS ambassador_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- 品牌大使到期日
  ADD COLUMN IF NOT EXISTS ambassador_status TEXT DEFAULT NULL;  -- 'active', 'expired', 'pending'

COMMENT ON COLUMN public.members.ambassador_type IS '品牌大使類型：paid=付費升級, free_performance=免費業績升級';
COMMENT ON COLUMN public.members.ambassador_since IS '品牌大使資格開始日期';
COMMENT ON COLUMN public.members.ambassador_expires_at IS '品牌大使資格到期日期';
COMMENT ON COLUMN public.members.ambassador_status IS '品牌大使狀態：active=有效, expired=已到期, pending=申請審核中';

-- 2. 建立品牌大使申請紀錄表
CREATE TABLE IF NOT EXISTS public.ambassador_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    application_type TEXT NOT NULL,                              -- 'paid'=付費申請($98,000), 'free'=業績免費升級
    amount NUMERIC(10, 2) DEFAULT 0,                            -- 申請金額（付費申請用）
    last_five TEXT,                                              -- 匯款帳號後五碼（付費申請用）
    remittance_photo TEXT,                                       -- 匯款水單照片（Base64）
    free_performance_total NUMERIC(10, 2) DEFAULT 0,            -- 申請當下的累積業績總額（免費升級用）
    status TEXT DEFAULT 'pending' NOT NULL,                     -- 'pending', 'approved', 'rejected'
    notes TEXT,                                                  -- 審核備註
    reviewed_by TEXT,                                            -- 審核人員
    reviewed_at TIMESTAMP WITH TIME ZONE,                        -- 審核時間
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

COMMENT ON TABLE public.ambassador_applications IS '品牌大使申請紀錄表';

-- 3. 建立 RLS 政策
ALTER TABLE public.ambassador_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on ambassador_applications" ON public.ambassador_applications FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on ambassador_applications" ON public.ambassador_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on ambassador_applications" ON public.ambassador_applications FOR UPDATE USING (true);

-- 4. 建立索引
CREATE INDEX IF NOT EXISTS idx_ambassador_applications_member_id ON public.ambassador_applications(member_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_applications_status ON public.ambassador_applications(status);
CREATE INDEX IF NOT EXISTS idx_members_ambassador_status ON public.members(ambassador_status);

-- 5. 更新現有的 member_code 說明：
-- 格式：CR + 年份後2碼 + 類型碼 + 月份2碼 + 流水號4碼
-- M = 一般會員  CR26M050001
-- A = 品牌大使  CR26A050001  
-- P = 合夥人    CR26P050001
COMMENT ON COLUMN public.members.member_code IS '會員編碼 V2: CR{YY}{類型}{MM}{流水號4碼}, M=會員, A=品牌大使, P=合夥人';

-- 完成提示
SELECT '✅ 品牌大使系統 Migration 完成！' AS status;
