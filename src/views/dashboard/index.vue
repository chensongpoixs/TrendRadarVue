<template>
  <div class="dashboard">
    <!-- 欢迎卡片 -->
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>欢迎使用 趋势雷达</span>
          <el-space wrap>
            <router-link
              class="link-history"
              :to="{ name: 'AIChat' }"
            >
              大模型对话
            </router-link>
            <router-link
              v-if="!isMobile"
              class="link-history"
              :to="{ name: 'NewsByDate', params: { date: todayYMD } }"
            >
              按日/小时热榜
            </router-link>
          </el-space>
        </div>
      </template>
      <div class="welcome-content">
        <h1>行业热点雷达</h1>
        <p v-if="!isMobile" class="welcome-sub">多源热榜 · RSS 订阅 · 话题聚合，一站式追踪全网信号</p>
      </div>
    </el-card>

    <!-- 核心 KPI -->
    <el-row :gutter="isMobile ? 10 : 20" class="stats-row">
      <el-col :xs="12" :md="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="stat-card">
            <el-icon class="stat-icon" :size="isMobile ? 24 : 32" color="#409EFF"><Document /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ newsStore.newsCount }}</div>
              <div class="stat-label">热榜条目</div>
              <div class="stat-hint">当前抓取条数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :md="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="stat-card">
            <el-icon class="stat-icon" :size="isMobile ? 24 : 32" color="#5b8ff9"><DataAnalysis /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ newsStore.hotlistPlatformCount }}</div>
              <div class="stat-label">平台覆盖</div>
              <div class="stat-hint">有数据平台数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :md="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="stat-card">
            <el-icon class="stat-icon" :size="isMobile ? 24 : 32" color="#67C23A"><Position /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ newsStore.rssCount }}</div>
              <div class="stat-label">RSS 条目</div>
              <div class="stat-hint">订阅源条数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :md="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="stat-card">
            <el-icon class="stat-icon" :size="isMobile ? 24 : 32" color="#E6A23C"><TrendCharts /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ healthPercent }}</div>
              <div class="stat-label">抓取健康度</div>
              <div class="stat-hint">成功平台 / 已尝试</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 次要 KPI -->
    <el-row :gutter="isMobile ? 10 : 20" class="second-kpi">
      <el-col :xs="12" :md="6">
        <el-card shadow="hover">
          <div class="stat-card compact">
            <div class="stat-content">
              <div class="stat-value sm">{{ failedPlatformCount }}</div>
              <div class="stat-label">失败源</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :md="6">
        <el-card shadow="hover">
          <div class="stat-card compact">
            <div class="stat-content">
              <div class="stat-value sm">{{ topics.length }}</div>
              <div class="stat-label">话题数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="hover">
          <div class="stat-card compact time-row">
            <el-icon class="stat-icon" :size="isMobile ? 20 : 24" color="#F56C6C"><Clock /></el-icon>
            <div class="stat-content">
              <div class="stat-label">数据时间</div>
              <div class="stat-value sm">{{ fullTime(newsStore.lastUpdateTime) }}</div>
              <div v-if="newsStore.newsDataSource === 'database' && !isMobile" class="stat-hint">
                仅展示后端库内数据；外网热榜与 RSS 由定时任务在整点/配置周期内拉取并写入
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 历史快照 -->
    <el-card v-loading="snapshotLoading" class="snapshot-dates-card">
      <template #header>
        <div class="card-header">
          <span>历史热榜记录</span>
          <el-space>
            <el-tag v-if="snapshotTimezone" type="info" size="small">{{ snapshotTimezone }}</el-tag>
            <router-link
              class="link-history"
              :to="{ name: 'NewsByDate', params: { date: todayYMD } }"
            >
              今天详情
            </router-link>
          </el-space>
        </div>
      </template>
      <el-empty
        v-if="!snapshotLoading && snapshotDates.length === 0"
        description="暂无历史快照；调度或触发抓取后，会按天、按小时累积"
        :image-size="isMobile ? 60 : 72"
      />
      <div v-else class="snapshot-chips">
        <router-link
          v-for="d in snapshotDates"
          :key="d.date"
          :to="{ name: 'NewsByDate', params: { date: d.date } }"
          class="snap-link"
        >
          <el-tag
            :type="d.date === todayYMD ? 'primary' : 'info'"
            effect="plain"
            class="snap-tag"
          >
            <span class="snap-label">{{ dateChipLabel(d.date) }}</span>
            <span class="snap-meta">{{ d.row_count.toLocaleString() }} 条</span>
          </el-tag>
        </router-link>
      </div>
    </el-card>

    <!-- 平台来源分布 -->
    <el-card class="dist-card" v-if="platformRows.length">
      <template #header>
        <div class="card-header">
          <span>多平台来源分布</span>
          <el-tag type="info" size="small">条数 / 占比</el-tag>
        </div>
      </template>
      <el-table :data="platformRows" size="small" stripe :max-height="isMobile ? 200 : 280">
        <el-table-column prop="name" label="平台" :min-width="isMobile ? 80 : 140" />
        <el-table-column prop="count" label="条数" width="60" align="right" />
        <el-table-column label="占比" :min-width="isMobile ? 100 : 200">
          <template #default="{ row }">
            <el-progress
              :percentage="row.pct"
              :stroke-width="8"
              :format="() => row.pct.toFixed(1) + '%'"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新闻列表和热门话题 -->
    <el-row :gutter="isMobile ? 10 : 20">
      <el-col :xs="24" :md="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <div class="card-header-left">
                <el-button
                  v-if="selectedTopic"
                  link
                  type="primary"
                  size="small"
                  @click="clearTopicFilter"
                >
                  <el-icon><ArrowLeft /></el-icon>
                  返回全部新闻
                </el-button>
                <span v-else>最新新闻</span>
              </div>
              <div class="card-header-right">
                <el-tag v-if="selectedTopic" type="warning" size="small" effect="plain">
                  # {{ selectedTopic.word }}
                </el-tag>
                <el-button type="primary" link @click="loadMore">
                  查看更多 <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </template>
          <!-- 骨架屏加载态 -->
          <el-skeleton v-if="!selectedTopic && newsStore.allNews.length === 0 && snapshotLoading" :rows="6" animated />
          <el-empty v-else-if="currentDisplayNews.length === 0" :description="selectedTopic ? '该话题暂无关联新闻' : '暂无新闻数据'" />
          <div v-else class="news-list">
            <div
              v-for="news in currentDisplayNews"
              :key="newsItemKey(news)"
              class="news-item"
            >
              <div class="news-rank" :class="getRankClass(news.rank)">
                {{ news.rank }}
              </div>
              <div class="news-content">
                <div class="news-title">
                  <a :href="getNewsUrl(news)" target="_blank" rel="noopener noreferrer">
                    {{ news.title }}
                  </a>
                </div>
                <div class="news-meta">
                  <span class="news-source">{{ news.source_name }}</span>
                  <span class="news-time">{{ formatTime(news.crawl_time) }}</span>
                  <NewsAiAnalyzeButton
                    :title="news.title"
                    :url="getNewsUrl(news)"
                    :source-name="news.source_name"
                  />
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 热门话题 -->
      <el-col :xs="24" :md="8">
        <el-card class="topics-card">
          <template #header>
            <div class="card-header">
              <span>热门话题</span>
              <el-radio-group v-model="topicMode" size="small">
                <el-radio-button label="current">当前</el-radio-button>
                <el-radio-button label="daily">当日</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <el-empty v-if="topics.length === 0" description="暂无热门话题" :image-size="isMobile ? 60 : 80" />
          <div v-else class="topics-list">
            <div
              v-for="(topic, index) in topics"
              :key="topic.word"
              class="topic-item"
              :class="{ selected: selectedTopic?.word === topic.word }"
              @click="selectTopic(topic)"
            >
              <div class="topic-rank">{{ index + 1 }}</div>
              <div class="topic-content">
                <div class="topic-word">{{ topic.word }}</div>
                <div class="topic-count">{{ topic.count }}条</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { useNewsStore } from '@/stores/news'
import { getSnapshotAvailableDates } from '@/api/news'
import NewsAiAnalyzeButton from '@/components/NewsAiAnalyzeButton.vue'
import { useResponsive } from '@/composables/useResponsive'
import type { NewsItem, Topic, SnapshotDateInfo } from '@/types'

const newsStore = useNewsStore()
const { isMobile } = useResponsive()
const todayYMD = dayjs().format('YYYY-MM-DD')

const snapshotLoading = ref(false)
const snapshotDates = ref<SnapshotDateInfo[]>([])
const snapshotTimezone = ref('')

const topics = ref<Topic[]>([])
const topicMode = ref('current')
const displayLimit = ref(10)
const selectedTopic = ref<Topic | null>(null)

/** 按排名合并各平台后截取 */
const displayedNews = computed(() => {
  const list: NewsItem[] = []
  Object.values(newsStore.newsData).forEach((items) => {
    list.push(...items)
  })
  list.sort((a, b) => (a.rank || 999) - (b.rank || 999))
  return list.slice(0, displayLimit.value)
})

/** 当前显示的新闻列表：选中话题时按关键词匹配过滤，否则显示全部最新 */
interface DisplayNewsItem {
  title: string
  url: string
  mobile_url?: string
  rank: number
  source_id: string
  source_name: string
  crawl_time: string
}

const currentDisplayNews = computed<DisplayNewsItem[]>(() => {
  const all = displayedNews.value.map(n => ({
    title: n.title,
    url: n.url,
    mobile_url: n.mobile_url,
    rank: n.rank,
    source_id: n.source_id,
    source_name: n.source_name || newsStore.idToName[n.source_id] || n.source_id,
    crawl_time: n.crawl_time,
  }))

  if (selectedTopic.value) {
    const kw = selectedTopic.value.word
    return all.filter(item => item.title.includes(kw))
  }
  return all
})

/** 获取新闻链接：移动端优先 mobile_url */
function getNewsUrl(item: DisplayNewsItem): string {
  if (isMobile.value && item.mobile_url) return item.mobile_url
  return item.url
}

/** 选择话题 */
function selectTopic(topic: Topic) {
  if (selectedTopic.value?.word === topic.word) {
    clearTopicFilter()
    return
  }
  selectedTopic.value = topic
}

/** 清除话题过滤 */
function clearTopicFilter() {
  selectedTopic.value = null
}

const platformRows = computed(() => {
  const total = newsStore.newsCount || 1
  const rows: { id: string; name: string; count: number; pct: number }[] = []
  Object.entries(newsStore.newsData).forEach(([id, items]) => {
    const c = items?.length ?? 0
    if (c === 0) return
    rows.push({
      id,
      name: newsStore.idToName[id] || id,
      count: c,
      pct: (c / total) * 100,
    })
  })
  return rows.sort((a, b) => b.count - a.count)
})

const failedPlatformCount = computed(() => newsStore.failedIds.length)

const healthPercent = computed(() => {
  const ok = newsStore.hotlistPlatformCount
  const fail = newsStore.failedIds.length
  const t = ok + fail
  if (t === 0) return '—'
  return `${Math.round((ok / t) * 100)}%`
})

function newsItemKey(n: DisplayNewsItem) {
  return `${n.source_id || n.source_name}-${n.rank}-${n.title}`
}

function fullTime(timeStr: string) {
  if (!timeStr) return '—'
  return dayjs(timeStr).format('YYYY-MM-DD HH:mm:ss')
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '-'
  const day = dayjs(timeStr)
  if (day.isSame(dayjs(), 'day')) {
    return day.format('HH:mm')
  }
  return day.format('MM-DD HH:mm')
}

function getRankClass(rank: number): string {
  if (rank <= 3) return 'rank-top'
  if (rank <= 10) return 'rank-high'
  return 'rank-normal'
}

function loadMore() {
  displayLimit.value += 10
}

function dateChipLabel(ymd: string): string {
  if (ymd === todayYMD) return '今天'
  if (ymd === dayjs().subtract(1, 'day').format('YYYY-MM-DD')) return '昨天'
  return ymd
}

async function loadSnapshotDates() {
  snapshotLoading.value = true
  try {
    const res = await getSnapshotAvailableDates(90)
    if (res.data) {
      snapshotDates.value = res.data.dates ?? []
      snapshotTimezone.value = res.data.timezone || ''
    }
  } catch (e) {
    console.error('loadSnapshotDates', e)
    snapshotDates.value = []
  } finally {
    snapshotLoading.value = false
  }
}

async function loadTopics() {
  try {
    await newsStore.fetchTrendingTopics(10, topicMode.value)
    topics.value = newsStore.topics
  } catch (error) {
    console.error('Failed to load topics:', error)
  }
}

watch(topicMode, () => {
  loadTopics()
})

onMounted(async () => {
  void loadSnapshotDates()
  try {
    await Promise.all([
      newsStore.fetchLatestNews(undefined, 100, true),
      newsStore.fetchLatestRSS(),
    ])
    await loadTopics()
  } catch (error) {
    console.error('Failed to load data:', error)
    ElMessage.error('加载数据失败')
  }
})
</script>

<style scoped>
.dashboard {
  padding: var(--tr-spacing-sm);
}

@media (min-width: 768px) {
  .dashboard {
    padding: var(--tr-spacing-md);
  }
}

.welcome-card {
  margin-bottom: var(--tr-spacing-md);
}

.welcome-content h1 {
  font-size: var(--tr-font-size-xl);
  color: var(--el-text-color-primary);
  margin-bottom: var(--tr-spacing-xs);
}

@media (min-width: 768px) {
  .welcome-content h1 {
    font-size: var(--tr-font-size-2xl);
  }
}

.welcome-content p,
.welcome-sub {
  color: var(--el-text-color-secondary);
}

.welcome-sub {
  margin: 0;
  font-size: var(--tr-font-size-base);
}

.stats-row {
  margin-bottom: var(--tr-spacing-sm);
}

@media (min-width: 768px) {
  .stats-row {
    margin-bottom: var(--tr-spacing-md);
  }
}

.second-kpi {
  margin-bottom: var(--tr-spacing-md);
}

.snapshot-dates-card {
  margin-bottom: var(--tr-spacing-md);
}

.snapshot-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  align-items: center;
}

.snap-link {
  text-decoration: none;
  display: inline-block;
}

.snap-tag {
  cursor: pointer;
  max-width: 100%;
}
.snap-tag :deep(.el-tag__content) {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.snap-label {
  font-weight: 500;
}
.snap-meta {
  opacity: 0.85;
  font-size: var(--tr-font-size-sm);
}
.snap-link:hover .snap-tag {
  filter: brightness(1.05);
}

.kpi-card {
  height: 100%;
}

.stat-hint {
  font-size: var(--tr-font-size-xs);
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
}

.stat-card.compact {
  padding: 6px 10px;
}

.stat-card.compact .stat-value.sm {
  font-size: var(--tr-font-size-lg);
}

.time-row {
  align-items: center;
}

.time-row .stat-content {
  text-align: left;
}

.dist-card {
  margin-bottom: var(--tr-spacing-md);
}

.stat-card {
  display: flex;
  align-items: center;
  padding: var(--tr-spacing-sm);
}

@media (min-width: 768px) {
  .stat-card {
    padding: 10px;
  }
}

.stat-icon {
  margin-right: var(--tr-spacing-sm);
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .stat-icon {
    margin-right: var(--tr-spacing-md);
  }
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: var(--tr-font-size-xl);
  font-weight: 600;
  color: var(--el-text-color-primary);
}

@media (min-width: 768px) {
  .stat-value {
    font-size: 24px;
  }
}

.stat-label {
  font-size: var(--tr-font-size-sm);
  color: var(--el-text-color-secondary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--tr-spacing-xs);
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: var(--tr-spacing-xs);
}

.card-header-right {
  display: flex;
  align-items: center;
  gap: var(--tr-spacing-xs);
}

.link-history {
  font-size: var(--tr-font-size-base);
  color: var(--el-color-primary);
  text-decoration: none;
}
.link-history:hover {
  text-decoration: underline;
}

.news-list {
  max-height: 400px;
  overflow-y: auto;
}

@media (min-width: 768px) {
  .news-list {
    max-height: 500px;
  }
}

.news-item {
  display: flex;
  padding: var(--tr-spacing-sm) 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.news-item:last-child {
  border-bottom: none;
}

.news-rank {
  min-width: 28px;
  height: 28px;
  border-radius: var(--tr-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--tr-font-size-sm);
  margin-right: var(--tr-spacing-sm);
  flex-shrink: 0;
}

.rank-top {
  background-color: #ffebee;
  color: #f44336;
}

.rank-high {
  background-color: #fff3e0;
  color: #ff9800;
}

.rank-normal {
  background-color: #f5f5f5;
  color: #9e9e9e;
}

.news-content {
  flex: 1;
  min-width: 0;
}

.news-title {
  font-size: var(--tr-font-size-base);
  line-height: 1.5;
  margin-bottom: 4px;
}

.news-title a {
  color: var(--el-text-color-primary);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.news-title a:hover {
  color: var(--el-color-primary);
}

.news-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  font-size: var(--tr-font-size-sm);
  color: var(--el-text-color-secondary);
}

.news-source {
  margin-right: var(--tr-spacing-sm);
}

.topics-card {
  margin-top: var(--tr-spacing-md);
}

@media (min-width: 768px) {
  .topics-card {
    margin-top: 0;
  }
}

.topics-list {
  max-height: 400px;
  overflow-y: auto;
}

.topic-item {
  display: flex;
  padding: var(--tr-spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
  border-radius: var(--tr-radius-sm);
  cursor: pointer;
  transition: background-color var(--tr-transition-fast);
}

.topic-item:hover {
  background-color: var(--el-fill-color-light);
}

.topic-item.selected {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
}

.topic-rank {
  min-width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--el-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--tr-font-size-sm);
  font-weight: 600;
  margin-right: var(--tr-spacing-sm);
  flex-shrink: 0;
}

.topic-content {
  flex: 1;
  min-width: 0;
}

.topic-word {
  font-size: var(--tr-font-size-base);
  color: var(--el-text-color-primary);
}

.topic-count {
  font-size: var(--tr-font-size-sm);
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
</style>
