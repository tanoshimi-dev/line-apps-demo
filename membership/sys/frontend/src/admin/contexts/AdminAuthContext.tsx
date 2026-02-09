import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AdminUser, AdminLoginResponse } from '../types'
import { adminLogin, adminLogout, adminVerify2fa, getAdminMe } from '../services/adminApi'

interface AdminAuthContextType {
  user: AdminUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<AdminLoginResponse>
  logout: () => Promise<void>
  verifyTwoFactor: (token: string, code: string) => Promise<void>
  isAuthenticated: boolean
}

export const AdminAuthContext = createContext<AdminAuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ token: '', expires_at: '', user: { id: '', username: '', name: '', role: 'operator' } }),
  logout: async () => {},
  verifyTwoFactor: async () => {},
  isAuthenticated: false,
})

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      getAdminMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_user')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<AdminLoginResponse> => {
    const response = await adminLogin(username, password)
    if (!response.two_factor_required) {
      setUser(response.user)
    }
    return response
  }, [])

  const verifyTwoFactor = useCallback(async (token: string, code: string) => {
    const response = await adminVerify2fa(token, code)
    setUser(response.user)
  }, [])

  const logout = useCallback(async () => {
    await adminLogout()
    setUser(null)
  }, [])

  return (
    <AdminAuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      verifyTwoFactor,
      isAuthenticated: !!user,
    }}>
      {children}
    </AdminAuthContext.Provider>
  )
}
