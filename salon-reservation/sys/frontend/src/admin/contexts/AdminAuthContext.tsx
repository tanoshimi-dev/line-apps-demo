import { createContext, useState, useEffect, type ReactNode } from 'react';
import type { AdminUser, AdminLoginResponse } from '../types';
import {
  adminLogin,
  adminVerify2fa,
  adminLogout,
  getAdminMe,
} from '../services/adminApi';

export interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<AdminLoginResponse>;
  logout: () => Promise<void>;
  verifyTwoFactor: (token: string, code: string) => Promise<void>;
  isAuthenticated: boolean;
}

export const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      getAdminMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('admin_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<AdminLoginResponse> => {
    const response = await adminLogin(username, password);

    if (!response.twoFactorRequired) {
      localStorage.setItem('admin_token', response.token);
      setUser(response.user);
    }

    return response;
  };

  const verifyTwoFactor = async (token: string, code: string) => {
    const response = await adminVerify2fa(token, code);
    localStorage.setItem('admin_token', response.token);
    setUser(response.user);
  };

  const logout = async () => {
    await adminLogout();
    setUser(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        verifyTwoFactor,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}
