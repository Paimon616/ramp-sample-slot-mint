import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Asset, Transaction } from '../types/database.types'

// 사용자 훅
export function useUser(userId: string | null) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUser(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return { user, loading, error, refetch: fetchUser }
}

// 자산 목록 훅
export function useAssets(userId?: string) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase.from('assets').select('*')
      
      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw error
      setAssets(data || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  // 실시간 구독
  useEffect(() => {
    const channel = supabase
      .channel('assets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assets',
          ...(userId ? { filter: `user_id=eq.${userId}` } : {}),
        },
        () => {
          fetchAssets()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchAssets])

  return { assets, loading, error, refetch: fetchAssets }
}

// 트랜잭션 목록 훅
export function useTransactions(userId?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw error
      setTransactions(data || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // 실시간 구독
  useEffect(() => {
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          ...(userId ? { filter: `user_id=eq.${userId}` } : {}),
        },
        () => {
          fetchTransactions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchTransactions])

  return { transactions, loading, error, refetch: fetchTransactions }
}

// 단일 트랜잭션 상태 추적 훅
export function useTransaction(transactionId: string | null) {
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTransaction = useCallback(async () => {
    if (!transactionId) {
      setTransaction(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      if (error) throw error
      setTransaction(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [transactionId])

  useEffect(() => {
    fetchTransaction()
  }, [fetchTransaction])

  // 실시간 구독
  useEffect(() => {
    if (!transactionId) return

    const channel = supabase
      .channel(`transaction-${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `id=eq.${transactionId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setTransaction(null)
          } else {
            setTransaction(payload.new as Transaction)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [transactionId])

  return { transaction, loading, error, refetch: fetchTransaction }
}
