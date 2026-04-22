import { apiClient } from './client'
import type { ApiResponse, Member } from './types'

export interface MeDetail extends Member {
  group?: { name: string } | null
  profile?: {
    avatar?: string | null
    gender?: number | null
    birthday?: string | null
    bio?: string | null
    language?: string | null
    timezone?: string | null
  } | null
  sns?: Array<{ provider: string }>
  tags?: Array<{ name: string; color?: string | null }>
}

export async function getMe() {
  const { data } = await apiClient.get<ApiResponse<MeDetail>>('/me')
  return data
}

export interface UpdateMePayload {
  name?: string
  nickname?: string | null
  phone?: string | null
}

export async function updateMe(payload: UpdateMePayload) {
  const { data } = await apiClient.put<ApiResponse<MeDetail>>('/me', payload)
  return data
}
