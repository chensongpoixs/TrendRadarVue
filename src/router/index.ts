import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/dashboard/index.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/news',
    name: 'News',
    component: () => import('@/views/news/index.vue'),
    meta: { title: '新闻列表' },
  },
  {
    path: '/news/:date',
    name: 'NewsByDate',
    component: () => import('@/views/news/date.vue'),
    meta: { title: '历史新闻' },
  },
  {
    path: '/topics',
    name: 'Topics',
    component: () => import('@/views/news/topics.vue'),
    meta: { title: '热门话题' },
  },
  {
    path: '/rss',
    name: 'RSS',
    component: () => import('@/views/news/rss.vue'),
    meta: { title: 'RSS 订阅' },
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('@/views/analytics/index.vue'),
    meta: { title: '数据分析' },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/settings/index.vue'),
    meta: { title: '系统设置' },
  },
  {
    path: '/settings/platforms',
    name: 'PlatformSettings',
    component: () => import('@/views/settings/platforms.vue'),
    meta: { title: '平台配置' },
  },
  {
    path: '/settings/rss',
    name: 'RSSSettings',
    component: () => import('@/views/settings/rss.vue'),
    meta: { title: 'RSS 配置' },
  },
  {
    path: '/settings/notification',
    name: 'NotificationSettings',
    component: () => import('@/views/settings/notification.vue'),
    meta: { title: '通知配置' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '趋势雷达'} - 热点新闻聚合`
  next()
})

export default router
