import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { authService, LoginCredentials, RegisterData } from '../services/authService';
import { AuthContext, User } from './AuthContextDefinition';

// Export AuthContext for use in other files
export { AuthContext };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser as User);
    }
    setLoading(false);
  }, []);

  const persistUser = useCallback((next: User | null) => {
    if (next) {
      localStorage.setItem('user', JSON.stringify(next));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  const applyUser = useCallback(
    (next: User | null) => {
      persistUser(next);
      setUser(next);
    },
    [persistUser]
  );

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await authService.login(credentials);
      if (response && response.user) {
        applyUser(response.user as User);
      }
    },
    [applyUser]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const response = await authService.register(data);
      if (response && response.user) {
        applyUser(response.user as User);
      }
    },
    [applyUser]
  );

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      const response = await authService.loginWithGoogle(idToken);
      if (response && response.user) {
        applyUser(response.user as User);
      }
    },
    [applyUser]
  );

  const logout = useCallback(() => {
    authService.logout();
    applyUser(null);
  }, [applyUser]);

  const updateCurrentUser = useCallback(
    (changes: Partial<User>) => {
      setUser((prev) => {
        if (!prev) {
          return prev;
        }
        const next: User = { ...prev, ...changes };
        persistUser(next);
        return next;
      });
    },
    [persistUser]
  );

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      loginWithGoogle,
      register,
      logout,
      loading,
      updateCurrentUser,
    }),
    [user, login, loginWithGoogle, register, logout, loading, updateCurrentUser]
  );

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
};

