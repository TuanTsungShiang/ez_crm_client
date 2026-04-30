<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import type { AxiosError } from 'axios'
  import {
    Dialog,
    DialogPanel,
    DialogTitle,
    TransitionChild,
    TransitionRoot,
  } from '@headlessui/vue'
  import { destroyMe, getMe, type MeDetail } from '@/api/me'
  import { useAuthStore } from '@/stores/auth'
  import type { ApiError } from '@/api/types'
  import Button from '@/components/ui/Button.vue'
  import Card from '@/components/ui/Card.vue'
  import FormInput from '@/components/ui/FormInput.vue'
  import FormLabel from '@/components/ui/FormLabel.vue'
  import TextLink from '@/components/ui/TextLink.vue'

  const router = useRouter()
  const auth = useAuthStore()

  const member = ref<MeDetail | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  // 註銷帳號 modal
  const showDestroyModal = ref(false)
  const destroyEmailInput = ref('')
  const destroying = ref(false)
  const destroyError = ref<string | null>(null)

  const canConfirmDestroy = computed(
    () => member.value && destroyEmailInput.value === member.value.email && !destroying.value,
  )

  function openDestroyModal() {
    destroyEmailInput.value = ''
    destroyError.value = null
    showDestroyModal.value = true
  }

  function closeDestroyModal() {
    if (destroying.value) return
    showDestroyModal.value = false
  }

  async function confirmDestroy() {
    if (!canConfirmDestroy.value) return
    destroying.value = true
    destroyError.value = null
    try {
      const res = await destroyMe()
      if (res.success) {
        auth.clear()
        router.push({ name: 'login' })
      }
    } catch (e) {
      const err = e as AxiosError<ApiError>
      destroyError.value = err.response?.data.message ?? '註銷失敗,請稍後再試'
    } finally {
      destroying.value = false
    }
  }

  const providerMeta: Record<string, { label: string; dot: string }> = {
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
      <Card>
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
      </Card>

      <!-- 綁定的第三方登入 -->
      <Card>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">已綁定登入方式</h2>
          <div class="flex items-center gap-3">
            <span class="text-xs text-slate-400"> {{ member.sns?.length ?? 0 }} 個 </span>
            <TextLink to="/me/sns" variant="primary" class="text-xs font-medium"> 管理 → </TextLink>
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
      </Card>

      <!-- Profile -->
      <Card v-if="member.profile">
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
      </Card>

      <!-- 危險區 -->
      <div class="rounded-lg border border-red-200 bg-red-50/50 p-6">
        <h2 class="text-lg font-semibold text-red-900">危險操作</h2>
        <p class="mt-1 text-sm text-red-800">
          註銷帳號後無法登入,資料會進入刪除狀態(email / 手機會保留一段時間以防搶註)。
        </p>
        <Button variant="danger" class="mt-4" @click="openDestroyModal">註銷帳號…</Button>
      </div>
    </div>

    <!-- 註銷帳號 modal -->
    <TransitionRoot appear :show="showDestroyModal && !!member" as="template">
      <Dialog as="div" class="relative z-50" @close="closeDestroyModal">
        <TransitionChild
          as="template"
          enter="duration-200 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-150 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-slate-900/60" />
        </TransitionChild>

        <div class="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="duration-200 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-150 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <DialogTitle class="text-lg font-semibold text-slate-900">確認註銷帳號</DialogTitle>
              <p class="mt-2 text-sm text-slate-600">此動作會:</p>
              <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                <li>軟刪除你的會員資料</li>
                <li>登出所有裝置(撤銷所有 token)</li>
                <li>保留 email / 手機不被立即搶註(需聯繫客服完全釋放)</li>
              </ul>

              <div class="mt-4 space-y-1">
                <FormLabel>
                  輸入你的 email 以確認:
                  <span class="font-mono text-xs text-slate-500">{{ member?.email }}</span>
                </FormLabel>
                <FormInput v-model="destroyEmailInput" type="email" autocomplete="off" error />
              </div>

              <p
                v-if="destroyError"
                class="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700"
              >
                {{ destroyError }}
              </p>

              <div class="mt-6 flex items-center justify-end gap-2">
                <Button variant="secondary" :disabled="destroying" @click="closeDestroyModal">
                  取消
                </Button>
                <Button
                  variant="danger-solid"
                  :disabled="!canConfirmDestroy"
                  @click="confirmDestroy"
                >
                  {{ destroying ? '處理中…' : '確認註銷' }}
                </Button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>
  </section>
</template>
