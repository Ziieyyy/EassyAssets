-- Add status_notes and status_date columns to assets table
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS status_notes TEXT,
ADD COLUMN IF NOT EXISTS status_date DATE;