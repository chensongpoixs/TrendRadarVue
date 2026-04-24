/**
 * 运行时配置（不随 npm run build 打进步骤包，构建产物中保留本文件，部署后可只改本文件与后端联调）
 * 必须包含在 index.html 中先于应用模块脚本加载
 *
 * apiBase: 后端 API 根路径（须含 /api/v1），与前端页面同源时可用相对路径
 * 示例: '/api/v1'  或  'http://127.0.0.1:8080/api/v1'  或  'https://api.example.com/api/v1'
 */
window.__TRENDRADAR_CONFIG__ = {
  apiBase: '/api/v1',
}
