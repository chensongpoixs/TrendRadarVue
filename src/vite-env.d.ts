/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** public/config.js 在全局挂载（先于应用模块执行） */
interface Window {
  __TRENDRADAR_CONFIG__?: { apiBase?: string }
}
