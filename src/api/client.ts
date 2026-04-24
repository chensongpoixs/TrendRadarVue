import axios, { AxiosInstance, AxiosError } from 'axios'
import type { ApiResponse } from '@/types'
import { getApiBaseURL } from '@/config/runtime'

// 创建 axios 实例（基地址来自 /config.js 中 window.__TRENDRADAR_CONFIG__，或 Vite 环境变量，或默认 /api/v1）
const request: AxiosInstance = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 可以在此添加 token 等认证信息
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res: ApiResponse = response.data

    if (res.success) {
      return res as any
    }

    // 处理业务错误
    return Promise.reject(new Error(res.error || '请求失败'))
  },
  (error: AxiosError) => {
    // 处理 HTTP 错误
    const responseData = error.response?.data as { error?: string } | undefined
    const message = responseData?.error || error.message || '网络错误'
    return Promise.reject(new Error(message))
  }
)

export default request
