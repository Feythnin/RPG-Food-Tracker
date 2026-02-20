import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useGameStore } from '../stores/gameStore';

export function useGameState() {
  const { setGameState } = useGameStore();
  return useQuery({
    queryKey: ['game', 'state'],
    queryFn: async () => {
      const { data } = await api.get('/game/state');
      setGameState(data.gameState);
      return data;
    },
  });
}

export function useEvaluateTasks() {
  const qc = useQueryClient();
  const { setGameState } = useGameStore();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/game/evaluate');
      return data;
    },
    onSuccess: (data) => {
      setGameState(data.gameState);
      qc.invalidateQueries({ queryKey: ['game'] });
    },
  });
}
