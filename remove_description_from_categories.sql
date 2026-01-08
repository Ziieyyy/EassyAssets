-- SQL to remove NOT NULL constraint from description field in categories table

-- Since the description field was already created as nullable in our previous migration,
-- we just need to ensure it stays optional. If you want to remove the column entirely:

-- Option 1: If you want to drop the description column entirely
-- ALTER TABLE public.categories DROP COLUMN IF EXISTS description;

-- Option 2: Just ensure the description field remains optional (this is the default behavior)
-- The field was already created as nullable in our migration, so no changes needed for that

-- If you want to make sure the field is truly optional and remove any potential constraints:
ALTER TABLE public.categories ALTER COLUMN description DROP NOT NULL;