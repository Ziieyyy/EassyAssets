import { supabase } from '@/lib/supabase';
import type { MaintenanceTask, MaintenanceTaskInsert, MaintenanceTaskUpdate } from '@/types/database';

export const maintenanceService = {
  // Get all maintenance tasks
  async getAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data as MaintenanceTask[];
  },

  // Get upcoming maintenance tasks (not completed)
  async getUpcoming(limit: number = 10) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('due_date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    
    // Calculate days until due
    const today = new Date();
    return (data as MaintenanceTask[]).map(task => {
      const dueDate = new Date(task.due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...task, daysUntilDue };
    });
  },

  // Get task by ID
  async getById(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data as MaintenanceTask;
  },

  // Create new maintenance task
  async create(task: MaintenanceTaskInsert) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .insert({ ...task, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data as MaintenanceTask;
  },

  // Update maintenance task
  async update(id: string, updates: MaintenanceTaskUpdate) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as MaintenanceTask;
  },

  // Mark task as completed
  async markCompleted(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .update({ 
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as MaintenanceTask;
  },

  // Delete maintenance task
  async delete(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('maintenance_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  // Get maintenance count by priority
  async getCountByPriority() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select('priority')
      .eq('user_id', user.id)
      .eq('completed', false);

    if (error) throw error;

    const highPriority = data?.filter(t => t.priority === 'high').length || 0;
    const mediumPriority = data?.filter(t => t.priority === 'medium').length || 0;
    const lowPriority = data?.filter(t => t.priority === 'low').length || 0;

    return {
      total: data?.length || 0,
      high: highPriority,
      medium: mediumPriority,
      low: lowPriority,
    };
  },
};
