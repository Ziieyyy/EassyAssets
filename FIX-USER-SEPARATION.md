# Fix: User Data Separation Issue

## Problem
When you sign in with different accounts, all users see the same data. This is because the database policies allow ALL users to access ALL data.

## Solution
The fix adds a `user_id` column to track which user owns each asset and maintenance task, then updates the Row Level Security (RLS) policies to filter data by the authenticated user.

## Steps to Apply the Fix

### 1. Update Your Supabase Database

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the entire contents of `migration-add-user-id.sql`
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

### 2. Clear Existing Data (Recommended)

Since your existing data doesn't have a `user_id`, you should clear it:

1. In the same SQL Editor, run these commands:
```sql
DELETE FROM public.maintenance_tasks;
DELETE FROM public.assets;
```

**OR** if you want to keep the data and assign it to your first user account, uncomment steps 4-5 in the migration file.

### 3. Test the Fix

1. **Sign out** from your current account
2. **Sign in** with Account A
3. Create some assets
4. **Sign out** and **sign in** with Account B
5. Create different assets
6. Verify that each account only sees their own data

## What Changed

### Database Schema
- Added `user_id UUID` column to `assets` table
- Added `user_id UUID` column to `maintenance_tasks` table
- Updated RLS policies to use `auth.uid() = user_id` instead of `USING (true)`

### Code Changes
- Updated TypeScript types in `src/types/database.ts`
- Updated `src/services/assets.ts` to automatically set and filter by `user_id`
- Updated `src/services/maintenance.ts` to automatically set and filter by `user_id`

## Important Notes

- Each user will now have their own isolated data
- Users cannot see, edit, or delete other users' assets or maintenance tasks
- When creating new assets/tasks, the system automatically assigns them to the logged-in user
- All existing data will be cleared unless you explicitly assign it to a user (see Step 2)

## Troubleshooting

If you still see shared data after applying the fix:
1. Make sure you ran the migration SQL successfully
2. Clear your browser cache and local storage
3. Sign out and sign in again
4. Verify the `user_id` column exists in your database tables
