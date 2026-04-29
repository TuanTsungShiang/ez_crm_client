<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import type { AxiosError } from 'axios'
  import { forgotPassword } from '@/api/auth'
  import type { ApiError } from '@/api/types'

  const router = useRouter()

  const email = ref('')
  const submitting = ref(false)
  const error = ref<string | null>(null)

  async function handleSubmit() {
    submitting.value = true
    error.value = null

    try {
      const res = await forgotPassword(email.value)
      if (res.success) {
        // email 帶到下一頁(sessionStorage,不進 URL)
        sessionStorage.setItem('pending_reset_email', email.value)
        router.push({ name: 'reset-password' })
      }
    } catch (e) {
      const err = e as AxiosError<ApiError>
      error.value = err.response?.data.message ?? '發送失敗,請稍後再試'
    } finally {
      submitting.value = false
    }
  }
</script>

<template>
  <section class="mx-auto max-w-md">
    <h1 class="text-2xl font-bold text-slate-900">忘記密碼</h1>
    <p class="mt-2 text-sm text-slate-500">輸入註冊時的 Email,我們會寄送 6 位數驗證碼給你。</p>

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

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <button
        type="submit"
        :disabled="submitting"
        class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
      >
        {{ submitting ? '發送中…' : '寄送驗證碼' }}
      </button>

      <p class="pt-2 text-center text-xs text-slate-500">
        想起密碼了?
        <RouterLink to="/login" class="text-blue-600 hover:underline">返回登入</RouterLink>
      </p>
    </form>
  </section>
</template>
