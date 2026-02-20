import { useEffect, useState } from 'react';

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

export default function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`rpg-border rpg-card p-8 text-center transition-all duration-500 ${
          show ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="animate-pulse-glow mb-4">
          <div className="w-24 h-24 mx-auto rounded-full bg-accent-gold/20 flex items-center justify-center">
            <span className="text-5xl">&#9733;</span>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-accent-gold mb-2 animate-bounce-in">Level Up!</h2>
        <p className="text-xl text-text-primary mb-1">You reached</p>
        <p className="text-4xl font-bold text-accent-gold mb-4">Level {level}</p>
        <div className="text-text-secondary text-sm mb-6">
          New challenges await in the dungeon...
        </div>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-accent-gold text-bg-primary font-bold rounded-lg hover:opacity-90 transition-opacity"
        >
          Continue Quest
        </button>
      </div>
    </div>
  );
}
