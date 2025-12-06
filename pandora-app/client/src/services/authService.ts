import api from './api';

export interface RegisterData {
  email: string;
  name: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  trustScore: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  trustScore: number;
  lastLogin?: string;
}

export const authService = {
  /**
   * Register new user
   */
  register: async (data: RegisterData) => {
    const response = await api.post<{ id: string; email: string; name: string }>(
      '/auth/register',
      data
    );
    return response.data;
  },

  /**
   * Login user
   */
  login: async (data: LoginData) => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  /**
   * Refresh access token
   */
  refresh: async (refreshToken: string) => {
    const response = await api.post<{ accessToken: string; tokenType: string }>(
      '/auth/refresh',
      { refreshToken }
    );
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async () => {
    await api.post('/auth/logout');
  },

  /**
   * Verify token
   */
  verify: async () => {
    const response = await api.get<{
      valid: boolean;
      userId: string;
      email: string;
      trustScore: number;
    }>('/auth/verify');
    return response.data;
  },

  /**
   * Get current user info
   */
  getMe: async () => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};
