# 🎰 슬롯 머신 게임

React + TypeScript로 구현된 웹 기반 슬롯 머신 게임입니다.

## 주요 기능

- **슬롯 머신 게임**: 5개의 릴과 다양한 심볼로 구성된 슬롯 게임
- **확률 기반 시스템**: 심볼별 출현 확률과 매칭 확률이 적용된 공정한 게임
- **사용자 인증**: 회원가입/로그인 기능
- **리더보드**: 실시간 순위표 (상위 10명)
- **크레딧 시스템**: 베팅 및 잔액 관리

## 게임 규칙

### 심볼 및 배당률 (3개 매칭 기준)

| 심볼 | 배당률 |
|------|--------|
| 🍒 | ×0.3 |
| 🍋 | ×0.5 |
| 🍊 | ×0.7 |
| 🍇 | ×1 |
| 🔔 | ×2 |
| ⭐ | ×5 |
| 💎 | ×10 |

### 매칭 배수

- 3개 매칭: ×1
- 4개 매칭: ×3
- 5개 매칭: ×10 (잭팟!)

## 기술 스택

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite 5
- **Backend**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Supabase 프로젝트

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd slot-machine-game

# 의존성 설치
npm install
```

### 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase 데이터베이스 설정

Supabase에서 다음 테이블을 생성하세요:

```sql
-- users 테이블
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  balance INTEGER DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 실시간 구독을 위한 설정
ALTER TABLE users REPLICA IDENTITY FULL;
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속하세요.

### 프로덕션 빌드

```bash
npm run build
```

### 빌드 미리보기

```bash
npm run preview
```

## 프로젝트 구조

```
├── src/
│   ├── components/
│   │   ├── Auth.tsx          # 로그인/회원가입 컴포넌트
│   │   ├── Leaderboard.tsx   # 리더보드 컴포넌트
│   │   └── SlotMachine.tsx   # 메인 슬롯 머신 컴포넌트
│   ├── hooks/
│   │   └── useSupabase.ts    # Supabase 커스텀 훅
│   ├── lib/
│   │   └── supabase.ts       # Supabase 클라이언트 및 헬퍼 함수
│   ├── types/
│   │   └── database.types.ts # TypeScript 타입 정의
│   ├── App.tsx               # 메인 앱 컴포넌트
│   ├── App.css               # 앱 스타일
│   └── main.tsx              # 앱 진입점
├── components/
│   └── SlotMachine.css       # 슬롯 머신 스타일
├── public/
│   └── slot.svg              # 아이콘
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vercel.json               # Vercel 배포 설정
```

## 라이센스

MIT License
