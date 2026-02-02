import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '../types/database.types'

interface AuthProps {
  onLogin: (user: User) => void
}

type AuthMode = 'login' | 'register'

interface PinInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  label: string
}

function PinInput({ value, onChange, disabled, label }: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  
  // 항상 4개의 요소를 가진 배열 생성
  const getDigits = () => {
    return Array.from({ length: 4 }, (_, i) => value[i] || '')
  }

  const handleChange = (_index: number, inputValue: string) => {
    if (disabled) return
    
    // 숫자만 허용
    const digit = inputValue.replace(/\D/g, '').slice(-1)
    
    if (digit) {
      // 현재 value 뒤에 새 숫자 추가 (최대 4자리)
      const newValue = (value + digit).slice(0, 4)
      onChange(newValue)
      
      // 다음 칸으로 이동
      const nextIndex = newValue.length
      if (nextIndex < 4) {
        setTimeout(() => {
          inputRefs.current[nextIndex]?.focus()
        }, 0)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
    
    if (e.key === 'Backspace') {
      e.preventDefault()
      
      // 현재 입력된 값의 길이 확인
      const currentLength = value.length
      
      if (currentLength > 0) {
        // 마지막 문자 삭제
        const newValue = value.slice(0, -1)
        onChange(newValue)
        
        // 삭제 후 해당 위치로 포커스 이동
        setTimeout(() => {
          inputRefs.current[newValue.length]?.focus()
        }, 0)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pastedData) {
      onChange(pastedData)
      const focusIndex = Math.min(pastedData.length, 3)
      inputRefs.current[focusIndex]?.focus()
    }
  }

  const handleFocus = (index: number) => {
    // 빈 칸을 클릭하면 입력된 마지막 위치 다음으로 포커스 이동
    const currentLength = value.length
    if (index > currentLength && currentLength < 4) {
      inputRefs.current[currentLength]?.focus()
    }
  }

  const digits = getDigits()

  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="pin-input-container">
        {[0, 1, 2, 3].map((index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digits[index]}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            disabled={disabled}
            className="pin-input"
          />
        ))}
      </div>
    </div>
  )
}

function Auth({ onLogin }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single()

      if (error || !data) {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.')
        return
      }

      onLogin(data)
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 유효성 검사
    if (username.length < 3) {
      setError('아이디는 3자 이상이어야 합니다.')
      return
    }

    if (!/^\d{4}$/.test(password)) {
      setError('비밀번호는 숫자 4자리여야 합니다.')
      return
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)

    try {
      // 중복 아이디 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single()

      if (existingUser) {
        setError('이미 존재하는 아이디입니다.')
        return
      }

      // 새 유저 생성
      const { data, error } = await supabase
        .from('users')
        .insert({
          username,
          password,
          balance: 1000, // 초기 크레딧
        })
        .select()
        .single()

      if (error) {
        console.error('Registration error:', error)
        setError('회원가입 중 오류가 발생했습니다.')
        return
      }

      if (data) {
        onLogin(data)
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🎰 슬롯 머신</h1>
          <p>{mode === 'login' ? '로그인하여 게임을 시작하세요' : '새 계정을 만들어보세요'}</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login')
              setError(null)
            }}
          >
            로그인
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register')
              setError(null)
            }}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          <div className="form-group">
            <label htmlFor="username">아이디</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              required
              disabled={loading}
            />
          </div>

          <PinInput
            label="비밀번호 (숫자 4자리)"
            value={password}
            onChange={setPassword}
            disabled={loading}
          />

          {mode === 'register' && (
            <PinInput
              label="비밀번호 확인"
              value={confirmPassword}
              onChange={setConfirmPassword}
              disabled={loading}
            />
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        {mode === 'register' && (
          <div className="auth-info">
            <p>💰 가입 시 1,000 크레딧이 지급됩니다!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Auth
