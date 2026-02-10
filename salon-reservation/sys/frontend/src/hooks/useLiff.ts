import { useState, useEffect } from 'react';
import { getProfile, isLoggedIn, login, logout } from '../services/liff';
import type { UserProfile } from '../types';

export function useLiff() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (isLoggedIn()) {
        const profile = await getProfile();
        setUser(profile);
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  return {
    user,
    loading,
    isLoggedIn: isLoggedIn(),
    login,
    logout,
  };
}
