<template>
  <header class="header-bar" :class="{ 'header-mobile': isMobile }">
    <div class="header-inner">
      <!-- 左侧：Logo + 移动端汉堡 -->
      <div class="header-left">
        <el-button
          v-if="isMobile"
          link
          class="hamburger-btn"
          @click="$emit('toggleDrawer')"
        >
          <el-icon :size="22"><Expand /></el-icon>
        </el-button>
        <router-link to="/" class="logo-link">
          <span class="logo-text">趋势雷达</span>
          <span class="logo-sub">TrendRadar</span>
        </router-link>
      </div>

      <!-- 中间：搜索栏 (桌面端) -->
      <div v-if="!isMobile" class="header-center">
        <SearchBar @search="(q: string) => $emit('search', q)" />
      </div>

      <!-- 右侧：操作按钮 -->
      <div class="header-right">
        <router-link v-if="!isMobile" to="/dashboard" class="nav-link">仪表盘</router-link>
        <router-link v-if="!isMobile" to="/chat" class="nav-link">AI 对话</router-link>
        <el-button
          :icon="isDark ? Sunny : Moon"
          @click="$emit('toggleDark')"
          title="切换暗色/亮色模式"
        >
          <span v-if="!isMobile">{{ isDark ? '亮色' : '暗色' }}</span>
        </el-button>
        <el-button
          :icon="Refresh"
          @click="$emit('refresh')"
          title="刷新数据"
        >
          <span v-if="!isMobile">刷新</span>
        </el-button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Refresh, Sunny, Moon, Expand } from '@element-plus/icons-vue'
import SearchBar from '@/components/SearchBar.vue'

defineProps<{
  isDark: boolean
  isMobile: boolean
}>()

defineEmits<{
  toggleDark: []
  toggleDrawer: []
  refresh: []
  search: [query: string]
}>()
</script>

<style scoped>
.header-bar {
  height: var(--header-height);
  background: var(--tr-bg-card);
  border-bottom: 1px solid var(--tr-border-subtle);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-inner {
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--tr-spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--tr-spacing-md);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--tr-spacing-sm);
  flex-shrink: 0;
}

.logo-link {
  display: flex;
  align-items: baseline;
  gap: 6px;
  text-decoration: none;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--tr-color-accent);
  letter-spacing: 0.5px;
}

.logo-sub {
  font-size: 11px;
  color: var(--tr-text-muted);
  font-weight: 400;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 560px;
  margin: 0 auto;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--tr-spacing-sm);
  flex-shrink: 0;
}

.nav-link {
  font-size: var(--tr-font-size-base);
  color: var(--tr-text-muted);
  text-decoration: none;
  padding: 4px 10px;
  border-radius: var(--tr-radius-sm);
  transition: color 0.2s, background 0.2s;
  white-space: nowrap;
}
.nav-link:hover {
  color: var(--tr-color-accent);
  background: var(--tr-color-accent-light);
}

.hamburger-btn {
  padding: var(--tr-spacing-xs);
}

@media (max-width: 767px) {
  .header-inner {
    padding: 0 var(--tr-spacing-md);
  }
  .header-right {
    gap: var(--tr-spacing-xs);
  }
  .logo-text {
    font-size: 16px;
  }
}
</style>
