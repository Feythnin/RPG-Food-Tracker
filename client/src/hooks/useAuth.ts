import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export function useMe() {
  const { setUser } = useAuthStore();
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      return data.user;
    },
    retry: false,
  });
}

export function useLogin() {
  const { setUser } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (creds: { username: string; password: string }) => {
      const { data } = await api.post('/auth/login', creds);
      return data;
    },
    onSuccess: (data) => {
      setUser(data.user);
      qc.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

export function useRegister() {
  const { setUser } = useAuthStore();
  return useMutation({
    mutationFn: async (creds: { username: string; password: string }) => {
      const { data } = await api.post('/auth/register', creds);
      return data;
    },
    onSuccess: (data) => {
      setUser(data.user);
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      logout();
      qc.clear();
    },
  });
}
