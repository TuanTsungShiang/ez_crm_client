<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import type { AxiosError } from 'axios'
  import { getMe, unbindSns, type MeDetail } from '@/api/me'
  import { useOAuthPopup } from '@/composables/useOAuthPopup'
  import type { OAuthProvider } from '@/api/auth'
  import type { ApiError } from '@/api/types'

  const { bind } = useOAuthPopup()

  const member = ref<MeDetail | null>(null)
  const loading = ref(true)
  const busy = ref<OAuthProvider | null>(null)
  const topError = ref<string | null>(null)
  const flash = ref<{ tone: 'success' | 'info'; text: string } | null>(null)

  const allProviders: Array<{
    id: OAuthProvider
    label: string
    dot: string
    hint: string
  }> = [
    { id: 'google', label: 'Google', dot: 'bg-red-500', hint: 'Google 帳號登入' },
    { id: 'github', label: 'GitHub', dot: 'bg-slate-800', hint: 'GitHub 帳號登入' },
    { id: 'line', label: 'LINE', dot: 'bg-[#06C755]', hint: 'LINE 帳號登入' },
    { id: 'discord', label: 'Discord', dot: 'bg-[#5865F2]', hint: 'Discord 帳號登入' },
  ]

  const boundProviders = computed(() => new Set((member.value?.sns ?? []).map((s) => s.provider)))

  const bindingCount = computed(() => boundProviders.value.size)
  const emailVerified = computed(() => !!member.value?.email_verified_at)

  // 是否會鎖死自己(最後一個 SNS + email 沒驗證過)
  const wouldLockOut = computed(() => bindingCount.value <= 1 && !emailVerified.value)

  async function loadMe() {
    loading.value = true
    topError.value = null
    try {
      const res = await getMe()
      if (res.success) {
        member.value = res.data
      } else {
        topError.value = res.message
      }
    } catch (e) {
      const err = e as AxiosError<ApiError>
      topError.value = err.response?.data.message ?? '讀取失敗'
    } finally {
      loading.value = false
    }
  }

  async function handleBind(provider: OAuthProvider) {
    if (!member.value) return
    busy.value = provider
    topError.value = null
    flash.value = null
    try {
      const result = await bind(provider, member.value.uuid)
      await loadMe()
      flash.value = {
        tone: 'success',
        text: result.newly_bound ? `已綁定 ${provider}` : `${provider} 已經是你的登入方式了`,
      }
    } catch (e) {
      topError.value = (e as Error).message
    } finally {
      busy.value = null
    }
  }

  async function handleUnbind(provider: OAuthProvider) {
    // 最後一個 SNS + email 未驗證 → 先警示(backend 也會擋,這是友善的前置提醒)
    if (boundProviders.value.size === 1 && !emailVerified.value) {
      const ok = window.confirm(
        `這是你最後一個登入方式,且 email 尚未驗證。\n解綁後你將無法登入這個帳號。\n\n建議先驗證 email 再解綁。\n\n仍要嘗試嗎?(後端會擋下)`,
      )
      if (!ok) return
    } else {
      const ok = window.confirm(`確定要解除綁定 ${provider} 嗎?`)
      if (!ok) return
    }

    busy.value = provider
    topError.value = null
    flash.value = null
    try {
      const res = await unbindSns(provider)
      if (res.success) {
        await loadMe()
        flash.value = { tone: 'info', text: `已解除綁定 ${provider}` }
      }
    } catch (e) {
      const err = e as AxiosError<ApiError>
      topError.value = err.response?.data.message ?? '解綁失敗'
    } finally {
      busy.value = null
    }
  }

  onMounted(loadMe)
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">登入方式管理</h1>
      <RouterLink to="/me" class="text-sm text-slate-500 hover:text-slate-700"> ← 返回 </RouterLink>
    </div>
    <p class="mt-2 text-sm text-slate-500">你可以綁定多個第三方登入管道,或解除你不再使用的。</p>

    <p v-if="loading" class="mt-8 text-sm text-slate-500">載入中…</p>

    <div v-else>
      <!-- flash -->
      <div
        v-if="flash"
        class="mt-6 rounded-md border px-3 py-2 text-sm"
        :class="
          flash.tone === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-slate-200 bg-slate-50 text-slate-700'
        "
      >
        {{ flash.text }}
      </div>
      <p
        v-if="topError"
        class="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ topError }}
      </p>

      <!-- email 驗證狀態 + 警示 -->
      <div
        v-if="wouldLockOut"
        class="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
      >
        ⚠️ 你目前的 email
        <span class="font-mono">{{ member?.email }}</span>
        尚未驗證,且只綁定一個登入方式。 為避免把自己鎖在外面,建議先完成 email
        驗證,或綁定第二個登入方式,再考慮解綁。
      </div>

      <!-- 列表 -->
      <div class="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <ul class="divide-y divide-slate-100">
          <li v-for="p in allProviders" :key="p.id" class="flex items-center gap-3 px-4 py-3">
            <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="p.dot" />
            <div class="flex-1">
              <p class="text-sm font-medium text-slate-900">{{ p.label }}</p>
              <p class="text-xs text-slate-500">{{ p.hint }}</p>
            </div>

            <template v-if="boundProviders.has(p.id)">
              <span class="text-xs font-medium text-emerald-600">已綁定</span>
              <button
                type="button"
                :disabled="busy !== null"
                class="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                @click="handleUnbind(p.id)"
              >
                {{ busy === p.id ? '處理中…' : '解綁' }}
              </button>
            </template>
            <template v-else>
              <span class="text-xs text-slate-400">未綁定</span>
              <button
                type="button"
                :disabled="busy !== null"
                class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                @click="handleBind(p.id)"
              >
                {{ busy === p.id ? '授權中…' : '綁定' }}
              </button>
            </template>
          </li>
        </ul>
      </div>

      <p class="mt-4 text-xs text-slate-400">
        綁定流程會開一個授權視窗;請允許 popup。目前綁定
        <span class="font-medium text-slate-700">{{ bindingCount }}</span>
        個登入方式。
      </p>
    </div>
  </section>
</template>
