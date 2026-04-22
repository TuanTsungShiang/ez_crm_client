<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useOAuthPopup } from '@/composables/useOAuthPopup'
import type { OAuthProvider } from '@/api/auth'

const props = defineProps<{
  mode?: 'login' | 'register'
}>()

const router = useRouter()
const { login } = useOAuthPopup()

const busy = ref<OAuthProvider | null>(null)
const error = ref<string | null>(null)

const providers: Array<{
  id: OAuthProvider
  label: string
  bg: string
  hover: string
  iconPath: string
}> = [
  {
    id: 'google',
    label: 'Google',
    bg: 'bg-white',
    hover: 'hover:bg-slate-50',
    iconPath:
      'M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z',
  },
  {
    id: 'github',
    label: 'GitHub',
    bg: 'bg-slate-900',
    hover: 'hover:bg-slate-800 text-white',
    iconPath:
      'M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.29 9.42 7.86 10.96.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.3-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.2-3.1-.12-.3-.52-1.48.11-3.08 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.2-1.5 3.18-1.18 3.18-1.18.63 1.6.23 2.78.11 3.08.74.81 1.2 1.84 1.2 3.1 0 4.43-2.7 5.4-5.26 5.69.42.36.78 1.07.78 2.16v3.2c0 .31.21.67.79.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z',
  },
  {
    id: 'line',
    label: 'LINE',
    bg: 'bg-[#06C755]',
    hover: 'hover:bg-[#05A647] text-white',
    iconPath:
      'M19.365 9.89c.50 0 .9.4.9.9s-.4.9-.9.9h-2.5v1.6h2.5c.5 0 .9.4.9.9s-.4.9-.9.9h-3.4a.9.9 0 0 1-.9-.9v-6.9c0-.5.4-.9.9-.9h3.4c.5 0 .9.4.9.9s-.4.9-.9.9h-2.5v1.6h2.5zm-5.2 4.6c0 .4-.3.7-.6.85-.1.04-.2.05-.3.05a.9.9 0 0 1-.73-.37l-3.47-4.75v4.22a.9.9 0 0 1-.9.9c-.5 0-.9-.4-.9-.9v-6.9c0-.4.3-.75.6-.85a.9.9 0 0 1 1.04.33l3.47 4.75V8.1a.9.9 0 0 1 1.8 0v6.9zM7.43 15.4c-.5 0-.9-.4-.9-.9v-6.9c0-.5.4-.9.9-.9s.9.4.9.9v6.9c0 .5-.4.9-.9.9zM24 10.3C24 4.87 18.62.46 12 .46S0 4.87 0 10.3c0 4.87 4.26 8.95 10.02 9.72.39.08.92.26 1.05.6.12.3.08.79.04 1.09l-.17 1.03c-.05.3-.24 1.19 1.06.65s7.0-4.13 9.55-7.07l-.01.01c1.75-1.93 2.46-3.88 2.46-6.02z',
  },
  {
    id: 'discord',
    label: 'Discord',
    bg: 'bg-[#5865F2]',
    hover: 'hover:bg-[#4752C4] text-white',
    iconPath:
      'M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z',
  },
]

async function handleClick(providerId: OAuthProvider) {
  busy.value = providerId
  error.value = null

  try {
    const result = await login(providerId)
    router.push({ name: 'home' })
    console.log('OAuth login ok:', result)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <div class="space-y-3">
    <p class="text-center text-xs uppercase tracking-wider text-slate-400">
      {{ props.mode === 'register' ? '或用第三方帳號註冊' : '或用第三方帳號登入' }}
    </p>

    <div class="grid grid-cols-2 gap-2">
      <button
        v-for="p in providers"
        :key="p.id"
        type="button"
        :disabled="busy !== null"
        :class="[
          'flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60',
          p.bg,
          p.hover,
        ]"
        @click="handleClick(p.id)"
      >
        <svg
          v-if="busy !== p.id"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="h-4 w-4"
          :fill="p.id === 'google' ? '#4285F4' : 'currentColor'"
        >
          <path :d="p.iconPath" />
        </svg>
        <svg
          v-else
          class="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span>{{ p.label }}</span>
      </button>
    </div>

    <p v-if="error" class="text-center text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>
