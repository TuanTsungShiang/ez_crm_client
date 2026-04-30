# ez_crm_client Architecture

Vue 3 + TypeScript + Tailwind CSS 4 + Pinia + Vue Router 的前台會員 SPA。
這份文件不是 onboarding guide，而是**紀律 anchor**：明文寫下哪些寫法會破壞長期可維護性，因為 Vue + Tailwind 的自由度需要紀律補強。

---

## 為什麼有這份文件

ez_crm（後端）有 Filament 框架替紀律代勞 — 同樣的「複製貼上、繞過 layer、在錯位置寫邏輯」即使想做也做不出來，框架直接擋下。

ez_crm_client（前端）沒有等價物。Vue 是 unopinionated 的，Tailwind 是 utility-first 的；兩者搭配給開發者極大自由度，但也意味著**反模式可以無聲長進專案**。

跨專案審計（Linky360 → ez_crm → ez_crm_client）證實：
- 後端在 Filament 保護下 30 天 0 個 anti-pattern 種子
- 前端在 Vue + Tailwind 自由度下 9 天就出現 Linky360 等價形態的「Tailwind 字串複製」種子（14 處複製 form label class、12 處複製 form input class、5 處 form card、5 處 primary button 含 2 種 micro-divergence）

不是 Vue/Tailwind 的問題，是「自由度高的工具需要更高紀律」這個老命題。本 repo 的作者也是 ez_crm 後端的作者 — 同一人習慣會跨專案傳染，即使工具不同，「相同樣式分散到 N 個位置、需要改時改不齊」這個結構性問題會以新形態重現。

這份文件 + ESLint + 自我執法是前端的紀律組合拳。違反任何一條 = block PR、回頭重寫，不接受「先做完再回來補」。

---

## 違規處理原則

1. **違反任何一條規矩 = block PR、回頭重寫。**
2. 不接受「先做完再回來補」、「下個 PR 再修」、「等有空再抽 component」。
3. 寫程式時若不確定，**先停下來看本文件**，再決定要寫的位置。
4. 規矩執行優先於功能交付速度 — 因為違規累積後的修復成本永遠 > 當下回頭重寫的成本（Linky360 已證實）。

---

## 五條硬規矩

### 規矩 1：禁止 view / component 內複製貼上 Tailwind utility 字串

**閾值**：同一個 utility 字串若在 ≥3 個位置出現，**必須**抽成 component（放 [src/components/ui/](src/components/ui/) 或 feature-specific component）。

**理由**：這是 Linky360 反模式的等價形態 — Tailwind 把 CSS 命名重複從 .css 層移到 .vue 層，複製貼上的本質沒變，只是更難偵測。當第 5 個 button 出現時，沒人記得上次怎麼寫，會 copy-paste 一份微調，三個月後變成 5-7 種按鈕。

**例外**：純 layout class（`flex items-center gap-2`、`mt-6`、`grid grid-cols-2`）即使重複也可保留，因為它們語義是「位置」不是「樣式」。

**判定方法**：
```bash
grep -hoE 'class="[^"]{40,}"' src/views/*.vue src/components/*.vue | sort | uniq -c | sort -rn
```
任何重複數 ≥3 的字串 = 違規。

---

### 規矩 2：禁止單一 Tailwind class 串 ≥10 個 utility

**閾值**：單一 `class="..."` 含 ≥10 個 utility token = 違規（layout class 例外）。

**理由**：超過 10 個 utility 表示這個元素已具備可獨立識別的視覺身份，應該成為 component。內聯堆疊只會讓 template 越讀越累，並且鼓勵下次再 copy-paste。

**抽法**：
- 純樣式 → atomic primitive（`<Button>`、`<Card>`、`<FormInput>`）
- 含結構 → feature component
- 變體多 → primitive + `variant` prop（≤ 5 種變體；超過代表設計太亂）

**例外**：內聯允許「少量 layout 微調」附加在 primitive 上，例如 `<Button class="w-full mt-4">`。但 `<Button>` 自身不該長成 10+ utility。

---

### 規矩 3：禁止 view / component 直接呼叫 axios

**規定**：所有 HTTP 請求必須走 [src/api/](src/api/) layer。

- View / component 只能 import `src/api/*.ts` 暴露的具名函式（`login()`, `getMe()`, ...）
- View 不允許 `import axios from 'axios'`、不允許 `axios.post(...)`、不允許 `new AxiosInstance()`
- View 允許 `import type { AxiosError } from 'axios'`（純型別 import，無 runtime cost）

**理由**：把 HTTP 細節集中在一處才能：
- 統一 base URL、timeout、interceptor、token 注入、401 全域處理
- API 變更時改一處不改 N 處
- Test 時 mock 一個 layer 而不是 N 個 component

**現狀**：[src/api/client.ts](src/api/client.ts) 已是唯一 axios 實例化的地方。維持這個邊界。

---

### 規矩 4：禁止 view 內寫業務邏輯

**規定**：view 是組裝層（fetch、display、route），不是邏輯層。複雜邏輯抽到：

- **Composable**（[src/composables/](src/composables/)）— 含 reactive state 的可重用邏輯（例：[useOAuthPopup](src/composables/useOAuthPopup.ts)）
- **Pure function**（[src/api/](src/api/) helper 或新建 `src/utils/`）— 無 state 的計算
- **Pinia store**（[src/stores/](src/stores/)）— 跨 view 共享的狀態

**判定方法**：view 的 `<script setup>` 出現以下任一情況 = 候選違規：
- 函式 ≥ 30 行
- 同一段邏輯在 ≥ 2 個 view 重複（fmtDate、statusLabel 之類的 helper 是 hint）
- 複雜的 reactive 計算（多層 `computed` / `watch`）
- DOM 計算、ref 操作邏輯

**例外**：handler 函式（`handleSubmit`, `openModal`）可在 view 內，因為它們是 view-specific 編排。

---

### 規矩 5：永續身份狀態走 Pinia，禁止在 component 內直接讀寫 localStorage

**規定**：
- **持久身份狀態**（token、會員資料、登入狀態）必須由 [src/stores/auth.ts](src/stores/auth.ts) 管理。component 不得直接 `localStorage.getItem('ez_crm_token')`。
- **跨頁一次性 handoff**（`pending_verify_email` 等註冊流轉的 transient email）可用 `sessionStorage`，但生命週期限定為單次流程，使用後必須 `removeItem`。
- **不允許**在 component 內 `window.X = Y` 寫全域變數，或自寫 EventBus / pubsub。跨 component 通訊：Pinia 或 props/emit。

**理由**：散落的 localStorage 讀寫會：
- 鍵名拼錯查不出來（`ez_crm_token` vs `ezcrm_token`）
- token 過期 / 撤銷時清除點變多，遺漏一處就資料不一致
- 跨分頁同步邏輯重複實作

**現狀**：
- [src/stores/auth.ts](src/stores/auth.ts) 已 hydrate from localStorage，並透過 storage event 跨分頁同步 — 這是唯一被允許讀寫 `ez_crm_token` / `ez_crm_member` 鍵的地方
- [src/api/client.ts](src/api/client.ts) 在 401 時清除 localStorage — 這是唯一被允許清除身份 key 的地方（避免循環依賴）

新增任何持久狀態時，加到 auth store 或新建 store，不要直接 localStorage。

---

## Repo 結構

```
src/
├── api/              # HTTP layer (規矩 3 的唯一例外)
│   ├── client.ts     # axios 實例 + interceptor (唯一 axios 實例化處)
│   ├── auth.ts       # /auth/* endpoints
│   ├── me.ts         # /me/* endpoints
│   └── types.ts
├── components/
│   ├── ui/           # atomic primitives (Button, FormInput, Card, ...)
│   ├── DynamicForm.vue
│   └── OAuthButtons.vue
├── composables/      # reactive logic (規矩 4)
├── router/           # vue-router 設定
├── stores/           # Pinia (規矩 5: 持久狀態走這裡)
│   └── auth.ts
├── views/            # 路由頁面 (組裝 api + ui，不寫邏輯)
└── style.css         # tailwind entry
```

新增檔案前先看上面：找不到對的位置 = 設計沒想清楚，回頭想。

---

## 自動化護欄

### 已啟用
- **TypeScript strict mode**（[tsconfig.json](tsconfig.json)）
- **vue-tsc** type check（`npm run type-check` / build 時自動跑）
- **ESLint** + **Prettier**（`npm run lint` / `npm run format`）
- **規矩 1 + 規矩 2 自動偵測** — [scripts/check-tailwind-duplication.mjs](scripts/check-tailwind-duplication.mjs)
  - `npm run lint:tailwind`（獨立執行）
  - 已串進 `npm run lint`（CI 自動跑）
  - 偵測重複 ≥3 處的 class 字串（規矩 1）+ 單一 class 含 ≥10 個非 layout utility（規矩 2）
  - 違規時 exit 1，CI 直接 fail
- **CI**（[.github/workflows/frontend.yml](.github/workflows/frontend.yml)：lint + type-check）

### 工具選型紀錄
- `eslint-plugin-tailwindcss` 不適用：本專案用 Tailwind 4（CSS-first config，無 `tailwind.config.js`），該 plugin 對 v4 支援不完整
- 自寫 ESLint rule 偵測跨檔重複工程成本高：ESLint 是 per-file linter，跨檔需自寫 multi-pass。改寫成獨立 Node script 串進 lint chain，更直接且跨平台（Windows / Linux CI 都能跑）

---

## 變更本文件

新增規矩前確認：
1. 是否有實際 anti-pattern 案例佐證（不要憑直覺加）
2. 是否能用 `grep` / ESLint rule 客觀判定（規矩需要可驗收）
3. 是否與既有 5 條衝突或重疊

刪除規矩需要更高門檻：說明為什麼這個風險已不存在或已被其他機制取代。

---

## 參考

- 跨專案審計交接單：[work_log/20260430/handoff_audit_fixes.md](work_log/20260430/handoff_audit_fixes.md)
- 後端對應文件：`c:/xampp/htdocs/ez_crm/ARCHITECTURE.md`（不同 stack，不同規矩，但精神一致）
