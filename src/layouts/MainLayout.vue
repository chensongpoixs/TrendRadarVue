<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <h2>趋势雷达</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        @select="handleMenuSelect"
      >
        <el-menu-item index="/">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-menu-item>

        <el-sub-menu index="news">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>新闻</span>
          </template>
          <el-menu-item index="/news">新闻列表</el-menu-item>
          <el-menu-item index="/topics">热门话题</el-menu-item>
          <el-menu-item index="/rss">RSS 订阅</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/analytics">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据分析</span>
        </el-menu-item>

        <el-sub-menu index="settings">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>设置</span>
          </template>
          <el-menu-item index="/settings">系统设置</el-menu-item>
          <el-menu-item index="/settings/platforms">平台配置</el-menu-item>
          <el-menu-item index="/settings/rss">RSS 配置</el-menu-item>
          <el-menu-item index="/settings/notification">通知配置</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute.meta.title">
              {{ currentRoute.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-button @click="toggleDark">
            <el-icon v-if="isDark"><Sunny /></el-icon>
            <el-icon v-else><Moon /></el-icon>
          </el-button>
          <el-button title="从服务器重新加载已持久化的热榜与 RSS（不触发外网抓取）" @click="refreshData">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useNewsStore } from '@/stores/news'

const route = useRoute()
const newsStore = useNewsStore()
const currentRoute = route

// 暗色模式
const isDark = ref(false)

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}

// 活动菜单
const activeMenu = computed(() => route.path)

function handleMenuSelect(index: string) {
  console.log('Menu selected:', index)
}

// 刷新数据
function refreshData() {
  newsStore.fetchLatestNews().catch(console.error)
}

// 监听路由变化
watch(() => route.path, () => {
  // 页面标题已在全局路由守卫中设置
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: var(--el-menu-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.logo h2 {
  color: var(--el-color-primary);
  font-size: 18px;
  font-weight: 600;
}

.el-menu {
  border-right: none;
}

.header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  gap: 10px;
}

.main-content {
  background-color: var(--el-bg-color-page);
  padding: 20px;
  overflow-y: auto;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
