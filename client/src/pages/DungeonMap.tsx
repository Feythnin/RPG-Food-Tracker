import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useGameState } from '../hooks/useGame';

const TOTAL_LEVELS = 30;

interface TierConfig {
  name: string;
  label: string;
  range: [number, number];
  borderColor: string;
  bgAccent: string;
}

const TIERS: TierConfig[] = [
  {
    name: 'Dragon\'s Lair',
    label: 'Tier 3',
    range: [15, 30],
    borderColor: 'border-tier3',
    bgAccent: 'rgba(155, 89, 182, 0.15)',
  },
  {
    name: 'Crystal Caves',
    label: 'Tier 2',
    range: [7, 14],
    borderColor: 'border-tier2',
    bgAccent: 'rgba(52, 152, 219, 0.15)',
  },
  {
    name: 'Dark Forest',
    label: 'Tier 1',
    range: [1, 6],
    borderColor: 'border-tier1',
    bgAccent: 'rgba(46, 204, 113, 0.15)',
  },
];

function getTierForLevel(level: number): TierConfig {
  for (const tier of TIERS) {
    if (level >= tier.range[0] && level <= tier.range[1]) {
      return tier;
    }
  }
  return TIERS[2]; // fallback to tier 1
}

function getTierColor(level: number): string {
  if (level >= 15) return '#9b59b6';
  if (level >= 7) return '#3498db';
  return '#2ecc71';
}

function isBossLevel(level: number): boolean {
  return level % 5 === 0;
}

export default function DungeonMap() {
  useGameState();
  const currentLevel = useGameStore((s) => s.level);
  const currentLevelRef = useRef<HTMLDivElement>(null);

  // Scroll current level into view on mount
  useEffect(() => {
    if (currentLevelRef.current) {
      currentLevelRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLevel]);

  // Build levels array from top (30) to bottom (1) for rendering
  const levels = Array.from({ length: TOTAL_LEVELS }, (_, i) => TOTAL_LEVELS - i);

  // Group levels by tier for dividers
  const renderLevelNode = (level: number, index: number) => {
    const isCurrent = level === currentLevel;
    const isCompleted = level < currentLevel;
    const isBoss = isBossLevel(level);
    const tierColor = getTierColor(level);
    const isLocked = level > currentLevel;

    const nodeSize = isBoss ? 'w-16 h-16' : 'w-12 h-12';

    return (
      <div
        key={level}
        ref={isCurrent ? currentLevelRef : undefined}
        className="flex items-center gap-4"
      >
        {/* Level number label */}
        <div className="w-8 text-right shrink-0">
          <span
            className={`text-sm font-mono ${
              isCurrent
                ? 'text-accent-gold font-bold'
                : isCompleted
                ? 'text-text-secondary'
                : 'text-text-muted'
            }`}
          >
            {level}
          </span>
        </div>

        {/* Node */}
        <div className="flex flex-col items-center">
          <div
            className={`${nodeSize} rounded-xl flex items-center justify-center text-lg font-bold transition-all relative ${
              isLocked ? 'opacity-40' : ''
            }`}
            style={{
              backgroundColor: isCompleted
                ? `${tierColor}30`
                : isCurrent
                ? `${tierColor}40`
                : 'rgba(255,255,255,0.05)',
              border: isCurrent
                ? '2px solid #f5c542'
                : isCompleted
                ? `2px solid ${tierColor}80`
                : '2px solid rgba(255,255,255,0.1)',
              boxShadow: isCurrent
                ? '0 0 16px rgba(245, 197, 66, 0.4), 0 0 32px rgba(245, 197, 66, 0.15)'
                : isBoss && !isLocked
                ? `0 0 12px ${tierColor}30`
                : 'none',
              animation: isCurrent ? 'dungeonPulse 2s ease-in-out infinite' : 'none',
            }}
          >
            {isCompleted ? (
              <span className="text-accent-green text-xl">&#10003;</span>
            ) : isBoss ? (
              <span
                className="text-xl"
                style={{ color: isLocked ? '#6c6f85' : '#e74c3c' }}
              >
                &#9760;
              </span>
            ) : isCurrent ? (
              <span className="text-accent-gold text-base">&#9733;</span>
            ) : (
              <span className="text-text-muted text-xs">&#9679;</span>
            )}
          </div>

          {/* Connecting line to next node (skip last in render order, which is level 1) */}
          {index < levels.length - 1 && (
            <div
              className="w-0.5 h-6"
              style={{
                backgroundColor:
                  isCompleted || isCurrent
                    ? `${tierColor}60`
                    : 'rgba(255,255,255,0.1)',
              }}
            />
          )}
        </div>

        {/* Level info */}
        <div className="flex-1 min-w-0">
          {isBoss && (
            <span
              className={`text-xs font-semibold uppercase tracking-wide ${
                isLocked ? 'text-text-muted' : 'text-boss'
              }`}
            >
              Boss
            </span>
          )}
          {isCurrent && (
            <span className="text-xs font-semibold text-accent-gold uppercase tracking-wide">
              Current
            </span>
          )}
        </div>
      </div>
    );
  };

  // Build grouped render with tier dividers
  const renderContent = () => {
    const elements: React.ReactNode[] = [];
    let currentTierIndex = -1;

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const tier = getTierForLevel(level);
      const tierIdx = TIERS.indexOf(tier);

      // Insert tier divider when entering a new tier
      if (tierIdx !== currentTierIndex) {
        currentTierIndex = tierIdx;

        elements.push(
          <div
            key={`tier-${tierIdx}`}
            className={`flex items-center gap-3 my-4 py-3 px-4 rounded-lg border-l-4 ${tier.borderColor}`}
            style={{ backgroundColor: tier.bgAccent }}
          >
            <div className="flex-1">
              <p
                className="text-sm font-bold"
                style={{ color: getTierColor(tier.range[0]) }}
              >
                {tier.name}
              </p>
              <p className="text-text-muted text-xs">
                {tier.label} &middot; Levels {tier.range[0]}-{tier.range[1]}
              </p>
            </div>
          </div>
        );
      }

      elements.push(renderLevelNode(level, i));
    }

    return elements;
  };

  return (
    <div className="min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-accent-gold">Dungeon Map</h1>
        <div className="rpg-card px-4 py-2">
          <span className="text-text-secondary text-sm">Level </span>
          <span className="text-accent-gold font-bold text-lg">
            {currentLevel}
          </span>
          <span className="text-text-muted text-sm"> / {TOTAL_LEVELS}</span>
        </div>
      </div>

      {/* Map container */}
      <div className="rpg-card p-6 max-w-lg mx-auto">
        <div className="flex flex-col">{renderContent()}</div>
      </div>

      {/* Pulse animation for current level */}
      <style>{`
        @keyframes dungeonPulse {
          0%, 100% { box-shadow: 0 0 16px rgba(245, 197, 66, 0.4), 0 0 32px rgba(245, 197, 66, 0.15); }
          50% { box-shadow: 0 0 24px rgba(245, 197, 66, 0.6), 0 0 48px rgba(245, 197, 66, 0.25); }
        }
      `}</style>
    </div>
  );
}
