<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <section class="text-center">
    <h1 class="text-3xl font-bold text-slate-900">ez_crm 前台會員系統</h1>

    <div
      v-if="auth.isAuthenticated"
      class="mx-auto mt-8 max-w-md rounded-lg border border-slate-200 bg-white p-6 text-left shadow-sm"
    >
      <p class="text-sm font-medium text-emerald-600">● 已登入</p>
      <div class="mt-3 space-y-1 text-sm">
        <p><span class="text-slate-500">名字:</span> {{ auth.member?.name }}</p>
        <p><span class="text-slate-500">Email:</span> {{ auth.member?.email }}</p>
        <p class="font-mono text-xs text-slate-400 break-all">
          <span class="text-slate-500">Token:</span> {{ auth.token?.slice(0, 24) }}…
        </p>
      </div>
    </div>

    <p v-else class="mt-6 text-slate-500">
      尚未登入,請到
      <RouterLink to="/login" class="text-blue-600 hover:underline">Login</RouterLink>
      或
      <RouterLink to="/register" class="text-blue-600 hover:underline">Register</RouterLink>。
    </p>
  </section>
</template>
