import { useMutation, useQuery } from '@tanstack/react-query';
import { httpClient } from '../api/httpClient';
import { endpoints } from '../api/endpoints';
import { User, LoginCredentials, AuthResponse } from '../../domain/types/auth';
import { useAuthStore } from '../../application/services/authStore';

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await httpClient.post<AuthResponse>(
        endpoints.auth.login,
        credentials
      );
      return response.data;
    },
    onSuccess: (data) => {
      useAuthStore.setState({
        user: data.user,
        token: data.accessToken,
        isAuthenticated: true,
      });
    },
  });
};

export const useCurrentUser = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await httpClient.get<User>(endpoints.auth.me);
      return response.data;
    },
    enabled: !!token,
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await httpClient.post(endpoints.auth.forgotPassword, { email });
      return response.data;
    },
  });
};
