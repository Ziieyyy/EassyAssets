-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Add unique constraint for user-specific category names
ALTER TABLE public.categories ADD CONSTRAINT unique_user_category_name UNIQUE (user_id, LOWER(name));

-- Enable Row Level Security (RLS) for categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories table (user-specific access)
CREATE POLICY "Users can view their own categories" ON public.categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON public.categories
    FOR DELETE USING (auth.uid() = user_id);

-- Add category_id column to assets table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'category_id') THEN
        ALTER TABLE public.assets ADD COLUMN category_id UUID REFERENCES public.categories(id);
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_assets_category_id') THEN
        ALTER TABLE public.assets ADD CONSTRAINT fk_assets_category_id FOREIGN KEY (category_id) REFERENCES public.categories(id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assets_category_id ON public.assets(category_id);
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS categories_name_idx ON public.categories(name);
CREATE INDEX IF NOT EXISTS categories_is_active_idx ON public.categories(is_active);

-- Update existing assets to link to categories based on their category field
-- This creates categories for existing category names and links them to assets
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
ON CONFLICT (user_id, LOWER(name)) DO NOTHING;

-- Update assets to use category_id based on their category field
UPDATE assets 
SET category_id = (
    SELECT c.id 
    FROM categories c 
    WHERE c.user_id = assets.user_id 
      AND LOWER(c.name) = LOWER(assets.category)
)
WHERE category IS NOT NULL 
  AND category_id IS NULL;

-- Create a helper function to update assets with category_id
CREATE OR REPLACE FUNCTION update_asset_with_category_id(p_asset_id TEXT, p_category_name TEXT)
RETURNS VOID AS $$
DECLARE
    v_category_id UUID;
BEGIN
    -- Get or create the category
    SELECT id INTO v_category_id
    FROM categories
    WHERE user_id = (SELECT user_id FROM assets WHERE id = p_asset_id)
      AND LOWER(name) = LOWER(p_category_name);
    
    IF v_category_id IS NULL THEN
        -- Create the category if it doesn't exist
        INSERT INTO categories (user_id, name, is_active)
        VALUES (
            (SELECT user_id FROM assets WHERE id = p_asset_id),
            p_category_name,
            TRUE
        )
        RETURNING id INTO v_category_id;
    END IF;
    
    -- Update the asset with the category_id
    UPDATE assets
    SET category_id = v_category_id
    WHERE id = p_asset_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to handle asset updates with category
CREATE OR REPLACE FUNCTION update_asset_with_category(p_id TEXT, p_updates JSONB)
RETURNS TABLE(result JSONB) AS $$
DECLARE
    v_user_id UUID;
    v_category_id UUID := NULL;
    v_category_name TEXT := NULL;
BEGIN
    -- Get the user_id for this asset
    SELECT user_id INTO v_user_id FROM assets WHERE id = p_id;
    
    -- Extract category name if provided in the update
    IF p_updates ? 'category' AND p_updates->>'category' IS NOT NULL THEN
        v_category_name := p_updates->>'category';
        
        -- Get or create the category
        SELECT id INTO v_category_id
        FROM categories
        WHERE user_id = v_user_id
          AND LOWER(name) = LOWER(v_category_name);
        
        IF v_category_id IS NULL THEN
            -- Create the category if it doesn't exist
            INSERT INTO categories (user_id, name, is_active)
            VALUES (v_user_id, v_category_name, TRUE)
            RETURNING id INTO v_category_id;
        END IF;
        
        -- Update the JSONB to use category_id instead of category
        p_updates := p_updates || jsonb_build_object('category_id', v_category_id::text);
        p_updates := p_updates - 'category'; -- Remove the old category field
    END IF;
    
    -- Perform the actual update
    EXECUTE 'UPDATE assets SET ' || 
            array_to_string(
                ARRAY(SELECT quote_ident(key) || '=' || quote_nullable(value)
                      FROM jsonb_each(p_updates) 
                      WHERE key != 'id'),
                ','
            ) || ' WHERE id=$1'
    USING p_id;
    
    -- Return the updated record
    RETURN QUERY SELECT row_to_json(t)::jsonb FROM (SELECT * FROM assets WHERE id = p_id) t;
END;
$$ LANGUAGE plpgsql;

-- Create a function to handle asset creation with category
CREATE OR REPLACE FUNCTION create_asset_with_category(p_asset_data JSONB)
RETURNS TABLE(result JSONB) AS $$
DECLARE
    v_user_id UUID;
    v_category_id UUID := NULL;
    v_category_name TEXT := NULL;
    v_company_id UUID := NULL;
    v_new_asset_id TEXT;
BEGIN
    -- Extract user_id from the data
    v_user_id := (p_asset_data->>'user_id')::UUID;
    
    -- Extract company_id if provided
    IF p_asset_data ? 'company_id' AND p_asset_data->>'company_id' IS NOT NULL THEN
        v_company_id := (p_asset_data->>'company_id')::UUID;
    ELSE
        -- Get user's company_id from profile
        SELECT company_id INTO v_company_id
        FROM user_profiles
        WHERE id = v_user_id;
    END IF;
    
    -- Extract category name if provided
    IF p_asset_data ? 'category' AND p_asset_data->>'category' IS NOT NULL THEN
        v_category_name := p_asset_data->>'category';
        
        -- Get or create the category
        SELECT id INTO v_category_id
        FROM categories
        WHERE user_id = v_user_id
          AND LOWER(name) = LOWER(v_category_name);
        
        IF v_category_id IS NULL THEN
            -- Create the category if it doesn't exist
            INSERT INTO categories (user_id, name, is_active)
            VALUES (v_user_id, v_category_name, TRUE)
            RETURNING id INTO v_category_id;
        END IF;
    END IF;
    
    -- Build the asset data with category_id instead of category
    p_asset_data := p_asset_data || jsonb_build_object('category_id', v_category_id::text);
    p_asset_data := p_asset_data - 'category'; -- Remove the old category field
    
    -- Add user_id and company_id to the data
    p_asset_data := p_asset_data || jsonb_build_object('user_id', v_user_id::text);
    IF v_company_id IS NOT NULL THEN
        p_asset_data := p_asset_data || jsonb_build_object('company_id', v_company_id::text);
    END IF;
    
    -- Insert the asset
    EXECUTE 'INSERT INTO assets (' || 
            array_to_string(ARRAY(SELECT quote_ident(key) FROM jsonb_object_keys(p_asset_data)), ',') ||
            ') VALUES (' ||
            array_to_string(
                ARRAY(SELECT '$' || (n+1)::text 
                      FROM jsonb_each(p_asset_data) WITH ORDINALITY AS t(key, value, n)),
                ','
            ) ||
            ') RETURNING id' 
    INTO v_new_asset_id
    USING VARIADIC (SELECT array_agg(value) FROM jsonb_array_elements_text(p_asset_data->(SELECT key FROM jsonb_each(p_asset_data) LIMIT 1)));
    
    -- Return the created record
    RETURN QUERY SELECT row_to_json(t)::jsonb FROM (SELECT * FROM assets WHERE id = v_new_asset_id) t;
END;
$$ LANGUAGE plpgsql;