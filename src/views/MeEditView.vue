<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import type { AxiosError } from 'axios'
  import { getMe, updateMe, type UpdateMePayload } from '@/api/me'
  import { useAuthStore } from '@/stores/auth'
  import type { ApiError } from '@/api/types'

  const router = useRouter()
  const auth = useAuthStore()

  const form = ref<UpdateMePayload>({
    name: '',
    nickname: '',
    phone: '',
  })

  const originalSnapshot = ref<UpdateMePayload | null>(null)
  const loading = ref(true)
  const submitting = ref(false)
  const errors = ref<Record<string, string[]>>({})
  const topError = ref<string | null>(null)
  const success = ref(false)

  const isDirty = computed(() => {
    if (!originalSnapshot.value) return false
    return (
      form.value.name !== originalSnapshot.value.name ||
      (form.value.nickname ?? '') !== (originalSnapshot.value.nickname ?? '') ||
      (form.value.phone ?? '') !== (originalSnapshot.value.phone ?? '')
    )
  })

  onMounted(async () => {
    try {
      const res = await getMe()
      if (res.success) {
        form.value = {
          name: res.data.name,
          nickname: res.data.nickname ?? '',
          phone: res.data.phone ?? '',
        }
        originalSnapshot.value = { ...form.value }
      } else {
        topError.value = res.message
      }
    } catch (e) {
      topError.value = (e as Error).message
    } finally {
      loading.value = false
    }
  })

  function fieldError(name: string): string | null {
    return errors.value[name]?.[0] ?? null
  }

  async function handleSubmit() {
    submitting.value = true
    errors.value = {}
    topError.value = null
    success.value = false

    // 只送有變動的欄位(backend rules 是 sometimes)
    const payload: UpdateMePayload = {}
    if (!originalSnapshot.value) return
    if (form.value.name !== originalSnapshot.value.name) {
      payload.name = form.value.name
    }
    if ((form.value.nickname ?? '') !== (originalSnapshot.value.nickname ?? '')) {
      payload.nickname = form.value.nickname === '' ? null : form.value.nickname
    }
    if ((form.value.phone ?? '') !== (originalSnapshot.value.phone ?? '')) {
      payload.phone = form.value.phone === '' ? null : form.value.phone
    }

    if (Object.keys(payload).length === 0) {
      submitting.value = false
      return
    }

    try {
      const res = await updateMe(payload)
      if (res.success) {
        // 把更新過的 member 存回 auth store(Navbar / Home 會即時反映)
        auth.setMember({
          uuid: res.data.uuid,
          name: res.data.name,
          email: res.data.email,
        })
        originalSnapshot.value = { ...form.value }
        success.value = true
        setTimeout(() => {
          router.push({ name: 'me' })
        }, 800)
      }
    } catch (e) {
      const err = e as AxiosError<ApiError>
      if (err.response?.status === 422 && err.response.data.errors) {
        errors.value = err.response.data.errors
        topError.value = err.response.data.message
      } else {
        topError.value = err.response?.data.message ?? '更新失敗,請稍後再試'
      }
    } finally {
      submitting.value = false
    }
  }
</script>

<template>
  <section class="mx-auto max-w-xl">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">編輯資料</h1>
      <RouterLink to="/me" class="text-sm text-slate-500 hover:text-slate-700"> ← 返回 </RouterLink>
    </div>

    <p v-if="loading" class="mt-8 text-sm text-slate-500">載入中…</p>

    <div v-else-if="success" class="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-4">
      <p class="text-sm font-medium text-emerald-800">儲存成功 🎉</p>
      <p class="mt-1 text-xs text-emerald-700">即將返回資料頁…</p>
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
        <label for="name" class="block text-sm font-medium text-slate-700">
          姓名 <span class="text-red-500">*</span>
        </label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          required
          maxlength="100"
          class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          :class="{ 'border-red-400': fieldError('name') }"
        />
        <p v-if="fieldError('name')" class="text-xs text-red-500">
          {{ fieldError('name') }}
        </p>
      </div>

      <div class="space-y-1">
        <label for="nickname" class="block text-sm font-medium text-slate-700">暱稱</label>
        <input
          id="nickname"
          v-model="form.nickname"
          type="text"
          maxlength="100"
          placeholder="留空代表無暱稱"
          class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          :class="{ 'border-red-400': fieldError('nickname') }"
        />
        <p v-if="fieldError('nickname')" class="text-xs text-red-500">
          {{ fieldError('nickname') }}
        </p>
      </div>

      <div class="space-y-1">
        <label for="phone" class="block text-sm font-medium text-slate-700">手機</label>
        <input
          id="phone"
          v-model="form.phone"
          type="tel"
          maxlength="20"
          placeholder="例如 0912345678"
          class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          :class="{ 'border-red-400': fieldError('phone') }"
        />
        <p v-if="fieldError('phone')" class="text-xs text-red-500">
          {{ fieldError('phone') }}
        </p>
        <p class="text-xs text-slate-500">手機號碼不可與其他會員重複</p>
      </div>

      <div class="flex items-center gap-3 pt-4">
        <button
          type="submit"
          :disabled="submitting || !isDirty"
          class="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {{ submitting ? '儲存中…' : isDirty ? '儲存變更' : '沒有變更' }}
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
