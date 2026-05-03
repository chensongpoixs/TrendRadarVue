<template>
  <div class="empty-state">
    <div class="empty-icon">
      <slot name="icon">
        <el-icon :size="iconSize">
          <component :is="icon" />
        </el-icon>
      </slot>
    </div>
    <h3 class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <div v-if="$slots.actions || actionLabel" class="empty-actions">
      <slot name="actions">
        <el-button
          v-if="actionLabel"
          type="primary"
          @click="$emit('action')"
        >
          {{ actionLabel }}
        </el-button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FolderOpened } from '@element-plus/icons-vue'
import { useResponsive } from '@/composables/useResponsive'

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  icon?: any
  actionLabel?: string
}>(), {
  title: '暂无数据',
  description: '',
  icon: FolderOpened,
  actionLabel: '',
})

defineEmits<{
  action: []
}>()

const { isMobile } = useResponsive()
const iconSize = computed(() => isMobile.value ? 48 : 64)
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--tr-spacing-xl) var(--tr-spacing-md);
  text-align: center;
  min-height: 200px;
}

.empty-icon {
  color: var(--el-text-color-placeholder);
  margin-bottom: var(--tr-spacing-md);
  opacity: 0.6;
}

.empty-title {
  font-size: var(--tr-font-size-md);
  font-weight: 500;
  color: var(--el-text-color-secondary);
  margin: 0 0 var(--tr-spacing-xs);
}

.empty-description {
  font-size: var(--tr-font-size-sm);
  color: var(--el-text-color-placeholder);
  margin: 0 0 var(--tr-spacing-md);
  max-width: 360px;
  line-height: 1.5;
}

.empty-actions {
  margin-top: var(--tr-spacing-sm);
}

@media (max-width: 767px) {
  .empty-state {
    padding: var(--tr-spacing-lg) var(--tr-spacing-md);
    min-height: 160px;
  }

  .empty-title {
    font-size: var(--tr-font-size-base);
  }
}
</style>
