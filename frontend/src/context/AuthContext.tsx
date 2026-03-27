/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, ReactNode } from 'react';
import * as authService from '../services/api';

// Typen för den inloggade användaren
interface User {
  user_id: number;
  username: string;
}

// Typen för vad contexten exponerar
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// Skapa contexten (undefined som default — vi använder alltid en Provider)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider-komponenten som omsluter hela appen
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string, password: string) => {
    // Anropar backend — JWT-cookien sätts automatiskt av servern
    const data = await authService.login(username, password);
    setUser({ user_id: data.user_id, username: data.username });
  };

  const logout = () => {
    // Anropar backend för att rensa cookien
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook för att använda auth-contexten i komponenter
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
