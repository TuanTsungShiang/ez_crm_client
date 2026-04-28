<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AxiosError } from 'axios'
import { updatePassword } from '@/api/me'
import { useAuthStore } from '@/stores/auth'
import type { ApiError } from '@/api/types'

const router = useRouter()
const auth = useAuthStore()

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

const canSubmit = computed(
  () =>
    !submitting.value
    && form.value.current_password.length > 0
    && form.value.password.length >= 8
    && !passwordMismatch.value,
)

function fieldError(name: string): string | null {
  return errors.value[name]?.[0] ?? null
}

async function handleSubmit() {
  if (!canSubmit.value) return

  submitting.value = true
  errors.value = {}
  topError.value = null

  try {
    const res = await updatePassword({ ...form.value })
    if (res.success) {
      success.value = true
      // 密碼改成功 → 其他 token 被撤銷。雖然當前 token 仍活,UX 上清掉 auth store 強制重登最乾淨
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
        // backend 把 current password 錯誤用 422 + A009 回
        errors.value = { current_password: [body.message ?? '目前密碼錯誤'] }
      } else if (body?.errors) {
        errors.value = body.errors
      } else {
        topError.value = body?.message ?? '驗證失敗'
      }
    } else {
      topError.value = body?.message ?? '更新失敗,請稍後再試'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-md">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">更改密碼</h1>
      <RouterLink to="/me" class="text-sm text-slate-500 hover:text-slate-700">
        ← 返回
      </RouterLink>
    </div>
    <p class="mt-2 text-sm text-slate-500">
      密碼更新後,其他裝置的登入 token 會被撤銷,請重新登入。
    </p>

    <div
      v-if="success"
      class="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-4"
    >
      <p class="text-sm font-medium text-emerald-800">密碼已更新 🔐</p>
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

      <div class="space-y-1">
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
          新密碼 <span class="text-red-500">*</span>
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
        <p class="text-xs text-slate-500">至少 8 字,建議包含英文字母與數字。</p>
      </div>

      <div class="space-y-1">
        <label for="password_confirmation" class="block text-sm font-medium text-slate-700">
          確認新密碼 <span class="text-red-500">*</span>
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
          兩次輸入的新密碼不一致
        </p>
      </div>

      <div class="flex items-center gap-3 pt-4">
        <button
          type="submit"
          :disabled="!canSubmit"
          class="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {{ submitting ? '更新中…' : '更新密碼' }}
        </button>
        <RouterLink
          to="/me"
          class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          取消
        </RouterLink>
      </div>
    </form>
  </section>
</template>
