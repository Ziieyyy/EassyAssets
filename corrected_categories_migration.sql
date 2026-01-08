-- Corrected Categories Migration Script for Supabase SQL Editor

-- 1. Create the categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. Add unique index for user-specific category names (corrected syntax)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_category_name ON public.categories (user_id, LOWER(name));

-- 3. Enable Row Level Security (RLS) for categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for categories table (user-specific access)
CREATE POLICY "Users can view their own categories" ON public.categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON public.categories
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Add category_id column to assets table if it doesn't exist
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assets_category_id ON public.assets(category_id);
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS categories_name_idx ON public.categories(name);
CREATE INDEX IF NOT EXISTS categories_is_active_idx ON public.categories(is_active);

-- 7. Migrate existing categories to the new categories table and link to assets
-- First, create categories for existing category names
INSERT INTO categories (user_id, name, is_active)
SELECT DISTINCT a.user_id, a.category, TRUE
FROM assets a
WHERE a.category IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM categories c 
    WHERE c.user_id = a.user_id 
      AND LOWER(c.name) = LOWER(a.category)
  )
ON CONFLICT ON CONSTRAINT idx_unique_user_category_name DO NOTHING;

-- 8. Update assets to use category_id based on their category field
UPDATE assets 
SET category_id = (
    SELECT c.id 
    FROM categories c 
    WHERE c.user_id = assets.user_id 
      AND LOWER(c.name) = LOWER(assets.category)
)
WHERE category IS NOT NULL 
  AND category_id IS NULL;

-- 9. Update the assets table to make category optional (since we're now using category_id)
-- This is a comment since we don't want to drop the column, just acknowledge the dual system
-- In future, you may want to drop the old category column after confirming everything works