-- Migration: Add user_id column and update RLS policies for user-specific data separation
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.assets;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.assets;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.assets;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.assets;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.maintenance_tasks;

-- Step 2: Add user_id column to assets table
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Add user_id column to maintenance_tasks table
ALTER TABLE public.maintenance_tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 4: Update existing records (OPTIONAL - only if you have existing data you want to keep)
-- This sets all existing assets to the first user in your auth.users table
-- If you don't want to keep existing data, skip this step and delete the existing records manually
-- UPDATE public.assets SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
-- UPDATE public.maintenance_tasks SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- Step 5: Make user_id NOT NULL (after updating existing records)
-- ALTER TABLE public.assets ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.maintenance_tasks ALTER COLUMN user_id SET NOT NULL;

-- Step 6: Create new RLS policies for user-specific access
CREATE POLICY "Users can view their own assets" ON public.assets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets" ON public.assets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets" ON public.assets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets" ON public.assets
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own maintenance tasks" ON public.maintenance_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own maintenance tasks" ON public.maintenance_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own maintenance tasks" ON public.maintenance_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own maintenance tasks" ON public.maintenance_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS assets_user_id_idx ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS maintenance_tasks_user_id_idx ON public.maintenance_tasks(user_id);

-- Step 8: Clean up old sample data (OPTIONAL)
-- DELETE FROM public.maintenance_tasks;
-- DELETE FROM public.assets;
