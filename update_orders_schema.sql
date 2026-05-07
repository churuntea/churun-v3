-- 請將以下指令複製並貼到您的 Supabase Dashboard -> SQL Editor 中執行：

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'unfulfilled';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
