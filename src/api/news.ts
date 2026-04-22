import request from './client'
import type { NewsItem, RSSItem, Topic, ApiResponse, SearchParams } from '@/types'

// 获取最新新闻
export function getLatestNews(
  platforms?: string[],
  limit = 50,
  includeUrl = false
): Promise<ApiResponse<{
  news: Record<string, NewsItem[]>
  id_to_name: Record<string, string>
  failed_ids: string[]
  crawl_time: string
}>> {
  return request.get('/news/latest', {
    params: {
      platforms,
      limit,
      include_url: includeUrl,
    },
  })
}

// 按日期获取新闻
export function getNewsByDate(
  date: string,
  platforms?: string[],
  limit = 50
): Promise<ApiResponse<{
  news: Record<string, NewsItem[]>
  date: string
}>> {
  return request.get(`/news/${date}`, {
    params: {
      platforms,
      limit,
    },
  })
}

// 搜索新闻
export function searchNews(params: SearchParams): Promise<ApiResponse<{
  query: string
  search_mode: string
  results: NewsItem[]
}>> {
  return request.get('/news/search', { params })
}

// 获取热门话题
export function getTrendingTopics(
  topN = 10,
  mode = 'current'
): Promise<ApiResponse<{
  topics: Topic[]
  mode: string
}>> {
  return request.get('/topics/trending', {
    params: {
      top_n: topN,
      mode,
    },
  })
}

// 获取最新 RSS
export function getLatestRSS(
  feeds?: string[],
  days = 1,
  limit = 50
): Promise<ApiResponse<{
  rss: Record<string, RSSItem[]>
  id_to_name: Record<string, string>
  failed_ids: string[]
  crawl_time: string
}>> {
  return request.get('/rss/latest', {
    params: {
      feeds,
      days,
      limit,
    },
  })
}

// 搜索 RSS
export function searchRSS(
  keyword: string,
  feeds?: string[],
  days = 7,
  limit = 50
): Promise<ApiResponse<{
  keyword: string
  results: RSSItem[]
}>> {
  return request.get('/rss/search', {
    params: {
      keyword,
      feeds,
      days,
      limit,
    },
  })
}

// 获取 RSS 源状态
export function getRSSFeedsStatus(): Promise<ApiResponse<{
  feeds: Record<string, any>
  total: number
}>> {
  return request.get('/rss/feeds/status')
}
