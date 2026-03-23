// Este arquivo é gerado automaticamente pelo comando:
// supabase gen types typescript --project-id <project-id> > packages/database/types.ts
//
// NÃO edite manualmente. Regenere sempre que o schema mudar.
//
// Para regenerar: pnpm --filter @revenue-hub/database gen:types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          currency_default: string
          is_super_admin: boolean
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          avatar_url?: string | null
          currency_default?: string
          is_super_admin?: boolean
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          avatar_url?: string | null
          currency_default?: string
          is_super_admin?: boolean
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          plan: Database['public']['Enums']['workspace_plan']
          owner_id: string
          currency_base: string
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          plan?: Database['public']['Enums']['workspace_plan']
          owner_id: string
          currency_base?: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          plan?: Database['public']['Enums']['workspace_plan']
          owner_id?: string
          currency_base?: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: Database['public']['Enums']['workspace_role']
          invited_by: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: Database['public']['Enums']['workspace_role']
          invited_by?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: Database['public']['Enums']['workspace_role']
          invited_by?: string | null
          joined_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          workspace_id: string
          created_by: string
          name: string
          type: Database['public']['Enums']['account_type']
          institution: string | null
          balance: number
          currency: string
          color: string | null
          icon: string | null
          is_active: boolean
          include_in_net_worth: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          created_by: string
          name: string
          type: Database['public']['Enums']['account_type']
          institution?: string | null
          balance?: number
          currency?: string
          color?: string | null
          icon?: string | null
          is_active?: boolean
          include_in_net_worth?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          created_by?: string
          name?: string
          type?: Database['public']['Enums']['account_type']
          institution?: string | null
          balance?: number
          currency?: string
          color?: string | null
          icon?: string | null
          is_active?: boolean
          include_in_net_worth?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          workspace_id: string
          parent_id: string | null
          name: string
          type: Database['public']['Enums']['category_type']
          icon: string | null
          color: string | null
          is_system: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          parent_id?: string | null
          name: string
          type: Database['public']['Enums']['category_type']
          icon?: string | null
          color?: string | null
          is_system?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          parent_id?: string | null
          name?: string
          type?: Database['public']['Enums']['category_type']
          icon?: string | null
          color?: string | null
          is_system?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          workspace_id: string
          account_id: string
          category_id: string | null
          created_by: string
          recurrence_id: string | null
          type: Database['public']['Enums']['transaction_type']
          amount: number
          currency: string
          amount_in_base: number
          exchange_rate: number
          description: string
          notes: string | null
          date: string
          status: Database['public']['Enums']['transaction_status']
          is_transfer: boolean
          transfer_peer_id: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          account_id: string
          category_id?: string | null
          created_by: string
          recurrence_id?: string | null
          type: Database['public']['Enums']['transaction_type']
          amount: number
          currency?: string
          amount_in_base: number
          exchange_rate?: number
          description: string
          notes?: string | null
          date: string
          status?: Database['public']['Enums']['transaction_status']
          is_transfer?: boolean
          transfer_peer_id?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          account_id?: string
          category_id?: string | null
          created_by?: string
          recurrence_id?: string | null
          type?: Database['public']['Enums']['transaction_type']
          amount?: number
          currency?: string
          amount_in_base?: number
          exchange_rate?: number
          description?: string
          notes?: string | null
          date?: string
          status?: Database['public']['Enums']['transaction_status']
          is_transfer?: boolean
          transfer_peer_id?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Enums: {
      workspace_plan: 'free' | 'pro' | 'family'
      workspace_role: 'owner' | 'admin' | 'member'
      account_type: 'checking' | 'savings' | 'wallet' | 'investment' | 'other'
      transaction_type: 'income' | 'expense' | 'transfer' | 'opening_balance'
      transaction_status: 'pending' | 'confirmed' | 'reconciled' | 'void'
      category_type: 'income' | 'expense'
      recurrence_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'yearly'
      goal_status: 'active' | 'paused' | 'completed' | 'cancelled'
      goal_strategy: 'fixed_monthly' | 'percentage_income' | 'manual'
      invoice_status: 'open' | 'closed' | 'paid' | 'overdue'
      card_brand: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'other'
    }
  }
}

// Aliases convenientes
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

export type Profile = Tables<'profiles'>
export type Workspace = Tables<'workspaces'>
export type WorkspaceMember = Tables<'workspace_members'>
export type Account = Tables<'accounts'>
export type Category = Tables<'categories'>
export type Transaction = Tables<'transactions'>
