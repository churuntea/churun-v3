-- ==========================================
-- 初潤製茶所 資料庫 RLS 權限收緊建議
-- ==========================================

-- [🚨 安全隱患說明]
-- 目前 `database_schema.sql` 中對 `members` 表的 RLS 政策設定為全開：
--   CREATE POLICY "Allow public update access on members" ON public.members FOR UPDATE USING (true);
-- 這代表任何知道前端 Anon Key 的人，都可以任意修改資料庫中所有人的資料。
--
-- 由於系統目前混合了「自訂登入 (存 localStorage)」與「第三方登入」，
-- 在未使用 Supabase Auth 作為統一 Session 管理前，資料庫無法辨識「是誰在發送請求」。
--
-- 以下提供兩種修復方案，請評估後採用：

-- ------------------------------------------
-- 方案 A：最安全方案 (完全關閉前端直接修改權限)
-- ------------------------------------------
-- [做法] 關閉 public 的 UPDATE 權限，所有資料修改一律透過後端 API (使用 supabaseAdmin) 執行。
-- [風險] 目前前端有直接調用 `supabase.from('members').update()` 的地方（例如 `login/page.tsx` 記錄最後登入時間）將會失效，必須改寫為呼叫後端 API。

/*
-- 1. 刪除原本全開的政策
DROP POLICY IF EXISTS "Allow public update access on members" ON public.members;

-- 2. 關閉 public update (USING false 代表一般用戶完全無法修改)
CREATE POLICY "Allow update only via service role" ON public.members 
FOR UPDATE 
USING (false)
WITH CHECK (false);
*/

-- ------------------------------------------
-- 方案 B：中庸方案 (當系統全面改用 Supabase Auth 時)
-- ------------------------------------------
-- [做法] 當用戶登入後，Supabase 會核發 JWT，此時可使用 `auth.uid()` 進行比對。

/*
-- 1. 刪除原本全開的政策
DROP POLICY IF EXISTS "Allow public update access on members" ON public.members;

-- 2. 限制用戶只能修改自己的資料
CREATE POLICY "Allow authenticated update on members" ON public.members 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
*/

-- ------------------------------------------
-- 💡 建議立即執行的最小安全補強 (針對產品表)
-- ------------------------------------------
-- 目前產品表 (products) 也是 public 任意讀寫，建議關閉 insert/update/delete，僅保留 select。
-- 產品的建立與修改應由管理後台或後端 API 執行。

-- 1. 刪除原本全開的政策
DROP POLICY IF EXISTS "Allow public insert access on products" ON public.products;
DROP POLICY IF EXISTS "Allow public update access on products" ON public.products;

-- 2. 設定僅允許讀取
-- (若無其他 insert/update 政策，預設即為拒絕，僅保留 SELECT)
