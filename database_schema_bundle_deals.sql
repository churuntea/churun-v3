-- 建立組合套組優惠資料表
CREATE TABLE IF NOT EXISTS bundle_deals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    items JSONB NOT NULL,
    target_price NUMERIC NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    tier_restriction TEXT,
    limit_one_per_user BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 插入預設測試資料 (2組高山烏龍 + 1組帆布袋 = 799)
INSERT INTO bundle_deals (name, items, target_price, start_time, end_time, tier_restriction, limit_one_per_user)
VALUES (
    '兩組高山烏龍+一組帆布袋特惠',
    '[{"id": "9955531d-c7b2-4f7a-89fd-2cdf7bc97f29", "quantity": 2}, {"id": "ddd0cf47-63ef-4be0-8ab9-490391819895", "quantity": 1}]',
    799,
    '2026-05-19T00:00:00Z',
    '2026-12-31T23:59:59Z',
    '初潤寶寶',
    true
);
