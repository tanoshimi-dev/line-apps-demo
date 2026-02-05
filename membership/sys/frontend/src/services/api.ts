import { getAccessToken } from './liff'
import type { MemberInfo, PointHistory } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

interface ApiMemberResponse {
  registered: boolean
  member: {
    id: string
    member_number: string
    display_name: string
    points: number
    rank: string
    picture_url?: string
    created_at: string
  }
}

function transformMember(data: ApiMemberResponse['member']): MemberInfo {
  return {
    id: data.id,
    userId: '',
    displayName: data.display_name,
    memberNumber: data.member_number,
    points: data.points,
    rank: data.rank as MemberInfo['rank'],
    registeredAt: data.created_at,
    pictureUrl: data.picture_url,
  }
}

export async function getMemberInfo(): Promise<MemberInfo> {
  const response = await fetchWithAuth<ApiMemberResponse>('/member')
  return transformMember(response.member)
}

export async function registerMember(data: { displayName: string }): Promise<MemberInfo> {
  const response = await fetchWithAuth<{ message: string; member: ApiMemberResponse['member'] }>('/member/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return transformMember(response.member)
}

interface ApiPointHistoryItem {
  id: string
  type: 'add' | 'use'
  points: number
  balance: number
  reason: string
  created_at: string
}

interface ApiPointHistoryResponse {
  data: ApiPointHistoryItem[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

function transformPointHistory(item: ApiPointHistoryItem): PointHistory {
  return {
    id: item.id,
    type: item.type,
    points: item.points,
    balance: item.balance,
    reason: item.reason,
    createdAt: item.created_at,
  }
}

export async function getPointHistory(page: number = 1, limit: number = 20): Promise<PointHistory[]> {
  const response = await fetchWithAuth<ApiPointHistoryResponse>(`/points/history?page=${page}&per_page=${limit}`)
  return response.data.map(transformPointHistory)
}

export async function addPoints(points: number, reason: string): Promise<MemberInfo> {
  return fetchWithAuth<MemberInfo>('/points/add', {
    method: 'POST',
    body: JSON.stringify({ points, reason }),
  })
}

export async function usePoints(points: number, reason: string): Promise<MemberInfo> {
  return fetchWithAuth<MemberInfo>('/points/use', {
    method: 'POST',
    body: JSON.stringify({ points, reason }),
  })
}

export async function getMemberQRCode(): Promise<{ qrCodeUrl: string }> {
  const response = await fetchWithAuth<{ qr_code: string; member_number: string }>('/member/qrcode')
  return { qrCodeUrl: response.qr_code }
}
