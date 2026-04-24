<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getMe, type MeDetail } from '@/api/me'

const auth = useAuthStore()

const me = ref<MeDetail | null>(null)
const loadingMe = ref(false)
const showDebug = ref(false)
const isDev = import.meta.env.DEV

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 5) return '夜深了'
  if (h < 11) return '早安'
  if (h < 14) return '午安'
  if (h < 18) return '下午好'
  if (h < 22) return '晚上好'
  return '夜深了'
})

const providerCount = computed(() => me.value?.sns?.length ?? 0)
const emailVerified = computed(() => !!me.value?.email_verified_at)

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

onMounted(async () => {
  if (!auth.isAuthenticated) return
  loadingMe.value = true
  try {
    const res = await getMe()
    if (res.success) me.value = res.data
  } finally {
    loadingMe.value = false
  }
})
</script>

<template>
  <!-- 未登入狀態 -->
  <section v-if="!auth.isAuthenticated" class="text-center">
    <h1 class="text-3xl font-bold text-slate-900">ez_crm 前台會員系統</h1>
    <p class="mt-6 text-slate-500">
      尚未登入,請到
      <RouterLink to="/login" class="text-blue-600 hover:underline">Login</RouterLink>
      或
      <RouterLink to="/register" class="text-blue-600 hover:underline">Register</RouterLink>。
    </p>
  </section>

  <!-- 登入後 Dashboard -->
  <section v-else class="space-y-6">
    <!-- Hero greeting -->
    <div class="rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-8 text-white shadow-lg">
      <p class="text-sm opacity-80">{{ greeting }} 👋</p>
      <h1 class="mt-1 text-3xl font-bold">
        {{ auth.member?.name }}
      </h1>
      <p class="mt-2 text-sm opacity-90">
        歡迎回到 ez_crm,今天也要好好照顧你的會員資料。
      </p>
    </div>

    <!-- Quick stats -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs text-slate-500">Email 驗證</p>
        <p class="mt-1 text-lg font-semibold"
           :class="emailVerified ? 'text-emerald-600' : 'text-amber-600'">
          {{ emailVerified ? '✓ 已驗證' : '待驗證' }}
        </p>
      </div>
      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs text-slate-500">已綁定登入方式</p>
        <p class="mt-1 text-lg font-semibold text-slate-900">
          {{ loadingMe ? '…' : providerCount + ' 個' }}
        </p>
      </div>
      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs text-slate-500">最後登入</p>
        <p class="mt-1 text-sm font-medium text-slate-900">
          {{ loadingMe ? '…' : fmtDate(me?.last_login_at) }}
        </p>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-semibold text-slate-900">快速操作</h2>
      <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RouterLink
          to="/me"
          class="rounded-md border border-slate-200 px-3 py-3 text-center text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-700"
        >
          👤 我的資料
        </RouterLink>
        <RouterLink
          to="/me/edit"
          class="rounded-md border border-slate-200 px-3 py-3 text-center text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-700"
        >
          ✏️ 編輯資料
        </RouterLink>
        <button
          type="button"
          disabled
          class="cursor-not-allowed rounded-md border border-slate-200 px-3 py-3 text-center text-sm font-medium text-slate-400"
          title="下次上線"
        >
          🔑 更改密碼
        </button>
        <RouterLink
          to="/me/sns"
          class="rounded-md border border-slate-200 px-3 py-3 text-center text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-700"
        >
          🔌 綁定管理
        </RouterLink>
      </div>
    </div>

    <!-- Debug panel (dev only) -->
    <details
      v-if="isDev"
      class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-600"
      @toggle="showDebug = ($event.target as HTMLDetailsElement).open"
    >
      <summary class="cursor-pointer font-mono text-slate-500 hover:text-slate-700">
        🛠 Debug info (dev only)
      </summary>
      <dl class="mt-3 space-y-1 font-mono">
        <div><span class="text-slate-400">uuid:</span> {{ auth.member?.uuid }}</div>
        <div><span class="text-slate-400">email:</span> {{ auth.member?.email }}</div>
        <div class="break-all">
          <span class="text-slate-400">token:</span> {{ auth.token }}
        </div>
      </dl>
    </details>
  </section>
</template>
