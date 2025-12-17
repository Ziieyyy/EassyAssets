import { supabase } from '@/lib/supabase';
import type { Asset, AssetInsert, AssetUpdate } from '@/types/database';

export const assetsService = {
  // Get all assets
  async getAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Asset[];
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
    return data as Asset;
  },

  // Create new asset
  async create(asset: AssetInsert) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('assets')
      .insert({ ...asset, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data as Asset;
  },

  // Update asset
  async update(id: string, updates: AssetUpdate) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('assets')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as Asset;
  },

  // Delete asset
  async delete(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

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
    const totalValue = assets?.reduce((sum, asset) => sum + (asset.current_value || 0), 0) || 0;
    const totalDepreciation = assets?.reduce((sum, asset) => sum + ((asset.purchase_price || 0) - (asset.current_value || 0)), 0) || 0;
    const activeAssets = assets?.filter(a => a.status === 'active').length || 0;
    const maintenanceAssets = assets?.filter(a => a.status === 'maintenance').length || 0;

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
      .eq('user_id', user.id);

    if (error) throw error;

    const categoryMap = new Map<string, number>();
    data?.forEach(asset => {
      const current = categoryMap.get(asset.category) || 0;
      categoryMap.set(asset.category, current + (asset.current_value || 0));
    });

    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  },
};
