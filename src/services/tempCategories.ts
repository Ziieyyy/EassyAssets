import { supabase } from '@/lib/supabase';

// Temporary service to handle categories until types are properly generated
export const tempCategoryService = {
  // Get all categories for the current user
  getCategories: async () => {
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

  // Create a new category
  createCategory: async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, user_id: user.id, is_active: true }])
      .select()
      .single() as any;

    if (error) throw error;
    return data;
  },
};