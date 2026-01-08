import { useState, useEffect } from 'react';

interface User {
  username: string;
  role: 'ADMIN' | 'MEMBER';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  checkAuth: () => Promise<void>;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isAdmin: false,
    checkAuth: async () => {},
  });

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setState({
          user: data.user,
          loading: false,
          isAdmin: data.user.role === 'ADMIN',
          checkAuth,
        });
      } else {
        setState(prev => ({ ...prev, loading: false, user: null, isAdmin: false }));
      }
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, user: null, isAdmin: false }));
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return state;
}
