import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type { Member } from '@/api/types'

const TOKEN_KEY = 'ez_crm_token'
const MEMBER_KEY = 'ez_crm_member'

export const useAuthStore = defineStore('auth', () => {
  // 從 localStorage hydrate,跨分頁自動同步
  const token = useLocalStorage<string | null>(TOKEN_KEY, null)
  const memberJson = useLocalStorage<string | null>(MEMBER_KEY, null)

  const member = computed<Member | null>(() =>
    memberJson.value ? (JSON.parse(memberJson.value) as Member) : null,
  )

  const isAuthenticated = computed(() => !!token.value)

  function setToken(t: string) {
    token.value = t
  }

  function setMember(m: Member | Pick<Member, 'uuid' | 'name' | 'email'>) {
    memberJson.value = JSON.stringify(m)
  }

  function clear() {
    token.value = null
    memberJson.value = null
  }

  return {
    token,
    member,
    isAuthenticated,
    setToken,
    setMember,
    clear,
  }
})
