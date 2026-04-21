<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AxiosError } from 'axios'
import DynamicForm from '@/components/DynamicForm.vue'
import {
  getRegisterSchema,
  register,
  type RegisterPayload,
} from '@/api/auth'
import type { ApiError, RegisterSchema } from '@/api/types'

const router = useRouter()

const schema = ref<RegisterSchema | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)

const formData = ref<Record<string, unknown>>({})
const submitting = ref(false)
const submitErrors = ref<Record<string, string[]>>({})
const topLevelError = ref<string | null>(null)

onMounted(async () => {
  try {
    const res = await getRegisterSchema()
    if (res.success) {
      schema.value = res.data
      // 預設值:checkbox false、其他空字串
      const defaults: Record<string, unknown> = {}
      for (const f of res.data.fields) {
        defaults[f.name] = f.type === 'checkbox' ? false : ''
      }
      formData.value = defaults
    } else {
      loadError.value = res.message
    }
  } catch (e) {
    loadError.value = (e as Error).message
  } finally {
    loading.value = false
  }
})

async function handleSubmit() {
  submitting.value = true
  submitErrors.value = {}
  topLevelError.value = null

  try {
    const payload = formData.value as unknown as RegisterPayload
    const res = await register(payload)

    if (res.success) {
      // 安全起見 email 不走 URL query(避免進 browser history / server log / referer)
      sessionStorage.setItem('pending_verify_email', res.data.email)
      router.push({ name: 'verify' })
    }
  } catch (e) {
    const err = e as AxiosError<ApiError>
    if (err.response?.status === 422 && err.response.data.errors) {
      submitErrors.value = err.response.data.errors
      topLevelError.value = err.response.data.message
    } else {
      topLevelError.value = err.response?.data.message ?? '註冊失敗,請稍後再試'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-md">
    <h1 class="text-2xl font-bold text-slate-900">會員註冊</h1>

    <!-- 載入中 -->
    <p v-if="loading" class="mt-6 text-sm text-slate-500">載入中…</p>

    <!-- 載入錯誤 -->
    <p v-else-if="loadError" class="mt-6 text-sm text-red-500">
      無法載入表單:{{ loadError }}
    </p>

    <!-- 表單 -->
    <div v-else-if="schema" class="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p
        v-if="topLevelError"
        class="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ topLevelError }}
      </p>

      <DynamicForm
        v-model="formData"
        :fields="schema.fields"
        :errors="submitErrors"
        :submitting="submitting"
        @submit="handleSubmit"
      />

      <p class="mt-4 text-xs text-slate-400">
        送出後將寄 OTP 驗證碼至 Email。
        <a
          :href="schema.links.terms"
          target="_blank"
          class="underline hover:text-slate-600"
        >
          服務條款
        </a>
        ·
        <a
          :href="schema.links.privacy"
          target="_blank"
          class="underline hover:text-slate-600"
        >
          隱私權
        </a>
      </p>
    </div>
  </section>
</template>
