<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import type { AxiosError } from 'axios'
  import { resetPassword, forgotPassword } from '@/api/auth'
  import { ApiCode, type ApiError } from '@/api/types'
  import Button from '@/components/ui/Button.vue'
  import Card from '@/components/ui/Card.vue'
  import FormInput from '@/components/ui/FormInput.vue'
  import FormLabel from '@/components/ui/FormLabel.vue'

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
      <Button class="mt-4 w-full" @click="goLogin">前往登入</Button>
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
    <Card v-else class="mt-6">
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <p class="text-sm text-slate-600">
          重設帳號
          <strong class="text-slate-900">{{ email }}</strong>
          的密碼。
        </p>

        <div class="space-y-1">
          <FormLabel for="code" required>驗證碼</FormLabel>
          <FormInput
            id="code"
            v-model="code"
            type="text"
            inputmode="numeric"
            pattern="[0-9]{6}"
            maxlength="6"
            placeholder="123456"
            required
            class="text-center text-lg font-mono tracking-widest"
          />
        </div>

        <div class="space-y-1">
          <FormLabel for="password" required>新密碼</FormLabel>
          <FormInput
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="new-password"
          />
          <p class="text-xs text-slate-500">至少 8 字元,需含大寫字母和數字</p>
        </div>

        <div class="space-y-1">
          <FormLabel for="password_confirmation" required>確認新密碼</FormLabel>
          <FormInput
            id="password_confirmation"
            v-model="passwordConfirmation"
            type="password"
            required
            autocomplete="new-password"
            :error="!!passwordConfirmation && password !== passwordConfirmation"
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

        <Button type="submit" :disabled="submitting || !canSubmit" class="w-full">
          {{ submitting ? '重設中…' : '確認重設密碼' }}
        </Button>

        <Button variant="ghost" :disabled="resending" class="w-full" @click="handleResend">
          {{ resending ? '發送中…' : '沒收到信?重新發送' }}
        </Button>
      </form>
    </Card>
  </section>
</template>
