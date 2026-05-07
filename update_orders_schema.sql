-- 請將以下指令複製並貼到您的 Supabase Dashboard -> SQL Editor 中執行：

-- 新增物流追蹤相關欄位
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'unfulfilled';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- 新增收件資訊欄位 (JSONB 格式儲存姓名、電話、地址、超商資訊等)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_info JSONB;
