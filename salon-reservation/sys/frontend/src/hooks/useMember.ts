import { useState, useEffect, useCallback } from 'react';
import { getMemberInfo, registerMember } from '../services/api';
import type { MemberInfo } from '../types';

export function useMember() {
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMember = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMemberInfo();
      setMember(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  const register = async (data?: { phone?: string; email?: string }) => {
    try {
      setLoading(true);
      const newMember = await registerMember(data);
      setMember(newMember);
      return newMember;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    member,
    loading,
    error,
    register,
    refetch: fetchMember,
  };
}
