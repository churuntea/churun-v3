-- scripts/create_ambassador_table.sql

-- Create table to store brand ambassador applications
CREATE TABLE IF NOT EXISTS ambassador_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  apply_date timestamp with time zone DEFAULT now() NOT NULL,
  amount_paid numeric NOT NULL,
  duration_months integer NOT NULL,
  status varchar(20) DEFAULT 'pending' NOT NULL,
  -- optional fields for admin review
  reviewer_id uuid,
  reviewed_at timestamp with time zone,
  remarks text
);

-- Index for quick lookup by member_id
CREATE INDEX IF NOT EXISTS idx_ambassador_member ON ambassador_applications (member_id);
