<template>
  <section class="hero-section">
    <div class="section-header">
      <h2 class="section-title">
        <el-icon :size="20"><TrendCharts /></el-icon>
        热门事件
      </h2>
    </div>

    <!-- 加载态 -->
    <div v-if="loading" class="hero-grid">
      <div v-for="i in 3" :key="i" class="event-card skeleton-card">
        <div class="sk-circle"></div>
        <div class="sk-body">
          <div class="sk-line w-80"></div>
          <div class="sk-line w-60"></div>
          <div class="sk-line w-40"></div>
        </div>
      </div>
    </div>

    <!-- 空态 -->
    <el-empty v-else-if="events.length === 0" description="暂无热门事件" :image-size="80" />

    <!-- 事件卡片 -->
    <div v-else class="hero-grid">
      <EventCard
        v-for="(event, idx) in events.slice(0, 3)"
        :key="idx"
        :event="event"
        :index="idx"
        variant="hero"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { TrendCharts } from '@element-plus/icons-vue'
import EventCard from './EventCard.vue'

defineProps<{
  events: Array<{
    title: string
    url: string
    mobile_url: string
    heat_score: number
    sources: Array<{ source_id: string; source_name: string; rank: number }>
    source_count: number
    max_rank: number
    crawl_time: string
  }>
  loading: boolean
}>()
</script>

<style scoped>
.hero-section {
  margin-bottom: var(--tr-spacing-lg);
}
.section-header {
  margin-bottom: var(--tr-spacing-md);
}
.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--tr-text-body);
  display: flex;
  align-items: center;
  gap: 8px;
}
.hero-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
@media (max-width: 1023px) {
  .hero-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 767px) {
  .hero-grid { grid-template-columns: 1fr; }
}

/* 骨架 */
.skeleton-card { padding: 24px 28px; align-items: center; gap: 18px; cursor: default; }
.skeleton-card:hover { transform: none; box-shadow: var(--tr-shadow-card); }
.sk-circle {
  width: 36px; height: 36px; border-radius: 4px;
  background: var(--el-fill-color-light); flex-shrink: 0;
}
.sk-body { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.sk-line {
  height: 14px; border-radius: 6px;
  background: var(--el-fill-color-light);
}
.w-80 { width: 80%; } .w-60 { width: 60%; } .w-40 { width: 40%; }
</style>
