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
      users: {
        Row: {
          id: string
          username: string
          password: string
          email: string | null
          wallet_address: string | null
          avatar_url: string | null
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          password: string
          email?: string | null
          wallet_address?: string | null
          avatar_url?: string | null
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          password?: string
          email?: string | null
          wallet_address?: string | null
          avatar_url?: string | null
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          id: string
          user_id: string
          asset_type: string
          asset_name: string
          amount: number
          value: number | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          asset_type: string
          asset_name: string
          amount?: number
          value?: number | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          asset_type?: string
          asset_name?: string
          amount?: number
          value?: number | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'assets_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          transaction_type: string
          amount: number
          currency: string
          status: string
          tx_hash: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_type: string
          amount: number
          currency?: string
          status?: string
          tx_hash?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_type?: string
          amount?: number
          currency?: string
          status?: string
          tx_hash?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// 편의를 위한 타입 별칭
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Asset = Database['public']['Tables']['assets']['Row']
export type AssetInsert = Database['public']['Tables']['assets']['Insert']
export type AssetUpdate = Database['public']['Tables']['assets']['Update']

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']
