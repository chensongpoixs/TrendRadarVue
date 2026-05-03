<template>
  <div class="analytics-page">
    <h2 class="page-title">数据分析中心</h2>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" type="card" @tab-change="onTabChange">
      <!-- 话题趋势 -->
      <el-tab-pane label="话题趋势" name="trend">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>话题趋势分析</span>
            </div>
          </template>
          <el-form :inline="!isMobile" :class="{ 'form-mobile': isMobile }">
            <el-form-item label="话题关键词">
              <el-input v-model="trendTopic" placeholder="输入话题关键词" />
            </el-form-item>
            <el-form-item label="分析类型">
              <el-select v-model="trendType">
                <el-option label="趋势" value="trend" />
                <el-option label="生命周期" value="lifecycle" />
              </el-select>
            </el-form-item>
            <el-form-item label="时间范围">
              <el-select v-model="trendRange">
                <el-option label="最近 7 天" value="last_7_days" />
                <el-option label="最近 30 天" value="last_30_days" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="trendLoading" @click="analyzeTrend">
                分析
              </el-button>
            </el-form-item>
          </el-form>

          <div v-if="trendData.length" class="chart-card">
            <h4>{{ trendTopic }} - 热度趋势</h4>
            <div class="bar-chart">
              <div v-for="point in trendData" :key="point.date" class="bar-item">
                <div
                  class="bar"
                  :style="{ height: barPct(point.value) }"
                  :title="`${point.date}: ${point.value} 条`"
                />
                <span class="bar-label">{{ point.date.slice(5) }}</span>
                <span class="bar-value">{{ point.value }}</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="输入话题关键词并点击分析" :image-size="isMobile ? 60 : 80" />
        </el-card>
      </el-tab-pane>

      <!-- 情感分析 -->
      <el-tab-pane label="情感分析" name="sentiment">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>情感倾向分析</span>
            </div>
          </template>
          <el-form :inline="!isMobile" :class="{ 'form-mobile': isMobile }">
            <el-form-item label="话题">
              <el-input v-model="sentTopic" placeholder="输入话题关键词" />
            </el-form-item>
            <el-form-item label="平台">
              <el-select v-model="sentPlatforms" multiple placeholder="全部平台" clearable>
                <el-option label="微博" value="weibo" />
                <el-option label="知乎" value="zhihu" />
                <el-option label="百度" value="baidu" />
                <el-option label="头条" value="toutiao" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="sentLoading" @click="analyzeSentiment">
                分析
              </el-button>
            </el-form-item>
          </el-form>

          <div v-if="sentResult" class="sentiment-result">
            <el-row :gutter="isMobile ? 10 : 20">
              <el-col :xs="24" :md="8" class="sent-col">
                <div class="stat-card positive">
                  <div class="stat-num">{{ sentResult.distribution?.positive || 0 }}</div>
                  <div class="stat-label">正面</div>
                  <div class="stat-pct">{{ sentResult.percentages?.positive?.toFixed(1) || 0 }}%</div>
                </div>
              </el-col>
              <el-col :xs="24" :md="8" class="sent-col">
                <div class="stat-card neutral">
                  <div class="stat-num">{{ sentResult.distribution?.neutral || 0 }}</div>
                  <div class="stat-label">中性</div>
                  <div class="stat-pct">{{ sentResult.percentages?.neutral?.toFixed(1) || 0 }}%</div>
                </div>
              </el-col>
              <el-col :xs="24" :md="8" class="sent-col">
                <div class="stat-card negative">
                  <div class="stat-num">{{ sentResult.distribution?.negative || 0 }}</div>
                  <div class="stat-label">负面</div>
                  <div class="stat-pct">{{ sentResult.percentages?.negative?.toFixed(1) || 0 }}%</div>
                </div>
              </el-col>
            </el-row>
            <el-alert
              v-if="sentResult.sentiment"
              :title="`整体倾向：${sentLabel(sentResult.sentiment)}`"
              :type="sentType(sentResult.sentiment)"
              show-icon
              :closable="false"
              class="sent-alert"
            />
          </div>
          <el-empty v-else description="输入话题关键词并点击分析" :image-size="isMobile ? 60 : 80" />
        </el-card>
      </el-tab-pane>

      <!-- 时期对比 -->
      <el-tab-pane label="时期对比" name="compare">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>时期对比分析</span>
            </div>
          </template>
          <el-form :inline="!isMobile" :class="{ 'form-mobile': isMobile }">
            <el-form-item label="时期 1">
              <el-date-picker
                v-model="period1"
                type="daterange"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item label="时期 2">
              <el-date-picker
                v-model="period2"
                type="daterange"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="compLoading" @click="comparePeriods">
                对比
              </el-button>
            </el-form-item>
          </el-form>

          <div v-if="compareResult" class="compare-result">
            <el-row :gutter="isMobile ? 10 : 20" class="compare-summary">
              <el-col :xs="12" :md="12">
                <div class="stat-card">
                  <div class="stat-num">{{ compareResult.period1?.total || 0 }}</div>
                  <div class="stat-label">时期 1 新闻数</div>
                </div>
              </el-col>
              <el-col :xs="12" :md="12">
                <div class="stat-card">
                  <div class="stat-num">{{ compareResult.period2?.total || 0 }}</div>
                  <div class="stat-label">时期 2 新闻数</div>
                </div>
              </el-col>
            </el-row>

            <h4>关键词变化 TOP 20</h4>
            <div class="keyword-changes">
              <div
                v-for="kw in (compareResult.keyword_changes || [])"
                :key="kw.keyword"
                class="kw-row"
              >
                <span class="kw-word">{{ kw.keyword }}</span>
                <span class="kw-counts">{{ kw.count1 }} → {{ kw.count2 }}</span>
                <span
                  class="kw-change"
                  :class="kw.change_pct > 0 ? 'up' : 'down'"
                >
                  {{ kw.change_pct > 0 ? '+' : '' }}{{ kw.change_pct.toFixed(1) }}%
                </span>
                <el-progress
                  :percentage="Math.min(Math.abs(kw.change_pct), 100)"
                  :color="kw.change_pct > 0 ? '#67C23A' : '#F56C6C'"
                  :show-text="false"
                  :stroke-width="6"
                />
              </div>
            </div>
          </div>
          <el-empty v-else description="选择两个时期并点击对比" :image-size="isMobile ? 60 : 80" />
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/api/client'
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()
const activeTab = ref('trend')

// 趋势分析
const trendTopic = ref('')
const trendType = ref('trend')
const trendRange = ref('last_7_days')
const trendLoading = ref(false)
const trendData = ref<any[]>([])
const trendTotal = ref(0)

function barPct(val: number): string {
  const maxVal = Math.max(...trendData.value.map((d: any) => d.value), 1)
  return Math.round((val / maxVal) * 100) + '%'
}

async function analyzeTrend() {
  if (!trendTopic.value) {
    ElMessage.warning('请输入话题关键词')
    return
  }
  trendLoading.value = true
  try {
    const res = await request.post('/analytics/topic/trend', {
      topic: trendTopic.value,
      analysis_type: trendType.value,
      date_range: trendRange.value,
      granularity: 'day',
    })
    if (res.data?.success) {
      trendData.value = res.data.data?.trend || []
      trendTotal.value = res.data.data?.total_news || 0
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '趋势分析失败')
  } finally {
    trendLoading.value = false
  }
}

// 情感分析
const sentTopic = ref('')
const sentPlatforms = ref<string[]>([])
const sentLoading = ref(false)
const sentResult = ref<any>(null)

function sentLabel(s: string) {
  const map: Record<string, string> = { positive: '正面', negative: '负面', neutral: '中性' }
  return map[s] || s
}
function sentType(s: string) {
  const map: Record<string, string> = { positive: 'success', negative: 'danger', neutral: 'info' }
  return (map[s] || 'info') as 'success' | 'danger' | 'info'
}

async function analyzeSentiment() {
  if (!sentTopic.value) {
    ElMessage.warning('请输入话题关键词')
    return
  }
  sentLoading.value = true
  try {
    const res = await request.post('/analytics/sentiment', {
      topic: sentTopic.value,
      platforms: sentPlatforms.value,
      date_range: 'last_7_days',
      limit: 50,
    })
    if (res.data?.success) {
      sentResult.value = res.data.data
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '情感分析失败')
  } finally {
    sentLoading.value = false
  }
}

// 时期对比
const period1 = ref<string[]>([])
const period2 = ref<string[]>([])
const compLoading = ref(false)
const compareResult = ref<any>(null)

async function comparePeriods() {
  if (!period1.value?.length || !period2.value?.length) {
    ElMessage.warning('请同时选择两个时期')
    return
  }
  compLoading.value = true
  try {
    const res = await request.post('/analytics/compare-periods', {
      period1_start: period1.value[0],
      period1_end: period1.value[1],
      period2_start: period2.value[0],
      period2_end: period2.value[1],
      platforms: [],
    })
    if (res.data?.success) {
      compareResult.value = res.data.data
    } else {
      ElMessage.error(res.data?.error || '对比分析失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '对比分析失败')
  } finally {
    compLoading.value = false
  }
}

function onTabChange(_tab: string) {}
</script>

<style scoped>
.analytics-page {
  padding: var(--tr-spacing-sm);
}

@media (min-width: 768px) {
  .analytics-page {
    padding: var(--tr-spacing-md);
    max-width: 1200px;
    margin: 0 auto;
  }
}

.page-title {
  margin: 0 0 var(--tr-spacing-md);
  font-size: var(--tr-font-size-xl);
  font-weight: 600;
}

@media (min-width: 768px) {
  .page-title {
    font-size: var(--tr-font-size-2xl);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--tr-spacing-sm);
}

/* 移动端表单堆叠 */
.form-mobile :deep(.el-form-item) {
  display: block;
  margin-bottom: var(--tr-spacing-sm);
}

.form-mobile :deep(.el-form-item__label) {
  width: auto !important;
}

.form-mobile :deep(.el-select) {
  width: 100%;
}

.form-mobile :deep(.el-date-editor) {
  width: 100%;
}

/* 柱状图 */
.chart-card {
  margin-top: var(--tr-spacing-md);
}

.chart-card h4 {
  margin: 0 0 var(--tr-spacing-md);
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 180px;
  padding: var(--tr-spacing-md) 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

@media (min-width: 768px) {
  .bar-chart {
    gap: 8px;
    height: 200px;
  }
}

.bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.bar {
  width: 100%;
  max-width: 32px;
  background: linear-gradient(180deg, var(--el-color-primary) 0%, var(--el-color-primary-light-5) 100%);
  border-radius: var(--tr-radius-sm) var(--tr-radius-sm) 0 0;
  min-height: 4px;
  transition: height var(--tr-transition-normal);
}

@media (min-width: 768px) {
  .bar {
    max-width: 40px;
  }
}

.bar-label {
  font-size: 9px;
  color: var(--el-text-color-secondary);
  margin-top: 6px;
}

@media (min-width: 768px) {
  .bar-label {
    font-size: 10px;
  }
}

.bar-value {
  font-size: var(--tr-font-size-xs);
  font-weight: 500;
  color: var(--el-text-color-primary);
}

/* 情感分析 */
.sentiment-result {
  margin-top: var(--tr-spacing-md);
}

.sent-col {
  margin-bottom: var(--tr-spacing-sm);
}

@media (min-width: 768px) {
  .sent-col {
    margin-bottom: 0;
  }
}

.stat-card {
  text-align: center;
  padding: var(--tr-spacing-md);
  border-radius: var(--tr-radius-md);
  background: var(--el-fill-color-light);
}

@media (min-width: 768px) {
  .stat-card {
    padding: var(--tr-spacing-lg);
  }
}

.stat-card.positive {
  border-top: 3px solid #67C23A;
}

.stat-card.neutral {
  border-top: 3px solid #909399;
}

.stat-card.negative {
  border-top: 3px solid #F56C6C;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

@media (min-width: 768px) {
  .stat-num {
    font-size: 32px;
  }
}

.stat-label {
  font-size: var(--tr-font-size-base);
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.stat-pct {
  font-size: var(--tr-font-size-sm);
  color: var(--el-text-color-placeholder);
  margin-top: 2px;
}

.sent-alert {
  margin-top: var(--tr-spacing-md);
}

/* 时期对比 */
.compare-result {
  margin-top: var(--tr-spacing-md);
}

.compare-summary {
  margin-bottom: var(--tr-spacing-lg);
}

.compare-result h4 {
  margin: 0 0 var(--tr-spacing-sm);
}

.keyword-changes {
  display: flex;
  flex-direction: column;
  gap: var(--tr-spacing-xs);
}

.kw-row {
  display: flex;
  align-items: center;
  gap: var(--tr-spacing-sm);
  padding: var(--tr-spacing-xs) 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.kw-word {
  width: 80px;
  font-weight: 500;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .kw-word {
    width: 120px;
  }
}

.kw-counts {
  width: 70px;
  font-size: var(--tr-font-size-sm);
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .kw-counts {
    width: 80px;
  }
}

.kw-change {
  width: 50px;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.kw-change.up {
  color: #67C23A;
}

.kw-change.down {
  color: #F56C6C;
}
</style>
