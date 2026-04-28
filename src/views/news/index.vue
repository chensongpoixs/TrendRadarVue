<template>
  <div class="news-page">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-input
            v-model="searchQuery"
            placeholder="搜索新闻标题..."
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="8">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-select v-model="searchPlatform" placeholder="平台" clearable style="width: 100%">
                <el-option
                  v-for="platform in platforms"
                  :key="platform.id"
                  :label="platform.name"
                  :value="platform.id"
                />
              </el-select>
            </el-col>
            <el-col :span="12">
              <el-button type="primary" @click="handleSearch" :loading="searching">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
            </el-col>
          </el-row>
        </el-col>
      </el-row>
    </el-card>

    <!-- 新闻列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>新闻列表</span>
          <div class="header-right">
            <el-radio-group v-model="viewMode" size="small" @change="handleViewChange">
              <el-radio-button value="platform">按平台</el-radio-button>
              <el-radio-button value="merged">合并视图</el-radio-button>
            </el-radio-group>
            <span v-if="newsStore.newsDataSource === 'database'" class="source-hint">库内数据 · 外网由定时任务拉取</span>
            <span class="count">共 {{ displayList.length }} 条</span>
          </div>
        </div>
      </template>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>

      <!-- 空状态 -->
      <el-empty v-else-if="displayList.length === 0" description="暂无新闻数据" />

      <!-- 合并视图 -->
      <div v-else-if="viewMode === 'merged'" class="news-list">
        <div
          v-for="(news, index) in paginatedMerged"
          :key="'m-' + index"
          class="news-item"
        >
          <div class="news-left">
            <div class="news-rank" :class="getRankClass(news.max_rank)">
              {{ news.max_rank }}
            </div>
          </div>
          <div class="news-right">
            <div class="news-header">
              <h3 class="news-title">
                <a :href="news.url" target="_blank" rel="noopener noreferrer">
                  {{ news.title }}
                </a>
              </h3>
              <div class="news-actions">
                <NewsAiAnalyzeButton
                  :title="news.title"
                  :url="news.url"
                  :source-name="news.sources[0]?.source_name || ''"
                />
                <el-button
                  type="primary"
                  link
                  @click="copyLink(news.url)"
                >
                  <el-icon><Link /></el-icon>
                  复制链接
                </el-button>
              </div>
            </div>
            <div class="news-meta">
              <el-tag
                v-for="source in news.sources"
                :key="source.source_id"
                size="small"
                :type="news.sources.length > 1 ? 'warning' : 'info'"
                class="source-tag"
              >
                {{ source.source_name }} #{{ source.rank }}
              </el-tag>
              <span class="news-time">{{ formatTime(news.crawl_time) }}</span>
              <span v-if="news.total_count > 1" class="news-count">
                跨 {{ news.total_count }} 平台
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 按平台视图（原有） -->
      <div v-else class="news-list">
        <div
          v-for="news in paginatedNews"
          :key="news.id"
          class="news-item"
        >
          <div class="news-left">
            <div class="news-rank" :class="getRankClass(news.rank)">
              {{ news.rank }}
            </div>
          </div>
          <div class="news-right">
            <div class="news-header">
              <h3 class="news-title">
                <a :href="news.url" target="_blank" rel="noopener noreferrer">
                  {{ news.title }}
                </a>
              </h3>
              <div class="news-actions">
                <NewsAiAnalyzeButton
                  :title="news.title"
                  :url="news.url"
                  :source-name="newsStore.idToName[news.source_id] || news.source_id"
                />
                <el-button
                  type="primary"
                  link
                  @click="copyLink(news.url)"
                >
                  <el-icon><Link /></el-icon>
                  复制链接
                </el-button>
              </div>
            </div>
            <div class="news-meta">
              <el-tag size="small" type="info">
                {{ newsStore.idToName[news.source_id] || news.source_id }}
              </el-tag>
              <span class="news-time">{{ formatTime(news.crawl_time) }}</span>
              <span v-if="news.count > 1" class="news-count">
                出现 {{ news.count }} 次
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="newsList.length > pageSize" class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="newsList.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { useNewsStore } from '@/stores/news'
import { searchNews } from '@/api/news'
import NewsAiAnalyzeButton from '@/components/NewsAiAnalyzeButton.vue'
import type { NewsItem, MergedNewsItem } from '@/types'

const newsStore = useNewsStore()

// 视图模式：platform = 按平台分组，merged = 跨平台合并
const viewMode = ref<'platform' | 'merged'>('platform')

// 搜索状态
const searchQuery = ref('')
const searchPlatform = ref('')
const searching = ref(false)

// 列表状态
const newsList = ref<NewsItem[]>([])
const mergedList = ref<MergedNewsItem[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)

// 当前显示的列表
const displayList = computed(() => {
  return viewMode.value === 'merged' ? mergedList.value : newsList.value
})

// 分页后的新闻列表
const paginatedNews = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return newsList.value.slice(start, end)
})

const paginatedMerged = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return mergedList.value.slice(start, end)
})

// 平台列表
const platforms = ref([
  { id: 'weibo', name: '微博' },
  { id: 'toutiao', name: '今日头条' },
  { id: 'baidu', name: '百度热搜' },
  { id: 'zhihu', name: '知乎' },
  { id: 'bilibili', name: 'B 站' },
  { id: 'douyin', name: '抖音' },
])

// 加载新闻
async function loadNews() {
  loading.value = true
  try {
    await newsStore.fetchLatestNews()
    // 扁平化新闻列表（按平台视图）
    newsList.value = []
    Object.values(newsStore.newsData).forEach(items => {
      newsList.value.push(...items)
    })
    newsList.value.sort((a, b) => {
      return new Date(b.crawl_time).getTime() - new Date(a.crawl_time).getTime()
    })
    // 合并视图
    mergedList.value = newsStore.mergedNews
  } catch (error: any) {
    ElMessage.error('加载新闻失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 搜索新闻
async function handleSearch() {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  searching.value = true
  try {
    const response = await searchNews({
      query: searchQuery.value,
      platforms: searchPlatform.value ? [searchPlatform.value] : undefined,
    })

    if (response.data?.results) {
      newsList.value = response.data.results
      currentPage.value = 1
      ElMessage.success(`找到 ${newsList.value.length} 条结果`)
    } else {
      newsList.value = []
      ElMessage.info('未找到相关结果')
    }
  } catch (error: any) {
    ElMessage.error('搜索失败：' + error.message)
  } finally {
    searching.value = false
  }
}

// 视图切换
function handleViewChange() {
  currentPage.value = 1
}

// 分页处理
function handleSizeChange(size: number) {
  pageSize.value = size
}

function handlePageChange(page: number) {
  currentPage.value = page
}

// 格式化时间
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

// 复制链接
function copyLink(url: string) {
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 初始化
onMounted(() => {
  loadNews()
})
</script>

<style scoped>
.news-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.search-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.source-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.count {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.loading-container {
  padding: 20px 0;
}

.news-list {
  padding: 10px 0;
}

.news-item {
  display: flex;
  padding: 16px;
  margin-bottom: 12px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  transition: all 0.3s;
}

.news-item:hover {
  background-color: var(--el-fill-color);
  transform: translateX(4px);
}

.news-left {
  flex-shrink: 0;
  margin-right: 16px;
}

.news-right {
  flex: 1;
  min-width: 0;
}

.news-rank {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.rank-top {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.rank-high {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.rank-normal {
  background-color: var(--el-fill-color);
  color: var(--el-text-color-regular);
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.news-title {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.news-title a {
  color: var(--el-text-color-primary);
  text-decoration: none;
}

.news-title a:hover {
  color: var(--el-color-primary);
  text-decoration: underline;
}

.news-actions {
  flex-shrink: 0;
  margin-left: 12px;
}

.news-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.news-time {
  display: flex;
  align-items: center;
}

.news-count {
  display: flex;
  align-items: center;
}

.source-tag {
  margin-right: 4px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
