-- ==========================================
-- 初潤製茶所 V2 系統 - 測試假資料 (Dummy Data)
-- ==========================================

-- 1. 插入會員 (使用固定的 UUID 以便建立層級關聯)
INSERT INTO public.members (id, upline_id, name, phone, tier, referral_code, is_b2b, points_balance, virtual_balance, initial_deposit, lifetime_spend, quarterly_spend, referral_count, created_at)
VALUES
  -- B2B 總經銷
  ('11111111-1111-1111-1111-111111111111', NULL, '初潤總公司', '0900000000', '初潤靈魂伴侶', 'BOSS001', true, 0, 999999, 999999, 999999, 999999, 100, NOW() - INTERVAL '30 days'),
  
  -- B2B 創業夥伴 (王大明) - 初始儲值 50,000，目前有預收款 14,000 (低於 30% 即 15,000 會觸發鎖倉)
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '王大明(創業夥伴)', '0911111111', '初潤知己', 'WANG168', true, 500, 14000, 50000, 20000, 8000, 2, NOW() - INTERVAL '20 days'),
  
  -- B2C 一般消費者 (陳小華) - 已經是初潤青少年 (累積消費 > 3000)
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '陳小華(一般消費者)', '0922222222', '初潤青少年', 'CHEN888', false, 150, 0, 0, 4500, 1500, 0, NOW() - INTERVAL '10 days'),

  -- B2C 新註冊用戶 (林小美) - 剛註冊的初潤寶寶
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', '林小美(新註冊)', '0933333333', '初潤寶寶', 'LIN999', false, 0, 0, 0, 0, 0, 0, NOW() - INTERVAL '1 days');

-- 2. 插入歷史訂單
INSERT INTO public.orders (id, member_id, total_amount, original_amount, status, paid_at, completed_at, created_at)
VALUES
  -- 陳小華的歷史購買紀錄 (花了 4500)
  ('aaaa1111-aaaa-1111-aaaa-1111aaaa1111', '33333333-3333-3333-3333-333333333333', 4500, 4500, 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '10 days');

-- 3. 插入積分交易紀錄 (陳小華消費 4500，假設當時是初潤寶寶 100元=1點，獲得 45 點)
INSERT INTO public.point_transactions (id, member_id, order_id, amount, transaction_type, created_at)
VALUES
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'aaaa1111-aaaa-1111-aaaa-1111aaaa1111', 45, 'earned_from_order', NOW() - INTERVAL '10 days'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', NULL, 105, 'system_adjustment', NOW() - INTERVAL '2 days'); -- 系統贈送的點數，讓餘額變 150

-- 4. 插入虛擬帳戶交易紀錄 (王大明)
INSERT INTO public.wallet_transactions (id, member_id, order_id, amount, transaction_type, status, created_at)
VALUES
  -- 初始儲值
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', NULL, 50000, 'deposit', 'completed', NOW() - INTERVAL '20 days');

