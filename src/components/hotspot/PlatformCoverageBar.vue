<template>
  <section class="platform-bar">
    <div class="platform-scroll">
      <div
        v-for="p in platforms"
        :key="p.id"
        class="platform-chip"
      >
        <span class="chip-dot" :class="p.status"></span>
        <span class="chip-name">{{ p.name }}</span>
        <span class="chip-count">{{ p.item_count }}条</span>
      </div>
      <div v-if="platforms.length === 0" class="platform-empty">
        暂无平台数据
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  platforms: Array<{ id: string; name: string; item_count: number; status: string }>
}>()
</script>

<style scoped>
.platform-bar {
  background: var(--tr-bg-card);
  border: 1px solid var(--tr-border-card);
  border-radius: var(--tr-radius-lg);
  padding: 12px 20px;
  margin-bottom: var(--tr-spacing-lg);
  overflow: hidden;
}

.platform-scroll {
  display: flex;
  align-items: center;
  gap: 24px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.platform-scroll::-webkit-scrollbar { display: none; }

.platform-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  font-size: var(--tr-font-size-base);
  color: var(--tr-text-body);
  white-space: nowrap;
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.chip-dot.active { background: #10B981; }
.chip-dot.empty { background: #F59E0B; }
.chip-dot.error { background: #EF4444; }

.chip-name { font-weight: 500; }
.chip-count {
  color: var(--tr-text-muted);
  font-size: var(--tr-font-size-sm);
}

.platform-empty {
  color: var(--tr-text-muted);
  font-size: var(--tr-font-size-base);
}
</style>
