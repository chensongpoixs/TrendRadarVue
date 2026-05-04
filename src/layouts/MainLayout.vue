<template>
  <div class="layout-stack">
    <!-- ==================== 顶部导航 ==================== -->
    <HeaderBar
      :is-dark="isDark"
      :is-mobile="isMobile"
      @toggle-dark="toggleDark"
      @toggle-drawer="drawerVisible = true"
      @refresh="refreshData"
      @search="handleSearch"
    />

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
        <el-menu-item index="/dashboard">
          <el-icon><Monitor /></el-icon>
          <span>仪表盘</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNewsStore } from '@/stores/news'
import { useResponsive } from '@/composables/useResponsive'
import HeaderBar from '@/components/HeaderBar.vue'

const route = useRoute()
const router = useRouter()
const newsStore = useNewsStore()
const { isMobile } = useResponsive()

const isDark = ref(false)
const drawerVisible = ref(false)

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}

function onDrawerSelect() {
  drawerVisible.value = false
}

function refreshData() {
  newsStore.fetchLatestNews().catch(console.error)
}

function handleSearch(query: string) {
  router.push({ path: '/news', query: { q: query } })
}

const activeMenu = computed(() => route.path)

const bottomTabs = [
  { path: '/', label: '首页', icon: 'House', activePrefix: '/' },
  { path: '/news', label: '新闻', icon: 'Document', activePrefix: '/news' },
  { path: '/topics', label: '话题', icon: 'TrendCharts', activePrefix: '/topics' },
  { path: '/chat', label: 'AI 对话', icon: 'ChatDotSquare', activePrefix: '/chat' },
  { path: '/dashboard', label: '仪表盘', icon: 'Monitor', activePrefix: '/dashboard' },
]
</script>

<style scoped>
.layout-stack {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
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

/* ---- 主内容 ---- */
.main-content {
  background: var(--tr-bg-page);
  padding: 0;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  -webkit-overflow-scrolling: touch;
}
.main-content.has-bottom-nav {
  padding-bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px));
}

/* ---- 移动端底部导航 ---- */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--bottom-nav-height);
  background: var(--tr-bg-card);
  border-top: 1px solid var(--tr-border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 1500;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-shadow: 0 -1px 6px rgba(0, 0, 0, 0.05);
}
html.dark .mobile-bottom-nav {
  box-shadow: 0 -1px 6px rgba(0, 0, 0, 0.3);
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
</style>
