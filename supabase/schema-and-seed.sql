--- ====================================================================
--- MYEASYASSETS - COMPLETE SUPABASE DATABASE SETUP & SEED SCRIPT
--- ====================================================================
--- This script contains all necessary table definitions, triggers,
--- functions, RLS security policies, performance indexes, and seed data
--- to restore a broken myEasyAssets Supabase instance from scratch.
--- Safe to run multiple times (idempotent).
--- ====================================================================

--- -------------------------------------------------------------
--- 1. EXTENSIONS
--- -------------------------------------------------------------
--- Enable pg_cron for keep-alive logs if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

--- -------------------------------------------------------------
--- 2. SCHEMAS AND CLEANUP
--- -------------------------------------------------------------
--- Drop existing views and tables in reverse dependency order
DROP VIEW IF EXISTS public.assets_with_details CASCADE;
DROP TABLE IF EXISTS public.system_status CASCADE;
DROP TABLE IF EXISTS public.keep_alive_logs CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.user_companies CASCADE;
DROP TABLE IF EXISTS public.maintenance_schedules CASCADE;
DROP TABLE IF EXISTS public.maintenance_tasks CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.depreciation_records CASCADE;
DROP TABLE IF EXISTS public.company_users CASCADE;
DROP TABLE IF EXISTS public.asset_disposals CASCADE;
DROP TABLE IF EXISTS public.asset_locations CASCADE;
DROP TABLE IF EXISTS public.asset_categories CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;


--- -------------------------------------------------------------
--- 3. TABLES DEFINITIONS (DEPENDENCY ORDER)
--- -------------------------------------------------------------

--- A. Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    address TEXT,
    default_currency TEXT DEFAULT 'USD'::text,
    default_depreciation_method TEXT DEFAULT 'straight_line'::text,
    default_useful_life INTEGER DEFAULT 5,
    default_salvage_value NUMERIC DEFAULT 0
);

--- B. User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

--- C. Categories Table (Personal & User-scoped)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

--- Add unique constraint to enforce user-specific unique category names
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_category_name') THEN
        ALTER TABLE public.categories ADD CONSTRAINT unique_user_category_name UNIQUE (user_id, name);
    END IF;
END $$;

--- D. Assets Table (Unified personal & company structure)
CREATE TABLE IF NOT EXISTS public.assets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    category TEXT, -- Kept for backward compatibility
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL, -- Dynamic category relation
    location TEXT,
    status TEXT DEFAULT 'active'::text CHECK (status IN ('active', 'maintenance', 'inactive', 'disposed')),
    purchase_date DATE,
    purchase_price NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    current_value NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    assigned_to TEXT,
    assigned_invoice TEXT,
    description TEXT,
    serial_number TEXT,
    image_url TEXT,
    warranty_image TEXT,
    useful_life INTEGER DEFAULT 5,
    salvage_value NUMERIC(15, 2) DEFAULT 0.00,
    depreciation_method TEXT DEFAULT 'straight_line'::text CHECK (depreciation_method IN ('straight_line', 'declining_balance', 'sum_of_years_digits')),
    invoice_number TEXT,
    supplier_name TEXT,
    status_notes TEXT,
    status_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

COMMENT ON COLUMN public.assets.useful_life IS 'Useful life in years for depreciation calculation. 0 means infinite (no depreciation).';

--- E. Asset Categories Table (Legacy/Alternative table from clean-seed)
CREATE TABLE IF NOT EXISTS public.asset_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    default_depreciation_method TEXT,
    default_useful_life INTEGER
);

--- F. Asset Locations Table
CREATE TABLE IF NOT EXISTS public.asset_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT
);

--- G. Asset Disposals Table
CREATE TABLE IF NOT EXISTS public.asset_disposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    asset_id TEXT NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    disposal_date DATE NOT NULL,
    disposal_reason TEXT,
    sale_price NUMERIC(15, 2),
    disposal_method TEXT,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    is_approved BOOLEAN DEFAULT FALSE
);

--- H. Company Users Table (Company membership relations)
CREATE TABLE IF NOT EXISTS public.company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

--- I. Depreciation Records Table
CREATE TABLE IF NOT EXISTS public.depreciation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    asset_id TEXT NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    depreciation_date DATE NOT NULL,
    depreciation_amount NUMERIC(15, 2) NOT NULL,
    accumulated_depreciation NUMERIC(15, 2) NOT NULL,
    book_value NUMERIC(15, 2) NOT NULL,
    method TEXT NOT NULL
);

--- J. Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    asset_id TEXT NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    document_type TEXT NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    expiry_date DATE,
    reminder_days INTEGER DEFAULT 30
);

--- K. Inventory Items Table
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    quantity INTEGER DEFAULT 0,
    unit_price NUMERIC(15, 2),
    supplier TEXT,
    location TEXT,
    notes TEXT
);

--- L. Maintenance Tasks Table (Active table used by newer code)
CREATE TABLE IF NOT EXISTS public.maintenance_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    asset_id TEXT NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    asset_name TEXT NOT NULL,
    task TEXT NOT NULL,
    due_date DATE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium'::text CHECK (priority IN ('low', 'medium', 'high')),
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

--- M. Maintenance Schedules Table (Legacy)
CREATE TABLE IF NOT EXISTS public.maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    asset_id TEXT NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL,
    frequency_interval INTEGER DEFAULT 1,
    start_date DATE NOT NULL,
    next_due_date DATE NOT NULL,
    last_completed_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    cost_estimate NUMERIC(15, 2),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    priority TEXT DEFAULT 'medium'::text CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    notes TEXT
);

--- N. User Companies Table
CREATE TABLE IF NOT EXISTS public.user_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member'::text NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

--- O. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    language TEXT DEFAULT 'en'::text,
    theme TEXT DEFAULT 'light'::text,
    currency TEXT DEFAULT 'USD'::text
);

--- P. Keep Alive Logs Table (Daily ping utility)
CREATE TABLE IF NOT EXISTS public.keep_alive_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pinged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

--- Q. System Status Table
CREATE TABLE IF NOT EXISTS public.system_status (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    last_run TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    status TEXT,
    error_message TEXT
);

--- -------------------------------------------------------------
--- 4. VIEWS DEFINITION
--- -------------------------------------------------------------
CREATE OR REPLACE VIEW public.assets_with_details AS
 SELECT a.id,
    a.company_id,
    a.created_at,
    a.updated_at,
    a.name,
    a.description,
    a.category_id,
    -- Map old location_id columns to NULL since location is now TEXT in newer assets
    NULL::UUID AS location_id,
    a.purchase_date,
    a.purchase_price,
    a.current_value,
    a.status,
    a.assigned_to,
    a.serial_number,
    a.status_notes AS notes,
    FALSE AS is_locked,
    NULL::NUMERIC AS depreciation_override,
    NULL::UUID AS approved_by,
    NULL::TIMESTAMP WITH TIME ZONE AS approved_at,
    a.useful_life,
    a.depreciation_method,
    a.salvage_value AS residual_value,
    ac.name AS category_name,
    a.location AS location_name
   FROM (public.assets a
     LEFT JOIN public.categories ac ON (a.category_id = ac.id));

--- -------------------------------------------------------------
--- 5. FUNCTION DEFINITIONS
--- -------------------------------------------------------------

--- Trigger Function: Auto-create Profile and link Company on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    company_id_var UUID;
BEGIN
    -- Create user profile (using email local part as default names)
    INSERT INTO public.user_profiles (id, email, full_name, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        SPLIT_PART(NEW.email, '@', 1),
        ''
    )
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name);
    
    -- Assign user to default company
    SELECT id INTO company_id_var FROM public.companies WHERE name = 'Default Company' LIMIT 1;
    IF company_id_var IS NULL THEN
        INSERT INTO public.companies (name) VALUES ('Default Company') RETURNING id INTO company_id_var;
    END IF;
    
    -- Link user to company (role 'staff') if not already linked
    IF NOT EXISTS (SELECT 1 FROM public.company_users WHERE user_id = NEW.id AND company_id = company_id_var) THEN
        INSERT INTO public.company_users (user_id, company_id, role)
        VALUES (NEW.id, company_id_var, 'staff');
    END IF;
    
    -- Link user in user_companies if not already linked
    IF NOT EXISTS (SELECT 1 FROM public.user_companies WHERE user_id = NEW.id AND company_id = company_id_var) THEN
        INSERT INTO public.user_companies (user_id, company_id, role)
        VALUES (NEW.id, company_id_var, 'member');
    END IF;

    -- Create user preferences row
    INSERT INTO public.user_preferences (user_id, language, theme, currency)
    VALUES (NEW.id, 'en', 'light', 'MYR')
    ON CONFLICT (user_id) DO NOTHING;

    -- Create default categories for the user
    INSERT INTO public.categories (user_id, name, is_active)
    VALUES 
        (NEW.id, 'IT Equipment', TRUE),
        (NEW.id, 'Furniture', TRUE),
        (NEW.id, 'Vehicles', TRUE),
        (NEW.id, 'Office Equipment', TRUE),
        (NEW.id, 'Machinery', TRUE),
        (NEW.id, 'Other', TRUE)
    ON CONFLICT (user_id, name) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--- Company assets helper function
CREATE OR REPLACE FUNCTION public.get_my_company_assets() 
RETURNS SETOF public.assets_with_details
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT awd.*
  FROM assets_with_details awd
  WHERE awd.company_id IN (
    SELECT company_id 
    FROM company_users 
    WHERE user_id = auth.uid()
  )
$$;

--- Get user active company ID helper function
CREATE OR REPLACE FUNCTION public.get_user_company_id() 
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid() AND is_active = true 
    LIMIT 1
  );
END;
$$;

--- Check company admin helper function
CREATE OR REPLACE FUNCTION public.is_company_admin(company_id uuid) 
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_companies 
    WHERE user_id = auth.uid() AND company_id = $1 AND role = 'admin' AND is_active = true
  );
END;
$$;

--- Category sync helper function: Update asset category_id dynamically
CREATE OR REPLACE FUNCTION update_asset_with_category_id(p_asset_id TEXT, p_category_name TEXT)
RETURNS VOID AS $$
DECLARE
    v_category_id UUID;
    v_user_id UUID;
BEGIN
    SELECT user_id INTO v_user_id FROM assets WHERE id = p_asset_id;
    
    -- Get or create the category for this user
    SELECT id INTO v_category_id
    FROM categories
    WHERE user_id = v_user_id
      AND LOWER(name) = LOWER(p_category_name);
    
    IF v_category_id IS NULL THEN
        INSERT INTO categories (user_id, name, is_active)
        VALUES (v_user_id, p_category_name, TRUE)
        RETURNING id INTO v_category_id;
    END IF;
    
    -- Update the asset
    UPDATE assets
    SET category_id = v_category_id
    WHERE id = p_asset_id;
END;
$$ LANGUAGE plpgsql;

--- -------------------------------------------------------------
--- 6. TRIGGERS DEFINITION
--- -------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

--- -------------------------------------------------------------
--- 7. ROW-LEVEL SECURITY (RLS) POLICIES
--- -------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_disposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depreciation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keep_alive_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_status ENABLE ROW LEVEL SECURITY;

--- A. Categories Policies (User-isolated)
CREATE POLICY "Users can view their own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

--- B. Assets Policies (User-isolated for personal accounts)
CREATE POLICY "Users can view their own assets" ON public.assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own assets" ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assets" ON public.assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assets" ON public.assets FOR DELETE USING (auth.uid() = user_id);

--- C. Maintenance Tasks Policies (User-isolated)
CREATE POLICY "Users can view their own maintenance tasks" ON public.maintenance_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own maintenance tasks" ON public.maintenance_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own maintenance tasks" ON public.maintenance_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own maintenance tasks" ON public.maintenance_tasks FOR DELETE USING (auth.uid() = user_id);

--- D. User Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

--- E. User Preferences Policies
CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

--- F. User Companies Policies
CREATE POLICY "Users can view their company associations" ON public.user_companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own company associations" ON public.user_companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own company associations" ON public.user_companies FOR UPDATE USING (auth.uid() = user_id);

--- G. Company Level Policies
CREATE POLICY "Users can read their company details" ON public.companies FOR SELECT USING (id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can view company members" ON public.company_users FOR SELECT USING (company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can view company asset categories" ON public.asset_categories FOR SELECT USING (company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can view company asset locations" ON public.asset_locations FOR SELECT USING (company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()));

--- H. Keep-alive Policies (Cron accessible)
CREATE POLICY "Allow public/auth read of keep_alive_logs" ON public.keep_alive_logs FOR SELECT USING (true);
CREATE POLICY "Allow system insert of keep_alive_logs" ON public.keep_alive_logs FOR INSERT WITH CHECK (true);

--- -------------------------------------------------------------
--- 8. INDEXES FOR PERFORMANCE
--- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_category_id ON public.assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_user_id ON public.maintenance_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_asset_id ON public.maintenance_tasks(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_due_date ON public.maintenance_tasks(due_date);

--- -------------------------------------------------------------
--- 9. CRON KEEP-ALIVE SCHEDULING
--- -------------------------------------------------------------
--- Schedule keep-alive ping every day at midnight (to keep DB active and free tier alive)
SELECT cron.unschedule('keep-alive-daily');
SELECT cron.schedule(
    'keep-alive-daily',
    '0 0 * * *',
    $$ INSERT INTO public.keep_alive_logs (pinged_at) VALUES (now()); $$
);

--- Delete keep-alive logs older than 7 days daily at 1 AM
SELECT cron.unschedule('cleanup-keep-alive-logs');
SELECT cron.schedule(
    'cleanup-keep-alive-logs',
    '0 1 * * *',
    $$ DELETE FROM public.keep_alive_logs WHERE pinged_at < now() - interval '7 days'; $$
);

--- -------------------------------------------------------------
--- 10. SEED DATA
--- -------------------------------------------------------------

--- Seed default company (id matches referenced value in assets seeds)
INSERT INTO public.companies (id, name, address, default_currency)
VALUES (
    '11111111-1111-1111-1111-111111111111', 
    'Test Company Inc.', 
    '123 Test Street, Test City', 
    'MYR'
)
ON CONFLICT (name) DO UPDATE 
SET address = EXCLUDED.address,
    default_currency = EXCLUDED.default_currency;

--- Seed default asset categories (associated with default company)
INSERT INTO public.asset_categories (id, company_id, name, description, default_depreciation_method, default_useful_life)
VALUES 
    ('2a2ca2d5-2312-44cb-acd3-62fb933c0ebd', '11111111-1111-1111-1111-111111111111', 'Electronics', 'Electronic devices and equipment', 'straight_line', 3),
    ('6aac54b2-4025-413d-99ab-0149479aef78', '11111111-1111-1111-1111-111111111111', 'Furniture', 'Office furniture and fixtures', 'straight_line', 7),
    ('c30ec008-1daa-4f6e-a480-c4ea20f57f39', '11111111-1111-1111-1111-111111111111', 'Vehicles', 'Company vehicles and transportation', 'declining_balance', 5)
ON CONFLICT (id) DO NOTHING;

--- Seed default asset locations (associated with default company)
INSERT INTO public.asset_locations (id, company_id, name, description)
VALUES 
    ('15060d3c-4973-4dc2-8f88-f37b2da0c6b0', '11111111-1111-1111-1111-111111111111', 'Head Office', 'Main headquarters'),
    ('c8d0a524-1299-4672-aa3f-822337aa65b1', '11111111-1111-1111-1111-111111111111', 'Warehouse A', 'Primary storage facility'),
    ('48233b8a-0b46-428f-a83a-f0e6a32577ba', '11111111-1111-1111-1111-111111111111', 'Branch Office', 'Regional office location')
ON CONFLICT (id) DO NOTHING;

--- Seed default categories for any existing users
INSERT INTO public.categories (user_id, name, is_active)
SELECT up.id, cat_name, TRUE
FROM public.user_profiles up
CROSS JOIN (
    VALUES 
        ('IT Equipment'),
        ('Furniture'),
        ('Vehicles'),
        ('Office Equipment'),
        ('Machinery'),
        ('Other')
) AS default_cats(cat_name)
ON CONFLICT (user_id, name) DO NOTHING;