import type { NavigationGuard } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export const requireAuth: NavigationGuard = (to) => {
  const auth = useAuthStore()
  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
}

export const redirectIfAuth: NavigationGuard = () => {
  const auth = useAuthStore()
  if (auth.isAuthenticated) {
    return { name: 'home' }
  }
}
