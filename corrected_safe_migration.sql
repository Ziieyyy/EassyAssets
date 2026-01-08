-- Corrected Safe Categories Migration Script for Supabase SQL Editor

-- 1. Create the categories table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. Add unique index for user-specific category names (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_unique_user_category_name') THEN
        CREATE UNIQUE INDEX idx_unique_user_category_name ON public.categories (user_id, LOWER(name));
    END IF;
END $$;

-- 3. Enable Row Level Security (RLS) for categories table (only if not already enabled)
DO $$ 
BEGIN
    IF NOT (SELECT rowsecurity FROM pg_tables WHERE tablename = 'categories') THEN
        ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 4. Create policies for categories table only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Users can view their own categories') THEN
        CREATE POLICY "Users can view their own categories" ON public.categories
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Users can insert their own categories') THEN
        CREATE POLICY "Users can insert their own categories" ON public.categories
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Users can update their own categories') THEN
        CREATE POLICY "Users can update their own categories" ON public.categories
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Users can delete their own categories') THEN
        CREATE POLICY "Users can delete their own categories" ON public.categories
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Add category_id column to assets table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'category_id') THEN
        ALTER TABLE public.assets ADD COLUMN category_id UUID REFERENCES public.categories(id);
    END IF;
END $$;

-- 6. Create indexes for better performance (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assets_category_id') THEN
        CREATE INDEX idx_assets_category_id ON public.assets(category_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'categories_user_id_idx') THEN
        CREATE INDEX categories_user_id_idx ON public.categories(user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'categories_name_idx') THEN
        CREATE INDEX categories_name_idx ON public.categories(name);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'categories_is_active_idx') THEN
        CREATE INDEX categories_is_active_idx ON public.categories(is_active);
    END IF;
END $$;

-- 7. Migrate existing categories to the new categories table and link to assets
-- First, create categories for existing category names (avoiding conflicts)
-- Only process assets that have both a category and a user_id
INSERT INTO categories (user_id, name, is_active)
SELECT DISTINCT a.user_id, a.category, TRUE
FROM assets a
WHERE a.category IS NOT NULL
  AND a.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM categories c 
    WHERE c.user_id = a.user_id 
      AND LOWER(c.name) = LOWER(a.category)
  );

-- 8. Update assets to use category_id based on their category field
-- Only update assets that have both a category and a user_id
UPDATE assets 
SET category_id = (
    SELECT c.id 
    FROM categories c 
    WHERE c.user_id = assets.user_id 
      AND LOWER(c.name) = LOWER(assets.category)
)
WHERE category IS NOT NULL 
  AND user_id IS NOT NULL
  AND category_id IS NULL;

-- 9. Update the assets table to make category optional (since we're now using category_id)
-- This is a comment since we don't want to drop the column, just acknowledge the dual system
-- In future, you may want to drop the old category column after confirming everything works