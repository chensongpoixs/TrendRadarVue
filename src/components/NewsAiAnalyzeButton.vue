<template>
  <span class="ai-analyze">
    <el-button
      type="primary"
      link
      size="small"
      :loading="loading"
      @click="run"
    >
      AI 读报
    </el-button>
    <el-dialog
      v-model="dialogVisible"
      title="AI 读报摘要"
      width="min(92vw, 560px)"
      destroy-on-close
      append-to-body
    >
      <p v-if="meta" class="meta">{{ meta }}</p>
      <div class="summary-body">{{ summaryText || '（无内容）' }}</div>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </span>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { analyzeNewsArticle } from '@/api/news'

const props = defineProps<{
  title: string
  url: string
  sourceName?: string
}>()

const loading = ref(false)
const dialogVisible = ref(false)
const summaryText = ref('')
const contentFetched = ref<boolean | null>(null)
const extractedRunes = ref(0)

const meta = computed(() => {
  if (contentFetched.value == null) return ''
  if (contentFetched.value) {
    return `已尝试抓取正文并抽取约 ${extractedRunes.value} 字（片段可能不完整，仅供参考）`
  }
  return '未能可靠抓取正文，以下为基于标题的保守说明'
})

async function run() {
  const title = (props.title || '').trim()
  const u = (props.url || '').trim()
  if (!title || !u) {
    ElMessage.warning('缺少标题或链接')
    return
  }
  loading.value = true
  summaryText.value = ''
  contentFetched.value = null
  try {
    const res = await analyzeNewsArticle({
      title,
      url: u,
      source_name: props.sourceName,
    })
    if (res.data) {
      summaryText.value = res.data.summary
      contentFetched.value = res.data.content_fetched
      extractedRunes.value = res.data.extracted_runes
      dialogVisible.value = true
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '分析失败'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 0 0 10px;
}
.summary-body {
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 14px;
  color: var(--el-text-color-primary);
  max-height: 60vh;
  overflow-y: auto;
}
</style>
