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

-- Create assets table
CREATE TABLE IF NOT EXISTS public.assets (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    name TEXT NOT NULL,
    category TEXT, -- Keep for backward compatibility
    category_id UUID REFERENCES public.categories(id), -- New foreign key
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive', 'disposed')),
    purchase_date DATE NOT NULL,
    purchase_price NUMERIC(10, 2) NOT NULL,
    current_value NUMERIC(10, 2) NOT NULL,
    assigned_to TEXT NOT NULL,
    assigned_invoice TEXT,
    description TEXT,
    serial_number TEXT,
    image_url TEXT,
    useful_life INTEGER,
    invoice_number TEXT,
    supplier_name TEXT,
    status_notes TEXT,
    status_date DATE
);

-- Create maintenance_tasks table
CREATE TABLE IF NOT EXISTS public.maintenance_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    asset_id TEXT NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    asset_name TEXT NOT NULL,
    task TEXT NOT NULL,
    due_date DATE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for assets table (user-specific access)
CREATE POLICY "Users can view their own assets" ON public.assets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets" ON public.assets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets" ON public.assets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets" ON public.assets
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for maintenance_tasks table (user-specific access)
CREATE POLICY "Users can view their own maintenance tasks" ON public.maintenance_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own maintenance tasks" ON public.maintenance_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own maintenance tasks" ON public.maintenance_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own maintenance tasks" ON public.maintenance_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS categories_name_idx ON public.categories(name);
CREATE INDEX IF NOT EXISTS categories_is_active_idx ON public.categories(is_active);

CREATE INDEX IF NOT EXISTS assets_user_id_idx ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS assets_category_idx ON public.assets(category);
CREATE INDEX IF NOT EXISTS assets_category_id_idx ON public.assets(category_id);
CREATE INDEX IF NOT EXISTS assets_status_idx ON public.assets(status);
CREATE INDEX IF NOT EXISTS assets_assigned_to_idx ON public.assets(assigned_to);
CREATE INDEX IF NOT EXISTS maintenance_tasks_user_id_idx ON public.maintenance_tasks(user_id);
CREATE INDEX IF NOT EXISTS maintenance_tasks_asset_id_idx ON public.maintenance_tasks(asset_id);
CREATE INDEX IF NOT EXISTS maintenance_tasks_due_date_idx ON public.maintenance_tasks(due_date);
CREATE INDEX IF NOT EXISTS maintenance_tasks_priority_idx ON public.maintenance_tasks(priority);

-- Note: Sample data removed. Each user will create their own assets.
