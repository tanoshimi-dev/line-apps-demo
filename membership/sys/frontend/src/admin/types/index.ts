export interface AdminUser {
  id: string
  username: string
  name: string
  role: 'admin' | 'operator'
  two_factor_enabled?: boolean
}

export interface AdminLoginResponse {
  token: string
  expires_at: string
  user: AdminUser
  two_factor_required?: boolean
}

export interface TwoFactorSetupResponse {
  secret: string
  otpauth_uri: string
}

export interface TwoFactorConfirmResponse {
  message: string
  recovery_codes: string[]
}

export interface DashboardStats {
  total_members: number
  total_points_issued: number
  total_points_used: number
  today_transactions: number
  members_by_rank: {
    bronze: number
    silver: number
    gold: number
    platinum: number
  }
  recent_transactions: AdminTransaction[]
}

export interface AdminMember {
  id: string
  display_name: string
  member_number: string
  points: number
  rank: string
  picture_url?: string
  created_at: string
}

export interface AdminMemberDetail {
  member: AdminMember & {
    line_user_id: string
    updated_at: string
  }
  point_history: AdminPointHistory[]
}

export interface AdminPointHistory {
  id: string
  type: 'add' | 'use'
  points: number
  balance: number
  reason: string
  created_at: string
}

export interface AdminTransaction {
  id: string
  member_id?: string
  member_name: string
  member_number: string
  type: 'add' | 'use'
  points: number
  balance: number
  reason: string
  created_at: string
}

export interface QrSessionResponse {
  id: string
  type: 'spend' | 'earn'
  points: number | null
  status: 'pending' | 'completed' | 'expired'
  qr_data: string
  expires_at: string
}

export interface QrSessionDetail {
  id: string
  type: 'spend' | 'earn'
  points: number | null
  token: string
  status: 'pending' | 'completed' | 'expired'
  member_name?: string
  member_number?: string
  admin_name?: string
  reason?: string
  created_at: string
  expires_at: string
}

export interface QrSessionListItem {
  id: string
  type: 'spend' | 'earn'
  points: number | null
  status: 'pending' | 'completed' | 'expired'
  member_name?: string
  admin_name?: string
  reason?: string
  created_at: string
  expires_at: string
}

export interface Operator {
  id: string
  username: string
  name: string
  role: 'admin' | 'operator'
  is_active: boolean
  created_at: string
}

export interface Pagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: Pagination
}
