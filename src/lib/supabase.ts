import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// 헬퍼 함수들

// Users
export const getUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export const createUser = async (user: Database['public']['Tables']['users']['Insert']) => {
  const { data, error } = await supabase
    .from('users')
    .insert(user)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const updateUser = async (userId: string, updates: Database['public']['Tables']['users']['Update']) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Assets
export const getAssets = async (userId?: string) => {
  let query = supabase.from('assets').select('*')
  
  if (userId) {
    query = query.eq('user_id', userId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

export const getAsset = async (assetId: string) => {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .single()
  
  if (error) throw error
  return data
}

export const createAsset = async (asset: Database['public']['Tables']['assets']['Insert']) => {
  const { data, error } = await supabase
    .from('assets')
    .insert(asset)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const updateAsset = async (assetId: string, updates: Database['public']['Tables']['assets']['Update']) => {
  const { data, error } = await supabase
    .from('assets')
    .update(updates)
    .eq('id', assetId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Transactions
export const getTransactions = async (userId?: string) => {
  let query = supabase.from('transactions').select('*').order('created_at', { ascending: false })
  
  if (userId) {
    query = query.eq('user_id', userId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

export const getTransaction = async (transactionId: string) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single()
  
  if (error) throw error
  return data
}

export const createTransaction = async (transaction: Database['public']['Tables']['transactions']['Insert']) => {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const updateTransaction = async (transactionId: string, updates: Database['public']['Tables']['transactions']['Update']) => {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', transactionId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export default supabase
