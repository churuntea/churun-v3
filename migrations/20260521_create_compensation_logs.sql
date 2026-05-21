-- Migration: Create compensation_logs table
-- Run this on your Postgres (Supabase) database to store compensation events for audit and recovery.

CREATE TABLE IF NOT EXISTS compensation_logs (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  order_id TEXT,
  order_number TEXT,
  member_id TEXT,
  error TEXT,
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_compensation_logs_order_id ON compensation_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_compensation_logs_processed ON compensation_logs(processed);
