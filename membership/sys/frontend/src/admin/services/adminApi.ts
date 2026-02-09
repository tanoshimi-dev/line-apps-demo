import type {
  AdminLoginResponse,
  AdminUser,
  DashboardStats,
  AdminMember,
  AdminMemberDetail,
  AdminTransaction,
  QrSessionResponse,
  QrSessionDetail,
  QrSessionListItem,
  Operator,
  PaginatedResponse,
  TwoFactorSetupResponse,
  TwoFactorConfirmResponse,
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

console.log('Admin API Base URL:', API_BASE_URL)

function getToken(): string | null {
  return localStorage.getItem('admin_token')
}

async function adminFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    window.location.href = '/admin/login'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `API Error: ${response.status}`)
  }

  return response.json()
}

// Auth
export async function adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
  const response = await adminFetch<AdminLoginResponse>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  if (!response.two_factor_required) {
    localStorage.setItem('admin_token', response.token)
    localStorage.setItem('admin_user', JSON.stringify(response.user))
  }
  return response
}

export async function adminVerify2fa(token: string, code: string): Promise<AdminLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/2fa/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `API Error: ${response.status}`)
  }

  const data: AdminLoginResponse = await response.json()
  localStorage.setItem('admin_token', data.token)
  localStorage.setItem('admin_user', JSON.stringify(data.user))
  return data
}

export async function adminLogout(): Promise<void> {
  try {
    await adminFetch('/admin/logout', { method: 'POST' })
  } finally {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }
}

export async function getAdminMe(): Promise<AdminUser> {
  return adminFetch<AdminUser>('/admin/me')
}

// Dashboard
export async function getDashboard(): Promise<DashboardStats> {
  return adminFetch<DashboardStats>('/admin/dashboard')
}

// Members
export async function getMembers(params: {
  page?: number
  per_page?: number
  search?: string
  rank?: string
  sort_by?: string
  sort_order?: string
} = {}): Promise<PaginatedResponse<AdminMember>> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.per_page) query.set('per_page', String(params.per_page))
  if (params.search) query.set('search', params.search)
  if (params.rank) query.set('rank', params.rank)
  if (params.sort_by) query.set('sort_by', params.sort_by)
  if (params.sort_order) query.set('sort_order', params.sort_order)
  return adminFetch<PaginatedResponse<AdminMember>>(`/admin/members?${query}`)
}

export async function getMemberDetail(id: string): Promise<AdminMemberDetail> {
  return adminFetch<AdminMemberDetail>(`/admin/members/${id}`)
}

// Transactions
export async function getTransactions(params: {
  page?: number
  per_page?: number
  type?: string
  member_id?: string
  date_from?: string
  date_to?: string
} = {}): Promise<PaginatedResponse<AdminTransaction>> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.per_page) query.set('per_page', String(params.per_page))
  if (params.type) query.set('type', params.type)
  if (params.member_id) query.set('member_id', params.member_id)
  if (params.date_from) query.set('date_from', params.date_from)
  if (params.date_to) query.set('date_to', params.date_to)
  return adminFetch<PaginatedResponse<AdminTransaction>>(`/admin/transactions?${query}`)
}

// QR Sessions
export async function createSpendQr(): Promise<QrSessionResponse> {
  return adminFetch<QrSessionResponse>('/admin/qr/spend', { method: 'POST' })
}

export async function createEarnQr(points: number, reason?: string): Promise<QrSessionResponse> {
  return adminFetch<QrSessionResponse>('/admin/qr/earn', {
    method: 'POST',
    body: JSON.stringify({ points, reason }),
  })
}

export async function getQrSessions(params: {
  page?: number
  per_page?: number
  type?: string
  status?: string
} = {}): Promise<PaginatedResponse<QrSessionListItem>> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.per_page) query.set('per_page', String(params.per_page))
  if (params.type) query.set('type', params.type)
  if (params.status) query.set('status', params.status)
  return adminFetch<PaginatedResponse<QrSessionListItem>>(`/admin/qr/sessions?${query}`)
}

export async function getQrSessionDetail(id: string): Promise<QrSessionDetail> {
  return adminFetch<QrSessionDetail>(`/admin/qr/sessions/${id}`)
}

// Settings
export async function getSettings(): Promise<Record<string, unknown>> {
  return adminFetch<Record<string, unknown>>('/admin/settings')
}

export async function updateSettings(settings: Record<string, unknown>): Promise<void> {
  await adminFetch('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}

// Operators
export async function getOperators(): Promise<{ data: Operator[] }> {
  return adminFetch<{ data: Operator[] }>('/admin/operators')
}

export async function createOperator(data: {
  username: string
  password: string
  name: string
  role: string
}): Promise<Operator> {
  return adminFetch<Operator>('/admin/operators', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateOperator(id: string, data: Record<string, unknown>): Promise<Operator> {
  return adminFetch<Operator>(`/admin/operators/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteOperator(id: string): Promise<void> {
  await adminFetch(`/admin/operators/${id}`, { method: 'DELETE' })
}

// 2FA
export async function setup2fa(): Promise<TwoFactorSetupResponse> {
  return adminFetch<TwoFactorSetupResponse>('/admin/2fa/setup')
}

export async function confirm2fa(code: string): Promise<TwoFactorConfirmResponse> {
  return adminFetch<TwoFactorConfirmResponse>('/admin/2fa/confirm', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

export async function disable2fa(password: string): Promise<void> {
  await adminFetch('/admin/2fa', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  })
}

export async function get2faStatus(): Promise<{ two_factor_enabled: boolean }> {
  return adminFetch<{ two_factor_enabled: boolean }>('/admin/2fa/status')
}
