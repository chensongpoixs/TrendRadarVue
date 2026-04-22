<template>
  <div class="rss-page">
    <!-- RSS 源列表 -->
    <el-card class="feeds-card">
      <template #header>
        <div class="card-header">
          <span>RSS 订阅源</span>
          <el-button type="primary" link @click="loadFeeds">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col
          v-for="feed in rssFeeds"
          :key="feed.id"
          :span="8"
        >
          <el-card shadow="hover" class="feed-card">
            <div class="feed-header">
              <div class="feed-name">{{ feed.name }}</div>
              <el-tag
                :type="feed.enabled ? 'success' : 'info'"
                size="small"
              >
                {{ feed.enabled ? '启用' : '禁用' }}
              </el-tag>
            </div>
            <div class="feed-url">
              <el-icon><Link /></el-icon>
              <a :href="feed.url" target="_blank" rel="noopener noreferrer">
                {{ feed.url }}
              </a>
            </div>
            <div class="feed-stats">
              <span>最大条目：{{ feed.max_items || '无限制' }}</span>
              <span v-if="feed.max_age_days"> | 保留：{{ feed.max_age_days }}天</span>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-empty v-if="rssFeeds.length === 0" description="暂无 RSS 订阅源" />
    </el-card>

    <!-- RSS 新闻列表 -->
    <el-card class="rss-news-card">
      <template #header>
        <div class="card-header">
          <span>RSS 新闻</span>
          <span class="count">共 {{ allRSS.length }} 条</span>
        </div>
      </template>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>

      <!-- 空状态 -->
      <el-empty v-else-if="allRSS.length === 0" description="暂无 RSS 新闻" />

      <!-- 按源分组显示 -->
      <div v-else class="rss-groups">
        <div
          v-for="(items, feedId) in rssByFeed"
          :key="feedId"
          class="rss-group"
        >
          <div class="group-header">
            <h4>{{ newsStore.idToName[feedId] || feedId }}</h4>
            <el-tag size="small">{{ items.length }} 条</el-tag>
          </div>
          <div class="group-news">
            <div
              v-for="item in items"
              :key="item.id"
              class="rss-news-item"
            >
              <div class="rss-news-content">
                <h3 class="rss-news-title">
                  <a :href="item.url" target="_blank" rel="noopener noreferrer">
                    {{ item.title }}
                  </a>
                </h3>
                <div v-if="item.summary" class="rss-news-summary">
                  {{ truncateText(item.summary, 200) }}
                </div>
                <div class="rss-news-meta">
                  <span v-if="item.author" class="author">
                    <el-icon><User /></el-icon>
                    {{ item.author }}
                  </span>
                  <span class="time">
                    {{ formatTime(item.published_at || item.crawl_time) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import { useNewsStore } from '@/stores/news'
import { getRSSFeedsStatus } from '@/api/news'
import type { RSSItem } from '@/types'

const newsStore = useNewsStore()

// 状态
const loading = ref(false)
const rssFeeds = ref<any[]>([])

// 所有 RSS 新闻（扁平化）
const allRSS = computed(() => {
  const rssList: RSSItem[] = []
  Object.values(newsStore.rssData).forEach(items => {
    rssList.push(...items)
  })
  return rssList
})

// 按源分组的 RSS 新闻
const rssByFeed = computed(() => {
  const groups: Record<string, RSSItem[]> = {}
  Object.entries(newsStore.rssData).forEach(([feedId, items]) => {
    groups[feedId] = items
  })
  return groups
})

// 加载 RSS 源状态
async function loadFeeds() {
  try {
    const response = await getRSSFeedsStatus()
    if (response.data?.feeds) {
      rssFeeds.value = Object.entries(response.data.feeds).map(([id, feed]: any) => ({
        id,
        ...feed,
      }))
    }
  } catch (error: any) {
    console.error('Failed to load feeds:', error)
  }
}

// 加载 RSS 新闻
async function loadRSS() {
  loading.value = true
  try {
    await newsStore.fetchLatestRSS()
  } catch (error: any) {
    console.error('Failed to load RSS:', error)
  } finally {
    loading.value = false
  }
}

// 截断文本
function truncateText(text: string, length: number): string {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

// 格式化时间
function formatTime(timeStr: string): string {
  if (!timeStr) return '-'
  const day = dayjs(timeStr)
  if (day.isSame(dayjs(), 'day')) {
    return day.format('HH:mm')
  }
  if (day.isSame(dayjs().subtract(1, 'day'), 'day')) {
    return '昨天 ' + day.format('HH:mm')
  }
  return day.format('MM-DD HH:mm')
}

// 初始化
onMounted(async () => {
  await loadFeeds()
  await loadRSS()
})
</script>

<style scoped>
.rss-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.count {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

/* RSS 源卡片 */
.feeds-card {
  margin-bottom: 20px;
}

.feed-card {
  transition: all 0.3s;
}

.feed-card:hover {
  transform: translateY(-2px);
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.feed-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.feed-url {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.feed-url a {
  color: var(--el-color-primary);
  text-decoration: none;
}

.feed-url a:hover {
  text-decoration: underline;
}

.feed-stats {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* RSS 新闻卡片 */
.rss-news-card {
  margin-top: 20px;
}

.loading-container {
  padding: 20px 0;
}

.rss-groups {
  padding: 10px 0;
}

.rss-group {
  margin-bottom: 24px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: var(--el-fill-color);
  border-radius: 6px;
  margin-bottom: 12px;
}

.group-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.group-news {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rss-news-item {
  padding: 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  transition: all 0.3s;
}

.rss-news-item:hover {
  background-color: var(--el-fill-color);
  transform: translateX(4px);
}

.rss-news-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rss-news-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.rss-news-title a {
  color: var(--el-text-color-primary);
  text-decoration: none;
}

.rss-news-title a:hover {
  color: var(--el-color-primary);
  text-decoration: underline;
}

.rss-news-summary {
  font-size: 14px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.rss-news-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.author {
  display: flex;
  align-items: center;
  gap: 4px;
}

.time {
  display: flex;
  align-items: center;
}
</style>
