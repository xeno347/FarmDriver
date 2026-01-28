import React, { createContext, useState, useContext, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  dateOfBirth: string;
  joiningDate: string;
  experience: string;
  role: string;
  stats: {
    tasksCompleted: number;
    hoursLogged: number;
    rating: number;
    safetyScore: number;
  };
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => Promise<boolean>;
  logout: () => void;
}



const AuthContext = createContext<AuthContextProps | undefined>(undefined);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // show login screen by default
  const [user, setUser] = useState<User | null>(null);

  const login = async (userObj: User) => {
    setUser(userObj);
    setIsAuthenticated(true);
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
