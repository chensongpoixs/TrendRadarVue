import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NewsItem, RSSItem, Topic } from '@/types'
import { getLatestNews, getTrendingTopics, getLatestRSS } from '@/api/news'

export const useNewsStore = defineStore('news', () => {
  // State
  const newsData = ref<Record<string, NewsItem[]>>({})
  const rssData = ref<Record<string, RSSItem[]>>({})
  const topics = ref<Topic[]>([])
  const idToName = ref<Record<string, string>>({})
  const failedIds = ref<string[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdateTime = ref<string>('')
  /** 与后端约定：database 表示热榜为库内快照，由定时任务写入 */
  const newsDataSource = ref<string>('')

  // Getters
  const allNews = computed(() => {
    const newsList: NewsItem[] = []
    Object.values(newsData.value).forEach(items => {
      newsList.push(...items)
    })
    return newsList
  })

  const allRSS = computed(() => {
    const rssList: RSSItem[] = []
    Object.values(rssData.value).forEach(items => {
      rssList.push(...items)
    })
    return rssList
  })

  const newsCount = computed(() => allNews.value.length)
  const rssCount = computed(() => allRSS.value.length)

  /** 已返回数据的平台数（有至少一条热榜） */
  const hotlistPlatformCount = computed(
    () => Object.keys(newsData.value).filter((k) => (newsData.value[k]?.length ?? 0) > 0).length
  )

  // Actions
  async function fetchLatestNews(
    platforms?: string[],
    limit = 50,
    includeUrl = true
  ) {
    loading.value = true
    error.value = null

    try {
      const response = await getLatestNews(platforms, limit, includeUrl)
      if (response.data) {
        newsData.value = response.data.news
        idToName.value = response.data.id_to_name
        failedIds.value = response.data.failed_ids ?? []
        lastUpdateTime.value = response.data.crawl_time
        newsDataSource.value = response.data.source ?? ''
      }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTrendingTopics(topN = 10, mode = 'current') {
    loading.value = true
    error.value = null

    try {
      const response = await getTrendingTopics(topN, mode)
      if (response.data) {
        topics.value = response.data.topics
      }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchLatestRSS(feeds?: string[]) {
    loading.value = true
    error.value = null

    try {
      const response = await getLatestRSS(feeds)
      if (response.data) {
        rssData.value = response.data.rss
        idToName.value = { ...idToName.value, ...response.data.id_to_name }
        lastUpdateTime.value = response.data.crawl_time
        if (response.data.source) {
          newsDataSource.value = response.data.source
        }
      }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearData() {
    newsData.value = {}
    rssData.value = {}
    topics.value = []
    failedIds.value = []
    error.value = null
    newsDataSource.value = ''
  }

  return {
    // State
    newsData,
    rssData,
    topics,
    idToName,
    failedIds,
    loading,
    error,
    lastUpdateTime,
    newsDataSource,

    // Getters
    allNews,
    allRSS,
    newsCount,
    rssCount,
    hotlistPlatformCount,

    // Actions
    fetchLatestNews,
    fetchTrendingTopics,
    fetchLatestRSS,
    clearData,
  }
})
