export interface UserProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

export interface MemberInfo {
  id: string
  userId: string
  displayName: string
  memberNumber: string
  points: number
  rank: MemberRank
  registeredAt: string
  pictureUrl?: string
}

export type MemberRank = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface PointHistory {
  id: string
  type: 'add' | 'use'
  points: number
  balance: number
  reason: string
  createdAt: string
}
