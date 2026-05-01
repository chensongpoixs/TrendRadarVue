<template>
  <div class="history-page">
    <el-card class="toolbar">
      <el-space wrap>
        <span class="label">选择日期</span>
        <el-date-picker
          v-model="picked"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择一天"
          :disabled-date="disabledFuture"
          @change="onDatePicked"
        />
        <el-tag v-if="timezone" type="info" size="small">时区 {{ timezone }}</el-tag>
        <el-button link type="primary" @click="goToday">今天</el-button>
      </el-space>
    </el-card>

    <el-card v-loading="summaryLoading">
      <template #header>
        <div class="card-header">
          <span>日汇总</span>
          <el-space wrap>
            <el-tag v-if="totalRows >= 0" type="success" size="small">
              共 {{ totalRows }} 条快照
            </el-tag>
            <el-button
              type="primary"
              size="small"
              :loading="exporting"
              :disabled="totalRows <= 0"
              @click="syncToModelScope"
            >
              {{ exporting ? '同步中...' : '同步到 ModelScope' }}
            </el-button>
          </el-space>
        </div>
      </template>
      <el-empty v-if="!summaryLoading && totalRows === 0" description="该日尚无热榜快照（调度抓取后会按小时累积）" />
      <div v-else class="hour-bars">
        <div
          v-for="h in 24"
          :key="h - 1"
          class="hour-cell"
          :class="{
            empty: (hourCountMap[h - 1] ?? 0) === 0,
            active: selectedHour === h - 1,
          }"
          :title="tooltipForHour(h - 1)"
          @click="selectHour(h - 1)"
        >
          <div
            class="bar"
            :style="{ height: barHeight(h - 1) }"
          />
          <span class="hn">{{ h - 1 }}</span>
        </div>
      </div>
      <p class="hint">横轴为本地 0–23 点；柱高表示该小时快照条数；点击某小时查看列表。</p>
    </el-card>

    <el-card v-loading="insightsLoading" class="insights-card">
      <template #header>
        <div class="card-header">
          <span>当日行业 AI 研报</span>
          <el-space wrap>
            <el-tag v-if="insightsModel" type="info" size="small">{{ insightsModel }}</el-tag>
            <span v-if="insightsUpdated" class="insight-updated">{{
              formatInsightTime(insightsUpdated)
            }}</span>
            <el-tag
              v-if="insightsMeta?.digest_truncated"
              type="warning"
              size="small"
            >输入已截断</el-tag>
            <el-button
              v-if="totalRows > 0"
              type="primary"
              link
              :disabled="insightsLoading"
              :loading="insightsLoading"
              @click="refreshDayInsights"
            >
              重新生成
            </el-button>
          </el-space>
        </div>
      </template>
      <p
        v-if="!insightError && totalRows > 0"
        class="insight-legend"
      >
        在当日热榜标题基础上归纳 <strong>行业机遇</strong>、<strong>可落地与可参与机会</strong>、<strong>普通人可关注的方向</strong>；依据不足时正文会直说。非投资建议。重新生成会按最新说明更新全文。
      </p>
      <el-alert
        v-if="insightError"
        :title="insightError"
        type="error"
        show-icon
        :closable="false"
        class="insight-err"
      />
      <p v-else-if="!insightsLoading && totalRows === 0" class="muted">
        该日无热榜快照，无法基于标题流生成投研体例的汇总（抓取任务运行后会累积数据）。
      </p>
      <div
        v-else-if="insightsContent"
        class="insight-body"
        v-html="insightBodyHtml"
      ></div>
      <p
        v-else-if="!insightsLoading && !insightError && totalRows > 0"
        class="muted"
      >
        可点击下方「重新生成」拉取该日热榜并调用模型（首次进入会自动尝试生成）。
      </p>
    </el-card>

    <el-card v-loading="hourLoading">
      <template #header>
        <div class="card-header">
          <span>{{ selectedHour }} 点 · 热榜条目</span>
          <el-select
            v-model="filterPlatforms"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="筛选平台"
            clearable
            style="min-width: 200px"
            @change="reloadHour"
          >
            <el-option
              v-for="(name, id) in idToName"
              :key="id"
              :label="name"
              :value="id"
            />
          </el-select>
        </div>
      </template>
      <el-empty v-if="!hourLoading && hourItems.length === 0" description="该小时无数据或已筛选为空" />
      <div v-else class="news-list">
        <div
          v-for="row in hourItems"
          :key="row.id + '-' + row.source_id + '-' + row.url"
          class="news-item"
        >
          <div class="news-rank" :class="getRankClass(row.rank)">{{ row.rank }}</div>
          <div class="news-content">
            <div class="news-title">
              <a :href="row.url" target="_blank" rel="noopener noreferrer">{{ row.title }}</a>
            </div>
            <div class="news-meta">
              <span>{{ idToName[row.source_id] || row.source_name || row.source_id }}</span>
              <span>{{ formatCaptured(row.captured_at) }}</span>
              <NewsAiAnalyzeButton
                :title="row.title"
                :url="row.url"
                :source-name="idToName[row.source_id] || row.source_name"
              />
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import {
  getSnapshotAvailableDates,
  getSnapshotDaySummary,
  getSnapshotDayInsights,
  postSnapshotDayInsights,
  getSnapshotHour,
} from '@/api/news'
import { postDailyExport } from '@/api/system'
import NewsAiAnalyzeButton from '@/components/NewsAiAnalyzeButton.vue'
import { formatInsightBodyHtml } from '@/utils/insightDisplay'
import type { HotlistSnapshotRow, SnapshotHourStat } from '@/types'

const route = useRoute()
const router = useRouter()

const picked = ref<string>('')
const timezone = ref('')
const summaryLoading = ref(false)
const hourLoading = ref(false)
const totalRows = ref(-1)
const hourStats = ref<SnapshotHourStat[]>([])
const idToName = ref<Record<string, string>>({})
const selectedHour = ref(0)
const hourItems = ref<HotlistSnapshotRow[]>([])
const filterPlatforms = ref<string[]>([])
const maxCount = ref(1)

const insightsLoading = ref(false)
const insightsContent = ref('')
const insightsModel = ref('')
const insightsUpdated = ref('')
const insightsMeta = ref<{ unique_titles?: number; digest_truncated?: boolean } | null>(null)
const insightError = ref('')

const currentDate = computed(() => (route.params.date as string) || '')

const insightBodyHtml = computed(() => formatInsightBodyHtml(insightsContent.value))

// ModelScope 同步
const exporting = ref(false)

async function syncToModelScope() {
  const date = currentDate.value
  if (!date) {
    ElMessage.warning('请先选择日期')
    return
  }
  exporting.value = true
  try {
    const res = await postDailyExport(date)
    if (res.success) {
      ElMessage.success(`${date} 正在同步到 ModelScope，请稍后查看仓库`)
    } else {
      ElMessage.error(res.error || '同步失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '同步请求失败')
  } finally {
    exporting.value = false
  }
}

const hourCountMap = computed(() => {
  const m: Record<number, number> = {}
  for (let i = 0; i < 24; i++) m[i] = 0
  for (const h of hourStats.value) {
    m[h.hour] = Number(h.row_count)
  }
  return m
})

function disabledFuture(d: Date) {
  return dayjs(d).isAfter(dayjs(), 'day')
}

function barHeight(h: number): string {
  const c = hourCountMap.value[h] || 0
  if (c === 0) return '2px'
  const max = maxCount.value || 1
  const pct = Math.max(8, Math.round((c / max) * 100))
  return pct + '%'
}

function tooltipForHour(h: number): string {
  const c = hourCountMap.value[h] || 0
  return `${h}:00 — ${c} 条`
}

function goToday() {
  const t = dayjs().format('YYYY-MM-DD')
  router.push({ name: 'NewsByDate', params: { date: t } })
}

function onDatePicked(v: string | null) {
  if (!v) return
  router.push({ name: 'NewsByDate', params: { date: v } })
}

async function loadSummary(date: string) {
  summaryLoading.value = true
  try {
    const res = await getSnapshotDaySummary(date)
    if (res.data) {
      timezone.value = res.data.timezone || ''
      totalRows.value = res.data.total_rows
      hourStats.value = res.data.hours || []
      idToName.value = res.data.id_to_name || {}
      let max = 1
      for (const h of hourStats.value) {
        if (h.row_count > max) max = h.row_count
      }
      maxCount.value = max
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('加载日汇总失败')
  } finally {
    summaryLoading.value = false
  }
}

async function loadHour(date: string, hour: number) {
  hourLoading.value = true
  try {
    const plats = filterPlatforms.value.length ? filterPlatforms.value : undefined
    const res = await getSnapshotHour(date, hour, plats)
    if (res.data) {
      hourItems.value = res.data.items
      idToName.value = { ...idToName.value, ...res.data.id_to_name }
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('加载小时数据失败')
  } finally {
    hourLoading.value = false
  }
}

function reloadHour() {
  if (currentDate.value) {
    void loadHour(currentDate.value, selectedHour.value)
  }
}

function formatCaptured(iso: string) {
  if (!iso) return '—'
  return dayjs(iso).format('MM-DD HH:mm:ss')
}

function getRankClass(rank: number): string {
  if (rank <= 3) return 'rank-top'
  if (rank <= 10) return 'rank-high'
  return 'rank-normal'
}

function formatInsightTime(iso: string) {
  if (!iso) return ''
  return dayjs(iso).format('MM-DD HH:mm')
}

/** 有快照时：先读缓存，无则自动生成整日研报 */
async function loadDayInsights() {
  const date = currentDate.value
  insightError.value = ''
  insightsContent.value = ''
  insightsModel.value = ''
  insightsUpdated.value = ''
  insightsMeta.value = null
  if (!date || totalRows.value <= 0) {
    return
  }
  insightsLoading.value = true
  try {
    const cached = await getSnapshotDayInsights(date)
    if (cached.data?.cached && (cached.data.content || '').length > 0) {
      insightsContent.value = cached.data.content
      insightsModel.value = cached.data.model || ''
      insightsUpdated.value = cached.data.updated_at || ''
      return
    }
    const gen = await postSnapshotDayInsights(date)
    if (gen.data) {
      insightsContent.value = gen.data.content || ''
      insightsModel.value = gen.data.model || ''
      insightsUpdated.value = gen.data.updated_at || ''
      insightsMeta.value = {
        unique_titles: gen.data.unique_titles,
        digest_truncated: gen.data.digest_truncated,
      }
    }
  } catch (e) {
    console.error(e)
    const msg = e && typeof e === 'object' && 'message' in e ? String((e as Error).message) : '研报加载或生成失败'
    insightError.value = msg
  } finally {
    insightsLoading.value = false
  }
}

async function refreshDayInsights() {
  const date = currentDate.value
  if (!date || totalRows.value <= 0) {
    ElMessage.info('该日无快照数据')
    return
  }
  insightError.value = ''
  insightsLoading.value = true
  try {
    const plats = filterPlatforms.value.length ? filterPlatforms.value : undefined
    const gen = await postSnapshotDayInsights(date, plats)
    if (gen.data) {
      insightsContent.value = gen.data.content || ''
      insightsModel.value = gen.data.model || ''
      insightsUpdated.value = gen.data.updated_at || ''
      insightsMeta.value = {
        unique_titles: gen.data.unique_titles,
        digest_truncated: gen.data.digest_truncated,
      }
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('重新生成失败')
  } finally {
    insightsLoading.value = false
  }
}

function selectHour(h: number) {
  if (hourCountMap.value[h] === 0) {
    ElMessage.info('该小时尚无快照数据')
    return
  }
  selectedHour.value = h
  void loadHour(currentDate.value, h)
}

watch(
  () => route.params.date,
  async (d) => {
    const date = typeof d === 'string' ? d : String(d)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const t = dayjs().format('YYYY-MM-DD')
      await router.replace({ name: 'NewsByDate', params: { date: t } })
      return
    }
    picked.value = date
    await loadSummary(date)
    await loadDayInsights()
    if (hourStats.value.length) {
      const first = hourStats.value[0]!.hour
      selectedHour.value = first
      await loadHour(date, first)
    } else {
      selectedHour.value = 0
      hourItems.value = []
    }
  },
  { immediate: true }
)

onMounted(async () => {
  try {
    const res = await getSnapshotAvailableDates(90)
    if (res.data?.dates?.length) {
      // 若当前日无数据且列表中有更近的日期，可仅作信息展示
      void res.data
    }
  } catch {
    // 可选
  }
})
</script>

<style scoped>
.history-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.toolbar {
  margin-bottom: 16px;
}

.label {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.hour-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 120px;
  padding: 8px 0 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.hour-cell {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  position: relative;
  border-radius: 4px;
  padding: 4px 2px 0;
}

.hour-cell.empty {
  cursor: default;
  opacity: 0.45;
}

.hour-cell:hover:not(.empty) {
  background: var(--el-fill-color-light);
}

.hour-cell.active {
  background: var(--el-color-primary-light-9);
}

.bar {
  width: 100%;
  max-width: 18px;
  min-height: 2px;
  background: var(--el-color-primary);
  border-radius: 2px 2px 0 0;
  margin-bottom: 4px;
  align-self: center;
}

.hour-cell.empty .bar {
  background: var(--el-border-color);
}

.hn {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  line-height: 1;
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

.hint {
  margin: 24px 0 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.news-list {
  max-height: 520px;
  overflow-y: auto;
}

.news-item {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  gap: 10px;
}

.news-rank {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.rank-top {
  background: #ffebee;
  color: #f44336;
}
.rank-high {
  background: #fff3e0;
  color: #ff9800;
}
.rank-normal {
  background: #f5f5f5;
  color: #9e9e9e;
}

.news-content {
  min-width: 0;
  flex: 1;
}
.news-title {
  font-size: 14px;
  line-height: 1.4;
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
}
.news-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
}

.insights-card {
  margin-top: 16px;
}
.insight-legend {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  margin: 0 0 12px;
  padding: 8px 10px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  border-left: 3px solid var(--el-color-primary);
}
.muted {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin: 0;
}
.insight-updated {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.insight-body {
  line-height: 1.65;
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.insight-body :deep(.insight-h2) {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1em 0 0.5em;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 4px;
}
.insight-body :deep(.insight-h3) {
  font-size: 1rem;
  font-weight: 600;
  margin: 1em 0 0.4em;
  color: var(--el-color-primary);
}
.insight-body :deep(strong) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.insight-err {
  margin-bottom: 0;
}
</style>
