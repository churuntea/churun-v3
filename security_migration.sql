-- ==========================================
-- 初潤製茶所 V2 資安防護升級 (Security Hardening)
-- 請在 Supabase SQL Editor 中執行此腳本
-- ==========================================

-- 1. 關閉所有資料表的公共讀寫權限 (移除危險的 USING(true))
DROP POLICY IF EXISTS "Allow public read access on members" ON public.members;
DROP POLICY IF EXISTS "Allow public insert access on members" ON public.members;
DROP POLICY IF EXISTS "Allow public update access on members" ON public.members;

DROP POLICY IF EXISTS "Allow public select access on products" ON public.products;
DROP POLICY IF EXISTS "Allow public insert access on products" ON public.products;
DROP POLICY IF EXISTS "Allow public update access on products" ON public.products;

DROP POLICY IF EXISTS "Allow public read access on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public read access on point_transactions" ON public.point_transactions;
DROP POLICY IF EXISTS "Allow public read access on wallet_transactions" ON public.wallet_transactions;

DROP POLICY IF EXISTS "Allow public read access on order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public insert access on order_items" ON public.order_items;

DROP POLICY IF EXISTS "Allow public read access on announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow public insert access on announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow public update access on announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow public delete access on announcements" ON public.announcements;

-- 2. 建立原子操作 RPC，解決紅利點數與錢包扣款的 Race Condition 漏洞
CREATE OR REPLACE FUNCTION secure_deduct_points(member_uuid UUID, deduct_amount INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance INT;
BEGIN
    -- 鎖定該行資料以防止併發修改 (FOR UPDATE)
    SELECT points_balance INTO current_balance 
    FROM public.members 
    WHERE id = member_uuid 
    FOR UPDATE;

    IF current_balance >= deduct_amount THEN
        UPDATE public.members 
        SET points_balance = points_balance - deduct_amount 
        WHERE id = member_uuid;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION secure_deduct_wallet(member_uuid UUID, deduct_amount NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance NUMERIC;
BEGIN
    SELECT virtual_balance INTO current_balance 
    FROM public.members 
    WHERE id = member_uuid 
    FOR UPDATE;

    IF current_balance >= deduct_amount THEN
        UPDATE public.members 
        SET virtual_balance = virtual_balance - deduct_amount 
        WHERE id = member_uuid;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;
