import type { AxiosError } from 'axios'
import axios, { type InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from './types'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Request interceptor：自動附 Bearer token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('ez_crm_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor：401 → 清 token + 導 login
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401 && error.response?.data?.code === 'A001') {
      localStorage.removeItem('ez_crm_token')
      localStorage.removeItem('ez_crm_member')
      // Lazy redirect：避免 module-level 匯入 router 造成 circular import
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=1'
      }
    }
    return Promise.reject(error)
  },
)
