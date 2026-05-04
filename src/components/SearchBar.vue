<template>
  <div class="search-hero" :class="{ 'search-mobile': isMobile }">
    <el-input
      v-model="query"
      size="large"
      placeholder="搜索热点事件..."
      :prefix-icon="Search"
      clearable
      :class="{ 'is-focus': focused }"
      @focus="focused = true"
      @blur="focused = false"
      @keyup.enter="doSearch"
      @clear="doClear"
    >
      <template #append>
        <el-button :icon="Search" @click="doSearch">搜索</el-button>
      </template>
    </el-input>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useResponsive } from '@/composables/useResponsive'

const emit = defineEmits<{
  search: [query: string]
}>()

const { isMobile } = useResponsive()
const query = ref('')
const focused = ref(false)

function doSearch() {
  const trimmed = query.value.trim()
  if (trimmed) {
    emit('search', trimmed)
  }
}

function doClear() {
  query.value = ''
}
</script>

<style scoped>
.search-hero {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}

.search-hero :deep(.el-input__wrapper) {
  box-shadow: var(--tr-shadow-card);
  border-radius: var(--tr-radius-lg);
  padding: 6px 16px;
  background: var(--tr-bg-card);
  border: 1px solid var(--tr-border-subtle);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.search-hero :deep(.el-input__wrapper:hover) {
  border-color: #93C5FD;
}

.search-hero :deep(.el-input__wrapper.is-focus) {
  border-color: var(--tr-color-accent);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.search-hero :deep(.el-input-group__append) {
  border-radius: 0 var(--tr-radius-lg) var(--tr-radius-lg) 0;
  background: var(--tr-color-accent);
  border-color: var(--tr-color-accent);
}

.search-hero :deep(.el-input-group__append .el-button) {
  color: #fff;
}

.search-mobile {
  max-width: 100%;
  padding: 0 var(--tr-spacing-md);
}
</style>
