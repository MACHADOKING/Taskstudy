import api from './api';
import { showToast } from '../utils/toast';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  notificationEmail?: string | null;
  avatarUrl?: string | null;
  googleConnected?: boolean;
  googlePictureUrl?: string | null;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      showToast.success('toastLoginSuccess');
      return response.data;
    } catch (error) {
      showToast.apiError(error, 'toastLoginError');
      throw error;
    }
  },

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/google', { idToken });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      showToast.success('toastGoogleLoginSuccess');
      return response.data;
    } catch (error) {
      showToast.apiError(error, 'toastGoogleLoginError');
      throw error;
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      showToast.success('toastRegisterSuccess');
      // Create a welcome notification for settings completion
      try {
        await api.post('/notification-center/read', { all: false }); // ping to ensure auth path works
        // We don't have a create endpoint; use a client-side info until server-side notification arrives
        showToast.info('Para habilitar todas as notificações, acesse Configurações da conta.');
      } catch (e) {
        // noop
      }
      return response.data;
    } catch (error) {
      showToast.apiError(error, 'toastRegisterError');
      throw error;
    }
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showToast.info('toastLogout');
  },

  getCurrentUser(): AuthUser | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return null;
    }

    try {
      return JSON.parse(userStr) as AuthUser;
    } catch (error) {
      console.warn('Failed to parse stored user payload', error);
      localStorage.removeItem('user');
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },
};