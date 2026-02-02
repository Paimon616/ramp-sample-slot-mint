import { useState, useEffect, useCallback, useRef } from 'react'
import SlotMachine from './components/SlotMachine'
import Auth from './components/Auth'
import Leaderboard, { type LeaderboardRef } from './components/Leaderboard'
import { supabase } from './lib/supabase'
import type { User } from './types/database.types'
import './App.css'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const leaderboardRef = useRef<LeaderboardRef>(null)

  // 로컬 스토리지에서 유저 정보 복원
  useEffect(() => {
    const savedUserId = localStorage.getItem('slotUserId')
    if (savedUserId) {
      supabase
        .from('users')
        .select('*')
        .eq('id', savedUserId)
        .single()
        .then(({ data }) => {
          if (data) {
            setUser(data)
          }
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser)
    localStorage.setItem('slotUserId', loggedInUser.id)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('slotUserId')
  }

  const handleCreditsChange = async (newCredits: number) => {
    if (!user) return

    // Supabase에 잔액 업데이트
    const { error } = await supabase
      .from('users')
      .update({ balance: newCredits })
      .eq('id', user.id)

    if (!error) {
      setUser({ ...user, balance: newCredits })
    }
  }

  // 승리 확인 시 리더보드 갱신
  const handleWinConfirm = useCallback(() => {
    leaderboardRef.current?.refresh()
  }, [])

  if (loading) {
    return (
      <div className="app">
        <div className="loading">로딩 중...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app">
        <Auth onLogin={handleLogin} />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="user-info">
          <span className="welcome">
            환영합니다, <strong>{user.username}</strong>님!
          </span>
          <span className="user-balance">💰 {user.balance.toLocaleString()}</span>
        </div>
        <div className="header-actions">
          <button className="logout-btn" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </header>

      <div className="main-content">
        <div className="game-section">
          <SlotMachine
            initialCredits={user.balance}
            onCreditsChange={handleCreditsChange}
            onWinConfirm={handleWinConfirm}
          />
        </div>
        <aside className="sidebar">
          <Leaderboard ref={leaderboardRef} currentUserId={user.id} />
        </aside>
      </div>
    </div>
  )
}

export default App
