// 對應後端 App\Http\Traits\ApiResponse 的回應結構
export interface ApiSuccess<T = unknown> {
  success: true
  code: string
  data: T
}

export interface ApiError {
  success: false
  code: string
  message: string
  errors?: Record<string, string[]>
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

// 常用 ApiCode 字串(對應後端 App\Enums\ApiCode)
export const ApiCode = {
  OK: 'S200',
  CREATED: 'S201',

  MISSING_FIELD: 'V001',
  INVALID_FORMAT: 'V002',
  OUT_OF_RANGE: 'V003',
  INVALID_ENUM: 'V004',
  INVALID_RELATION: 'V005',
  DUPLICATE_FIELD: 'V006',

  NO_TOKEN: 'A001',
  TOKEN_EXPIRED: 'A002',
  FORBIDDEN: 'A003',
  ACCOUNT_SUSPENDED: 'A004',
  EMAIL_NOT_VERIFIED: 'A005',
  ALREADY_VERIFIED: 'A006',
  INVALID_CODE: 'A007',
  THROTTLED: 'A008',
  INVALID_CREDENTIALS: 'A009',
  OAUTH_FAILED: 'A010',
  SNS_ALREADY_BOUND: 'A011',
  LAST_LOGIN_METHOD: 'A012',
  PROVIDER_NOT_SUPPORTED: 'A013',

  NOT_FOUND: 'N001',
  ENDPOINT_NOT_FOUND: 'N002',

  UNKNOWN_ERROR: 'I000',
} as const

export type ApiCodeValue = (typeof ApiCode)[keyof typeof ApiCode]

// 會員基本資料
export interface Member {
  uuid: string
  name: string
  nickname?: string | null
  email: string
  phone?: string | null
  status: number
  email_verified_at?: string | null
  phone_verified_at?: string | null
  last_login_at?: string | null
}

// Register Schema 回傳的欄位定義
export interface RegisterSchemaField {
  name: string
  label: string
  type: string
  required: boolean
  rules?: string[]
  placeholder?: string
  hint?: string
}

export interface RegisterSchema {
  fields: RegisterSchemaField[]
  links: {
    terms: string
    privacy: string
  }
  oauth_providers: string[]
}

// Register / Login / Verify 的 data payload
export interface RegisterResult {
  member_uuid: string
  email: string
  otp_expires_in: number
}

export interface LoginResult {
  token: string
  member: Pick<Member, 'uuid' | 'name' | 'email'>
}
