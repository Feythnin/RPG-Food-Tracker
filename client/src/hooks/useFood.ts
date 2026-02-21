import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { getLocalDateStr } from '../lib/dates';

export function useFoodLogs(date?: string) {
  const d = date || getLocalDateStr();
  return useQuery({
    queryKey: ['food', 'logs', d],
    queryFn: async () => {
      const { data } = await api.get(`/food/logs?date=${d}`);
      return data;
    },
  });
}

export function useLogFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (food: any) => {
      const { data } = await api.post('/food/log', food);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['food'] });
      qc.invalidateQueries({ queryKey: ['game'] });
    },
  });
}

export function useDeleteFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/food/log/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['food'] });
      qc.invalidateQueries({ queryKey: ['game'] });
    },
  });
}

export function useSearchUSDA(query: string) {
  return useQuery({
    queryKey: ['food', 'search', 'usda', query],
    queryFn: async () => {
      const { data } = await api.get(`/food/search/usda?q=${encodeURIComponent(query)}`);
      return data.foods;
    },
    enabled: query.length >= 2,
  });
}

export function useSearchRecipe(query: string) {
  return useQuery({
    queryKey: ['food', 'search', 'recipe', query],
    queryFn: async () => {
      const { data } = await api.get(`/food/search/recipe?q=${encodeURIComponent(query)}`);
      return data.foods;
    },
    enabled: query.length >= 2,
  });
}

export function useBarcodeLookup() {
  return useMutation({
    mutationFn: async (barcode: string) => {
      const { data } = await api.get(`/food/search/barcode/${barcode}`);
      return data;
    },
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: ['food', 'favorites'],
    queryFn: async () => {
      const { data } = await api.get('/food/favorites');
      return data.favorites;
    },
  });
}

export function useAddFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (food: any) => {
      const { data } = await api.post('/food/favorites', food);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['food', 'favorites'] }),
  });
}

export function useRecentFoods() {
  return useQuery({
    queryKey: ['food', 'recent'],
    queryFn: async () => {
      const { data } = await api.get('/food/recent');
      return data.recent;
    },
  });
}
