import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('smartpos-user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const login = (username, password) => {
    // Mock authentication for portfolio demonstration
    if (username === 'admin' && password === 'admin123') {
      const u = { id: 'usr_1', role: 'admin', name: 'Store Manager', username };
      setUser(u);
      localStorage.setItem('smartpos-user', JSON.stringify(u));
      return { success: true };
    }
    if (username === 'cashier' && password === 'cashier123') {
      const u = { id: 'usr_2', role: 'cashier', name: 'Front Desk', username };
      setUser(u);
      localStorage.setItem('smartpos-user', JSON.stringify(u));
      return { success: true };
    }
    if (username === 'kitchen' && password === 'kitchen123') {
      const u = { id: 'usr_3', role: 'kitchen', name: 'Head Chef', username };
      setUser(u);
      localStorage.setItem('smartpos-user', JSON.stringify(u));
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials. Use provided demo accounts.' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('smartpos-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
