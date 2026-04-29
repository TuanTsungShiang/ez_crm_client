<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import type { AxiosError } from 'axios'
  import { sendEmailOtp, verifyEmail } from '@/api/auth'
  import { useAuthStore } from '@/stores/auth'
  import { ApiCode, type ApiError } from '@/api/types'

  const router = useRouter()
  const auth = useAuthStore()

  // email 從 sessionStorage 讀,避免進 URL / history / referer
  const email = ref(sessionStorage.getItem('pending_verify_email') ?? '')
  const code = ref('')

  const submitting = ref(false)
  const resending = ref(false)
  const error = ref<string | null>(null)
  const resendMessage = ref<string | null>(null)

  async function handleSubmit() {
    if (code.value.length !== 6) {
      error.value = '驗證碼為 6 位數'
      return
    }
    if (!email.value) {
      error.value = '找不到註冊的 Email,請回註冊頁重新開始'
      return
    }

    submitting.value = true
    error.value = null

    try {
      const res = await verifyEmail(email.value, code.value)
      if (res.success) {
        auth.setToken(res.data.token)
        auth.setMember(res.data.member)
        sessionStorage.removeItem('pending_verify_email')
        router.push({ name: 'home' })
      }
    } catch (e) {
      const err = e as AxiosError<ApiError>
      const code = err.response?.data.code
      if (code === ApiCode.INVALID_CODE) {
        error.value = '驗證碼錯誤或已過期,請確認後再試'
      } else {
        error.value = err.response?.data.message ?? '驗證失敗,請稍後再試'
      }
    } finally {
      submitting.value = false
    }
  }

  async function handleResend() {
    if (!email.value) return
    resending.value = true
    resendMessage.value = null
    error.value = null

    try {
      await sendEmailOtp(email.value)
      resendMessage.value = '新的驗證碼已寄出,請至 Email 收取。'
    } catch (e) {
      const err = e as AxiosError<ApiError>
      if (err.response?.data.code === ApiCode.THROTTLED) {
        error.value = '剛剛才發送過,請稍後再試'
      } else if (err.response?.data.code === ApiCode.ALREADY_VERIFIED) {
        error.value = '此 Email 已驗證,可直接登入'
      } else {
        error.value = err.response?.data.message ?? '發送失敗,請稍後再試'
      }
    } finally {
      resending.value = false
    }
  }
</script>

<template>
  <section class="mx-auto max-w-md">
    <h1 class="text-2xl font-bold text-slate-900">驗證 Email</h1>

    <div class="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p v-if="email" class="text-sm text-slate-600">
        我們已寄驗證碼到
        <strong class="text-slate-900">{{ email }}</strong>
        ,請輸入 6 位數驗證碼:
      </p>
      <p v-else class="text-sm text-red-500">
        找不到 Email,請先到
        <RouterLink to="/register" class="underline">註冊頁</RouterLink>
        。
      </p>

      <form class="mt-4 space-y-4" @submit.prevent="handleSubmit">
        <input
          v-model="code"
          type="text"
          inputmode="numeric"
          pattern="[0-9]{6}"
          maxlength="6"
          placeholder="123456"
          class="block w-full rounded-md border border-slate-300 px-3 py-2 text-center text-2xl font-mono tracking-widest shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          :disabled="!email"
        />

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <p v-if="resendMessage" class="text-sm text-emerald-600">
          {{ resendMessage }}
        </p>

        <button
          type="submit"
          :disabled="submitting || !email"
          class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {{ submitting ? '驗證中…' : '驗證並登入' }}
        </button>
      </form>

      <button
        type="button"
        class="mt-4 w-full text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
        :disabled="resending || !email"
        @click="handleResend"
      >
        {{ resending ? '發送中…' : '沒收到信?重新發送' }}
      </button>
    </div>
  </section>
</template>
