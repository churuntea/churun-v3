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

-- 5. 品牌快訊 (Announcements)
INSERT INTO public.announcements (title, tag, content, color, image_url, action_label, action_href)
VALUES
  ('2026 春季限定：初潤靈魂系列新品上市', 'NEW', '我們很高興宣布全新的春季限定茶飲正式登場。', 'bg-emerald-900', 'https://images.unsplash.com/photo-1594631252845-29fc458631b6?w=800&q=80', '查看詳情', '/brand/news/spring-2026'),
  ('全台夥伴大會：台中場報名開始', 'EVENT', '今年度的全台夥伴大會將於下個月在台中舉辦，歡迎各位領導人報名參加。', 'bg-indigo-600', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80', '立即報名', '/events/taichung-2026'),
  ('系統升級公告：V2.0 版本正式上線', 'INFO', '為了提供更好的服務，初潤數位管理系統已升級至 V2.0 版本。', 'bg-amber-600', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', '更新日誌', '/support/changelog');

-- 6. 宣傳素材 (Materials)
INSERT INTO public.materials (title, category, url, file_type, thumbnail_url, description)
VALUES
  ('品牌主視覺 - 2026 簡潔款', '品牌主視覺', 'https://images.unsplash.com/photo-1544787210-2213d2429f77?w=1200&q=80', 'image', 'https://images.unsplash.com/photo-1544787210-2213d2429f77?w=400&q=80', '適用於 Facebook 與 Instagram 封面'),
  ('春季新品宣傳圖 (1)', '商品宣傳圖', 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=1200&q=80', 'image', 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&q=80', '2026 春季限定飲品宣傳圖'),
  ('創業夥伴招募文案', '社群分享文案', 'https://churun.com/copywriting/b2b-recruit', 'text', NULL, '加入初潤，開啟您的創業之路。我們提供完整的教育訓練與優渥的分潤制度。#初潤製茶所 #創業夥伴 #茶文化');

-- 7. 海報產生器樣板 (Poster Templates)
INSERT INTO public.poster_templates (name, url, config)
VALUES 
  ('尊榮禮盒系列', 'https://i.ibb.co/Vp8nF6Y/dm-template.jpg', '{"qr": {"x": 800, "y": 1100, "size": 160}, "name": {"x": 380, "y": 1120, "size": 28, "color": "#ffffff"}, "phone": {"x": 380, "y": 1155, "size": 24, "color": "#ffffff"}}'::jsonb),
  ('春季新品清新版', 'https://images.unsplash.com/photo-1556656793-062ff987b50d?w=1080&q=80', '{"qr": {"x": 750, "y": 1500, "size": 200}, "name": {"x": 100, "y": 1520, "size": 32, "color": "#1e293b"}, "phone": {"x": 100, "y": 1565, "size": 28, "color": "#64748b"}}'::jsonb);

