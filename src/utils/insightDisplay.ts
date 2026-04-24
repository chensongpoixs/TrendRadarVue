/** 将 AI 行业研报转为安全 HTML：转义标签，支持 **加粗**、# / ## 标题、换行 */
export function formatInsightBodyHtml(text: string): string {
  if (!text) return ''
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const bold = (s: string) => s.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')

  const out: string[] = []
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (/^##\s+/.test(t)) {
      out.push(
        '<h3 class="insight-h3">' + bold(esc(t.replace(/^##\s+/, ''))) + '</h3>'
      )
    } else if (/^#\s+/.test(t) && !t.startsWith('##')) {
      out.push(
        '<h2 class="insight-h2">' + bold(esc(t.replace(/^#\s+/, ''))) + '</h2>'
      )
    } else {
      out.push(bold(esc(line)) + '<br/>')
    }
  }
  return out.join('')
}
