import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database';

export const assetsService = {
  // Get all assets
  async getAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('assets')
      .select('*, categories!inner(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    // Transform the data to include category name at the top level
    const transformedData = data.map(item => ({
      ...item,
      category: item.categories?.name || null
    }));
    return transformedData as Tables<'assets'>[];
  },

  // Get assets with search and filtering
  async getAllWithFilters(searchQuery: string = '', category: string = '', status: 'active' | 'maintenance' | 'inactive' | 'disposed' | 'All Status' | string = '') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
  
    let query = supabase
      .from('assets')
      .select('*, categories!inner(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
  
    // Add search filtering if query is provided
    if (searchQuery) {
      query = query.or(
         `name.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%`
      ) as any;
    }
      
    // Add category filter if provided
    if (category && category !== 'All Categories' && category !== 'All Categories') {
      // First get the category ID based on the name
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', category)
        .eq('user_id', user.id)  // Make sure to get user's categories
        .limit(1) as any;
      
      if (categoryData && categoryData.length > 0) {
        query = query.eq('category_id', categoryData[0].id) as any;
      } else {
        // If no matching category found, return empty result
        query = query.eq('id', '00000000-0000-0000-0000-000000000000') as any; // Impossible ID
      }
    }
      
    // Add status filter if provided
    if (status && status !== 'All Status' && status !== '') {
      query = query.eq('status', status as 'active' | 'maintenance' | 'inactive' | 'disposed');
    }
  
    const { data, error } = await query;
  
    if (error) throw error;
    // Transform the data to include category name at the top level
    const transformedData = data.map(item => ({
      ...item,
      category: item.categories?.name || null
    }));
    return transformedData as Tables<'assets'>[];
  },

  // Get asset by ID
  async getById(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data as Tables<'assets'>;
  },

  // Create new asset
  async create(asset: TablesInsert<'assets'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // Get user's profile to retrieve company_id
    let company_id = null;
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (!profileError && profileData) {
        company_id = profileData.company_id || null;
      }
    } catch (profileError) {
      // If profile doesn't exist or there's an error, continue without company_id
      console.warn('User profile not found, proceeding without company_id:', profileError);
    }
    
    const { data, error } = await supabase
      .from('assets')
      .insert({ ...asset, user_id: user.id, company_id } as any)
      .select()
      .single() as any;

    if (error) throw error;
    return data as Tables<'assets'>;
  },

  // Update asset
  async update(id: string, updates: TablesUpdate<'assets'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('assets')
      .update(updates as any)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single() as any;

    if (error) throw error;
    return data as Tables<'assets'>;
  },

  // Delete asset
  async delete(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) as any;

    if (error) throw error;
  },

  // Get asset statistics
  async getStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data: assets, error } = await supabase
      .from('assets')
      .select('status, current_value, purchase_price')
      .eq('user_id', user.id);

    if (error) throw error;

    const totalAssets = assets?.length || 0;
    const activeAssets = assets?.filter((a: any) => a.status === 'active').length || 0;
    const maintenanceAssets = assets?.filter((a: any) => a.status === 'maintenance').length || 0;
    
    // Calculate total value and depreciation only for active assets (excluding disposed assets)
    const activeAssetsData = assets?.filter((a: any) => a.status !== 'disposed') || [];
    const totalValue = activeAssetsData.reduce((sum, asset: any) => sum + (asset.current_value || 0), 0) || 0;
    const totalDepreciation = activeAssetsData.reduce((sum, asset: any) => sum + ((asset.purchase_price || 0) - (asset.current_value || 0)), 0) || 0;

    return {
      totalAssets,
      totalValue,
      totalDepreciation,
      activeAssets,
      maintenanceAssets,
    };
  },

  // Get assets by category
  async getByCategory() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('assets')
      .select('category, current_value')
      .eq('user_id', user.id) as any;

    if (error) throw error;

    const categoryMap = new Map<string, number>();
    data?.forEach((asset: any) => {
      const current = categoryMap.get(asset.category) || 0;
      categoryMap.set(asset.category, current + (asset.current_value || 0));
    });

    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  },
};
