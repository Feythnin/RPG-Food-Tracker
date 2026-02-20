import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export function useNutritionSummary(period: string = 'day', date?: string) {
  const d = date || new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['nutrition', 'summary', period, d],
    queryFn: async () => {
      const { data } = await api.get(`/nutrition/summary?period=${period}&date=${d}`);
      return data;
    },
  });
}

export function useWaterSummary(period: string = 'week', date?: string) {
  const d = date || new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['nutrition', 'water-summary', period, d],
    queryFn: async () => {
      const { data } = await api.get(`/nutrition/water-summary?period=${period}&date=${d}`);
      return data;
    },
  });
}

export function useWeightHistory() {
  return useQuery({
    queryKey: ['profile', 'weight-history'],
    queryFn: async () => {
      const { data } = await api.get('/profile/weight-history');
      return data.weighIns;
    },
  });
}
