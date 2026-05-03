import { marked } from 'marked'
import DOMPurify from 'dompurify'

/** 将 AI 行业研报 Markdown 转为安全 HTML，企业级渲染 */
export function formatInsightBodyHtml(text: string): string {
  if (!text) return ''
  const raw = marked.parse(text, { breaks: true, gfm: true }) as string
  return DOMPurify.sanitize(raw)
}
