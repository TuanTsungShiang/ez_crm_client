<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AxiosError } from 'axios'
import { login } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { ApiCode, type ApiError } from '@/api/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)
const needVerifyEmail = ref<string | null>(null)
const sessionExpired = route.query.expired === '1'

async function handleSubmit() {
  submitting.value = true
  error.value = null
  needVerifyEmail.value = null

  try {
    const res = await login({ email: email.value, password: password.value })
    if (res.success) {
      auth.setToken(res.data.token)
      auth.setMember(res.data.member)
      const redirect = (route.query.redirect as string) || '/'
      router.push(redirect)
    }
  } catch (e) {
    const err = e as AxiosError<ApiError>
    const code = err.response?.data.code

    switch (code) {
      case ApiCode.INVALID_CREDENTIALS:
        error.value = '帳號或密碼錯誤'
        break
      case ApiCode.ACCOUNT_SUSPENDED:
        error.value = '此帳號已停用,請聯繫客服'
        break
      case ApiCode.EMAIL_NOT_VERIFIED:
        // 後端 errors.email 會帶當前 email,導引到 verify 頁面
        error.value = 'Email 尚未驗證'
        needVerifyEmail.value = err.response?.data.errors?.email?.[0] ?? email.value
        break
      default:
        error.value = err.response?.data.message ?? '登入失敗,請稍後再試'
    }
  } finally {
    submitting.value = false
  }
}

function goVerify() {
  if (needVerifyEmail.value) {
    sessionStorage.setItem('pending_verify_email', needVerifyEmail.value)
    router.push({ name: 'verify' })
  }
}
</script>

<template>
  <section class="mx-auto max-w-md">
    <h1 class="text-2xl font-bold text-slate-900">會員登入</h1>

    <div
      v-if="sessionExpired"
      class="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
    >
      登入已逾期,請重新登入。
    </div>

    <form
      class="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      @submit.prevent="handleSubmit"
    >
      <div class="space-y-1">
        <label for="email" class="block text-sm font-medium text-slate-700">
          Email <span class="text-red-500">*</span>
        </label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div class="space-y-1">
        <label for="password" class="block text-sm font-medium text-slate-700">
          密碼 <span class="text-red-500">*</span>
        </label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div v-if="error" class="space-y-2">
        <p class="text-sm text-red-600">{{ error }}</p>
        <button
          v-if="needVerifyEmail"
          type="button"
          class="text-sm text-blue-600 underline hover:text-blue-700"
          @click="goVerify"
        >
          前往驗證 {{ needVerifyEmail }} →
        </button>
      </div>

      <button
        type="submit"
        :disabled="submitting"
        class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
      >
        {{ submitting ? '登入中…' : '登入' }}
      </button>

      <div class="flex items-center justify-between pt-2 text-xs text-slate-500">
        <RouterLink
          to="/forgot-password"
          class="text-slate-500 hover:text-slate-700 hover:underline"
        >
          忘記密碼?
        </RouterLink>
        <span>
          還沒有帳號?
          <RouterLink to="/register" class="text-blue-600 hover:underline">立即註冊</RouterLink>
        </span>
      </div>
    </form>
  </section>
</template>
