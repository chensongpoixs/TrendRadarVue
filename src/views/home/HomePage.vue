<template>
  <div class="home-page">
    <div class="page-inner">
      <!-- ========== 搜索 Hero ========== -->
      <section v-if="!isMobile" class="search-section">
        <SearchBar @search="handleSearch" />
      </section>

      <!-- ========== 业界仪表盘 ========== -->
      <DashboardCards
        title="业界仪表盘"
        :total-items="store.newsCount"
        :platform-count="store.hotlistPlatformCount"
        :topic-count="topics.length"
        :update-time="store.lastUpdateTime ? formatShortTime(store.lastUpdateTime) : ''"
        :platforms="store.platformSummary"
        :topics="topics"
      >
        <div class="dash-actions">
          <el-button type="primary" size="small" @click="$router.push('/dashboard')">
            完整仪表盘
          </el-button>
          <el-button size="small" @click="$router.push('/chat')">
            <el-icon><ChatDotSquare /></el-icon>
            AI 对话
          </el-button>
        </div>
      </DashboardCards>

      <!-- ========== 前 3 热点事件 ========== -->
      <HotEventsHero
        :events="hotEvents"
        :loading="store.loading"
      />

      <!-- ========== 历史热榜记录 ========== -->
      <section class="history-section">
        <div class="section-title-bar">
          <h3>
            <el-icon :size="18"><Clock /></el-icon>
            历史热榜
          </h3>
          <router-link to="/news" class="more-link">查看更多 →</router-link>
        </div>

        <div v-if="snapshotLoading" class="history-loading">
          <el-skeleton :rows="2" animated />
        </div>

        <div v-else-if="snapshotDates.length === 0" class="history-empty">
          暂无历史热榜记录
        </div>

        <div v-else class="history-chips">
          <router-link
            v-for="d in snapshotDates"
            :key="d.date"
            :to="`/news/${d.date}`"
            class="history-chip"
          >
            <span class="chip-date">{{ formatDateLabel(d.date) }}</span>
            <span class="chip-count">{{ d.row_count }}条</span>
          </router-link>
        </div>
      </section>

      <!-- ========== 热门话题标签云 ========== -->
      <section v-if="topics.length > 0" class="topic-cloud-section">
        <div class="section-title-bar">
          <h3>热门话题</h3>
        </div>
        <div class="topic-chips">
          <span
            v-for="topic in topics.slice(0, 15)"
            :key="topic.word"
            class="topic-chip"
            @click="handleTopicClick(topic.word)"
          >
            {{ topic.word }}
            <sup>{{ topic.count }}</sup>
          </span>
        </div>
      </section>

      <!-- ========== 平台覆盖条 ========== -->
      <PlatformCoverageBar
        :platforms="store.platformSummary"
      />

      <!-- ========== AI 大模型对话入口 ========== -->
      <section class="ai-cta-card" @click="$router.push('/chat')">
        <div class="ai-cta-icon">
          <el-icon :size="28"><ChatDotSquare /></el-icon>
        </div>
        <div class="ai-cta-body">
          <h3>AI 大模型对话</h3>
          <p>基于云端大模型分析热点趋势、解读行业动态</p>
        </div>
        <el-icon :size="20" class="ai-cta-arrow"><ArrowRight /></el-icon>
      </section>

      <!-- ========== 按平台分类事件网格 ========== -->
      <CategorySection
        v-for="platformId in topPlatformIds"
        :key="platformId"
        :title="store.idToName[platformId] || platformId"
        :events="eventsByPlatform(platformId)"
        :start-index="3"
      />

      <!-- ========== 全部热门事件 ========== -->
      <CategorySection
        title="全部热点"
        :events="remainingEvents"
        :start-index="3"
      />

      <!-- ========== 页脚 ========== -->
      <footer class="page-footer">
        <span>趋势雷达 · 更新时间 {{ store.lastUpdateTime ? formatFullTime(store.lastUpdateTime) : '加载中...' }}</span>
        <span class="footer-sep">|</span>
        <span>覆盖 {{ store.hotlistPlatformCount }} 平台 · {{ totalCount }} 条热点</span>
        <span class="footer-sep">|</span>
        <router-link to="/dashboard" class="footer-link">仪表盘</router-link>
        <span class="footer-sep">|</span>
        <router-link to="/chat" class="footer-link">AI 对话</router-link>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNewsStore } from '@/stores/news'
import { useResponsive } from '@/composables/useResponsive'
import { fetchHotEvents, getSnapshotAvailableDates } from '@/api/news'
import type { HotEvent, SnapshotDateInfo } from '@/types'
import SearchBar from '@/components/SearchBar.vue'
import HotEventsHero from '@/components/hotspot/HotEventsHero.vue'
import PlatformCoverageBar from '@/components/hotspot/PlatformCoverageBar.vue'
import CategorySection from '@/components/hotspot/CategorySection.vue'
import DashboardCards from '@/components/hotspot/DashboardCards.vue'
import { ChatDotSquare, Clock, ArrowRight } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const router = useRouter()
const store = useNewsStore()
const { isMobile } = useResponsive()

const serverHotEvents = ref<HotEvent[]>([])
const snapshotDates = ref<SnapshotDateInfo[]>([])
const snapshotLoading = ref(false)

const hotEvents = computed<HotEvent[]>(() => {
  if (serverHotEvents.value.length > 0) return serverHotEvents.value
  return store.hotEvents
})

const remainingEvents = computed(() => hotEvents.value.slice(3))

const topics = computed(() => store.topics)

const totalCount = computed(() => store.newsCount)

const topPlatformIds = computed(() => {
  return store.platformSummary
    .filter(p => p.item_count > 0)
    .sort((a, b) => b.item_count - a.item_count)
    .slice(0, 4)
    .map(p => p.id)
})

function eventsByPlatform(platformId: string): HotEvent[] {
  return hotEvents.value.filter(e =>
    e.sources.some(s => s.source_id === platformId)
  )
}

function handleSearch(query: string) {
  router.push({ path: '/news', query: { q: query } })
}

function handleTopicClick(word: string) {
  router.push({ path: '/news', query: { q: word } })
}

function formatFullTime(t: string): string {
  if (!t) return ''
  return dayjs(t).format('YYYY-MM-DD HH:mm')
}

function formatShortTime(t: string): string {
  if (!t) return ''
  return dayjs(t).format('HH:mm')
}

function formatDateLabel(date: string): string {
  const d = dayjs(date)
  const now = dayjs()
  if (d.isSame(now, 'day')) return '今天'
  if (d.isSame(now.subtract(1, 'day'), 'day')) return '昨天'
  return d.format('MM/DD')
}

onMounted(async () => {
  // 加载历史热榜日期
  snapshotLoading.value = true
  try {
    const res = await getSnapshotAvailableDates(90)
    if (res.data?.dates) {
      snapshotDates.value = res.data.dates.slice(0, 14)
    }
  } catch { /* ignore */ }
  finally { snapshotLoading.value = false }

  // 加载热点事件
  try {
    const res = await fetchHotEvents()
    if (res.data?.hot_events) {
      serverHotEvents.value = res.data.hot_events
    }
  } catch { /* fallback */ }

  await store.fetchLatestNews(undefined, 100, true).catch(() => {})
  await store.fetchTrendingTopics(10, 'current').catch(() => {})
})
</script>

<style scoped>
.home-page {
  min-height: 100%;
  background: var(--tr-bg-page);
}
.page-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px var(--tr-spacing-lg) 48px;
}

/* 搜索区 */
.search-section {
  padding: 16px 0 28px;
}

/* 仪表盘操作 */
.dash-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--tr-border-card);
}

/* 历史热榜 */
.history-section {
  margin-bottom: var(--tr-spacing-xl);
}

/* AI 对话入口卡片 */
.ai-cta-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px 24px;
  margin-bottom: var(--tr-spacing-lg);
  background: linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%);
  border: 1px solid #DBEAFE;
  border-radius: var(--tr-radius-lg);
  cursor: pointer;
  transition: all 0.25s ease;
}
.ai-cta-card:hover {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  border-color: var(--tr-color-accent);
  transform: translateY(-1px);
}
.ai-cta-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--tr-radius-md);
  background: var(--tr-color-accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ai-cta-body { flex: 1; min-width: 0; }
.ai-cta-body h3 {
  font-size: var(--tr-font-size-md);
  font-weight: 700;
  color: var(--tr-text-body);
  margin: 0 0 4px;
}
.ai-cta-body p {
  font-size: var(--tr-font-size-sm);
  color: var(--tr-text-muted);
  margin: 0;
}
.ai-cta-arrow { color: var(--tr-color-accent); flex-shrink: 0; }
html.dark .ai-cta-card {
  background: linear-gradient(135deg, #1E3A5F 0%, #1E293B 100%);
  border-color: #334155;
}
.history-loading, .history-empty {
  padding: 16px;
  color: var(--tr-text-muted);
  font-size: var(--tr-font-size-sm);
}
.history-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.history-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--tr-bg-card);
  border: 1px solid var(--tr-border-subtle);
  border-radius: var(--tr-radius-md);
  text-decoration: none;
  color: var(--tr-text-body);
  font-size: var(--tr-font-size-base);
  transition: all 0.2s ease;
}
.history-chip:hover {
  border-color: var(--tr-color-accent);
  background: var(--tr-color-accent-light);
  color: var(--tr-color-accent);
}
.chip-date { font-weight: 600; }
.chip-count {
  font-size: var(--tr-font-size-xs);
  color: var(--tr-text-muted);
}

/* 话题标签云 */
.topic-cloud-section { margin-bottom: var(--tr-spacing-xl); }
.topic-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.topic-chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 6px 14px;
  background: var(--tr-bg-card);
  border: 1px solid var(--tr-border-subtle);
  border-radius: 20px;
  font-size: var(--tr-font-size-base);
  color: var(--tr-text-body);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}
.topic-chip:hover {
  background: var(--tr-color-accent-light);
  border-color: var(--tr-color-accent);
  color: var(--tr-color-accent);
}
.topic-chip sup { font-size: 11px; color: var(--tr-text-muted); }

/* Section title */
.section-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--tr-spacing-md);
}
.section-title-bar h3 {
  font-size: var(--tr-font-size-lg);
  font-weight: 700;
  color: var(--tr-text-body);
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-title-bar h3::before {
  content: '';
  width: 4px;
  height: 20px;
  background: var(--tr-color-accent);
  border-radius: 2px;
}
.more-link {
  font-size: var(--tr-font-size-sm);
  color: var(--tr-color-accent);
  text-decoration: none;
}
.more-link:hover { text-decoration: underline; }

/* 页脚 */
.page-footer {
  text-align: center;
  padding: 32px 0 16px;
  font-size: var(--tr-font-size-sm);
  color: var(--tr-text-muted);
}
.footer-sep { margin: 0 10px; }
.footer-link { color: var(--tr-color-accent); text-decoration: none; }
.footer-link:hover { text-decoration: underline; }

/* 响应式 */
@media (max-width: 767px) {
  .page-inner { padding: 12px var(--tr-spacing-md) 32px; }
  .search-section { padding: 8px 0 20px; }
}
</style>
