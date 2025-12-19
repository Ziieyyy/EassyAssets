-- Migration: Enable Asset ID updates by adding ON UPDATE CASCADE to foreign key

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.maintenance_tasks 
DROP CONSTRAINT IF EXISTS maintenance_tasks_asset_id_fkey;

-- Step 2: Re-add the foreign key constraint with ON UPDATE CASCADE
ALTER TABLE public.maintenance_tasks
ADD CONSTRAINT maintenance_tasks_asset_id_fkey 
FOREIGN KEY (asset_id) 
REFERENCES public.assets(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- This allows the asset_id in maintenance_tasks to automatically update
-- when the id in assets table is changed
