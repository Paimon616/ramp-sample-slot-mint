import { useState, useEffect, useCallback, useRef } from 'react'
import '../../components/SlotMachine.css'

// 심볼 정의
const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🔔', '⭐', '💎']

// 배당률 (3개 매칭 기준)
const PAYOUTS: Record<string, number> = {
  '🍒': 0.3,
  '🍋': 0.5,
  '🍊': 0.7,
  '🍇': 1,
  '🔔': 2,
  '⭐': 5,
  '💎': 10
}

// 심볼 출현 확률 (배당이 높을수록 낮은 확률)
const SYMBOL_WEIGHTS: Record<string, number> = {
  '🍒': 25,  // 가장 흔함
  '🍋': 20,
  '🍊': 18,
  '🍇': 15,
  '🔔': 12,
  '⭐': 9,
  '💎': 1
}

// 매칭 개수 확률표 (%)
const MATCH_PROBABILITIES = {
  0: 30,   // 매칭 없음: 30%
  2: 25,   // 2개 매칭: 25%
  3: 20,   // 3개 매칭: 20%
  4: 15,   // 4개 매칭: 15%
  5: 10,   // 5개 매칭 (잭팟): 10%
}

// 3개 매칭 배수
const THREE_MATCH_MULTIPLIER = 1
// 4개 매칭 배수
const FOUR_MATCH_MULTIPLIER = 3
// 5개 매칭 배수 (잭팟)
const FIVE_MATCH_MULTIPLIER = 10

const REELS = 5
const ROWS = 3
const SPIN_DURATION = 1500 // 최초 1열이 멈추는 시간 (1.5초)
const REEL_DELAY = 200
const MATCH_SUSPENSE_DELAY = 2000 // 매칭 시 다음 릴 지연 시간

type Grid = string[][]

interface WinResult {
  symbol: string
  count: number
  payout: number
  positions: number[]
}

interface SpinResult {
  matchCount: number
  symbol: string | null
}

// 가중치 기반 랜덤 심볼 선택
function getWeightedRandomSymbol(excludeSymbol?: string): string {
  const availableSymbols = excludeSymbol 
    ? SYMBOLS.filter(s => s !== excludeSymbol)
    : SYMBOLS
  
  const totalWeight = availableSymbols.reduce((sum, s) => sum + SYMBOL_WEIGHTS[s], 0)
  let random = Math.random() * totalWeight
  
  for (const symbol of availableSymbols) {
    random -= SYMBOL_WEIGHTS[symbol]
    if (random <= 0) return symbol
  }
  
  return availableSymbols[availableSymbols.length - 1]
}

// 확률표에 따라 매칭 개수 결정
function determineMatchCount(): number {
  const random = Math.random() * 100
  let cumulative = 0
  
  for (const [count, probability] of Object.entries(MATCH_PROBABILITIES)) {
    cumulative += probability
    if (random < cumulative) {
      return parseInt(count)
    }
  }
  
  return 0
}

// 스핀 결과 결정 (확률표 기반)
function determineSpinResult(): SpinResult {
  const matchCount = determineMatchCount()
  
  if (matchCount === 0) {
    return { matchCount: 0, symbol: null }
  }
  
  // 매칭될 심볼 선택 (가중치 기반)
  const symbol = getWeightedRandomSymbol()
  
  return { matchCount, symbol }
}

// 결정된 결과에 맞게 그리드 생성
function generateGridFromResult(result: SpinResult): Grid {
  const grid: Grid = Array(ROWS).fill(null).map(() => Array(REELS).fill(''))
  const mainLineRow = 1 // 중간 행
  
  if (result.matchCount === 0 || !result.symbol) {
    // 매칭 없음: 첫 두 심볼이 다르게 설정
    const firstSymbol = getWeightedRandomSymbol()
    const secondSymbol = getWeightedRandomSymbol(firstSymbol)
    
    grid[mainLineRow][0] = firstSymbol
    grid[mainLineRow][1] = secondSymbol
    
    // 나머지 열은 랜덤
    for (let col = 2; col < REELS; col++) {
      grid[mainLineRow][col] = getWeightedRandomSymbol()
    }
  } else {
    // 매칭 있음: 왼쪽부터 matchCount개의 심볼을 동일하게
    for (let col = 0; col < result.matchCount; col++) {
      grid[mainLineRow][col] = result.symbol
    }
    
    // 나머지 열은 다른 심볼로 채움 (연속 매칭 방지)
    for (let col = result.matchCount; col < REELS; col++) {
      grid[mainLineRow][col] = getWeightedRandomSymbol(result.symbol)
    }
  }
  
  // 상단, 하단 행은 완전 랜덤
  for (let row = 0; row < ROWS; row++) {
    if (row === mainLineRow) continue
    for (let col = 0; col < REELS; col++) {
      grid[row][col] = getWeightedRandomSymbol()
    }
  }
  
  return grid
}

interface SlotMachineProps {
  initialCredits?: number
  onCreditsChange?: (credits: number) => void
  onWinConfirm?: () => void
}

function SlotMachine({ initialCredits = 1000, onCreditsChange, onWinConfirm }: SlotMachineProps) {
  const [credits, setCredits] = useState(initialCredits)
  const [bet, setBet] = useState(10)
  const [grid, setGrid] = useState<Grid>(() => generateGridFromResult({ matchCount: 0, symbol: null }))
  const [spinning, setSpinning] = useState(false)
  const [spinningReels, setSpinningReels] = useState<boolean[]>(Array(REELS).fill(false))
  const [_lastWin, setLastWin] = useState<number | null>(null)
  const [winResult, setWinResult] = useState<WinResult | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [matchedPositions, setMatchedPositions] = useState<number[]>([])
  const [matchFlash, setMatchFlash] = useState(false)
  const [effectLevel, setEffectLevel] = useState<'none' | 'great' | 'mega'>('none')
  const spinIntervalRefs = useRef<(number | null)[]>(Array(REELS).fill(null))
  const prevCreditsRef = useRef(initialCredits)

  // 크레딧이 변경되면 부모에게 알림
  useEffect(() => {
    if (credits !== prevCreditsRef.current && onCreditsChange) {
      onCreditsChange(credits)
      prevCreditsRef.current = credits
    }
  }, [credits, onCreditsChange])

  // initialCredits가 변경되면 동기화
  useEffect(() => {
    if (initialCredits !== credits && !spinning) {
      setCredits(initialCredits)
      prevCreditsRef.current = initialCredits
    }
  }, [initialCredits])

  // 스핀 결과를 WinResult로 변환
  function createWinResult(result: SpinResult, currentBet: number): WinResult | null {
    if (result.matchCount < 3 || !result.symbol) return null
    
    let multiplier = 1
    if (result.matchCount === 3) multiplier = THREE_MATCH_MULTIPLIER
    else if (result.matchCount === 4) multiplier = FOUR_MATCH_MULTIPLIER
    else if (result.matchCount === 5) multiplier = FIVE_MATCH_MULTIPLIER
    
    const basePayout = PAYOUTS[result.symbol] || 10
    const payout = Math.floor(basePayout * multiplier * currentBet)
    const positions = Array.from({ length: result.matchCount }, (_, i) => i)
    
    return {
      symbol: result.symbol,
      count: result.matchCount,
      payout,
      positions
    }
  }

  // 릴 멈추기 함수
  const stopReel = useCallback((reel: number, finalGrid: Grid) => {
    // 인터벌 정지
    if (spinIntervalRefs.current[reel]) {
      clearInterval(spinIntervalRefs.current[reel]!)
      spinIntervalRefs.current[reel] = null
    }
    
    // 최종 심볼 설정
    setGrid(prev => {
      const newGrid = prev.map(row => [...row])
      for (let row = 0; row < ROWS; row++) {
        newGrid[row][reel] = finalGrid[row][reel]
      }
      return newGrid
    })
    
    // 해당 릴 스핀 상태 해제
    setSpinningReels(prev => {
      const newState = [...prev]
      newState[reel] = false
      return newState
    })
  }, [])

  // 스핀 애니메이션
  const spin = useCallback(() => {
    if (spinning || credits < bet) return
    
    setSpinning(true)
    setLastWin(null)
    setWinResult(null)
    setMatchedPositions([])
    setMatchFlash(false)
    setEffectLevel('none')
    setCredits(prev => prev - bet)
    
    // 🎯 스핀 시작 시점에 결과 먼저 결정 (확률표 기반)
    const spinResult = determineSpinResult()
    const finalGrid = generateGridFromResult(spinResult)
    const predeterminedWin = createWinResult(spinResult, bet)
    
    console.log('🎰 스핀 결과 결정:', {
      matchCount: spinResult.matchCount,
      symbol: spinResult.symbol,
      payout: predeterminedWin?.payout
    })
    
    // 모든 릴 스핀 시작
    const newSpinning = Array(REELS).fill(true)
    setSpinningReels(newSpinning)
    
    // 각 릴마다 빠르게 심볼 변경 (연출용)
    for (let reel = 0; reel < REELS; reel++) {
      spinIntervalRefs.current[reel] = window.setInterval(() => {
        setGrid(prev => {
          const newGrid = prev.map(row => [...row])
          for (let row = 0; row < ROWS; row++) {
            newGrid[row][reel] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
          }
          return newGrid
        })
      }, 50)
    }
    
    // 순차적으로 릴 멈추기 (매칭 시 지연 적용)
    const stopReelsSequentially = async () => {
      // 미리 결정된 매칭 개수 사용
      const predeterminedMatchCount = spinResult.matchCount
      let revealedMatchCount = 0
      
      for (let reel = 0; reel < REELS; reel++) {
        // 기본 대기 시간
        let waitTime = reel === 0 ? SPIN_DURATION : REEL_DELAY
        
        // 매칭 상태에 따른 추가 지연 (미리 결정된 결과 기반)
        // 1,2,3열 매칭 후 4열 지연 (3개 이상 매칭 예정일 때)
        // 1,2,3,4열 매칭 후 5열 지연 (4개 이상 매칭 예정일 때)
        if ((reel === 2 && predeterminedMatchCount >= 2) || 
            (reel === 3 && predeterminedMatchCount >= 3) || 
            (reel === 4 && predeterminedMatchCount >= 4)) {
          waitTime += MATCH_SUSPENSE_DELAY
        }
        
        await new Promise(resolve => setTimeout(resolve, waitTime))
        
        // 릴 멈추기 (미리 결정된 결과 표시)
        stopReel(reel, finalGrid)
        
        // 현재 릴까지 매칭 확인 (연출용)
        if (reel < predeterminedMatchCount) {
          revealedMatchCount++
        }
        
        // 3개 매칭 체크 (릴 3개 멈췄을 때)
        if (reel === 2 && predeterminedMatchCount >= 3) {
          setMatchFlash(true)
          setMatchedPositions([0, 1, 2])
          setTimeout(() => setMatchFlash(false), 600)
        }
        
        // 4개 매칭 체크 (릴 4개 멈췄을 때)
        if (reel === 3 && predeterminedMatchCount >= 4) {
          setMatchFlash(true)
          setMatchedPositions([0, 1, 2, 3])
          setTimeout(() => setMatchFlash(false), 600)
        }
        
        // 5개 매칭 체크 (릴 5개 멈췄을 때)
        if (reel === 4 && predeterminedMatchCount >= 5) {
          setMatchFlash(true)
          setMatchedPositions([0, 1, 2, 3, 4])
          setTimeout(() => setMatchFlash(false), 600)
        }
      }
      
      // 모든 릴이 멈추면 결과 확인 (미리 결정된 결과 사용)
      setTimeout(() => {
        setSpinning(false)
        
        if (predeterminedWin) {
          setMatchedPositions(predeterminedWin.positions)
          setCredits(prev => prev + predeterminedWin.payout)
          
          // 3개 이상 매칭시에만 lastWin 표시 및 팝업
          if (predeterminedWin.count >= 3) {
            setLastWin(predeterminedWin.payout)
            setWinResult(predeterminedWin)
            setShowPopup(true)
            
            // 효과 레벨 설정
            if (predeterminedWin.count >= 5) {
              setEffectLevel('mega')
            } else if (predeterminedWin.count >= 4) {
              setEffectLevel('great')
            }
          }
        }
      }, 100)
    }
    
    stopReelsSequentially()
  }, [spinning, credits, bet, stopReel])

  // 키보드 이벤트
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spinning) {
        e.preventDefault()
        spin()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [spin, spinning])

  // 컴포넌트 언마운트시 인터벌 정리
  useEffect(() => {
    return () => {
      spinIntervalRefs.current.forEach(interval => {
        if (interval) clearInterval(interval)
      })
    }
  }, [])

  const getEffectClass = () => {
    if (effectLevel === 'mega') return 'effect-mega'
    if (effectLevel === 'great') return 'effect-great'
    return ''
  }

  const getWinLevel = (result: WinResult): 'normal' | 'great' | 'mega' => {
    if (result.count >= 5) return 'mega'
    if (result.count >= 4) return 'great'
    return 'normal'
  }

  return (
    <div className={`slot-machine ${getEffectClass()}`}>
      {/* 슬롯 디스플레이 */}
      <div className="slot-display">
        <div className="slot-frame">
          {/* 상단 딤 영역 */}
          <div className="dim-area">
            <div className="dim-overlay" />
            <div className="dim-rows">
              <div className="slot-row dim">
                {grid[0].map((symbol, col) => (
                  <div
                    key={`top-${col}`}
                    className={`slot-cell ${spinningReels[col] ? 'spinning' : ''}`}
                  >
                    <span className="symbol">{symbol}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* 메인 라인 (중간 행) */}
          <div className={`main-line ${matchFlash ? 'match-flash' : ''}`}>
            <div className="payline-indicator">▶</div>
            <div className="slot-row main">
              {grid[1].map((symbol, col) => (
                <div
                  key={`main-${col}`}
                  className={`slot-cell main-cell 
                    ${spinningReels[col] ? 'spinning' : ''} 
                    ${matchedPositions.includes(col) && !spinning ? 'matched' : ''}
                    ${col === 2 && matchedPositions.length >= 2 && spinningReels[col] ? 'highlighted' : ''}
                    ${matchedPositions.length >= 2 && col >= matchedPositions.length && spinningReels[col] ? 'excited' : ''}
                  `}
                >
                  <span className="symbol">{symbol}</span>
                </div>
              ))}
            </div>
            <div className="payline-indicator">◀</div>
          </div>
          
          {/* 하단 딤 영역 */}
          <div className="dim-area">
            <div className="dim-overlay" />
            <div className="dim-rows">
              <div className="slot-row dim">
                {grid[2].map((symbol, col) => (
                  <div
                    key={`bottom-${col}`}
                    className={`slot-cell ${spinningReels[col] ? 'spinning' : ''}`}
                  >
                    <span className="symbol">{symbol}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 정보 패널 */}
      <div className="info-panel">
        <div className="bet-control">
          <div className="bet-header">
            <span className="label">베팅 금액</span>
            <span className="bet-value">{bet.toLocaleString()}</span>
          </div>
          <div className="bet-slider-container">
            <input
              type="range"
              className="bet-slider"
              min={10}
              max={Math.max(10, credits)}
              step={10}
              value={bet}
              onChange={(e) => setBet(Math.min(Number(e.target.value), credits))}
              disabled={spinning}
            />
            <div className="bet-ratio-labels">
              <span>MIN</span>
              <span 
                className="ratio-btn"
                onClick={() => !spinning && setBet(Math.max(10, Math.floor(credits * 0.25 / 10) * 10))}
              >25%</span>
              <span 
                className="ratio-btn"
                onClick={() => !spinning && setBet(Math.max(10, Math.floor(credits * 0.5 / 10) * 10))}
              >50%</span>
              <span 
                className="ratio-btn"
                onClick={() => !spinning && setBet(Math.max(10, Math.floor(credits * 0.75 / 10) * 10))}
              >75%</span>
              <span>MAX</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 스핀 버튼 */}
      <button
        className={`spin-button ${spinning ? 'spinning' : ''}`}
        onClick={spin}
        disabled={spinning || credits < bet}
      >
        {spinning ? '돌아가는 중...' : 'SPIN'}
      </button>
      
      {/* 배당표 */}
      <div className="paytable">
        <h3>배당표 (3개 매칭 기준)</h3>
        <div className="paytable-items">
          {Object.entries(PAYOUTS).map(([symbol, payout]) => (
            <div key={symbol} className="paytable-item">
              <span className="symbol">{symbol}</span>
              <span className="payout">×{payout}</span>
            </div>
          ))}
        </div>
        <div className="multiplier-info">
          <p>3개 매칭: ×1 | 4개 매칭: ×3 | 5개 매칭: ×10 (잭팟!)</p>
        </div>
      </div>
      
      {/* 승리 팝업 */}
      {showPopup && winResult && (
        <div className={`win-popup-overlay ${getWinLevel(winResult)}`}>
          <div className={`win-popup ${getWinLevel(winResult)}`}>
            <div className={`popup-title ${getWinLevel(winResult)}`}>
              <span className="jackpot-emoji">🎰</span>
              <span className="title-text">
                {winResult.count >= 5 ? 'MEGA JACKPOT!' : 
                 winResult.count >= 4 ? 'GREAT WIN!' : 'YOU WIN!'}
              </span>
              <span className="jackpot-emoji">🎰</span>
            </div>
            <div className="popup-subtitle">
              {winResult.count}개 연속 매칭!
            </div>
            
            <div className="matched-symbols">
              {winResult.positions.map((_, idx) => (
                <span key={idx} className="matched-symbol">
                  {winResult.symbol}
                </span>
              ))}
            </div>
            
            <div className="calculation-details">
              <div className="calc-row">
                <span className="calc-label">심볼</span>
                <span className="calc-value">{winResult.symbol}</span>
              </div>
              <div className="calc-row">
                <span className="calc-label">기본 배당</span>
                <span className="calc-value">×{PAYOUTS[winResult.symbol]}</span>
              </div>
              <div className="calc-row">
                <span className="calc-label">매칭 배수</span>
                <span className="calc-value highlight">
                  ×{winResult.count === 3 ? 1 : 
                    winResult.count === 4 ? FOUR_MATCH_MULTIPLIER : 
                    FIVE_MATCH_MULTIPLIER}
                </span>
              </div>
              <div className="calc-row">
                <span className="calc-label">베팅 금액</span>
                <span className="calc-value">{bet}</span>
              </div>
              <div className="calc-divider" />
              <div className="calc-row formula">
                <span className="calc-label">계산</span>
                <span className="calc-value">
                  {PAYOUTS[winResult.symbol]} × {
                    winResult.count === 3 ? 1 : 
                    winResult.count === 4 ? FOUR_MATCH_MULTIPLIER : 
                    FIVE_MATCH_MULTIPLIER
                  } × {bet}
                </span>
              </div>
            </div>
            
            <div className={`win-total ${getWinLevel(winResult)}`}>
              <span className="total-label">총 획득 금액</span>
              <span className="total-amount">
                +{winResult.payout.toLocaleString()}
              </span>
            </div>
            
            <button
              className="close-popup-btn"
              onClick={() => {
                setShowPopup(false)
                setEffectLevel('none')
                onWinConfirm?.()
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SlotMachine
