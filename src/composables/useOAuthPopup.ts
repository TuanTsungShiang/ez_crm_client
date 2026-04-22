import { getOAuthRedirectUrl, type OAuthProvider } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import type { Member } from '@/api/types'

interface OAuthSuccessPayload {
  type: 'ez_crm_oauth_result'
  success: true
  code: string
  data: {
    token: string
    member: Pick<Member, 'uuid' | 'name' | 'email'>
    is_new_account: boolean
    newly_bound: boolean
  }
}

interface OAuthErrorPayload {
  type: 'ez_crm_oauth_result'
  success: false
  code: string
  message: string
}

type OAuthMessage = OAuthSuccessPayload | OAuthErrorPayload

export interface OAuthResult {
  member: Pick<Member, 'uuid' | 'name' | 'email'>
  is_new_account: boolean
  newly_bound: boolean
}

// Backend 的 origin(callback html postMessage 的來源)
const BACKEND_ORIGIN = 'http://localhost:8080'

/**
 * 開啟一個 OAuth popup 走完授權流程,成功 resolve token+member,失敗 reject 錯誤訊息。
 */
export function useOAuthPopup() {
  async function login(provider: OAuthProvider): Promise<OAuthResult> {
    const auth = useAuthStore()

    // Step 1: 跟 backend 要授權 URL
    const res = await getOAuthRedirectUrl(provider)
    if (!res.success) {
      throw new Error(res.message ?? '無法取得授權 URL')
    }

    // Step 2: 開 popup(置中 + 固定大小)
    const w = 600
    const h = 700
    const left = window.screenX + (window.outerWidth - w) / 2
    const top = window.screenY + (window.outerHeight - h) / 2
    const popup = window.open(
      res.data.url,
      `oauth_${provider}`,
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`,
    )

    if (!popup) {
      throw new Error('瀏覽器阻擋了 popup,請允許後重試')
    }

    // Step 3: 聽 postMessage + 監控 popup 關閉
    return new Promise<OAuthResult>((resolve, reject) => {
      let settled = false

      const onMessage = (event: MessageEvent) => {
        // 安全檢查:只信任來自 backend 的訊息
        if (event.origin !== BACKEND_ORIGIN) return

        const payload = event.data as OAuthMessage
        if (payload?.type !== 'ez_crm_oauth_result') return

        settled = true
        cleanup()

        if (payload.success) {
          auth.setToken(payload.data.token)
          auth.setMember(payload.data.member)
          resolve({
            member: payload.data.member,
            is_new_account: payload.data.is_new_account,
            newly_bound: payload.data.newly_bound,
          })
        } else {
          reject(new Error(payload.message ?? 'OAuth 登入失敗'))
        }
      }

      // 偵測使用者手動關 popup(沒完成授權)
      const poll = window.setInterval(() => {
        if (popup.closed && !settled) {
          cleanup()
          reject(new Error('授權視窗被關閉,未完成登入'))
        }
      }, 500)

      function cleanup() {
        window.removeEventListener('message', onMessage)
        window.clearInterval(poll)
      }

      window.addEventListener('message', onMessage)
    })
  }

  return { login }
}
