# Personal Account RLS Policy Fix

## Issue
The application fails to create assets with the error "Failed to create asset: new row violates row-level security policy for table 'asset'" because the assets table in Supabase has RLS policies that don't allow users to insert their own assets based on user_id.

## Root Cause
Looking at the `auth-schema.sql` file, the assets table has RLS policies that were updated to work with company_id:
- Users can view assets in their company
- Users can insert assets in their company
- Users can update assets in their company
- Users can delete assets in their company

But since we removed company associations, these policies need to be updated to work with user_id instead.

## Solution
You need to update the RLS policies for the assets table in your Supabase dashboard to work with user_id for personal account access:

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Database > SQL Editor

### Step 2: Update the Assets Table RLS Policies
First, remove the old policies that use company_id:

```sql
-- Drop old company-based policies
DROP POLICY IF EXISTS "Users can view assets in their company" ON public.assets;
DROP POLICY IF EXISTS "Users can insert assets in their company" ON public.assets;
DROP POLICY IF EXISTS "Users can update assets in their company" ON public.assets;
DROP POLICY IF EXISTS "Users can delete assets in their company" ON public.assets;
```

Then, create new user-based policies:

```sql
-- Create new user-based policies
CREATE POLICY "Users can view their own assets" ON public.assets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets" ON public.assets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets" ON public.assets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets" ON public.assets
    FOR DELETE USING (auth.uid() = user_id);
```

### Step 3: Test
After updating the policies, try creating an asset again. The asset creation should now work properly with user-based access control.

## Alternative Approach (if the above doesn't work)
If you still have issues, make sure the assets table has the user_id column and that it's properly set:

```sql
-- Ensure user_id column exists and has proper RLS
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS user_id UUID;
UPDATE public.assets SET user_id = auth.uid() WHERE user_id IS NULL;
```

## Verification
After applying these changes, you should be able to:
- Create new assets under your user account
- View only your own assets
- Update only your own assets
- Delete only your own assets

This creates a personal account system where each user manages their own assets independently.