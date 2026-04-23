<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { AxiosError } from 'axios'
import { getMe, type MeDetail } from '@/api/me'
import type { ApiError } from '@/api/types'

const member = ref<MeDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const providerMeta: Record<
  string,
  { label: string; dot: string }
> = {
  google: { label: 'Google', dot: 'bg-red-500' },
  github: { label: 'GitHub', dot: 'bg-slate-800' },
  line: { label: 'LINE', dot: 'bg-[#06C755]' },
  discord: { label: 'Discord', dot: 'bg-[#5865F2]' },
}

onMounted(async () => {
  try {
    const res = await getMe()
    if (res.success) {
      member.value = res.data
    } else {
      error.value = res.message
    }
  } catch (e) {
    const err = e as AxiosError<ApiError>
    error.value = err.response?.data.message ?? '讀取失敗'
  } finally {
    loading.value = false
  }
})

function statusLabel(status?: number) {
  if (status === 1) return { text: '正常', color: 'text-emerald-600 bg-emerald-50' }
  if (status === 0) return { text: '停用', color: 'text-red-600 bg-red-50' }
  if (status === 2) return { text: '待驗證', color: 'text-amber-600 bg-amber-50' }
  return { text: '未知', color: 'text-slate-500 bg-slate-50' }
}

function fmtDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <h1 class="text-2xl font-bold text-slate-900">我的資料</h1>
    <p class="mt-2 text-sm text-slate-500">查看你的會員資訊與已綁定的登入方式。</p>

    <p v-if="loading" class="mt-8 text-sm text-slate-500">載入中…</p>
    <p v-else-if="error" class="mt-8 text-sm text-red-600">
      {{ error }}
    </p>

    <div v-else-if="member" class="mt-6 space-y-4">
      <!-- 基本資料卡片 -->
      <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">基本資料</h2>
            <p class="mt-1 font-mono text-xs text-slate-400">{{ member.uuid }}</p>
          </div>
          <span
            :class="[
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              statusLabel(member.status).color,
            ]"
          >
            {{ statusLabel(member.status).text }}
          </span>
        </div>

        <dl class="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <div>
            <dt class="text-xs text-slate-500">名字</dt>
            <dd class="text-sm text-slate-900">{{ member.name }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">暱稱</dt>
            <dd class="text-sm text-slate-900">{{ member.nickname || '—' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">Email</dt>
            <dd class="text-sm text-slate-900">
              {{ member.email }}
              <span
                v-if="member.email_verified_at"
                class="ml-1 text-xs text-emerald-600"
                title="已驗證"
              >
                ✓
              </span>
            </dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">手機</dt>
            <dd class="text-sm text-slate-900">{{ member.phone || '—' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">最後登入</dt>
            <dd class="text-sm text-slate-900">{{ fmtDate(member.last_login_at) }}</dd>
          </div>
        </dl>
      </div>

      <!-- 綁定的第三方登入 -->
      <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">已綁定登入方式</h2>
          <div class="flex items-center gap-3">
            <span class="text-xs text-slate-400">
              {{ member.sns?.length ?? 0 }} 個
            </span>
            <RouterLink
              to="/me/sns"
              class="text-xs font-medium text-blue-600 hover:underline"
            >
              管理 →
            </RouterLink>
          </div>
        </div>

        <ul v-if="member.sns && member.sns.length > 0" class="mt-4 space-y-2">
          <li
            v-for="s in member.sns"
            :key="s.provider"
            class="flex items-center gap-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
          >
            <span
              class="h-2.5 w-2.5 rounded-full"
              :class="providerMeta[s.provider]?.dot ?? 'bg-slate-400'"
            />
            <span class="text-sm font-medium text-slate-900">
              {{ providerMeta[s.provider]?.label ?? s.provider }}
            </span>
            <span class="ml-auto text-xs text-emerald-600">已綁定</span>
          </li>
        </ul>

        <p v-else class="mt-4 text-sm text-slate-500">
          目前沒有綁定任何第三方登入(你是用 Email 註冊的)
        </p>
      </div>

      <!-- Profile -->
      <div v-if="member.profile" class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">個人設定</h2>
        <dl class="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <div>
            <dt class="text-xs text-slate-500">語言</dt>
            <dd class="text-sm text-slate-900">{{ member.profile.language || '—' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">時區</dt>
            <dd class="text-sm text-slate-900">{{ member.profile.timezone || '—' }}</dd>
          </div>
          <div v-if="member.profile.bio" class="sm:col-span-2">
            <dt class="text-xs text-slate-500">簡介</dt>
            <dd class="text-sm text-slate-900">{{ member.profile.bio }}</dd>
          </div>
        </dl>
      </div>

      <p class="text-xs text-slate-400">
        編輯 / 更改密碼功能開發中(下次上線)。
      </p>
    </div>
  </section>
</template>
