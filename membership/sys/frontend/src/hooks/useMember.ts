import { useState, useEffect, useCallback } from 'react'
import { getMemberInfo, registerMember } from '../services/api'
import type { MemberInfo } from '../types'

interface UseMemberResult {
  member: MemberInfo | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  register: (displayName: string) => Promise<void>
}

export function useMember(): UseMemberResult {
  const [member, setMember] = useState<MemberInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchMember = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getMemberInfo()
      setMember(data)
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) {
        setMember(null)
      } else {
        setError(err instanceof Error ? err : new Error('Failed to fetch member'))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (displayName: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await registerMember({ displayName })
      setMember(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to register'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMember()
  }, [fetchMember])

  return {
    member,
    loading,
    error,
    refetch: fetchMember,
    register,
  }
}
