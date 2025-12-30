export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          created_at: string
          name: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          company_id: string | null
          full_name: string | null
          updated_at: string
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          company_id?: string | null
          full_name?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          company_id?: string | null
          full_name?: string | null
          updated_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          user_id: string
          created_at: string
          name: string
          category: string
          location: string
          status: 'active' | 'maintenance' | 'inactive' | 'disposed'
          purchase_date: string
          purchase_price: number
          current_value: number
          assigned_to: string
          assigned_invoice: string | null
          description: string | null
          serial_number: string | null
          image_url: string | null
          company_id: string | null
          useful_life: number
        }
        Insert: {
          id?: string
          user_id?: string
          created_at?: string
          name: string
          category: string
          location: string
          status?: 'active' | 'maintenance' | 'inactive' | 'disposed'
          purchase_date: string
          purchase_price: number
          current_value: number
          assigned_to: string
          assigned_invoice?: string | null
          description?: string | null
          serial_number?: string | null
          image_url?: string | null
          company_id?: string | null
          useful_life?: number
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          name?: string
          category?: string
          location?: string
          status?: 'active' | 'maintenance' | 'inactive' | 'disposed'
          purchase_date?: string
          purchase_price?: number
          current_value?: number
          assigned_to?: string
          assigned_invoice?: string | null
          description?: string | null
          serial_number?: string | null
          image_url?: string | null
          company_id?: string | null
          useful_life?: number
        }
      }
      maintenance_tasks: {
        Row: {
          id: string
          user_id: string
          created_at: string
          asset_id: string
          asset_name: string
          task: string
          due_date: string
          priority: 'low' | 'medium' | 'high'
          completed: boolean
          completed_at: string | null
          company_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string
          created_at?: string
          asset_id: string
          asset_name: string
          task: string
          due_date: string
          priority?: 'low' | 'medium' | 'high'
          completed?: boolean
          completed_at?: string | null
          company_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          asset_id?: string
          asset_name?: string
          task?: string
          due_date?: string
          priority?: 'low' | 'medium' | 'high'
          completed?: boolean
          completed_at?: string | null
          company_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Company = Database['public']['Tables']['companies']['Row']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export type Asset = Database['public']['Tables']['assets']['Row']
export type AssetInsert = Database['public']['Tables']['assets']['Insert']
export type AssetUpdate = Database['public']['Tables']['assets']['Update']

export type MaintenanceTask = Database['public']['Tables']['maintenance_tasks']['Row']
export type MaintenanceTaskInsert = Database['public']['Tables']['maintenance_tasks']['Insert']
export type MaintenanceTaskUpdate = Database['public']['Tables']['maintenance_tasks']['Update']