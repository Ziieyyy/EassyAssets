-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    name TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    email TEXT NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    full_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Users can view their own company" ON public.companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own company" ON public.companies
    FOR UPDATE USING (
        id IN (
            SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
        )
    );

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to create user profile and company on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email)
    VALUES (new.id, new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update assets table to link to companies
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Update maintenance_tasks table to link to companies
ALTER TABLE public.maintenance_tasks ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Update assets RLS policies to filter by company
DROP POLICY IF EXISTS "Enable read access for all users" ON public.assets;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.assets;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.assets;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.assets;

CREATE POLICY "Users can view assets in their company" ON public.assets
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert assets in their company" ON public.assets
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update assets in their company" ON public.assets
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete assets in their company" ON public.assets
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
        )
    );

-- Update maintenance_tasks RLS policies to filter by company
DROP POLICY IF EXISTS "Enable read access for all users" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.maintenance_tasks;

CREATE POLICY "Users can view maintenance tasks in their company" ON public.maintenance_tasks
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert maintenance tasks in their company" ON public.maintenance_tasks
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update maintenance tasks in their company" ON public.maintenance_tasks
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete maintenance tasks in their company" ON public.maintenance_tasks
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
        )
    );
