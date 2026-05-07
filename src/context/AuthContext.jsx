import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [projectRole, setProjectRoleState] = useState(null);
  // Prevents ProtectedRoute from redirecting before localStorage is checked
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      const payload = decodeJwt(savedToken);
      if (payload && payload.exp * 1000 > Date.now()) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (tokenValue, userData) => {
    setToken(tokenValue);
    setUser(userData);
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const updateUser = (patch) => {
    setUser(prev => {
      const updated = { ...prev, ...patch };
      localStorage.setItem('user', JSON.stringify(updated));
      if (patch.token) {
        setToken(patch.token);
        localStorage.setItem('token', patch.token);
      }
      return updated;
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setProjectRoleState(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const setProjectRole = (role) => setProjectRoleState(role);

  return (
    <AuthContext.Provider value={{ user, token, projectRole, isLoading, login, logout, setProjectRole, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
