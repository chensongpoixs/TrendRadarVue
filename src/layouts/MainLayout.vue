<template>
  <el-container class="layout-container">
    <!-- ==================== 桌面/平板侧边栏 ==================== -->
    <el-aside v-if="!isMobile" :width="sidebarWidth" class="sidebar">
      <div class="logo">
        <h2 v-if="!isSidebarCollapsed">趋势雷达</h2>
        <el-icon v-else :size="22"><TrendCharts /></el-icon>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isSidebarCollapsed"
        router
        @select="handleMenuSelect"
      >
        <el-menu-item index="/">
          <el-icon><House /></el-icon>
          <template #title>首页</template>
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
          <template #title>数据分析</template>
        </el-menu-item>

        <el-menu-item index="/chat">
          <el-icon><ChatDotSquare /></el-icon>
          <template #title>大模型对话</template>
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

    <!-- ==================== 移动端抽屉导航 ==================== -->
    <el-drawer
      v-if="isMobile"
      v-model="drawerVisible"
      direction="ltr"
      size="220px"
      :with-header="false"
      :z-index="2000"
    >
      <div class="drawer-logo">
        <h2>趋势雷达</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        @select="onDrawerSelect"
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

        <el-menu-item index="/chat">
          <el-icon><ChatDotSquare /></el-icon>
          <span>大模型对话</span>
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
    </el-drawer>

    <!-- ==================== 主内容区 ==================== -->
    <el-container>
      <!-- Header -->
      <el-header class="header">
        <div class="header-left">
          <!-- 移动端汉堡菜单 -->
          <el-button
            v-if="isMobile"
            link
            class="hamburger-btn"
            @click="drawerVisible = true"
          >
            <el-icon :size="22"><Expand /></el-icon>
          </el-button>

          <!-- 面包屑 -->
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute.meta.title">
              {{ currentRoute.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-button @click="toggleDark" :icon="isDark ? Sunny : Moon">
            <span v-if="!isMobile">{{ isDark ? '亮色' : '暗色' }}</span>
          </el-button>
          <el-button
            title="从服务器重新加载已持久化的热榜与 RSS（不触发外网抓取）"
            @click="refreshData"
            :icon="Refresh"
          >
            <span v-if="!isMobile">刷新</span>
          </el-button>
        </div>
      </el-header>

      <!-- 主内容 -->
      <el-main class="main-content" :class="{ 'has-bottom-nav': isMobile }">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>

      <!-- ==================== 移动端底部导航 ==================== -->
      <nav v-if="isMobile" class="mobile-bottom-nav safe-bottom">
        <router-link
          v-for="tab in bottomTabs"
          :key="tab.path"
          :to="tab.path"
          class="bottom-nav-item"
          :class="{ active: activeMenu === tab.path || activeMenu.startsWith(tab.activePrefix || '!') }"
        >
          <el-icon :size="20"><component :is="tab.icon" /></el-icon>
          <span class="nav-label">{{ tab.label }}</span>
        </router-link>
      </nav>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Refresh, Sunny, Moon } from '@element-plus/icons-vue'
import { useNewsStore } from '@/stores/news'
import { useResponsive } from '@/composables/useResponsive'

const route = useRoute()
const newsStore = useNewsStore()
const currentRoute = route

const { isMobile, isSidebarCollapsed, sidebarWidth } = useResponsive()

// 暗色模式
const isDark = ref(false)

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}

// 移动端抽屉
const drawerVisible = ref(false)
function onDrawerSelect() {
  drawerVisible.value = false
}

// 活动菜单
const activeMenu = computed(() => route.path)

function handleMenuSelect(_index: string) {
  // 平板模式下选择后可选收起菜单
}

// 刷新数据
function refreshData() {
  newsStore.fetchLatestNews().catch(console.error)
}

// 底部导航标签
const bottomTabs = [
  { path: '/', label: '首页', icon: 'House', activePrefix: '/' },
  { path: '/news', label: '新闻', icon: 'Document', activePrefix: '/news' },
  { path: '/topics', label: '话题', icon: 'TrendCharts', activePrefix: '/topics' },
  { path: '/chat', label: 'AI 对话', icon: 'ChatDotSquare', activePrefix: '/chat' },
  { path: '/analytics', label: '分析', icon: 'DataAnalysis', activePrefix: '/analytics' },
]
</script>

<style scoped>
.layout-container {
  height: 100vh;
  overflow: hidden;
}

/* ---- 侧边栏 ---- */
.sidebar {
  background-color: var(--el-menu-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
  transition: width var(--tr-transition-normal);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.logo h2 {
  color: var(--el-color-primary);
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.el-menu {
  border-right: none;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ---- 抽屉 ---- */
.drawer-logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: var(--tr-spacing-sm);
}

.drawer-logo h2 {
  color: var(--el-color-primary);
  font-size: 18px;
  font-weight: 600;
}

/* ---- Header ---- */
.header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--tr-spacing-md);
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--tr-spacing-sm);
  flex: 1;
  min-width: 0;
}

.header-right {
  display: flex;
  gap: var(--tr-spacing-sm);
  flex-shrink: 0;
}

.hamburger-btn {
  padding: var(--tr-spacing-xs);
  flex-shrink: 0;
}

/* ---- 主内容 ---- */
.main-content {
  background-color: var(--el-bg-color-page);
  padding: var(--tr-spacing-md);
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  -webkit-overflow-scrolling: touch;
}

.main-content.has-bottom-nav {
  padding-bottom: calc(var(--tr-spacing-md) + var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px));
}

/* ---- 移动端底部导航 ---- */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--bottom-nav-height);
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 1500;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-shadow: 0 -1px 6px rgba(0, 0, 0, 0.05);
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-decoration: none;
  color: var(--el-text-color-secondary);
  flex: 1;
  height: 100%;
  padding: 6px 0;
  transition: color var(--tr-transition-fast);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.bottom-nav-item.active {
  color: var(--el-color-primary);
}

.nav-label {
  font-size: 10px;
  line-height: 1;
  font-weight: 500;
}

/* ---- 动画 ---- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--tr-transition-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ---- 响应式 ---- */
@media (max-width: 767px) {
  .header {
    padding: 0 var(--tr-spacing-sm);
  }

  .header-right {
    gap: var(--tr-spacing-xs);
  }

  .main-content {
    padding: var(--tr-spacing-sm);
  }

  .main-content.has-bottom-nav {
    padding-bottom: calc(var(--tr-spacing-sm) + var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px));
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  /* 平板：折叠侧边栏 */
  .sidebar {
    width: var(--sidebar-collapsed-width);
  }

  .main-content {
    padding: var(--tr-spacing-md);
  }
}

/* ---- 暗色模式底部导航 ---- */
html.dark .mobile-bottom-nav {
  background: var(--el-bg-color);
  border-color: var(--el-border-color);
  box-shadow: 0 -1px 6px rgba(0, 0, 0, 0.3);
}
</style>
