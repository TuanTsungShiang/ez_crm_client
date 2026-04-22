import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import VerifyEmailView from '@/views/VerifyEmailView.vue'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'
import ResetPasswordView from '@/views/ResetPasswordView.vue'
import MeView from '@/views/MeView.vue'
import MeEditView from '@/views/MeEditView.vue'
import { redirectIfAuth, requireAuth } from './guards'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      beforeEnter: redirectIfAuth,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      beforeEnter: redirectIfAuth,
    },
    {
      path: '/verify',
      name: 'verify',
      component: VerifyEmailView,
      beforeEnter: redirectIfAuth,
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
      beforeEnter: redirectIfAuth,
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPasswordView,
      beforeEnter: redirectIfAuth,
    },
    {
      path: '/me',
      name: 'me',
      component: MeView,
      beforeEnter: requireAuth,
    },
    {
      path: '/me/edit',
      name: 'me.edit',
      component: MeEditView,
      beforeEnter: requireAuth,
    },
  ],
})

export default router
