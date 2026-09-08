import { createContext } from 'react';

// Auth Context
export const AuthContext = createContext(null);

// Auth Provider - bypassed for demo, always logged in
export const AuthProvider = ({ children }) => {
  const demoUser = { id: 'demo-001', email: 'test@test.com', name: 'Demo User', role: 'admin' };

  const login = async () => {};
  const logout = () => {};

  return (
    <AuthContext.Provider value={{ user: demoUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
