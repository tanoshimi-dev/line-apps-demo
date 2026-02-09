import { useContext } from 'react'
import { AdminAuthContext } from '../contexts/AdminAuthContext'

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}
