// 新闻项类型
export interface NewsItem {
  id: number
  title: string
  source_id: string
  source_name: string
  rank: number
  url: string
  mobile_url: string
  crawl_time: string
  first_time: string
  last_time: string
  count: number
  ranks: string
  rank_timeline: string
}

// RSS 项类型
export interface RSSItem {
  id: number
  title: string
  feed_id: string
  feed_name: string
  url: string
  published_at: string
  summary: string
  author: string
  crawl_time: string
  first_time: string
  last_time: string
  count: number
}

// 话题类型
export interface Topic {
  word: string
  count: number
  position: number
  titles: TitleItem[]
  percentage?: number
}

// 标题项
export interface TitleItem {
  title: string
  source_name: string
  url: string
  mobile_url: string
  ranks: string
  rank_threshold: number
  count: number
  is_new: boolean
  time_display: string
}

// API 响应基类
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 新闻列表响应
export interface NewsListResponse {
  news: Record<string, NewsItem[]>
  id_to_name: Record<string, string>
  failed_ids: string[]
  crawl_time: string
}

// 系统状态
export interface SystemStatus {
  version: string
  environment: string
  timezone: string
  uptime: string
  database: string
}

// 平台配置
export interface Platform {
  id: string
  name: string
  enabled: boolean
}

// RSS 源配置
export interface RSSFeed {
  id: string
  name: string
  url: string
  enabled: boolean
  max_items: number
  max_age_days?: number
}

// 搜索参数
export interface SearchParams {
  query: string
  search_mode?: 'keyword' | 'fuzzy' | 'entity'
  date_range?: string
  platforms?: string[]
  limit?: number
  include_url?: boolean
}

// 话题趋势分析参数
export interface TopicTrendParams {
  topic: string
  analysis_type?: 'trend' | 'lifecycle' | 'viral' | 'predict'
  date_range?: string
  granularity?: string
}
