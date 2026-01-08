import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Category, CategoryInsert, CategoryUpdate } from '@/types/database';

export const useCategories = () => {
  const queryClient = useQueryClient();

  // Get all categories for the current user
  const useGetCategories = () => {
    return useQuery({
      queryKey: ['categories'],
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true });

        if (error) throw error;
        return data as Category[];
      },
    });
  };

  // Get active categories for the current user
  const useGetActiveCategories = () => {
    return useQuery({
      queryKey: ['active-categories'],
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) throw error;
        return data as Category[];
      },
    });
  };

  // Create a new category
  const useCreateCategory = () => {
    return useMutation({
      mutationFn: async (name: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const categoryData: CategoryInsert = {
          name,
          user_id: user.id,
          is_active: true
        };

        const { data, error } = await supabase
          .from('categories')
          .insert([categoryData])
          .select()
          .single();

        if (error) throw error;
        return data as Category;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['active-categories'] });
      },
    });
  };

  // Update a category
  const useUpdateCategory = () => {
    return useMutation({
      mutationFn: async ({ id, updates }: { id: string; updates: Partial<CategoryUpdate> }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('categories')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data as Category;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['active-categories'] });
      },
    });
  };

  // Delete a category
  const useDeleteCategory = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['active-categories'] });
      },
    });
  };

  return {
    useGetCategories,
    useGetActiveCategories,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
  };
};