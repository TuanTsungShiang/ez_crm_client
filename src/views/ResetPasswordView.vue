<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import type { AxiosError } from 'axios'
  import { resetPassword, forgotPassword } from '@/api/auth'
  import { ApiCode, type ApiError } from '@/api/types'

  const router = useRouter()

  const email = ref(sessionStorage.getItem('pending_reset_email') ?? '')
  const code = ref('')
  const password = ref('')
  const passwordConfirmation = ref('')

  const submitting = ref(false)
  const resending = ref(false)
  const error = ref<string | null>(null)
  const resendMessage = ref<string | null>(null)
  const success = ref(false)

  const canSubmit = computed(
    () =>
      email.value &&
      code.value.length === 6 &&
      password.value.length >= 8 &&
      password.value === passwordConfirmation.value,
  )

  async function handleSubmit() {
    submitting.value = true
    error.value = null

    try {
      const res = await resetPassword({
        email: email.value,
        code: code.value,
        password: password.value,
        password_confirmation: passwordConfirmation.value,
      })

      if (res.success) {
        sessionStorage.removeItem('pending_reset_email')
        success.value = true
      }
    } catch (e) {
      const err = e as AxiosError<ApiError>
      const apiCode = err.response?.data.code

      if (apiCode === ApiCode.INVALID_CODE) {
        error.value = '驗證碼錯誤或已過期'
      } else if (err.response?.data.errors) {
        // 密碼不符規則時後端會給 validation errors
        const firstField = Object.keys(err.response.data.errors)[0]
        error.value = err.response.data.errors[firstField]?.[0] ?? '驗證失敗'
      } else {
        error.value = err.response?.data.message ?? '重設失敗,請稍後再試'
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
      await forgotPassword(email.value)
      resendMessage.value = '新的驗證碼已寄出,請至 Email 收取。'
    } catch (e) {
      const err = e as AxiosError<ApiError>
      error.value = err.response?.data.message ?? '發送失敗'
    } finally {
      resending.value = false
    }
  }

  function goLogin() {
    router.push({ name: 'login' })
  }
</script>

<template>
  <section class="mx-auto max-w-md">
    <h1 class="text-2xl font-bold text-slate-900">重設密碼</h1>

    <!-- 成功 -->
    <div v-if="success" class="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-6">
      <p class="text-sm font-medium text-emerald-800">密碼已重設 🎉</p>
      <p class="mt-2 text-sm text-emerald-700">
        為了安全,所有舊的登入 token 都已失效,請使用新密碼重新登入。
      </p>
      <button
        type="button"
        class="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        @click="goLogin"
      >
        前往登入
      </button>
    </div>

    <!-- 沒找到 email -->
    <div v-else-if="!email" class="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4">
      <p class="text-sm text-amber-800">
        找不到重設中的 Email,請先到
        <RouterLink to="/forgot-password" class="underline">忘記密碼</RouterLink>
        頁。
      </p>
    </div>

    <!-- 主表單 -->
    <form
      v-else
      class="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      @submit.prevent="handleSubmit"
    >
      <p class="text-sm text-slate-600">
        重設帳號
        <strong class="text-slate-900">{{ email }}</strong>
        的密碼。
      </p>

      <div class="space-y-1">
        <label for="code" class="block text-sm font-medium text-slate-700">
          驗證碼 <span class="text-red-500">*</span>
        </label>
        <input
          id="code"
          v-model="code"
          type="text"
          inputmode="numeric"
          pattern="[0-9]{6}"
          maxlength="6"
          placeholder="123456"
          required
          class="block w-full rounded-md border border-slate-300 px-3 py-2 text-center text-lg font-mono tracking-widest shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div class="space-y-1">
        <label for="password" class="block text-sm font-medium text-slate-700">
          新密碼 <span class="text-red-500">*</span>
        </label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          autocomplete="new-password"
          class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p class="text-xs text-slate-500">至少 8 字元,需含大寫字母和數字</p>
      </div>

      <div class="space-y-1">
        <label for="password_confirmation" class="block text-sm font-medium text-slate-700">
          確認新密碼 <span class="text-red-500">*</span>
        </label>
        <input
          id="password_confirmation"
          v-model="passwordConfirmation"
          type="password"
          required
          autocomplete="new-password"
          class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          :class="{
            'border-red-400': passwordConfirmation && password !== passwordConfirmation,
          }"
        />
        <p
          v-if="passwordConfirmation && password !== passwordConfirmation"
          class="text-xs text-red-500"
        >
          兩次輸入的密碼不一致
        </p>
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-if="resendMessage" class="text-sm text-emerald-600">
        {{ resendMessage }}
      </p>

      <button
        type="submit"
        :disabled="submitting || !canSubmit"
        class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
      >
        {{ submitting ? '重設中…' : '確認重設密碼' }}
      </button>

      <button
        type="button"
        class="w-full text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
        :disabled="resending"
        @click="handleResend"
      >
        {{ resending ? '發送中…' : '沒收到信?重新發送' }}
      </button>
    </form>
  </section>
</template>
