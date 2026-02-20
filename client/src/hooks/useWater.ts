import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useWaterLogs(date?: string) {
  const d = date || new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['water', 'logs', d],
    queryFn: async () => {
      const { data } = await api.get(`/water/logs?date=${d}`);
      return data;
    },
  });
}

export function useLogWater() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { glasses: number; date?: string }) => {
      const { data } = await api.post('/water/log', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['water'] });
      qc.invalidateQueries({ queryKey: ['game'] });
    },
  });
}

export function useDeleteWater() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/water/log/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['water'] });
      qc.invalidateQueries({ queryKey: ['game'] });
    },
  });
}
