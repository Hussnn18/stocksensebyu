import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { setCurrentUser } from '../api/inventory';

const STORAGE_KEY = 'stocksense.user';
const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = readStoredUser();
    setCurrentUser(stored);
    return stored;
  });

  const login = useCallback((nextUser) => {
    setUser(nextUser);
    setCurrentUser(nextUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } catch {
      // Private mode or blocked storage: the session just won't survive a reload.
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
