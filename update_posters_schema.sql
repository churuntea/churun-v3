-- 請將以下指令複製並貼到您的 Supabase Dashboard -> SQL Editor 中執行：

-- 新增海報分類欄位，預設為 '茶葉'
ALTER TABLE public.poster_templates ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '茶葉';
