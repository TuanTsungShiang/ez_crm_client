# 上午工作紀錄 — 2026-04-22 (Wed) AM

> 時間:約 11:55 - 12:15(前端專注時段,實作約 20 分)
> Repo:`ez_crm_client` frontend SPA
> 起點:`develop` 只有 3 個 commits(scaffold / cleanup / forgot-reset)
> 收工:`develop` 再 +4 個 commits

---

## 整體目標

接上後端 Phase 4 OAuth(Google / GitHub / LINE / Discord 4 個 provider 已通)的 SPA 前端串接。對應後端 repo 紀錄:[../../../ez_crm/work_log/20260422/morning_summary.md](../../../ez_crm/work_log/20260422/morning_summary.md)

---

## 完成項目

### 1. OAuth Popup 登入流程(`feature/oauth-buttons` → merged)

新增 3 個檔案 + 改 2 個 view,**把 4 個 OAuth provider 接進登入/註冊頁**。

#### 檔案

| 檔案 | 角色 |
|---|---|
| [src/api/auth.ts](src/api/auth.ts) | 加 `getOAuthRedirectUrl(provider)` 呼叫後端拿授權 URL |
| [src/composables/useOAuthPopup.ts](src/composables/useOAuthPopup.ts) | **核心邏輯**:開 popup、addEventListener message、origin check、popup-closed 偵測、成功後寫 auth store |
| [src/components/OAuthButtons.vue](src/components/OAuthButtons.vue) | 4 按鈕 UI(品牌色 + inline SVG logo + busy state + error display) |
| [src/views/LoginView.vue](src/views/LoginView.vue) | 底部掛 `<OAuthButtons mode="login" />` |
| [src/views/RegisterView.vue](src/views/RegisterView.vue) | 底部掛 `<OAuthButtons mode="register" />`(依 backend schema.oauth_providers 決定顯不顯示)|

#### 安全決策

- `postMessage` 的 `event.origin` 必等於 `http://localhost:8080`(backend)—— 抗跨站注入
- `message.type` 必等於 `ez_crm_oauth_result` —— 抗與其他套件的 postMessage 混淆
- Popup 被使用者手動關掉 → 500ms 輪詢 `popup.closed` 偵測並 reject 成可讀錯誤
- Token 只經 popup `postMessage` 進 opener,**全程不出現在 URL** —— 不進 browser history / server log / referer(延續昨天 `/verify` 頁的安全設計)

#### UX 細節

- Popup 600×700 中央對齊(用 `screenX/outerWidth` 計算)
- LINE 用 `#06C755`、Discord 用 `#5865F2`(品牌色)
- Google 白底藍 logo、GitHub slate-900
- busy 狀態:該 provider 按鈕顯示 spinner,其他 3 個 disabled
- 失敗訊息以紅字 inline,不跳離頁面

#### 驗證結果

端到端**真 OAuth flow 全通**:
- 初次 Discord 登入 → 建新 member(kevino430 / ruby004949@gmail.com)
- 再用 LINE / Google / GitHub 登入(同 email)→ 自動聚合到同 member(**scenario 2 auto-bind**)
- popup 自動關閉、主頁導轉到 `/home`、navbar 顯示 member 名稱 → 流暢如商業 SaaS

### 2. `/me` 個人資料頁(`feature/me-page` → merged)

新增 2 個檔案 + 改 2 個。**第一個登入後 member-guard 專屬頁**。

#### 檔案

| 檔案 | 角色 |
|---|---|
| [src/api/me.ts](src/api/me.ts) | `getMe()` 呼叫 `GET /api/v1/me`(auth:member middleware 保護)|
| [src/views/MeView.vue](src/views/MeView.vue) | 三張卡:基本資料 / 已綁定登入方式 / 個人設定 |
| [src/router/index.ts](src/router/index.ts) | 加 `/me` route + `requireAuth` guard |
| [src/App.vue](src/App.vue) | Navbar「Hi, {name}」從純 span 改為 `<RouterLink to="/me">` |

#### 視覺亮點:統一身份可視化

「已綁定登入方式」卡片直接**把同個 member 下所有 provider 列出來**:
- 每個 provider 有對應品牌色的小圓點
- 右上角顯示「X 個」
- 空狀態顯示「你是用 Email 註冊的」

本次實測 Member #2(ruby004949@gmail.com)四個 provider 齊全,**是 architecture 做對的強力 demo 畫面**。

---

## 今日前端 Commits(按時間序)

```
1a5026a  Merge feature/me-page into develop
2b6b2bf  feat(me): add /me page showing profile + bound OAuth providers
1fbb30d  Merge feature/oauth-buttons into develop
33e50b7  feat(auth): add OAuth button flow (popup + postMessage)
```

---

## 分支紀律

依昨天設定的 Gitflow(`develop` 分支 + `feature/*` 走 PR),**兩個 feature branch 都正確走完流程**:

| Branch | 從 | 到 | --no-ff | 完成後刪 |
|---|---|---|---|---|
| `feature/oauth-buttons` | develop | develop | ✅ | ✅ local + remote |
| `feature/me-page` | develop | develop | ✅ | ✅ local + remote |

`main` 依舊被 GitHub branch protection 守著,沒任何人 push 進去。Release 累積到值得發版再走 `release/x.x.x` → main。

---

## 目前頁面地圖

| 路由 | 元件 | Guard | 今天做了什麼 |
|---|---|---|---|
| `/` | HomeView | 無 | 顯示登入狀態(既有) |
| `/login` | LoginView | guest | **加 OAuthButtons** |
| `/register` | RegisterView | guest | **加 OAuthButtons** |
| `/verify` | VerifyEmailView | guest | (昨天做) |
| `/forgot-password` | ForgotPasswordView | guest | (昨天做) |
| `/reset-password` | ResetPasswordView | guest | (昨天做) |
| `/me` | MeView | requireAuth | **今天新增** |

7 個頁面,6 種使用者情境(註冊/驗證 email/登入/忘記密碼/重設/OAuth popup/看自己資料)全部可運作。

---

## 下午延伸可能性(非必做)

- `/me/edit`(PUT `/api/v1/me`:改 name / nickname / phone)
- `/me/password`(PUT `/api/v1/me/password`:含 current_password 驗證)
- OAuth 綁定/解綁管理(POST `/me/sns/{provider}/bind-url` / DELETE `/me/sns/{provider}`)—— 需後端 Phase 6

下午主戰場預計在後端開 webhook 系統,前端先休息一下,讓 /me 這個里程碑先停穩。

---

## 今日前端累積檔案

```
src/
├── api/
│   ├── client.ts                 (昨天)
│   ├── types.ts                  (昨天)
│   ├── auth.ts                   (昨天 + 今天加 getOAuthRedirectUrl)
│   └── me.ts                     (今天新)
├── stores/
│   └── auth.ts                   (昨天)
├── router/
│   ├── index.ts                  (今天加 /me route)
│   └── guards.ts                 (昨天)
├── composables/
│   └── useOAuthPopup.ts          (今天新)
├── components/
│   ├── DynamicForm.vue           (昨天)
│   └── OAuthButtons.vue          (今天新)
├── views/
│   ├── HomeView.vue              (昨天)
│   ├── LoginView.vue             (昨天 + 今天掛 OAuthButtons)
│   ├── RegisterView.vue          (昨天 + 今天掛 OAuthButtons)
│   ├── VerifyEmailView.vue       (昨天)
│   ├── ForgotPasswordView.vue    (昨天)
│   ├── ResetPasswordView.vue     (昨天)
│   └── MeView.vue                (今天新)
├── App.vue                       (今天改 navbar 連結)
├── main.ts                       (昨天)
└── style.css                     (昨天)
```

合計:16 個 `.vue` / `.ts` 檔,上線可玩的會員系統前端 ✅
