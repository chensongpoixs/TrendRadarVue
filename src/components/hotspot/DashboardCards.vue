<template>
  <section class="dashboard-section">
    <div class="section-title-bar">
      <h3>
        <el-icon :size="18"><DataAnalysis /></el-icon>
        {{ title }}
      </h3>
    </div>

    <!-- KPI 卡片行 -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon" style="background:#EFF6FF;color:#3B82F6">
          <el-icon :size="20"><Document /></el-icon>
        </div>
        <div class="kpi-body">
          <span class="kpi-value">{{ totalItems }}</span>
          <span class="kpi-label">热榜条目</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background:#F0FDF4;color:#10B981">
          <el-icon :size="20"><Connection /></el-icon>
        </div>
        <div class="kpi-body">
          <span class="kpi-value">{{ platformCount }}</span>
          <span class="kpi-label">覆盖平台</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background:#FEF3C7;color:#F59E0B">
          <el-icon :size="20"><TrendCharts /></el-icon>
        </div>
        <div class="kpi-body">
          <span class="kpi-value">{{ topicCount }}</span>
          <span class="kpi-label">热门话题</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background:#FEF2F2;color:#EF4444">
          <el-icon :size="20"><Clock /></el-icon>
        </div>
        <div class="kpi-body">
          <span class="kpi-value kpi-sm">{{ updateTime || '—' }}</span>
          <span class="kpi-label">数据时间</span>
        </div>
      </div>
    </div>

    <!-- 新闻类型环形图 -->
    <div v-if="ringItems.length > 0" class="platform-rings-wrap">
      <h4 class="dist-title">新闻类型分布</h4>
      <div class="rings-grid">
        <div v-for="(item, i) in ringItems" :key="item.name" class="ring-card">
          <svg width="90" height="90" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r="38" fill="none" stroke="#E2E8F0" stroke-width="8" />
            <circle
              cx="45" cy="45" r="38" fill="none"
              :stroke="ringColor(i)" stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashOffset(item.count)"
              transform="rotate(-90 45 45)"
              class="ring-arc"
            />
            <text x="45" y="47" text-anchor="middle" class="ring-value">{{ item.count }}</text>
            <text x="45" y="62" text-anchor="middle" class="ring-unit">条</text>
          </svg>
          <span class="ring-label">{{ item.name }}</span>
        </div>
      </div>
    </div>

    <!-- 平台分布条 -->
    <div v-if="platforms.length > 0" class="platform-dist">
      <h4 class="dist-title">平台详情</h4>
      <div class="dist-bars">
        <div
          v-for="p in platforms.slice(0, 8)"
          :key="p.id"
          class="dist-row"
        >
          <span class="dist-name">{{ p.name }}</span>
          <div class="dist-track">
            <div
              class="dist-fill"
              :style="{ width: pct(p.item_count, maxPlatformCount) }"
            />
          </div>
          <span class="dist-count">{{ p.item_count }}</span>
        </div>
      </div>
    </div>

    <slot />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DataAnalysis, Document, Connection, TrendCharts, Clock } from '@element-plus/icons-vue'

const props = withDefaults(defineProps<{
  title?: string
  totalItems?: number
  platformCount?: number
  topicCount?: number
  updateTime?: string
  platforms?: Array<{ id: string; name: string; item_count: number }>
  topics?: Array<{ word: string; count: number }>
}>(), {
  title: '数据仪表盘',
  totalItems: 0,
  platformCount: 0,
  topicCount: 0,
  updateTime: '',
  platforms: () => [],
  topics: () => [],
})

// 环形图数据：优先使用 topics，否则回退到 platforms
const ringItems = computed(() => {
  if (props.topics.length > 0) {
    return props.topics.slice(0, 8).map(t => ({
      name: t.word,
      count: t.count,
    }))
  }
  return props.platforms.slice(0, 8).map(p => ({
    name: p.name,
    count: p.item_count,
  }))
})

// SVG 环形图参数
const circumference = 2 * Math.PI * 38 // ~238.76
const ringColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
]

function ringColor(i: number) {
  return ringColors[i % ringColors.length]
}

function dashOffset(count: number) {
  const max = Math.max(...ringItems.value.map(r => r.count), 1)
  return circumference * (1 - count / max)
}

const maxPlatformCount = computed(() => {
  const max = Math.max(...props.platforms.map(p => p.item_count), 1)
  return max
})

function pct(val: number, max: number): string {
  if (max === 0) return '0%'
  return Math.round((val / max) * 100) + '%'
}
</script>

<style scoped>
.dashboard-section {
  background: var(--tr-bg-card);
  border: 1px solid var(--tr-border-card);
  border-radius: var(--tr-radius-lg);
  padding: 20px 24px;
  margin-bottom: var(--tr-spacing-lg);
}

.section-title-bar {
  margin-bottom: var(--tr-spacing-md);
}

.section-title-bar h3 {
  font-size: var(--tr-font-size-md);
  font-weight: 700;
  color: var(--tr-text-body);
  display: flex;
  align-items: center;
  gap: 8px;
}

/* KPI 网格 */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--tr-bg-page);
  border-radius: var(--tr-radius-md);
  border: 1px solid var(--tr-border-card);
}

.kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--tr-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.kpi-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--tr-text-body);
  line-height: 1.2;
}

.kpi-sm { font-size: 13px; }

.kpi-label {
  font-size: var(--tr-font-size-sm);
  color: var(--tr-text-muted);
}

/* 平台分布环形图 */
.platform-rings-wrap {
  border-top: 1px solid var(--tr-border-card);
  padding-top: 16px;
}
.rings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
}
.ring-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.ring-arc {
  transition: stroke-dashoffset 0.8s ease;
}
.ring-value {
  font-size: 16px;
  font-weight: 700;
  fill: var(--tr-text-body);
}
.ring-unit {
  font-size: 10px;
  fill: var(--tr-text-muted);
}
.ring-label {
  font-size: 12px;
  color: var(--tr-text-muted);
  font-weight: 500;
}

/* 平台分布条 */
.platform-dist {
  border-top: 1px solid var(--tr-border-card);
  padding-top: 16px;
}

.dist-title {
  font-size: var(--tr-font-size-sm);
  font-weight: 600;
  color: var(--tr-text-muted);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dist-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dist-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dist-name {
  width: 80px;
  font-size: var(--tr-font-size-sm);
  color: var(--tr-text-body);
  flex-shrink: 0;
  text-align: right;
}

.dist-track {
  flex: 1;
  height: 10px;
  background: var(--tr-bg-page);
  border-radius: 5px;
  overflow: hidden;
}

.dist-fill {
  height: 100%;
  background: linear-gradient(90deg, #3B82F6, #93C5FD);
  border-radius: 5px;
  min-width: 4px;
  transition: width 0.5s ease;
}

.dist-count {
  width: 30px;
  font-size: var(--tr-font-size-sm);
  font-weight: 600;
  color: var(--tr-text-muted);
  flex-shrink: 0;
}

/* 响应式 */
@media (max-width: 767px) {
  .dashboard-section { padding: 16px; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .kpi-card { padding: 12px; gap: 10px; }
  .kpi-value { font-size: 18px; }
  .dist-name { width: 60px; }
}
</style>
