import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useShopItems() {
  return useQuery({
    queryKey: ['shop', 'items'],
    queryFn: async () => {
      const { data } = await api.get('/shop/items');
      return data.items;
    },
  });
}

export function useBuyItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: number) => {
      const { data } = await api.post(`/shop/buy/${itemId}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop'] });
      qc.invalidateQueries({ queryKey: ['game'] });
    },
  });
}

export function useInventory() {
  return useQuery({
    queryKey: ['shop', 'inventory'],
    queryFn: async () => {
      const { data } = await api.get('/shop/inventory');
      return data.items;
    },
  });
}

export function useUseItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inventoryId: number) => {
      const { data } = await api.post(`/shop/use/${inventoryId}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop'] });
      qc.invalidateQueries({ queryKey: ['game'] });
    },
  });
}

export function useEquipItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inventoryId: number) => {
      const { data } = await api.post(`/shop/equip/${inventoryId}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop'] });
    },
  });
}
