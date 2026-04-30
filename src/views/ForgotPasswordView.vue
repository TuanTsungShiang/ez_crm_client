<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import type { AxiosError } from 'axios'
  import { forgotPassword } from '@/api/auth'
  import type { ApiError } from '@/api/types'
  import Button from '@/components/ui/Button.vue'
  import Card from '@/components/ui/Card.vue'
  import FormInput from '@/components/ui/FormInput.vue'
  import FormLabel from '@/components/ui/FormLabel.vue'
  import TextLink from '@/components/ui/TextLink.vue'

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

    <Card class="mt-6">
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="space-y-1">
          <FormLabel for="email" required>Email</FormLabel>
          <FormInput id="email" v-model="email" type="email" required autocomplete="email" />
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <Button type="submit" :disabled="submitting" class="w-full">
          {{ submitting ? '發送中…' : '寄送驗證碼' }}
        </Button>

        <p class="pt-2 text-center text-xs text-slate-500">
          想起密碼了?
          <TextLink to="/login" variant="primary">返回登入</TextLink>
        </p>
      </form>
    </Card>
  </section>
</template>
