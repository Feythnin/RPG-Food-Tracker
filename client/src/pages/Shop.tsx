import { useState, useEffect } from 'react';
import { useShopItems, useBuyItem } from '../hooks/useShop';
import { useGameStore } from '../stores/gameStore';
import { useGameState } from '../hooks/useGame';

interface ShopItem {
  id: number;
  name: string;
  description: string;
  category: string;
  cost: number;
  effect: string | null;
  rarity: string;
  spriteColor: string;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#888',
  uncommon: '#2ecc71',
  rare: '#3498db',
  legendary: '#f5c542',
};

const CATEGORY_TABS = [
  { key: 'consumable', label: 'Consumables' },
  { key: 'cosmetic', label: 'Cosmetics' },
  { key: 'mystery_box', label: 'Mystery Boxes' },
] as const;

type RevealState =
  | { phase: 'idle' }
  | { phase: 'animating' }
  | { phase: 'revealed'; wonItem: ShopItem; rarity: string };

export default function Shop() {
  useGameState();
  const coins = useGameStore((s) => s.coins);
  const { data: items, isLoading } = useShopItems();
  const buyMutation = useBuyItem();

  const [activeTab, setActiveTab] = useState<string>('consumable');
  const [reveal, setReveal] = useState<RevealState>({ phase: 'idle' });

  // Auto-dismiss revealed item after some time or let user close it
  useEffect(() => {
    if (reveal.phase === 'revealed') {
      const timer = setTimeout(() => setReveal({ phase: 'idle' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [reveal]);

  const handleBuy = (item: ShopItem) => {
    if (item.category === 'mystery_box') {
      setReveal({ phase: 'animating' });
      buyMutation.mutate(item.id, {
        onSuccess: (data) => {
          // Short delay for the animation build-up
          setTimeout(() => {
            setReveal({
              phase: 'revealed',
              wonItem: data.wonItem,
              rarity: data.rarity,
            });
          }, 1200);
        },
        onError: () => {
          setReveal({ phase: 'idle' });
        },
      });
    } else {
      buyMutation.mutate(item.id);
    }
  };

  const filteredItems: ShopItem[] = (items ?? []).filter(
    (item: ShopItem) => item.category === activeTab
  );

  return (
    <div className="min-h-full">
      {/* Header with coins */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-accent-gold">Shop</h1>
        <div className="rpg-card px-4 py-2 flex items-center gap-2">
          <span className="text-coin text-lg">&#9679;</span>
          <span className="text-accent-gold font-bold text-lg">{coins}</span>
          <span className="text-text-muted text-sm">coins</span>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-6 bg-bg-secondary rounded-lg p-1">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-bg-hover text-accent-gold'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12 text-text-muted">
          Loading shop items...
        </div>
      )}

      {/* Item grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const rarityColor = RARITY_COLORS[item.rarity] ?? '#888';
            const canAfford = coins >= item.cost;

            return (
              <div
                key={item.id}
                className="rpg-card p-4 flex flex-col gap-3 hover:bg-bg-hover transition-colors"
              >
                {/* Sprite placeholder */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-14 h-14 rounded-lg shrink-0"
                    style={{
                      backgroundColor: item.spriteColor,
                      boxShadow: `0 0 12px ${item.spriteColor}40`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-text-primary font-semibold truncate">
                        {item.name}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 capitalize"
                        style={{
                          backgroundColor: `${rarityColor}20`,
                          color: rarityColor,
                          border: `1px solid ${rarityColor}40`,
                        }}
                      >
                        {item.rarity}
                      </span>
                    </div>
                    <p className="text-text-muted text-sm leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Cost and buy button */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-coin">&#9679;</span>
                    <span className="text-accent-gold font-bold">
                      {item.cost}
                    </span>
                  </div>
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford || buyMutation.isPending}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      canAfford
                        ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/40 hover:bg-accent-gold/30 hover:scale-105 active:scale-95'
                        : 'bg-bg-secondary text-text-muted border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    {buyMutation.isPending ? 'Buying...' : 'Buy'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredItems.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          No items available in this category.
        </div>
      )}

      {/* Mystery box reveal overlay */}
      {reveal.phase !== 'idle' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() =>
            reveal.phase === 'revealed' && setReveal({ phase: 'idle' })
          }
        >
          <div
            className="flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {reveal.phase === 'animating' && (
              <div className="mystery-box-animating">
                <div
                  className="w-24 h-24 rounded-xl"
                  style={{
                    backgroundColor: '#ffd700',
                    animation: 'mysteryPulse 0.6s ease-in-out infinite',
                  }}
                />
                <p className="text-accent-gold text-lg font-bold mt-4 animate-pulse">
                  Opening...
                </p>
              </div>
            )}

            {reveal.phase === 'revealed' && (
              <div
                className="flex flex-col items-center gap-4"
                style={{ animation: 'mysteryReveal 0.5s ease-out forwards' }}
              >
                <div
                  className="w-20 h-20 rounded-xl"
                  style={{
                    backgroundColor: reveal.wonItem.spriteColor,
                    boxShadow: `0 0 30px ${
                      RARITY_COLORS[reveal.rarity] ?? '#888'
                    }80, 0 0 60px ${
                      RARITY_COLORS[reveal.rarity] ?? '#888'
                    }40`,
                  }}
                />
                <div className="text-center">
                  <p className="text-text-primary font-bold text-xl">
                    {reveal.wonItem.name}
                  </p>
                  <p
                    className="text-sm font-medium capitalize mt-1"
                    style={{
                      color: RARITY_COLORS[reveal.rarity] ?? '#888',
                    }}
                  >
                    {reveal.rarity}
                  </p>
                  <p className="text-text-muted text-sm mt-2">
                    {reveal.wonItem.description}
                  </p>
                </div>
                <button
                  onClick={() => setReveal({ phase: 'idle' })}
                  className="mt-2 px-6 py-2 bg-accent-gold/20 text-accent-gold border border-accent-gold/40 rounded-md font-medium hover:bg-accent-gold/30 transition-colors"
                >
                  Awesome!
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS animations for mystery box */}
      <style>{`
        @keyframes mysteryPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
          50% { transform: scale(1.15); box-shadow: 0 0 40px rgba(255, 215, 0, 0.6); }
        }
        @keyframes mysteryReveal {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
