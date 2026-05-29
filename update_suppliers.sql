-- 修復供應商表 (suppliers) 缺少欄位的問題
-- 這些欄位是前端表單在儲存時會送出的資料，如果資料庫沒有這些欄位就會引發 Content-Type not acceptable (400 Bad Request) 錯誤。

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS supplied_items JSONB DEFAULT '[]'::jsonb;
