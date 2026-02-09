import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AdminUser } from '../types'
import { adminLogin, adminLogout, getAdminMe } from '../services/adminApi'

interface AdminAuthContextType {
  user: AdminUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

export const AdminAuthContext = createContext<AdminAuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
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

  const login = useCallback(async (username: string, password: string) => {
    const response = await adminLogin(username, password)
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
      isAuthenticated: !!user,
    }}>
      {children}
    </AdminAuthContext.Provider>
  )
}
