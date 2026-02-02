/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // Cross Ramp V2 설정
  readonly VITE_CROSS_RAMP_PROJECT_ID: string
  readonly VITE_CROSS_RAMP_NETWORK: 'mainnet' | 'testnet'
  readonly VITE_CROSS_RAMP_TOKEN_CONTRACT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
