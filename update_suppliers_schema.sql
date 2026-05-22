-- ==========================================
-- 初潤製茶所 V3 - 供應商資料表擴充欄位 (優化提案)
-- ==========================================

-- 增加狀態欄位
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 增加廠商分類欄位 (原料商, 包材商, 設備商, 物流商 等)
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS category TEXT;

-- 增加結帳方式欄位
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS payment_terms TEXT;

-- 增加匯款帳號資訊
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS bank_info TEXT;
