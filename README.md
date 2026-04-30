# ez_crm_client

Frontend SPA for [ez_crm](https://github.com/TuanTsungShiang/ez_crm) — a member auth / self-service UI.

## Tech Stack

- **Framework**: Vue 3 (`<script setup>` + Composition API)
- **Language**: TypeScript
- **Build**: Vite 8
- **State**: Pinia + `@vueuse/core` (localStorage sync)
- **Routing**: Vue Router 4
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **HTTP**: axios (with request/response interceptors)

## Pairs with

Backend API: [ez_crm](https://github.com/TuanTsungShiang/ez_crm) (Laravel 10 + Sanctum + Filament).

Default API base URL for local dev: `http://ez-crm.local/api/v1` (see `.env.development`).

## What's in here

### Auth flows
- **Register** — dynamic form rendered from the backend's `/auth/register/schema` endpoint
- **Verify Email** — OTP entry + resend; email passed via `sessionStorage` (never in URL)
- **Login** — with three distinct error paths:
  - `A009` invalid credentials
  - `A004` account suspended
  - `A005` email not verified → offers a one-click jump to `/verify`
- **Forgot / reset password** — email + 6-digit code, with resend
- **OAuth login & binding** — Google / GitHub / LINE / Discord via popup + `postMessage`

### Self-service `/me`
- **Profile** — view member detail, status, bound SNS providers
- **Edit** — update name / nickname / phone with dirty tracking
- **Password** — change (existing) or set (OAuth-only members) with token revocation
- **SNS management** — bind / unbind providers; lock-out warning when last provider + email unverified
- **Account destroy** — soft-delete with email-confirmation modal (HeadlessUI `Dialog`)

### Foundations
- **Auth store** — Pinia + `useLocalStorage` so the token/member persist across tabs & reload
- **Interceptors** — `401` auto-clears auth state and redirects to `/login?expired=1`
- **UI primitives** — `<Button>` / `<Card>` / `<FormInput>` / `<FormLabel>` / `<TextLink>` in [src/components/ui/](src/components/ui/)
- **Architectural guardrails** — see [ARCHITECTURE.md](ARCHITECTURE.md) for the five hard rules (utility-string duplication, axios layer, business-logic placement, persistent state)
- **Tooling** — TypeScript strict, ESLint + Prettier, Vite-driven CI

## Coming next

- End-to-end Playwright tests
- Vercel deploy

## Development

```bash
npm install
npm run dev         # http://localhost:5173
npm run build
npm run preview
```

## Environment variables

| Key | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL (default `http://ez-crm.local/api/v1`) |
