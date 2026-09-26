import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DATA_SOURCE, setCurrentUser } from '../api/inventory';
import { API_BASE_URL } from '../lib/constants';

const STORAGE_KEY = 'stocksense.user';
const TOKEN_KEY = 'stocksense.token'; // JWT from POST /api/auth/login
const AuthContext = createContext(null);

function readStoredSession() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    // A saved user without a token is left over from the old mock login: sign in again.
    return token && raw ? { user: JSON.parse(raw), token } : { user: null, token: null };
  } catch {
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const stored = readStoredSession();
    setCurrentUser(stored.user);
    return stored;
  });

  const login = useCallback((nextUser, token) => {
    setSession({ user: nextUser, token });
    setCurrentUser(nextUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Private mode or blocked storage: the session just won't survive a reload.
    }
  }, []);

  const logout = useCallback(() => {
    setSession({ user: null, token: null });
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  }, []);

  // On start, check the saved token with the backend. Log out if it expired or the account is gone.
  useEffect(() => {
    const { token } = session;
    if (!token || DATA_SOURCE === 'mock') return; // mock mode has no backend to ask
    let cancelled = false;
    fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) return logout();
        if (!res.ok) return; // server error: keep the session for now
        const data = await res.json();
        login(data.user, token); // refresh name/role from the database
      })
      .catch(() => {}); // backend offline: keep the session, API calls will show the error
    return () => {
      cancelled = true;
    };
    // Runs once with the token saved from the last visit.
  }, []);

  // Any API call that comes back 401 (expired or invalid token) ends the session.
  useEffect(() => {
    window.addEventListener('stocksense:unauthorized', logout);
    return () => window.removeEventListener('stocksense:unauthorized', logout);
  }, [logout]);

  const value = useMemo(
    () => ({ user: session.user, token: session.token, login, logout }),
    [session, login, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
