<template>
  <div class="dashboard">
    <!-- 欢迎卡片 -->
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>欢迎使用 趋势雷达</span>
        </div>
      </template>
      <div class="welcome-content">
        <h1>🔍 热点新闻聚合与分析工具</h1>
        <p>快速了解全网热点，智能筛选关注内容</p>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon class="stat-icon" color="#409EFF"><Document /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ newsStore.newsCount }}</div>
              <div class="stat-label">新闻总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon class="stat-icon" color="#67C23A"><Position /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ newsStore.rssCount }}</div>
              <div class="stat-label">RSS 订阅</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon class="stat-icon" color="#E6A23C"><TrendCharts /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ topics.length }}</div>
              <div class="stat-label">热门话题</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon class="stat-icon" color="#F56C6C"><Clock /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ formatTime(newsStore.lastUpdateTime) }}</div>
              <div class="stat-label">最后更新</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新闻列表和热门话题 -->
    <el-row :gutter="20">
      <!-- 新闻列表 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最新新闻</span>
              <el-button type="primary" link @click="loadMore">
                查看更多 <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          <el-empty v-if="newsStore.allNews.length === 0" description="暂无新闻数据" />
          <div v-else class="news-list">
            <div
              v-for="news in displayedNews"
              :key="news.id"
              class="news-item"
            >
              <div class="news-rank" :class="getRankClass(news.rank)">
                {{ news.rank }}
              </div>
              <div class="news-content">
                <div class="news-title">
                  <a :href="news.url" target="_blank" rel="noopener noreferrer">
                    {{ news.title }}
                  </a>
                </div>
                <div class="news-meta">
                  <span class="news-source">{{ newsStore.idToName[news.source_id] || news.source_id }}</span>
                  <span class="news-time">{{ formatTime(news.crawl_time) }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 热门话题 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>热门话题</span>
              <el-radio-group v-model="topicMode" size="small">
                <el-radio-button label="current">当前</el-radio-button>
                <el-radio-button label="daily">当日</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <el-empty v-if="topics.length === 0" description="暂无热门话题" />
          <div v-else class="topics-list">
            <div
              v-for="(topic, index) in topics"
              :key="topic.word"
              class="topic-item"
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
import type { Topic } from '@/types'

const newsStore = useNewsStore()

const topics = ref<Topic[]>([])
const topicMode = ref('current')
const displayLimit = ref(10)

// 显示的新闻列表
const displayedNews = computed(() => {
  return newsStore.allNews.slice(0, displayLimit.value)
})

// 加载时间格式化
function formatTime(timeStr: string): string {
  if (!timeStr) return '-'
  const day = dayjs(timeStr)
  if (day.isSame(dayjs(), 'day')) {
    return day.format('HH:mm')
  }
  return day.format('MM-DD HH:mm')
}

// 获取排名样式类
function getRankClass(rank: number): string {
  if (rank <= 3) return 'rank-top'
  if (rank <= 10) return 'rank-high'
  return 'rank-normal'
}

// 加载更多
function loadMore() {
  displayLimit.value += 10
}

// 加载热门话题
async function loadTopics() {
  try {
    await newsStore.fetchTrendingTopics(10, topicMode.value)
    topics.value = newsStore.topics
  } catch (error) {
    console.error('Failed to load topics:', error)
  }
}

// 监听话题模式变化
watch(topicMode, () => {
  loadTopics()
})

// 初始化
onMounted(async () => {
  try {
    await newsStore.fetchLatestNews()
    await loadTopics()
  } catch (error) {
    console.error('Failed to load data:', error)
    ElMessage.error('加载数据失败')
  }
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.welcome-card {
  margin-bottom: 20px;
}

.welcome-content h1 {
  font-size: 24px;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.welcome-content p {
  color: var(--el-text-color-secondary);
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 10px;
}

.stat-icon {
  font-size: 32px;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.news-list {
  max-height: 500px;
  overflow-y: auto;
}

.news-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.news-item:last-child {
  border-bottom: none;
}

.news-rank {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-right: 12px;
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
  font-size: 14px;
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
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.news-source {
  margin-right: 12px;
}

.topics-list {
  max-height: 400px;
  overflow-y: auto;
}

.topic-item {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.topic-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--el-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-right: 10px;
}

.topic-content {
  flex: 1;
}

.topic-word {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.topic-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
</style>
