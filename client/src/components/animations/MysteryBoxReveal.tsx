import { useEffect, useState } from 'react';

interface MysteryBoxRevealProps {
  itemName: string;
  rarity: string;
  spriteColor: string;
  onClose: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#888888',
  uncommon: '#2ecc71',
  rare: '#3498db',
  legendary: '#f5c542',
};

export default function MysteryBoxReveal({ itemName, rarity, spriteColor, onClose }: MysteryBoxRevealProps) {
  const [phase, setPhase] = useState<'shaking' | 'opening' | 'reveal'>('shaking');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('opening'), 1200);
    const t2 = setTimeout(() => setPhase('reveal'), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const rarityColor = RARITY_COLORS[rarity] || '#888';

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={phase === 'reveal' ? onClose : undefined}>
      <div className="text-center">
        {phase === 'shaking' && (
          <div className="animate-shake">
            <div className="w-32 h-32 mx-auto rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 border-4 border-accent-gold flex items-center justify-center shadow-lg shadow-accent-gold/30">
              <span className="text-5xl">?</span>
            </div>
          </div>
        )}
        {phase === 'opening' && (
          <div className="animate-scale-up">
            <div className="w-40 h-40 mx-auto rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 border-4 border-white flex items-center justify-center shadow-xl shadow-white/30">
              <span className="text-6xl animate-spin-slow">&#10022;</span>
            </div>
          </div>
        )}
        {phase === 'reveal' && (
          <div className="animate-bounce-in">
            <div
              className="w-24 h-24 mx-auto rounded-lg mb-4 flex items-center justify-center"
              style={{ backgroundColor: spriteColor, boxShadow: `0 0 20px ${rarityColor}` }}
            >
              <span className="text-3xl text-white/80">&#9830;</span>
            </div>
            <p className="text-sm uppercase tracking-wider mb-1" style={{ color: rarityColor }}>
              {rarity}
            </p>
            <h3 className="text-2xl font-bold text-text-primary mb-4">{itemName}</h3>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-accent-gold text-bg-primary font-bold rounded-lg hover:opacity-90"
            >
              Collect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
