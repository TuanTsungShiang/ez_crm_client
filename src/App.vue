<script setup lang="ts">
import { RouterView, RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.clear()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="border-b border-slate-200 bg-white">
      <nav class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <RouterLink to="/" class="text-lg font-semibold text-slate-900">
          ez_crm_client
        </RouterLink>
        <div class="space-x-4 text-sm">
          <template v-if="!auth.isAuthenticated">
            <RouterLink to="/login" class="text-slate-600 hover:text-slate-900">
              Login
            </RouterLink>
            <RouterLink to="/register" class="text-slate-600 hover:text-slate-900">
              Register
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink to="/me" class="text-slate-600 hover:text-slate-900">
              Hi, {{ auth.member?.name }}
            </RouterLink>
            <button
              type="button"
              class="text-slate-600 hover:text-slate-900"
              @click="logout"
            >
              Logout
            </button>
          </template>
        </div>
      </nav>
    </header>

    <main class="mx-auto max-w-5xl px-6 py-10">
      <RouterView />
    </main>
  </div>
</template>
