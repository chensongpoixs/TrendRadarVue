<template>
  <div class="chat-page">
    <el-page-header @back="goHome" class="page-head">
      <template #content>
        <span class="title">大模型对话</span>
        <el-tag v-if="lastModel" type="info" size="small" class="ml8">{{ lastModel }}</el-tag>
      </template>
      <template #extra>
        <el-button v-if="messages.length" link type="danger" @click="clearAll">清空对话</el-button>
      </template>
    </el-page-header>

    <p class="hint">
      消息经<strong>本后端</strong>转发到配置的大模型，浏览器<strong>不接触</strong> API Key。请勿发送密码等敏感信息。
    </p>

    <el-card shadow="never" class="chat-card" :body-style="{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }">
      <div ref="listRef" class="msg-list">
        <el-empty
          v-if="!messages.length && !loading"
          description="在下方输入内容开始对话，支持多轮连续发言"
          :image-size="80"
        />
        <div
          v-for="(m, i) in messages"
          :key="i + '-' + m.role"
          class="msg-row"
          :class="m.role"
        >
          <div class="msg-bubble">
            <div class="msg-role">
              <el-tag
                v-if="m.role === 'user'"
                type="primary"
                size="small"
                effect="plain"
              >我</el-tag>
              <el-tag
                v-else-if="m.role === 'assistant'"
                type="success"
                size="small"
                effect="plain"
              >助手</el-tag>
              <el-tag
                v-else
                type="info"
                size="small"
                effect="plain"
              >系统</el-tag>
            </div>
            <div class="msg-text">{{ m.content }}</div>
          </div>
        </div>
        <div v-if="loading" class="msg-row assistant">
          <div class="msg-bubble loading-bubble">
            <el-icon class="is-loading"><Loading /></el-icon>
            正在思考…
          </div>
        </div>
      </div>

      <div v-if="lastUsage" class="usage-bar">
        上次 tokens：输入 {{ lastUsage.prompt_tokens }} · 输出
        {{ lastUsage.completion_tokens }} · 合计 {{ lastUsage.total_tokens }}
      </div>

      <div class="composer">
        <el-input
          v-model="input"
          type="textarea"
          :rows="3"
          placeholder="输入你的问题，Enter 发送，Shift+Enter 换行"
          :disabled="loading"
          @keydown="onKeydown"
        />
        <div class="composer-actions">
          <el-button type="primary" :loading="loading" :disabled="!canSend" @click="send">
            发送
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { postAIChat } from '@/api/ai'
import type { AiChatMessage, AiTokenUsage } from '@/types'

const router = useRouter()
const listRef = ref<HTMLElement | null>(null)
const input = ref('')
const loading = ref(false)
const messages = ref<AiChatMessage[]>([])
const lastUsage = ref<AiTokenUsage | null>(null)
const lastModel = ref('')

const canSend = computed(
  () => !loading.value && input.value.trim().length > 0
)

function goHome() {
  router.push({ name: 'Home' })
}

function clearAll() {
  messages.value = []
  lastUsage.value = null
  lastModel.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    void send()
  }
}

function scrollToBottom() {
  nextTick(() => {
    const el = listRef.value
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  })
}

watch(
  () => messages.value.length,
  () => scrollToBottom()
)

async function send() {
  const text = input.value.trim()
  if (!text || loading.value) return

  const userMsg: AiChatMessage = { role: 'user', content: text }
  const payload: AiChatMessage[] = [...messages.value, userMsg]
  input.value = ''
  messages.value = payload
  loading.value = true
  lastUsage.value = null

  try {
    const res = await postAIChat(payload)
    if (res.data?.message?.content) {
      messages.value = [
        ...messages.value,
        { role: 'assistant', content: res.data.message.content },
      ]
      lastUsage.value = res.data.usage
      lastModel.value = res.data.model || ''
    }
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '请求失败')
    if (messages.value.length > 0 && messages.value[messages.value.length - 1]?.role === 'user') {
      messages.value = messages.value.slice(0, -1)
    }
  } finally {
    loading.value = false
    scrollToBottom()
  }
}
</script>

<style scoped>
.chat-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 16px 32px;
  min-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

.page-head {
  margin-bottom: 8px;
}
.title {
  font-size: 18px;
  font-weight: 600;
}
.ml8 {
  margin-left: 8px;
}

.hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  margin: 0 0 12px;
}

.chat-card {
  flex: 1;
  min-height: 480px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
}

.msg-list {
  flex: 1;
  min-height: 240px;
  max-height: min(60vh, 640px);
  overflow-y: auto;
  padding: 16px;
  background: var(--el-fill-color-blank);
}

.msg-row {
  display: flex;
  margin-bottom: 12px;
}
.msg-row.user {
  justify-content: flex-end;
}
.msg-row.assistant,
.msg-row.system {
  justify-content: flex-start;
}

.msg-bubble {
  max-width: 88%;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.msg-row.user .msg-bubble {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
}

.msg-role {
  margin-bottom: 6px;
}

.msg-text {
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--el-text-color-primary);
}

.loading-bubble {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.usage-bar {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  padding: 4px 16px 8px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.composer {
  border-top: 1px solid var(--el-border-color);
  padding: 12px 16px 16px;
  background: var(--el-bg-color);
}

.composer-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}
</style>
