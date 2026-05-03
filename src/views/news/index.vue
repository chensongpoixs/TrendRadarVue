<template>
  <div class="news-page">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-row :gutter="isMobile ? 10 : 20">
        <el-col :xs="24" :sm="14" :md="16">
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
        <el-col :xs="24" :sm="10" :md="8" class="search-extra">
          <el-select
            v-model="searchPlatform"
            :placeholder="isMobile ? '平台' : '选择平台'"
            clearable
            :style="isMobile ? '' : 'min-width: 120px'"
          >
            <el-option
              v-for="platform in platforms"
              :key="platform.id"
              :label="platform.name"
              :value="platform.id"
            />
          </el-select>
          <el-button type="primary" @click="handleSearch" :loading="searching" class="search-btn">
            <el-icon><Search /></el-icon>
            <span v-if="!isMobile">搜索</span>
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 新闻列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">新闻列表</span>
          <div class="header-right">
            <el-radio-group v-model="viewMode" size="small" @change="handleViewChange">
              <el-radio-button value="platform">按平台</el-radio-button>
              <el-radio-button value="merged">合并</el-radio-button>
            </el-radio-group>
            <span class="count">{{ displayList.length }} 条</span>
          </div>
        </div>
      </template>

      <!-- 加载态 -->
      <el-skeleton v-if="loading" :rows="8" animated />

      <!-- 空状态 -->
      <el-empty v-else-if="displayList.length === 0" description="暂无新闻数据" :image-size="isMobile ? 60 : 80" />

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
                <el-button v-if="!isMobile" type="primary" link @click="copyLink(news.url)">
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
              <span v-if="news.total_count > 1 && !isMobile" class="news-count">
                跨 {{ news.total_count }} 平台
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 按平台视图 -->
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
                <el-button v-if="!isMobile" type="primary" link @click="copyLink(news.url)">
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
              <span v-if="news.count > 1 && !isMobile" class="news-count">
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
          :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
          :small="isMobile"
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
import { useResponsive } from '@/composables/useResponsive'
import type { NewsItem, MergedNewsItem } from '@/types'

const newsStore = useNewsStore()
const { isMobile } = useResponsive()

const viewMode = ref<'platform' | 'merged'>('platform')
const searchQuery = ref('')
const searchPlatform = ref('')
const searching = ref(false)

const newsList = ref<NewsItem[]>([])
const mergedList = ref<MergedNewsItem[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)

const displayList = computed(() => {
  return viewMode.value === 'merged' ? mergedList.value : newsList.value
})

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

const platforms = ref([
  { id: 'weibo', name: '微博' },
  { id: 'toutiao', name: '今日头条' },
  { id: 'baidu', name: '百度热搜' },
  { id: 'zhihu', name: '知乎' },
  { id: 'bilibili', name: 'B 站' },
  { id: 'douyin', name: '抖音' },
])

async function loadNews() {
  loading.value = true
  try {
    await newsStore.fetchLatestNews()
    newsList.value = []
    Object.values(newsStore.newsData).forEach(items => {
      newsList.value.push(...items)
    })
    newsList.value.sort((a, b) => {
      return new Date(b.crawl_time).getTime() - new Date(a.crawl_time).getTime()
    })
    mergedList.value = newsStore.mergedNews
  } catch (error: any) {
    ElMessage.error('加载新闻失败：' + error.message)
  } finally {
    loading.value = false
  }
}

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

function handleViewChange() {
  currentPage.value = 1
}

function handleSizeChange(size: number) {
  pageSize.value = size
}

function handlePageChange(page: number) {
  currentPage.value = page
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

function copyLink(url: string) {
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

onMounted(() => {
  loadNews()
})
</script>

<style scoped>
.news-page {
  padding: var(--tr-spacing-sm);
}

@media (min-width: 768px) {
  .news-page {
    padding: var(--tr-spacing-md);
    max-width: 1200px;
    margin: 0 auto;
  }
}

.search-card {
  margin-bottom: var(--tr-spacing-md);
}

.search-extra {
  display: flex;
  gap: var(--tr-spacing-sm);
  margin-top: var(--tr-spacing-sm);
}

@media (min-width: 768px) {
  .search-extra {
    margin-top: 0;
  }
}

.search-btn {
  flex-shrink: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--tr-spacing-sm);
}

.card-title {
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--tr-spacing-sm);
}

.count {
  color: var(--el-text-color-secondary);
  font-size: var(--tr-font-size-base);
  white-space: nowrap;
}

.news-list {
  padding: var(--tr-spacing-sm) 0;
}

.news-item {
  display: flex;
  padding: var(--tr-spacing-sm);
  margin-bottom: var(--tr-spacing-sm);
  background-color: var(--el-fill-color-light);
  border-radius: var(--tr-radius-md);
  transition: all var(--tr-transition-normal);
}

@media (min-width: 768px) {
  .news-item {
    padding: var(--tr-spacing-md);
    margin-bottom: 12px;
  }
}

.news-item:hover {
  background-color: var(--el-fill-color);
}

@media (min-width: 768px) {
  .news-item:hover {
    transform: translateX(4px);
  }
}

.news-left {
  flex-shrink: 0;
  margin-right: var(--tr-spacing-sm);
}

@media (min-width: 768px) {
  .news-left {
    margin-right: var(--tr-spacing-md);
  }
}

.news-right {
  flex: 1;
  min-width: 0;
}

.news-rank {
  width: 32px;
  height: 32px;
  border-radius: var(--tr-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--tr-font-size-base);
}

@media (min-width: 768px) {
  .news-rank {
    width: 36px;
    height: 36px;
  }
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
  margin-bottom: var(--tr-spacing-xs);
}

.news-title {
  flex: 1;
  font-size: var(--tr-font-size-base);
  font-weight: 500;
  margin: 0;
  min-width: 0;
}

@media (min-width: 768px) {
  .news-title {
    font-size: var(--tr-font-size-md);
  }
}

.news-title a {
  color: var(--el-text-color-primary);
  text-decoration: none;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.news-title a:hover {
  color: var(--el-color-primary);
  text-decoration: underline;
}

.news-actions {
  flex-shrink: 0;
  margin-left: var(--tr-spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--tr-spacing-xs);
}

.news-meta {
  display: flex;
  align-items: center;
  gap: var(--tr-spacing-sm);
  font-size: var(--tr-font-size-sm);
  color: var(--el-text-color-secondary);
  flex-wrap: wrap;
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
  margin-top: var(--tr-spacing-md);
  display: flex;
  justify-content: center;
}
</style>
