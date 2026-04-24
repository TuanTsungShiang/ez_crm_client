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
 * 開啟一個 OAuth popup 走完授權流程。
 * 不直接碰 auth store:由上層的 login/bind 決定怎麼處理 token/member。
 */
function openOAuthPopup(provider: OAuthProvider, authorizeUrl: string) {
  const w = 600
  const h = 700
  const left = window.screenX + (window.outerWidth - w) / 2
  const top = window.screenY + (window.outerHeight - h) / 2
  const popup = window.open(
    authorizeUrl,
    `oauth_${provider}`,
    `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`,
  )

  if (!popup) {
    return Promise.reject(new Error('瀏覽器阻擋了 popup,請允許後重試'))
  }

  return new Promise<OAuthSuccessPayload['data']>((resolve, reject) => {
    let settled = false

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== BACKEND_ORIGIN) return
      const payload = event.data as OAuthMessage
      if (payload?.type !== 'ez_crm_oauth_result') return

      settled = true
      cleanup()

      if (payload.success) {
        resolve(payload.data)
      } else {
        reject(new Error(payload.message ?? 'OAuth 授權失敗'))
      }
    }

    const poll = window.setInterval(() => {
      if (popup.closed && !settled) {
        cleanup()
        reject(new Error('授權視窗被關閉,未完成授權'))
      }
    }, 500)

    function cleanup() {
      window.removeEventListener('message', onMessage)
      window.clearInterval(poll)
    }

    window.addEventListener('message', onMessage)
  })
}

export function useOAuthPopup() {
  /**
   * 登入 / 註冊流程:拿回來的 token+member 寫進 auth store。
   */
  async function login(provider: OAuthProvider): Promise<OAuthResult> {
    const auth = useAuthStore()

    const res = await getOAuthRedirectUrl(provider)
    if (!res.success) {
      throw new Error(res.message ?? '無法取得授權 URL')
    }

    const data = await openOAuthPopup(provider, res.data.url)

    auth.setToken(data.token)
    auth.setMember(data.member)
    return {
      member: data.member,
      is_new_account: data.is_new_account,
      newly_bound: data.newly_bound,
    }
  }

  /**
   * 綁定流程(已登入狀態):
   * - 驗證回來的 member.uuid 跟當前登入者一致(否則代表 Google 帳號的 email
   *   對應到的是別人的 ez_crm 帳號,不能偷換成那個人)。
   * - 成功時更新 token(currentAccessToken 換成新發的),但保持同一個 member。
   */
  async function bind(
    provider: OAuthProvider,
    expectedMemberUuid: string,
  ): Promise<OAuthResult> {
    const auth = useAuthStore()

    const res = await getOAuthRedirectUrl(provider)
    if (!res.success) {
      throw new Error(res.message ?? '無法取得授權 URL')
    }

    const data = await openOAuthPopup(provider, res.data.url)

    if (data.member.uuid !== expectedMemberUuid) {
      throw new Error(
        `這個 ${provider} 帳號對應到另一個 ez_crm 會員,無法綁定到目前登入的帳號`,
      )
    }

    auth.setToken(data.token)
    auth.setMember(data.member)
    return {
      member: data.member,
      is_new_account: data.is_new_account,
      newly_bound: data.newly_bound,
    }
  }

  return { login, bind }
}
