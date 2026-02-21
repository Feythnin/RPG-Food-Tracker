import { useState, useEffect, useCallback } from 'react';
import { useWaterLogs, useLogWater, useDeleteWater } from '../hooks/useWater';
import { useEvaluateTasks } from '../hooks/useGame';
import { getLocalDateStr } from '../lib/dates';

// ---- Types ----

interface WaterEntry {
  id: number;
  glasses: number;
  createdAt: string;
}

interface WaterData {
  logs: WaterEntry[];
  totalGlasses: number;
  goalGlasses: number;
  totalOz: number;
  goalOz: number;
}

// ---- Helpers ----

function todayStr(): string {
  return getLocalDateStr();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// ---- XP Toast ----

function XPToast({ xp, visible }: { xp: number; visible: boolean }) {
  return (
    <div
      className={`fixed top-6 right-6 z-50 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
    >
      <div className="bg-bg-card border border-accent-gold/40 rounded-xl px-5 py-3 shadow-lg shadow-accent-gold/10 flex items-center gap-3">
        <span className="text-2xl">+{xp}</span>
        <div>
          <div className="text-accent-gold font-bold text-sm">XP Gained!</div>
          <div className="text-text-muted text-xs">Keep hydrating, adventurer</div>
        </div>
      </div>
    </div>
  );
}

// ---- Glass Grid ----

function GlassGrid({ filled, goal }: { filled: number; goal: number }) {
  const glasses = Array.from({ length: goal }, (_, i) => i < filled);

  return (
    <div className="flex flex-wrap justify-center gap-3 py-4">
      {glasses.map((isFilled, i) => (
        <div key={i} className="relative" title={`Glass ${i + 1}`}>
          <svg
            className={`w-12 h-14 transition-colors duration-300 ${
              isFilled ? 'text-accent-blue' : 'text-bg-hover'
            }`}
            viewBox="0 0 48 56"
            fill="none"
          >
            {/* Glass outline */}
            <path
              d="M8 4h32l-4 48H12L8 4z"
              stroke="currentColor"
              strokeWidth="2"
              fill={isFilled ? 'currentColor' : 'none'}
              opacity={isFilled ? 0.25 : 1}
            />
            {/* Water fill */}
            {isFilled && (
              <path
                d="M11 16h26l-3 32H14l-3-32z"
                fill="currentColor"
                opacity="0.8"
              />
            )}
            {/* Glass rim highlight */}
            <path d="M10 4h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          </svg>
          {isFilled && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-xs font-bold drop-shadow-md">{i + 1}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---- Progress Ring ----

function ProgressRing({ current, goal }: { current: number; goal: number }) {
  const pct = Math.min(current / goal, 1);
  const radius = 70;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - pct * circumference;
  const isComplete = current >= goal;

  return (
    <div className="relative flex items-center justify-center my-4">
      <svg width="180" height="180" className="-rotate-90">
        {/* Background circle */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-bg-hover"
          strokeWidth={stroke}
        />
        {/* Progress arc */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="currentColor"
          className={isComplete ? 'text-accent-green' : 'text-accent-blue'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-text-primary">{current}</span>
        <span className="text-text-muted text-sm">of {goal} glasses</span>
        <span className="text-text-muted text-xs mt-0.5">{current * 8} / {goal * 8} oz</span>
        {isComplete && (
          <span className="text-accent-green text-xs font-bold mt-1">Goal Complete!</span>
        )}
      </div>
    </div>
  );
}

// ---- Main Page ----

export default function WaterLog() {
  const [xpToast, setXpToast] = useState<{ amount: number; visible: boolean }>({ amount: 0, visible: false });

  const { data, isLoading } = useWaterLogs(todayStr());
  const logWater = useLogWater();
  const deleteWater = useDeleteWater();
  const evaluateTasks = useEvaluateTasks();

  const waterData: WaterData = data ?? {
    logs: [],
    totalGlasses: 0,
    goalGlasses: 8,
    totalOz: 0,
    goalOz: 64,
  };

  const { logs, totalGlasses, goalGlasses } = waterData;

  const showXP = useCallback((amount: number) => {
    setXpToast({ amount, visible: true });
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (!xpToast.visible) return;
    const timer = setTimeout(() => setXpToast((prev) => ({ ...prev, visible: false })), 2500);
    return () => clearTimeout(timer);
  }, [xpToast.visible]);

  function handleLog(glasses: number) {
    logWater.mutate(
      { glasses, date: todayStr() },
      {
        onSuccess: (resp: any) => {
          const xp = resp?.xpGained ?? glasses * 20;
          showXP(xp);
          evaluateTasks.mutate();
        },
      }
    );
  }

  function handleDelete(id: number) {
    deleteWater.mutate(id, {
      onSuccess: () => evaluateTasks.mutate(),
    });
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* XP Toast */}
      <XPToast xp={xpToast.amount} visible={xpToast.visible} />

      {/* Header */}
      <h1 className="text-2xl font-bold text-accent-gold mb-4">Water Tracker</h1>

      {isLoading ? (
        <div className="text-center py-12 text-text-muted">Loading water logs...</div>
      ) : (
        <>
          {/* Progress Ring */}
          <div className="rpg-card p-4 mb-4">
            <ProgressRing current={totalGlasses} goal={goalGlasses} />

            {/* Glass Grid */}
            <GlassGrid filled={totalGlasses} goal={goalGlasses} />
          </div>

          {/* Quick-Add Buttons */}
          <div className="rpg-card p-4 mb-4">
            <p className="text-text-secondary text-sm mb-3 text-center">
              Log your water intake (1 glass = 8 oz)
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleLog(1)}
                disabled={logWater.isPending}
                className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-accent-blue/20 border-2 border-accent-blue/40 hover:border-accent-blue hover:bg-accent-blue/30 text-accent-blue transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-2xl font-bold">+1</span>
                <span className="text-xs mt-0.5 opacity-80">glass</span>
              </button>

              <button
                onClick={() => handleLog(2)}
                disabled={logWater.isPending}
                className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-accent-blue/20 border-2 border-accent-blue/40 hover:border-accent-blue hover:bg-accent-blue/30 text-accent-blue transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-2xl font-bold">+2</span>
                <span className="text-xs mt-0.5 opacity-80">glasses</span>
              </button>

              <button
                onClick={() => handleLog(3)}
                disabled={logWater.isPending}
                className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-accent-blue/20 border-2 border-accent-blue/40 hover:border-accent-blue hover:bg-accent-blue/30 text-accent-blue transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-2xl font-bold">+3</span>
                <span className="text-xs mt-0.5 opacity-80">glasses</span>
              </button>
            </div>

            <p className="text-text-muted text-xs text-center mt-3">
              +20 XP per glass logged
            </p>
          </div>

          {/* Today's Log History */}
          <div className="rpg-card p-4">
            <h2 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
              <span>Today's Log</span>
              <span className="text-text-muted text-sm font-normal">
                ({logs.length} {logs.length === 1 ? 'entry' : 'entries'})
              </span>
            </h2>

            {logs.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-4">
                No water logged today. Start drinking, adventurer!
              </p>
            ) : (
              <div className="space-y-1">
                {(logs as WaterEntry[]).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-bg-hover/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-accent-blue" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-text-primary text-sm font-medium">
                          {entry.glasses} {entry.glasses === 1 ? 'glass' : 'glasses'}
                          <span className="text-text-muted font-normal"> ({entry.glasses * 8} oz)</span>
                        </div>
                        <div className="text-text-muted text-xs">
                          {formatTime(entry.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-accent-gold text-xs font-medium">
                        +{entry.glasses * 20} XP
                      </span>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-accent-red/20 text-text-muted hover:text-accent-red transition-all"
                        title="Delete entry"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
