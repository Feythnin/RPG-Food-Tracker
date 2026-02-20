import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGameState, useEvaluateTasks } from '../hooks/useGame';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';

const ENEMY_NAMES: Record<number, string[]> = {
  1: ['Snack Goblin', 'Soda Slime', 'Couch Imp', 'Chip Rat', 'Candy Bat'],
  2: ['Grease Ogre', 'Sugar Wraith', 'Fast-Food Golem', 'Binge Specter', 'Junk Troll'],
  3: ['Calorie Dragon', 'The Binge King', 'Sloth Lich', 'Gluttony Hydra', 'The Final Craving'],
};

function getEnemyName(tier: number, level: number): string {
  const names = ENEMY_NAMES[tier] || ENEMY_NAMES[1];
  return names[level % names.length];
}

function getTierLabel(tier: number): string {
  switch (tier) {
    case 1: return 'Green Dungeon';
    case 2: return 'Blue Dungeon';
    case 3: return 'Purple Dungeon';
    default: return 'Dungeon';
  }
}

function getTierColor(tier: number): string {
  switch (tier) {
    case 1: return 'text-tier1';
    case 2: return 'text-tier2';
    case 3: return 'text-tier3';
    default: return 'text-tier1';
  }
}

function getEnemyBgColor(tier: number): string {
  switch (tier) {
    case 1: return 'bg-tier1/40';
    case 2: return 'bg-tier2/40';
    case 3: return 'bg-tier3/40';
    default: return 'bg-tier1/40';
  }
}

interface Task {
  id: number;
  taskType: string;
  description: string;
  completed: boolean;
  xpReward: number;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const gameState = useGameStore();
  const { data, isLoading, error } = useGameState();
  const evaluateTasks = useEvaluateTasks();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(0);

  const tasks: Task[] = data?.tasks || [];

  // Evaluate tasks on load
  useEffect(() => {
    if (data && !evaluateTasks.isPending) {
      evaluateTasks.mutate(undefined, {
        onSuccess: (result) => {
          if (result.combat?.leveledUp) {
            setLevelUpLevel(result.combat.newLevel || gameState.level);
            setShowLevelUp(true);
          }
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.tasks?.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-text-muted text-lg">Loading quest board...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-accent-red text-lg">Failed to load game state. Please refresh.</div>
      </div>
    );
  }

  const xpPercent = gameState.xpToNext > 0 ? (gameState.xp / gameState.xpToNext) * 100 : 0;
  const enemyHpPercent =
    gameState.enemyMaxHp > 0 ? (gameState.enemyHp / gameState.enemyMaxHp) * 100 : 0;
  const hydrationLevel = 7 - gameState.thirstMeter; // 7 = fully hydrated, 0 = dehydrated

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Top row: Character panel + Enemy panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Character Panel */}
        <div className="rpg-card p-5">
          <div className="flex items-start gap-4">
            {/* Avatar placeholder */}
            <div className="w-20 h-20 rounded-lg bg-accent-purple/30 border-2 border-accent-purple/50 flex items-center justify-center shrink-0">
              <span className="text-3xl text-accent-purple font-bold">
                {user?.username?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              {/* Username + Level */}
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-text-primary truncate">
                  {user?.username || 'Adventurer'}
                </h2>
                <span className="shrink-0 px-2 py-0.5 bg-accent-gold/20 border border-accent-gold/40 rounded text-accent-gold text-xs font-bold">
                  LVL {gameState.level}
                </span>
              </div>

              {/* XP Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-text-muted">XP</span>
                  <span className="text-xp">
                    {gameState.xp} / {gameState.xpToNext}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-bg-primary rounded-full overflow-hidden">
                  <div
                    className="xp-bar h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(xpPercent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Health Hearts */}
              <div className="flex items-center gap-1 mb-2">
                <span className="text-text-muted text-xs mr-1">HP</span>
                {Array.from({ length: gameState.maxHealth }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-sm ${
                      i < gameState.health ? 'health-heart' : 'text-bg-hover opacity-50'
                    }`}
                  >
                    {i < gameState.health ? '\u2764' : '\u2661'}
                  </span>
                ))}
              </div>

              {/* Coins */}
              <div className="flex items-center gap-1">
                <span className="text-coin text-sm">{'\u26C1'}</span>
                <span className="text-coin font-bold text-sm">{gameState.coins}</span>
                <span className="text-text-muted text-xs ml-1">coins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enemy Battle Panel */}
        <div className="rpg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className={`text-xs font-bold uppercase ${getTierColor(gameState.dungeonTier)}`}>
                {getTierLabel(gameState.dungeonTier)}
              </span>
            </div>
            <span className="text-text-muted text-xs">Tier {gameState.dungeonTier}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Enemy sprite placeholder */}
            <div
              className={`w-20 h-20 rounded-lg ${getEnemyBgColor(
                gameState.dungeonTier
              )} border-2 border-accent-red/30 flex items-center justify-center shrink-0`}
            >
              <span className="text-3xl">
                {gameState.dungeonTier === 1
                  ? '\uD83D\uDC7E'
                  : gameState.dungeonTier === 2
                  ? '\uD83D\uDC79'
                  : '\uD83D\uDC32'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-text-primary truncate mb-1">
                {getEnemyName(gameState.dungeonTier, gameState.level)}
              </h3>

              {/* Enemy HP Bar */}
              <div className="mb-1">
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-text-muted">HP</span>
                  <span className="text-health">
                    {gameState.enemyHp} / {gameState.enemyMaxHp}
                  </span>
                </div>
                <div className="w-full h-3 bg-bg-primary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-health"
                    style={{
                      width: `${Math.min(enemyHpPercent, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <p className="text-text-muted text-xs">
                Complete daily tasks to deal damage!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle row: Task list + Thirst meter */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
        {/* Daily Tasks */}
        <div className="rpg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-accent-gold">Daily Quests</h2>
            <span className="text-text-muted text-sm">
              {tasks.filter((t) => t.completed).length} / {tasks.length} complete
            </span>
          </div>

          {tasks.length === 0 ? (
            <p className="text-text-muted text-sm py-4 text-center">
              No quests available. Log some food to get started!
            </p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                    task.completed
                      ? 'bg-accent-green/10 border-accent-green/30'
                      : 'bg-bg-secondary border-accent-gold/10'
                  }`}
                >
                  {/* Checkbox display (read-only) */}
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      task.completed
                        ? 'bg-accent-green border-accent-green text-bg-primary'
                        : 'border-text-muted'
                    }`}
                  >
                    {task.completed && (
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  <span
                    className={`flex-1 text-sm ${
                      task.completed ? 'text-text-secondary line-through' : 'text-text-primary'
                    }`}
                  >
                    {task.description}
                  </span>

                  <span className="text-xp text-xs font-bold shrink-0">
                    +{task.xpReward} XP
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Thirst Meter */}
        <div className="rpg-card p-5 lg:w-28">
          <h3 className="text-xs font-bold text-accent-blue text-center mb-3 uppercase tracking-wider">
            Hydration
          </h3>
          <div className="flex flex-col items-center gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => {
              const sectionIndex = 6 - i; // top = index 6, bottom = index 0
              const filled = sectionIndex < hydrationLevel;
              return (
                <div
                  key={i}
                  className={`w-10 h-6 rounded-sm border transition-colors ${
                    filled
                      ? 'bg-accent-blue/60 border-accent-blue/80'
                      : 'bg-bg-primary border-accent-gold/10'
                  }`}
                />
              );
            })}
          </div>
          <p className="text-text-muted text-xs text-center mt-2">
            {hydrationLevel >= 7
              ? 'Full!'
              : hydrationLevel >= 4
              ? 'Good'
              : hydrationLevel >= 2
              ? 'Low'
              : 'Dry!'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/food"
          className="rpg-card p-4 flex items-center gap-3 hover:bg-bg-hover transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-accent-green/20 flex items-center justify-center shrink-0 group-hover:bg-accent-green/30 transition-colors">
            <span className="text-lg text-accent-green">{'\uD83C\uDF56'}</span>
          </div>
          <div>
            <div className="text-text-primary font-bold text-sm">Log Food</div>
            <div className="text-text-muted text-xs">Track your meals</div>
          </div>
        </Link>

        <Link
          to="/water"
          className="rpg-card p-4 flex items-center gap-3 hover:bg-bg-hover transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-accent-blue/20 flex items-center justify-center shrink-0 group-hover:bg-accent-blue/30 transition-colors">
            <span className="text-lg text-accent-blue">{'\uD83D\uDCA7'}</span>
          </div>
          <div>
            <div className="text-text-primary font-bold text-sm">Log Water</div>
            <div className="text-text-muted text-xs">Stay hydrated</div>
          </div>
        </Link>

        <Link
          to="/shop"
          className="rpg-card p-4 flex items-center gap-3 hover:bg-bg-hover transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-accent-gold/20 flex items-center justify-center shrink-0 group-hover:bg-accent-gold/30 transition-colors">
            <span className="text-lg text-accent-gold">{'\uD83D\uDED2'}</span>
          </div>
          <div>
            <div className="text-text-primary font-bold text-sm">Open Shop</div>
            <div className="text-text-muted text-xs">Spend your coins</div>
          </div>
        </Link>
      </div>

      {/* Level Up Modal */}
      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="rpg-card p-8 max-w-sm w-full mx-4 text-center rpg-border animate-pulse">
            <div className="text-5xl mb-4">{'\u2B50'}</div>
            <h2 className="text-2xl font-bold text-accent-gold mb-2">Level Up!</h2>
            <p className="text-text-primary text-lg mb-1">
              You reached{' '}
              <span className="text-accent-gold font-bold">Level {levelUpLevel}</span>
            </p>
            <p className="text-text-muted text-sm mb-6">
              Your power grows stronger. New challenges await!
            </p>
            <button
              onClick={() => setShowLevelUp(false)}
              className="px-8 py-2 rounded-lg bg-accent-gold text-bg-primary font-bold hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
