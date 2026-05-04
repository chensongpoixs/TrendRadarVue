<template>
  <section class="category-section">
    <div class="section-header">
      <h3 class="section-title">{{ title }}</h3>
      <slot name="extra" />
    </div>

    <!-- 加载态 -->
    <div v-if="loading" class="event-grid">
      <div v-for="i in 4" :key="i" class="event-card skeleton-card">
        <div class="sk-line w-90"></div>
        <div class="sk-line w-60"></div>
        <div class="sk-line w-40"></div>
      </div>
    </div>

    <!-- 空态 -->
    <el-empty v-else-if="events.length === 0" description="暂无事件" :image-size="60" />

    <!-- 事件网格 -->
    <div v-else class="event-grid">
      <EventCard
        v-for="(event, idx) in events"
        :key="event.title.slice(0, 20) + idx"
        :event="event"
        :index="startIndex + idx"
        variant="grid"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import EventCard from './EventCard.vue'

withDefaults(defineProps<{
  title: string
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
  loading?: boolean
  startIndex?: number
}>(), {
  loading: false,
  startIndex: 0,
})
</script>

<style scoped>
.category-section {
  margin-bottom: var(--tr-spacing-xl);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--tr-spacing-md);
}

.section-title {
  font-size: var(--tr-font-size-lg);
  font-weight: 700;
  color: var(--tr-text-body);
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 20px;
  background: var(--tr-color-accent);
  border-radius: 2px;
}

/* 4 列网格 */
.event-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1023px) {
  .event-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 767px) {
  .event-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}

/* 骨架 */
.skeleton-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: default;
}
.skeleton-card:hover { transform: none; box-shadow: var(--tr-shadow-card); }
.sk-line {
  height: 14px; border-radius: 6px;
  background: var(--el-fill-color-light);
}
.w-90 { width: 90%; } .w-60 { width: 60%; } .w-40 { width: 40%; }
</style>
