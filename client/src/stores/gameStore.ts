import { create } from 'zustand';

interface GameState {
  level: number;
  xp: number;
  xpToNext: number;
  health: number;
  maxHealth: number;
  coins: number;
  dungeonTier: number;
  enemyHp: number;
  enemyMaxHp: number;
  thirstMeter: number;
  setGameState: (state: Partial<GameState>) => void;
}

export const useGameStore = create<GameState>((set) => ({
  level: 1,
  xp: 0,
  xpToNext: 100,
  health: 7,
  maxHealth: 7,
  coins: 0,
  dungeonTier: 1,
  enemyHp: 5,
  enemyMaxHp: 5,
  thirstMeter: 0,
  setGameState: (partial) => set((state) => ({ ...state, ...partial })),
}));
