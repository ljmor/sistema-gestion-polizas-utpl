import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../application/services/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Solo redirigir al login si es un 401 Y NO es la ruta de login/forgot-password
    const isAuthRoute = error.config?.url?.includes('/auth/login') || 
                        error.config?.url?.includes('/auth/forgot-password');
    
    if (error.response?.status === 401 && !isAuthRoute) {
      // Token expirado o inválido - cerrar sesión y redirigir
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    // Para rutas de auth, solo rechazar el error sin redirigir
    return Promise.reject(error);
  }
);

export const publicHttpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
