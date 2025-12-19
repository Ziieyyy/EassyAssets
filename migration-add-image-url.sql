-- Migration: Add image_url column to assets table
-- Run this in your Supabase SQL Editor if you have an existing database

-- Add image_url column to assets table
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS image_url TEXT;

-- No additional indexes needed for image_url as it's just a URL storage
