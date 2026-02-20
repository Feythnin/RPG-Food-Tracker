import { useEffect, useState } from 'react';

interface FloatingTextProps {
  text: string;
  color?: string;
  onComplete?: () => void;
}

export default function FloatingText({ text, color = '#f5c542', onComplete }: FloatingTextProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 font-bold text-lg animate-float-up"
      style={{ color, left: '50%', top: '40%', transform: 'translateX(-50%)' }}
    >
      {text}
    </div>
  );
}
