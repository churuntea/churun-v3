-- 在 Supabase SQL Editor 中執行此指令以建立 inventory_logs 表格
CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10, 2),
    supplier TEXT,
    type TEXT NOT NULL CHECK (type IN ('inbound', 'stock_check', 'outbound', 'adjustment')),
    status TEXT DEFAULT '已完成',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引以優化查詢效能
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_name ON inventory_logs(product_name);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_type ON inventory_logs(type);
