import request from './client'
import type { ApiResponse, AiChatMessage, AiChatResponseData } from '@/types'

/**
 * 多轮对话：请求体由前端维护完整历史，经后端转发至配置的 LLM（不暴露 API Key）
 */
export function postAIChat(
  messages: AiChatMessage[],
  maxTokens = 0
): Promise<ApiResponse<AiChatResponseData>> {
  return request.post(
    '/ai/chat',
    { messages, max_tokens: maxTokens > 0 ? maxTokens : undefined },
    { timeout: 300000 }
  )
}
