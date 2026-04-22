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
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdateTime = ref<string>('')

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

  // Actions
  async function fetchLatestNews(platforms?: string[]) {
    loading.value = true
    error.value = null

    try {
      const response = await getLatestNews(platforms)
      if (response.data) {
        newsData.value = response.data.news
        idToName.value = response.data.id_to_name
        lastUpdateTime.value = response.data.crawl_time
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
    error.value = null
  }

  return {
    // State
    newsData,
    rssData,
    topics,
    idToName,
    loading,
    error,
    lastUpdateTime,

    // Getters
    allNews,
    allRSS,
    newsCount,
    rssCount,

    // Actions
    fetchLatestNews,
    fetchTrendingTopics,
    fetchLatestRSS,
    clearData,
  }
})
