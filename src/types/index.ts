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

// 跨平台合并新闻来源
export interface NewsSource {
  source_id: string
  source_name: string
  rank: number
  url: string
}

// 跨平台合并后的新闻条目
export interface MergedNewsItem {
  title: string
  url: string
  mobile_url: string
  sources: NewsSource[]
  max_rank: number
  crawl_time: string
  total_count: number
}

// 新闻列表响应
export interface NewsListResponse {
  news: Record<string, NewsItem[]>
  merged_news?: MergedNewsItem[]
  id_to_name: Record<string, string>
  failed_ids: string[]
  crawl_time: string
  /** database = 仅读库内数据，不触发外网热榜拉取 */
  source?: string
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

/** 热榜按小时快照表一行（后端 hotlist_snapshots） */
export interface HotlistSnapshotRow {
  id: number
  date_local: string
  hour_local: number
  source_id: string
  source_name: string
  title: string
  url: string
  mobile_url: string
  rank: number
  captured_at: string
}

export interface SnapshotDateInfo {
  date: string
  row_count: number
}

export interface SnapshotHourStat {
  hour: number
  row_count: number
  first_captured: string
  last_captured: string
}

export interface SnapshotDaySummaryData {
  date: string
  timezone: string
  total_rows: number
  hours: SnapshotHourStat[]
  id_to_name: Record<string, string>
}

export interface SnapshotHourData {
  date: string
  hour: number
  timezone: string
  items: HotlistSnapshotRow[]
  id_to_name: Record<string, string>
}

/** 整日热榜聚类后的行业 AI 研报（GET/POST /news/snapshots/:date/insights） */
export interface SnapshotDayInsightsData {
  date: string
  timezone: string
  /** GET：是否已有缓存；POST 成功恒为 true */
  cached: boolean
  content: string
  model?: string
  updated_at?: string
  unique_titles?: number
  raw_snapshot_rows?: number
  digest_truncated?: boolean
}

/** POST /news/analyze 返回 */
export interface NewsArticleAnalyzeData {
  summary: string
  title: string
  url: string
  content_fetched: boolean
  extracted_runes: number
}

/** POST /ai/chat 请求消息 */
export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiTokenUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

/** POST /ai/chat 成功数据 */
export interface AiChatResponseData {
  message: { role: string; content: string }
  usage: AiTokenUsage
  model: string
  timeout?: string
}
