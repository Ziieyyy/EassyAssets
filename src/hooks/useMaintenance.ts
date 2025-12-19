import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceService } from '@/services/maintenance';
import type { MaintenanceTaskInsert, MaintenanceTaskUpdate } from '@/types/database';
import { toast } from 'sonner';

export const useMaintenanceTasks = () => {
  return useQuery({
    queryKey: ['maintenance-tasks'],
    queryFn: maintenanceService.getAll,
  });
};

export const useUpcomingMaintenance = (limit?: number) => {
  return useQuery({
    queryKey: ['upcoming-maintenance', limit],
    queryFn: () => maintenanceService.getUpcoming(limit),
  });
};

export const useMaintenanceTask = (id: string) => {
  return useQuery({
    queryKey: ['maintenance-task', id],
    queryFn: () => maintenanceService.getById(id),
    enabled: !!id,
  });
};

export const useMaintenanceCountByPriority = () => {
  return useQuery({
    queryKey: ['maintenance-count-by-priority'],
    queryFn: maintenanceService.getCountByPriority,
  });
};

export const useCreateMaintenanceTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task: MaintenanceTaskInsert) => maintenanceService.create(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-count-by-priority'] });
      toast.success('Maintenance task created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create maintenance task: ${error.message}`);
    },
  });
};

export const useUpdateMaintenanceTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: MaintenanceTaskUpdate }) =>
      maintenanceService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-count-by-priority'] });
      toast.success('Maintenance task updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update maintenance task: ${error.message}`);
    },
  });
};

export const useMarkMaintenanceCompleted = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => maintenanceService.markCompleted(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-count-by-priority'] });
      toast.success('Maintenance task marked as completed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark task as completed: ${error.message}`);
    },
  });
};

export const useDeleteMaintenanceTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => maintenanceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-count-by-priority'] });
      toast.success('Maintenance task deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete maintenance task: ${error.message}`);
    },
  });
};
