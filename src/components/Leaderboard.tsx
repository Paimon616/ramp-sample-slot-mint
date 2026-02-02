import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { supabase } from '../lib/supabase'

interface LeaderboardProps {
  currentUserId?: string
}

interface LeaderboardUser {
  id: string
  username: string
  balance: number
  rank: number
}

export interface LeaderboardRef {
  refresh: () => void
}

const Leaderboard = forwardRef<LeaderboardRef, LeaderboardProps>(({ currentUserId }, ref) => {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('id, username, balance')
        .order('balance', { ascending: false })
        .limit(10)

      if (error) throw error

      const rankedUsers = (data || []).map((user, index) => ({
        ...user,
        rank: index + 1,
      }))

      setUsers(rankedUsers)
    } catch (err) {
      setError('리더보드를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 외부에서 refresh 호출 가능하도록 노출
  useImperativeHandle(ref, () => ({
    refresh: fetchLeaderboard
  }))

  useEffect(() => {
    fetchLeaderboard()

    // 실시간 구독
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        () => {
          fetchLeaderboard()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return `#${rank}`
    }
  }

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'rank-gold'
    if (rank === 2) return 'rank-silver'
    if (rank === 3) return 'rank-bronze'
    return ''
  }

  if (loading) {
    return (
      <div className="leaderboard">
        <h2>🏆 리더보드</h2>
        <div className="leaderboard-loading">불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="leaderboard">
        <h2>🏆 리더보드</h2>
        <div className="leaderboard-error">{error}</div>
      </div>
    )
  }

  return (
    <div className="leaderboard">
      <h2>🏆 리더보드</h2>
      <div className="leaderboard-list">
        {users.length === 0 ? (
          <div className="leaderboard-empty">아직 플레이어가 없습니다</div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className={`leaderboard-item ${getRankClass(user.rank)} ${
                user.id === currentUserId ? 'current-user' : ''
              }`}
            >
              <span className="leaderboard-rank">{getRankEmoji(user.rank)}</span>
              <span className="leaderboard-username">
                {user.username}
                {user.id === currentUserId && <span className="you-badge">YOU</span>}
              </span>
              <span className="leaderboard-balance">
                {user.balance.toLocaleString()} 💰
              </span>
            </div>
          ))
        )}
      </div>
      <button className="leaderboard-refresh" onClick={fetchLeaderboard}>
        🔄 새로고침
      </button>
    </div>
  )
})

Leaderboard.displayName = 'Leaderboard'

export default Leaderboard
