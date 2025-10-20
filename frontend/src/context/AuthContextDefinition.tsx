import { createContext } from 'react';
import { LoginCredentials, RegisterData } from '../services/authService';

export interface User {
  id: string;
  name: string;
  email: string;
  notificationEmail?: string | null;
  avatarUrl?: string | null;
  googleConnected?: boolean;
  googlePictureUrl?: string | null;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  updateCurrentUser: (changes: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);