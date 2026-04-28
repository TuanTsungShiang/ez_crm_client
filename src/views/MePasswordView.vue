<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AxiosError } from 'axios'
import { getMe, setPassword, updatePassword } from '@/api/me'
import { useAuthStore } from '@/stores/auth'
import type { ApiError } from '@/api/types'

const router = useRouter()
const auth = useAuthStore()

const loading = ref(true)
const hasLocalPassword = ref<boolean>(true)

const form = ref({
  current_password: '',
  password: '',
  password_confirmation: '',
})

const submitting = ref(false)
const errors = ref<Record<string, string[]>>({})
const topError = ref<string | null>(null)
const success = ref(false)

const passwordMismatch = computed(
  () =>
    form.value.password.length > 0
    && form.value.password_confirmation.length > 0
    && form.value.password !== form.value.password_confirmation,
)

const canSubmit = computed(() => {
  if (submitting.value) return false
  if (form.value.password.length < 8) return false
  if (passwordMismatch.value) return false
  // Update flow needs current_password; set flow does not.
  if (hasLocalPassword.value && form.value.current_password.length === 0) return false
  return true
})

const heading = computed(() => (hasLocalPassword.value ? '更改密碼' : '設定密碼'))

const subheading = computed(() =>
  hasLocalPassword.value
    ? '密碼更新後,其他裝置的登入 token 會被撤銷,請重新登入。'
    : '你是用第三方帳號註冊的,還沒設過自己的密碼。設定後即可用 Email + 密碼登入。',
)

function fieldError(name: string): string | null {
  return errors.value[name]?.[0] ?? null
}

onMounted(async () => {
  try {
    const res = await getMe()
    if (res.success) {
      hasLocalPassword.value = res.data.has_local_password ?? true
    }
  } finally {
    loading.value = false
  }
})

async function handleSubmit() {
  if (!canSubmit.value) return

  submitting.value = true
  errors.value = {}
  topError.value = null

  try {
    const res = hasLocalPassword.value
      ? await updatePassword({ ...form.value })
      : await setPassword({
          password: form.value.password,
          password_confirmation: form.value.password_confirmation,
        })

    if (res.success) {
      success.value = true
      setTimeout(() => {
        auth.clear()
        router.push({ name: 'login' })
      }, 1500)
    }
  } catch (e) {
    const err = e as AxiosError<ApiError>
    const status = err.response?.status
    const body = err.response?.data
    if (status === 422) {
      if (body?.code === 'A009') {
        errors.value = { current_password: [body.message ?? '目前密碼錯誤'] }
      } else if (body?.errors) {
        errors.value = body.errors
      } else {
        topError.value = body?.message ?? '驗證失敗'
      }
    } else if (status === 403 && body?.code === 'A014') {
      // Edge case: user had has_local_password=false on load but it changed
      // server-side. Force reload.
      topError.value = '此帳號已設過密碼,請重新整理頁面'
    } else {
      topError.value = body?.message ?? '操作失敗,請稍後再試'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-md">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">{{ heading }}</h1>
      <RouterLink to="/me" class="text-sm text-slate-500 hover:text-slate-700">
        ← 返回
      </RouterLink>
    </div>
    <p class="mt-2 text-sm text-slate-500">{{ subheading }}</p>

    <div v-if="loading" class="mt-6 text-center text-sm text-slate-500">
      載入中…
    </div>

    <template v-else>
      <div
        v-if="success"
        class="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-4"
      >
        <p class="text-sm font-medium text-emerald-800">
          {{ hasLocalPassword ? '密碼已更新 🔐' : '密碼已設定 🔐' }}
        </p>
        <p class="mt-1 text-xs text-emerald-700">即將導向登入頁,請用新密碼登入…</p>
      </div>

      <form
        v-else
        class="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        @submit.prevent="handleSubmit"
      >
        <p v-if="topError" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ topError }}
        </p>

        <div v-if="hasLocalPassword" class="space-y-1">
          <label for="current_password" class="block text-sm font-medium text-slate-700">
            目前密碼 <span class="text-red-500">*</span>
          </label>
          <input
            id="current_password"
            v-model="form.current_password"
            type="password"
            required
            autocomplete="current-password"
            class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            :class="{ 'border-red-400': fieldError('current_password') }"
          />
          <p v-if="fieldError('current_password')" class="text-xs text-red-500">
            {{ fieldError('current_password') }}
          </p>
        </div>

        <div class="space-y-1">
          <label for="password" class="block text-sm font-medium text-slate-700">
            {{ hasLocalPassword ? '新密碼' : '密碼' }} <span class="text-red-500">*</span>
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            :class="{ 'border-red-400': fieldError('password') }"
          />
          <p v-if="fieldError('password')" class="text-xs text-red-500">
            {{ fieldError('password') }}
          </p>
          <p class="text-xs text-slate-500">至少 8 字,需包含大寫字母與數字。</p>
        </div>

        <div class="space-y-1">
          <label for="password_confirmation" class="block text-sm font-medium text-slate-700">
            {{ hasLocalPassword ? '確認新密碼' : '確認密碼' }} <span class="text-red-500">*</span>
          </label>
          <input
            id="password_confirmation"
            v-model="form.password_confirmation"
            type="password"
            required
            autocomplete="new-password"
            class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            :class="{ 'border-red-400': passwordMismatch }"
          />
          <p v-if="passwordMismatch" class="text-xs text-red-500">
            兩次輸入的密碼不一致
          </p>
        </div>

        <div class="flex items-center gap-3 pt-4">
          <button
            type="submit"
            :disabled="!canSubmit"
            class="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {{ submitting ? (hasLocalPassword ? '更新中…' : '設定中…') : (hasLocalPassword ? '更新密碼' : '設定密碼') }}
          </button>
          <RouterLink
            to="/me"
            class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            取消
          </RouterLink>
        </div>
      </form>
    </template>
  </section>
</template>
