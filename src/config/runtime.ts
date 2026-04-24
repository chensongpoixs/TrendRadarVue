/** 与 public/config.js 中 window.__TRENDRADAR_CONFIG__ 一致 */
export interface TrendradarWindowConfig {
  /** 后端 API 基地址，须含 /api/v1，如 http://host:8080/api/v1 或同源的 /api/v1 */
  apiBase?: string
}

/**
 * 读取 API 基地址：优先 public/config.js（运行时可改），其次 Vite 环境变量，最后默认同路径 /api/v1
 */
export function getApiBaseURL(): string {
  if (typeof window === 'undefined') {
    return import.meta.env.VITE_API_BASE_URL || '/api/v1'
  }
  const fromFile = (window as unknown as { __TRENDRADAR_CONFIG__?: TrendradarWindowConfig })
    .__TRENDRADAR_CONFIG__?.apiBase?.trim()
  if (fromFile) {
    return fromFile.replace(/\/$/, '')
  }
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '')
  }
  return '/api/v1'
}
