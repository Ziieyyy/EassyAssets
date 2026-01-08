-- Update assets table to make the old category column optional since we're using category_id now

-- Make the category column nullable to avoid the not-null constraint error
ALTER TABLE public.assets ALTER COLUMN category DROP NOT NULL;

-- Optionally, you can also set existing null values in category column to NULL explicitly if needed
-- UPDATE public.assets SET category = NULL WHERE category IS NULL;