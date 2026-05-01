import request from './client'
import type { ApiResponse } from '@/types'

// 获取系统状态
export function getSystemStatus(): Promise<ApiResponse<{ version: string; environment: string; timezone: string; uptime: string; database: string }>> {
  return request.get('/system/status')
}

// 获取当前配置
export function getCurrentConfig(section = 'all'): Promise<ApiResponse<any>> {
  return request.get('/system/config', {
    params: { section },
  })
}

// 触发抓取任务
export function triggerCrawl(platforms?: string[], saveToLocal = false): Promise<ApiResponse<any>> {
  return request.post('/system/crawl', {
    platforms,
    save_to_local: saveToLocal,
  })
}

// 从远程同步数据
export function syncFromRemote(days = 7): Promise<ApiResponse<any>> {
  return request.post('/storage/sync', {
    days,
  })
}

// 获取存储状态
export function getStorageStatus(): Promise<ApiResponse<any>> {
  return request.get('/storage/status')
}

// 列出可用日期
export function listAvailableDates(source = 'both'): Promise<ApiResponse<{
  source: string
  dates: string[]
}>> {
  return request.get('/storage/dates', {
    params: { source },
  })
}

// 每日新闻导出到 ModelScope
export function postDailyExport(date?: string): Promise<ApiResponse<{
  date: string
  message: string
}>> {
  return request.post('/daily-export', { date })
}
