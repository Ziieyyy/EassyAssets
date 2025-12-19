# Database Setup Instructions

## Setting up Supabase Database

Follow these steps to set up your Supabase database for the Asset Harmony application:

### Step 1: Access Supabase SQL Editor

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Navigate to your project: `cgfpoilflouitkubskkc`
4. Click on the **SQL Editor** in the left sidebar

### Step 2: Run the Database Schema

1. In the SQL Editor, click **New Query**
2. Copy the entire contents of the `database-schema.sql` file
3. Paste it into the SQL Editor
4. Click **Run** to execute the SQL script

This will create:
- `assets` table with all necessary columns
- `maintenance_tasks` table for tracking maintenance
- Row Level Security (RLS) policies for both tables
- Indexes for better query performance
- Sample data to get you started

### Step 3: Verify the Setup

After running the script, verify that everything is set up correctly:

1. Go to **Table Editor** in Supabase
2. You should see two tables:
   - `assets` - Contains 8 sample assets
   - `maintenance_tasks` - Contains 3 sample maintenance tasks

### Step 4: Test the Application

1. Make sure your `.env` file contains the correct credentials:
   ```
   VITE_SUPABASE_URL=https://cgfpoilflouitkubskkc.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. Run the application:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the application
4. You should see the dashboard populated with real data from Supabase

### Database Schema Overview

#### Assets Table
- `id` - Unique asset identifier (e.g., AST-001)
- `name` - Asset name
- `category` - Asset category (IT Equipment, Furniture, Vehicles, etc.)
- `location` - Physical location
- `status` - Current status (active, maintenance, inactive, disposed)
- `purchase_date` - Date of purchase
- `purchase_price` - Original purchase price
- `current_value` - Current depreciated value
- `assigned_to` - Person/department assigned to
- `description` - Optional description
- `serial_number` - Optional serial number
- `created_at` - Auto-generated timestamp

#### Maintenance Tasks Table
- `id` - Unique task identifier (UUID)
- `asset_id` - Reference to the asset
- `asset_name` - Name of the asset
- `task` - Maintenance task description
- `due_date` - When the maintenance is due
- `priority` - Priority level (low, medium, high)
- `completed` - Completion status
- `completed_at` - Completion timestamp
- `created_at` - Auto-generated timestamp

### Troubleshooting

If you encounter any issues:

1. **Connection Error**: Verify your Supabase URL and API key in the `.env` file
2. **Permission Error**: Make sure RLS policies are properly set up
3. **No Data Showing**: Check the browser console for errors
4. **API Errors**: Verify that the tables exist in Supabase Table Editor

### Next Steps

- Add more assets through the application UI
- Create additional maintenance tasks
- Customize the database schema as needed
- Set up authentication for user-specific data (optional)
