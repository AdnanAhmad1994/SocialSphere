import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  email: string | null;
  name: string;
  role: string;
  avatar: string | null;
}

interface AuthStatus {
  authenticated: boolean;
  user: User | null;
}

export function useCustomAuth() {
  const queryClient = useQueryClient();
  
  const { data: authStatus, isLoading, error } = useQuery<AuthStatus>({
    queryKey: ['/api/auth/status'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const logout = async () => {
    try {
      // Get JWT token for authorization
      const token = localStorage.getItem('auth-token');
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers,
      });
      
      // Clear JWT token from localStorage
      localStorage.removeItem('auth-token');
      
      // Set auth status to logged out immediately
      queryClient.setQueryData(['/api/auth/status'], {
        authenticated: false,
        user: null
      });
      
      // Clear all other cached data
      queryClient.clear();
      
      // Force refetch to ensure server state is synced
      queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      localStorage.removeItem('auth-token');
      queryClient.setQueryData(['/api/auth/status'], {
        authenticated: false,
        user: null
      });
    }
  };

  const refreshAuth = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
  };

  return {
    isAuthenticated: authStatus?.authenticated ?? false,
    user: authStatus?.user ?? null,
    isLoading,
    error,
    logout,
    refreshAuth,
  };
}