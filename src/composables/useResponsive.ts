import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * 响应式断点 composable
 *
 * 断点定义：
 * - mobile:  < 768px  手机
 * - tablet:  768px - 1023px  平板
 * - desktop: >= 1024px  桌面
 */
export function useResponsive() {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  const isMobile = computed(() => width.value < 768)
  const isTablet = computed(() => width.value >= 768 && width.value < 1024)
  const isDesktop = computed(() => width.value >= 1024)
  /** 非桌面设备（手机 + 平板） */
  const isCompact = computed(() => width.value < 1024)

  /** 侧边栏宽度 */
  const sidebarWidth = computed(() => {
    if (width.value < 768) return '0px'
    if (width.value < 1024) return 'var(--sidebar-collapsed-width)'
    return 'var(--sidebar-width)'
  })

  /** 侧边栏是否折叠（平板模式折叠为仅图标） */
  const isSidebarCollapsed = computed(() => {
    return width.value >= 768 && width.value < 1024
  })

  function onResize() {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  onMounted(() => {
    window.addEventListener('resize', onResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', onResize)
  })

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isCompact,
    sidebarWidth,
    isSidebarCollapsed,
  }
}
