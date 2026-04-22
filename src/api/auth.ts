import { apiClient } from './client'
import type {
  ApiResponse,
  LoginResult,
  RegisterResult,
  RegisterSchema,
} from './types'

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  phone?: string | null
  agree_terms: boolean
}

export interface LoginPayload {
  email: string
  password: string
  device_name?: string
  platform?: string
}

export async function getRegisterSchema() {
  const { data } = await apiClient.get<ApiResponse<RegisterSchema>>(
    '/auth/register/schema',
  )
  return data
}

export async function register(payload: RegisterPayload) {
  const { data } = await apiClient.post<ApiResponse<RegisterResult>>(
    '/auth/register',
    payload,
  )
  return data
}

export async function login(payload: LoginPayload) {
  const { data } = await apiClient.post<ApiResponse<LoginResult>>(
    '/auth/login',
    payload,
  )
  return data
}

export async function verifyEmail(email: string, code: string) {
  const { data } = await apiClient.post<ApiResponse<LoginResult>>(
    '/auth/verify/email',
    { email, code },
  )
  return data
}

export async function sendEmailOtp(email: string) {
  const { data } = await apiClient.post<ApiResponse<{ otp_expires_in: number }>>(
    '/auth/verify/email/send',
    { email },
  )
  return data
}

export async function forgotPassword(email: string) {
  const { data } = await apiClient.post<ApiResponse<{ otp_expires_in: number }>>(
    '/auth/password/forgot',
    { email },
  )
  return data
}

export interface ResetPasswordPayload {
  email: string
  code: string
  password: string
  password_confirmation: string
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const { data } = await apiClient.post<ApiResponse<null>>(
    '/auth/password/reset',
    payload,
  )
  return data
}

export type OAuthProvider = 'google' | 'github' | 'line' | 'discord'

export async function getOAuthRedirectUrl(provider: OAuthProvider) {
  const { data } = await apiClient.get<ApiResponse<{ url: string }>>(
    `/auth/oauth/${provider}/redirect`,
  )
  return data
}
