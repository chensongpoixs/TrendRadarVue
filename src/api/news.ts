import request from './client'
import type {
  NewsItem,
  RSSItem,
  Topic,
  ApiResponse,
  SearchParams,
  MergedNewsItem,
  SnapshotDateInfo,
  SnapshotDaySummaryData,
  SnapshotDayInsightsData,
  SnapshotHourData,
} from '@/types'

/** 单条新闻：拉取（若可）正文并由 AI 生成读报式摘要（需用户主动点击，非自动） */
export function analyzeNewsArticle(body: {
  title: string
  url: string
  source_name?: string
}): Promise<
  ApiResponse<{
    summary: string
    title: string
    url: string
    content_fetched: boolean
    extracted_runes: number
  }>
> {
  // 需拉取正文 + LLM，可能明显长于默认 30s
  return request.post('/news/analyze', body, { timeout: 180000 })
}

// 获取最新新闻
export function getLatestNews(
  platforms?: string[],
  limit = 50,
  includeUrl = false
): Promise<
  ApiResponse<{
    news: Record<string, NewsItem[]>
    merged_news?: MergedNewsItem[]
    id_to_name: Record<string, string>
    failed_ids?: string[]
    crawl_time: string
    source?: string
  }>
> {
  return request.get('/news/latest', {
    params: {
      platforms,
      limit,
      include_url: includeUrl,
    },
  })
}

/** 有热榜快照的日期列表（新→旧） */
export function getSnapshotAvailableDates(days = 60): Promise<
  ApiResponse<{ dates: SnapshotDateInfo[]; timezone: string }>
> {
  return request.get('/news/snapshots/dates', {
    params: { days },
  })
}

/** 某日各小时汇总 */
export function getSnapshotDaySummary(date: string): Promise<
  ApiResponse<SnapshotDaySummaryData>
> {
  return request.get(`/news/snapshots/${date}/summary`)
}

/** 某日某小时热榜（URL 去重保留最新一次） */
export function getSnapshotHour(
  date: string,
  hour: number,
  platforms?: string[]
): Promise<ApiResponse<SnapshotHourData>> {
  const search = new URLSearchParams()
  if (platforms?.length) {
    for (const id of platforms) {
      search.append('platforms', id)
    }
  }
  const q = search.toString()
  const path =
    '/news/snapshots/' + encodeURIComponent(date) + '/hour/' + String(hour) + (q ? '?' + q : '')
  return request.get(path)
}

/** 该日行业 AI 研报（有缓存则直接返回） */
export function getSnapshotDayInsights(
  date: string
): Promise<ApiResponse<SnapshotDayInsightsData>> {
  return request.get(
    '/news/snapshots/' + encodeURIComponent(date) + '/insights'
  )
}

/**
 * 基于整日热榜标题流生成并缓存行业研报；可能耗时数分钟
 * @param platforms 与小时列表相同的平台筛选；不传表示全日全平台
 */
export function postSnapshotDayInsights(
  date: string,
  platforms?: string[]
): Promise<ApiResponse<SnapshotDayInsightsData>> {
  const search = new URLSearchParams()
  if (platforms?.length) {
    for (const id of platforms) {
      search.append('platforms', id)
    }
  }
  const q = search.toString()
  return request.post(
    '/news/snapshots/' + encodeURIComponent(date) + '/insights' + (q ? '?' + q : ''),
    {},
    { timeout: 300000 }
  )
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
): Promise<  ApiResponse<{
  rss: Record<string, RSSItem[]>
  id_to_name: Record<string, string>
  failed_ids: string[]
  crawl_time: string
  source?: string
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
