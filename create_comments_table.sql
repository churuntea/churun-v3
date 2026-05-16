-- 請在 Supabase Dashboard 的 SQL Editor 中執行以下 SQL 語句

CREATE TABLE IF NOT EXISTS public.product_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 啟用 RLS
ALTER TABLE public.product_comments ENABLE ROW LEVEL SECURITY;

-- 設定權限 (比照專案現有風格，開放讀寫)
DROP POLICY IF EXISTS "Allow public select access on product_comments" ON public.product_comments;
DROP POLICY IF EXISTS "Allow public insert access on product_comments" ON public.product_comments;

CREATE POLICY "Allow public select access on product_comments" ON public.product_comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on product_comments" ON public.product_comments FOR INSERT WITH CHECK (true);
