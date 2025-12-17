import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsService } from '@/services/assets';
import type { AssetInsert, AssetUpdate } from '@/types/database';
import { toast } from 'sonner';

export const useAssets = () => {
  return useQuery({
    queryKey: ['assets'],
    queryFn: assetsService.getAll,
  });
};

export const useAsset = (id: string) => {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetsService.getById(id),
    enabled: !!id,
  });
};

export const useAssetStats = () => {
  return useQuery({
    queryKey: ['asset-stats'],
    queryFn: assetsService.getStats,
  });
};

export const useAssetsByCategory = () => {
  return useQuery({
    queryKey: ['assets-by-category'],
    queryFn: assetsService.getByCategory,
  });
};

export const useCreateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (asset: AssetInsert) => assetsService.create(asset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-stats'] });
      queryClient.invalidateQueries({ queryKey: ['assets-by-category'] });
      toast.success('Asset created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create asset: ${error.message}`);
    },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: AssetUpdate }) =>
      assetsService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-stats'] });
      queryClient.invalidateQueries({ queryKey: ['assets-by-category'] });
      toast.success('Asset updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update asset: ${error.message}`);
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assetsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-stats'] });
      queryClient.invalidateQueries({ queryKey: ['assets-by-category'] });
      toast.success('Asset deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete asset: ${error.message}`);
    },
  });
};
