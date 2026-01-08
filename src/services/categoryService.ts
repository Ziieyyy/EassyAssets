import { supabase } from '@/lib/supabase';

// Generic category service that bypasses type issues
export const categoryService = {
  // Get all categories for the current user
  getCategories: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
    return data || [];
  },

  // Create a new category
  createCategory: async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // First check if category already exists
    const { data: existing, error: checkError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .ilike('name', name.toLowerCase().trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is the error code for "Row not found", which is expected
      throw checkError;
    }

    if (existing) {
      throw new Error('Category with this name already exists');
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: name.trim(), user_id: user.id, is_active: true }])
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw error;
    }
    return data;
  },
};