// Migration script to update existing assets to use the new category_id system
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateCategories() {
  try {
    console.log('Starting category migration...');
    
    // Get all assets with their categories
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('id, user_id, category')
      .not('category', 'is', null);

    if (assetsError) {
      throw new Error(`Error fetching assets: ${assetsError.message}`);
    }

    console.log(`Found ${assets.length} assets with categories to migrate`);

    if (assets.length === 0) {
      console.log('No assets with categories to migrate. Migration complete.');
      return;
    }

    // Process each asset
    for (const asset of assets) {
      // Check if a category with this name already exists for the user
      const { data: existingCategory, error: categoryCheckError } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', asset.user_id)
        .ilike('name', asset.category.toLowerCase().trim())
        .single();

      let categoryId;

      if (existingCategory) {
        // Use existing category
        categoryId = existingCategory.id;
        console.log(`Using existing category for user ${asset.user_id}: ${asset.category}`);
      } else {
        // Create new category
        const { data: newCategory, error: createError } = await supabase
          .from('categories')
          .insert([{
            user_id: asset.user_id,
            name: asset.category.trim(),
            is_active: true
          }])
          .select('id')
          .single();

        if (createError) {
          console.error(`Error creating category for user ${asset.user_id}:`, createError);
          continue; // Skip this asset and continue with others
        }

        categoryId = newCategory.id;
        console.log(`Created new category for user ${asset.user_id}: ${asset.category}`);
      }

      // Update the asset to use the new category_id
      const { error: updateError } = await supabase
        .from('assets')
        .update({ category_id: categoryId })
        .eq('id', asset.id);

      if (updateError) {
        console.error(`Error updating asset ${asset.id}:`, updateError);
      } else {
        console.log(`Updated asset ${asset.id} to use category_id: ${categoryId}`);
      }
    }

    console.log('Category migration completed successfully!');
  } catch (error) {
    console.error('Error during category migration:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateCategories();