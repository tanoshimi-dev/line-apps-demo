import { useContext } from 'react';
import { AdminAuthContext, type AdminAuthContextType } from '../contexts/AdminAuthContext';

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
