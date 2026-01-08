import { supabase } from '@/lib/supabase';

export const categoriesService = {
  // Get all active categories for the current user
  getActiveCategories: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name', { ascending: true }) as any;

    if (error) throw error;
    return data;
  },

  // Get all categories for the current user (including inactive)
  getAllCategories: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true }) as any;

    if (error) throw error;
    return data;
  },

  // Get a single category by ID
  getCategoryById: async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single() as any;

    if (error) throw error;
    return data;
  },

  // Create a new category
  createCategory: async (categoryData: { name: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if a category with this name already exists for the user
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .ilike('name', categoryData.name.toLowerCase().trim())
      .maybeSingle() as any;

    if (existingCategory) {
      throw new Error('A category with this name already exists');
    }

    const newCategoryData = {
      name: categoryData.name,
      user_id: user.id,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('categories')
      .insert([newCategoryData])
      .select()
      .single() as any;

    if (error) throw error;
    return data;
  },

  // Update a category
  updateCategory: async (id: string, updates: { name?: string; description?: string; is_active?: boolean }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // If updating the name, check for duplicates
    if (updates.name) {
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', updates.name.toLowerCase().trim())
        .neq('id', id) // Exclude the current category
        .maybeSingle() as any;

      if (existingCategory) {
        throw new Error('A category with this name already exists');
      }
    }

    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single() as any;

    if (error) throw error;
    return data;
  },

  // Soft delete (deactivate) a category
  deactivateCategory: async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if the category is in use by any assets
    const { count: assetCount, error: assetCheckError } = await supabase
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id) as any;

    if (assetCheckError) throw assetCheckError;

    if (assetCount && assetCount > 0) {
      throw new Error('Cannot deactivate category: it is currently used by one or more assets');
    }

    const { data, error } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single() as any;

    if (error) throw error;
    return data;
  },

  // Permanently delete a category (only if not in use)
  deleteCategory: async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if the category is in use by any assets
    const { count: assetCount, error: assetCheckError } = await supabase
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id) as any;

    if (assetCheckError) throw assetCheckError;

    if (assetCount && assetCount > 0) {
      throw new Error('Cannot delete category: it is currently used by one or more assets');
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) as any;

    if (error) throw error;
  },

  // Reactivate a category
  reactivateCategory: async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('categories')
      .update({ is_active: true })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single() as any;

    if (error) throw error;
    return data;
  },
};