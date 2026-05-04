<template>
  <article
    class="event-card"
    :class="{ 'event-hero': variant === 'hero' }"
    @click="openLink"
  >
    <!-- 排名徽章 -->
    <div class="event-rank" :class="rankClass">
      <span v-if="index < 3" class="rank-icon">{{ ['🥇', '🥈', '🥉'][index] }}</span>
      <span v-else class="rank-num">{{ index + 1 }}</span>
    </div>

    <!-- 主体内容 -->
    <div class="event-body">
      <h3 class="event-title" :class="{ 'title-hero': variant === 'hero' }">
        {{ event.title }}
      </h3>

      <div class="event-meta">
        <!-- 热度徽章 -->
        <span class="heat-badge" :class="heatLevel">
          <el-icon :size="12"><TrendCharts /></el-icon>
          {{ formatHeat(event.heat_score) }}
        </span>

        <!-- 平台标签 -->
        <span class="platform-tags">
          <template v-for="(src, i) in event.sources.slice(0, 4)" :key="src.source_id">
            <span class="platform-tag">{{ src.source_name }}</span>
            <span v-if="i < Math.min(event.sources.length, 4) - 1" class="tag-sep"></span>
          </template>
          <span v-if="event.sources.length > 4" class="platform-tag more">+{{ event.sources.length - 4 }}</span>
        </span>

        <!-- 时间 -->
        <span class="event-time">{{ formatTime(event.crawl_time) }}</span>
      </div>
    </div>

    <!-- 展开箭头 (Hero) -->
    <el-icon v-if="variant === 'hero'" class="hero-arrow" :size="20">
      <ArrowRight />
    </el-icon>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TrendCharts, ArrowRight } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

interface HotEvent {
  title: string
  url: string
  mobile_url: string
  heat_score: number
  sources: Array<{ source_id: string; source_name: string; rank: number }>
  source_count: number
  max_rank: number
  crawl_time: string
}

const props = withDefaults(defineProps<{
  event: HotEvent
  index: number
  variant?: 'hero' | 'grid'
}>(), {
  variant: 'grid',
})

const rankClass = computed(() => {
  if (props.index < 3) return 'rank-top'
  if (props.index < 10) return 'rank-high'
  return 'rank-normal'
})

const heatLevel = computed(() => {
  if (props.event.heat_score >= 500) return 'high'
  if (props.event.heat_score >= 200) return 'mid'
  return 'low'
})

function formatHeat(score: number): string {
  if (score >= 1000) return (score / 1000).toFixed(1) + 'k'
  return String(score)
}

function formatTime(t: string): string {
  if (!t) return ''
  return dayjs(t).format('HH:mm')
}

function openLink() {
  const url = props.event.mobile_url || props.event.url
  if (url) window.open(url, '_blank')
}
</script>

<style scoped>
.event-card {
  position: relative;
  background: var(--tr-bg-card);
  border: 1px solid var(--tr-border-card);
  border-radius: var(--tr-radius-lg);
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  cursor: pointer;
  box-shadow: var(--tr-shadow-card);
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.event-card:hover {
  box-shadow: var(--tr-shadow-card-hover);
  transform: translateY(-2px);
  border-color: var(--tr-border-subtle);
}

/* Hero 变体 */
.event-hero {
  padding: 24px 28px;
  gap: 18px;
}

/* 排名 */
.event-rank {
  width: 36px;
  height: 36px;
  border-radius: var(--tr-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 700;
  font-size: 16px;
}
.rank-top { background: #EFF6FF; color: var(--tr-color-accent); }
.rank-high { background: #FEF3C7; color: #D97706; }
.rank-normal { background: #F1F5F9; color: var(--tr-text-muted); }
.rank-icon { font-size: 20px; }

/* 主体 */
.event-body { flex: 1; min-width: 0; }

.event-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--tr-text-body);
  line-height: 1.5;
  margin: 0 0 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.title-hero { font-size: 17px; }

/* 元信息行 */
.event-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* 热度徽章 */
.heat-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: #EFF6FF;
  color: var(--tr-color-accent);
}
.heat-badge.high { background: #FEE2E2; color: var(--tr-color-heat-high); }
.heat-badge.mid  { background: #FEF3C7; color: var(--tr-color-heat-mid); }
.heat-badge.low  { background: #D1FAE5; color: var(--tr-color-heat-low); }

/* 平台标签 */
.platform-tags {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--tr-font-size-sm);
  color: var(--tr-text-muted);
}

.platform-tag { white-space: nowrap; }
.platform-tag.more {
  background: var(--tr-border-subtle);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.tag-sep::after { content: '·'; margin: 0 2px; }

/* 时间 */
.event-time {
  font-size: var(--tr-font-size-sm);
  color: var(--tr-text-muted);
  white-space: nowrap;
}

/* Hero 箭头 */
.hero-arrow {
  color: var(--tr-text-muted);
  flex-shrink: 0;
  margin-top: 4px;
}

/* 暗色模式 */
html.dark .rank-top { background: #1E3A5F; }
html.dark .rank-high { background: #3D2E0A; }
html.dark .rank-normal { background: #1E293B; }
html.dark .heat-badge { background: #1E3A5F; }
html.dark .heat-badge.high { background: #3B1A1A; }
html.dark .heat-badge.mid  { background: #3D2E0A; }
html.dark .heat-badge.low  { background: #0F2D1F; }
html.dark .platform-tag.more { background: var(--tr-border-subtle); }
</style>
