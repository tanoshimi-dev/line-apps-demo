import { useState, useEffect } from 'react'
import { isLoggedIn, getProfile, login } from '../services/liff'
import type { UserProfile } from '../types'

interface UseLiffResult {
  isReady: boolean
  isLoggedIn: boolean
  profile: UserProfile | null
  login: () => void
  loading: boolean
  error: Error | null
}

export function useLiff(): UseLiffResult {
  const [isReady, setIsReady] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function init() {
      try {
        setIsReady(true)

        if (isLoggedIn()) {
          const userProfile = await getProfile()
          setProfile(userProfile)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  return {
    isReady,
    isLoggedIn: isLoggedIn(),
    profile,
    login,
    loading,
    error,
  }
}
