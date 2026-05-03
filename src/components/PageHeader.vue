<template>
  <div class="page-header">
    <div class="page-header-left">
      <!-- 返回按钮（可选） -->
      <el-button
        v-if="backRoute"
        link
        class="back-btn"
        @click="$router.push(backRoute)"
      >
        <el-icon><ArrowLeft /></el-icon>
      </el-button>

      <div class="title-section">
        <h1 class="page-title">{{ title }}</h1>
        <p v-if="description && !isMobile" class="page-description">
          {{ description }}
        </p>
      </div>
    </div>

    <div v-if="$slots.extra || actions?.length" class="page-header-right">
      <slot name="extra">
        <el-space wrap>
          <template v-for="action in actions" :key="action.label">
            <el-button
              :type="action.type || 'default'"
              :size="isMobile ? 'small' : 'default'"
              :loading="action.loading"
              :disabled="action.disabled"
              @click="action.onClick"
            >
              <el-icon v-if="action.icon"><component :is="action.icon" /></el-icon>
              <span>{{ action.label }}</span>
            </el-button>
          </template>
        </el-space>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { useResponsive } from '@/composables/useResponsive'

export interface PageAction {
  label: string
  icon?: Component
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  loading?: boolean
  disabled?: boolean
  onClick: () => void
}

defineProps<{
  title: string
  description?: string
  backRoute?: string
  actions?: PageAction[]
}>()

const { isMobile } = useResponsive()
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--tr-spacing-md);
  margin-bottom: var(--tr-spacing-md);
}

.page-header-left {
  display: flex;
  align-items: flex-start;
  gap: var(--tr-spacing-sm);
  flex: 1;
  min-width: 0;
}

.back-btn {
  flex-shrink: 0;
  margin-top: 2px;
}

.title-section {
  min-width: 0;
}

.page-title {
  font-size: var(--tr-font-size-xl);
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
  line-height: 1.4;
}

.page-description {
  font-size: var(--tr-font-size-sm);
  color: var(--el-text-color-secondary);
  margin: var(--tr-spacing-xs) 0 0;
  line-height: 1.5;
}

.page-header-right {
  flex-shrink: 0;
}

@media (max-width: 767px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-header-right {
    width: 100%;
  }

  .page-header-right .el-space {
    width: 100%;
    justify-content: flex-start;
  }

  .page-title {
    font-size: var(--tr-font-size-lg);
  }
}
</style>
