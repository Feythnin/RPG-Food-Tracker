import { useState } from 'react';
import { useNutritionSummary, useWaterSummary, useWeightHistory } from '../hooks/useNutrition';
import { useFoodLogs } from '../hooks/useFood';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import api from '../lib/api';

type Period = 'day' | 'week' | 'month';

const MACRO_COLORS = ['#3498db', '#2ecc71', '#e67e22']; // protein, carbs, fat

function ProgressBar({
  label,
  current,
  goal,
  unit,
  color = '#f5c542',
}: {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color?: string;
}) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const isOver = current > goal && goal > 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className={isOver ? 'text-accent-red' : 'text-text-primary'}>
          {Math.round(current)} / {Math.round(goal)} {unit}
        </span>
      </div>
      <div className="w-full h-3 bg-bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: isOver ? '#e74c3c' : color,
          }}
        />
      </div>
    </div>
  );
}

export default function NutritionDashboard() {
  const [period, setPeriod] = useState<Period>('day');
  const [showWeighIn, setShowWeighIn] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [weighInStatus, setWeighInStatus] = useState<string | null>(null);
  const [weighInError, setWeighInError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const isSaturday = new Date().getDay() === 6;

  const { data: nutrition, isLoading: nutritionLoading } = useNutritionSummary(period, today);
  const { data: waterData } = useWaterSummary(period === 'day' ? 'week' : period, today);
  const { data: weightHistory, isLoading: weightLoading } = useWeightHistory();
  const { data: foodData } = useFoodLogs(today);

  // Compute today's water from food log data (foodData has todayWater) or water summary
  const todayWaterGlasses = waterData?.dailyData?.find(
    (d: { date: string; glasses: number }) => d.date === today,
  )?.glasses ?? 0;

  const handleWeighIn = async () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight < 50 || weight > 700) {
      setWeighInError('Enter a valid weight between 50 and 700 lbs');
      return;
    }
    try {
      setWeighInError(null);
      await api.post('/profile/weigh-in', { weight });
      setWeighInStatus('Weigh-in recorded!');
      setShowWeighIn(false);
      setWeightInput('');
      setTimeout(() => setWeighInStatus(null), 3000);
    } catch (err: any) {
      setWeighInError(err.response?.data?.error || 'Failed to record weigh-in');
    }
  };

  const periods: Period[] = ['day', 'week', 'month'];

  // Prepare macro pie data from totals
  const macroData = nutrition
    ? [
        { name: 'Protein', value: Math.round(nutrition.totals.protein), unit: 'g' },
        { name: 'Carbs', value: Math.round(nutrition.totals.carbs), unit: 'g' },
        { name: 'Fat', value: Math.round(nutrition.totals.fat), unit: 'g' },
      ]
    : [];

  // Format calorie trend chart data
  const calorieChartData = nutrition?.dailyData?.map(
    (d: { date: string; calories: number }) => ({
      date: d.date.slice(5), // MM-DD
      calories: d.calories,
    }),
  ) ?? [];

  // Format weight history chart data
  const weightChartData = (weightHistory ?? []).map(
    (w: { date: string; weight: number }) => ({
      date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: w.weight,
    }),
  );

  // Current day totals for progress bars
  const todayNutrition = period === 'day' ? nutrition?.totals : null;
  const dayCalories = todayNutrition?.calories ?? (foodData?.logs ?? []).reduce(
    (s: number, l: { calories: number }) => s + l.calories, 0,
  );
  const dayProtein = todayNutrition?.protein ?? (foodData?.logs ?? []).reduce(
    (s: number, l: { protein: number }) => s + l.protein, 0,
  );
  const dayFiber = todayNutrition?.fiber ?? (foodData?.logs ?? []).reduce(
    (s: number, l: { fiber: number }) => s + l.fiber, 0,
  );

  const goalCalories = nutrition?.goals?.dailyCalories ?? 2000;
  const goalProtein = nutrition?.goals?.dailyProtein ?? 150;
  const goalWaterOz = nutrition?.goals?.waterGoalOz ?? 64;
  const goalWaterGlasses = goalWaterOz / 8;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-accent-gold">Nutrition Analytics</h1>

        {/* Period Toggle */}
        <div className="flex gap-1 bg-bg-secondary rounded-lg p-1">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                period === p
                  ? 'bg-accent-gold text-bg-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Weigh-in status */}
      {weighInStatus && (
        <div className="rpg-card p-3 border-accent-green text-accent-green text-center text-sm">
          {weighInStatus}
        </div>
      )}

      {/* Progress Bars - Today's goals */}
      <div className="rpg-card p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Today's Progress</h2>
        <ProgressBar
          label="Calories"
          current={dayCalories}
          goal={goalCalories}
          unit="kcal"
          color="#f5c542"
        />
        <ProgressBar
          label="Protein"
          current={dayProtein}
          goal={goalProtein}
          unit="g"
          color="#3498db"
        />
        <ProgressBar
          label="Fiber"
          current={dayFiber}
          goal={25}
          unit="g"
          color="#2ecc71"
        />
        <ProgressBar
          label="Water"
          current={todayWaterGlasses}
          goal={goalWaterGlasses}
          unit="glasses"
          color="#3498db"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calorie Trend Chart */}
        <div className="rpg-card p-5">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Calorie Trend ({period})
          </h2>
          {nutritionLoading ? (
            <div className="h-64 flex items-center justify-center text-text-muted">Loading...</div>
          ) : calorieChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-text-muted">
              No data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={calorieChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis dataKey="date" stroke="#6c6f85" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6c6f85" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#16213e',
                    border: '1px solid rgba(245,197,66,0.2)',
                    borderRadius: '8px',
                    color: '#e8e6e3',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="#f5c542"
                  strokeWidth={2}
                  dot={{ fill: '#f5c542', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Macro Breakdown Pie Chart */}
        <div className="rpg-card p-5">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Macro Breakdown ({period})
          </h2>
          {nutritionLoading ? (
            <div className="h-64 flex items-center justify-center text-text-muted">Loading...</div>
          ) : macroData.every((m) => m.value === 0) ? (
            <div className="h-64 flex items-center justify-center text-text-muted">
              No data for this period
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}g`}
                  >
                    {macroData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={MACRO_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#16213e',
                      border: '1px solid rgba(245,197,66,0.2)',
                      borderRadius: '8px',
                      color: '#e8e6e3',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                {macroData.map((m, i) => (
                  <div key={m.name} className="flex items-center gap-1.5 text-sm">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: MACRO_COLORS[i] }}
                    />
                    <span className="text-text-secondary">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daily Averages */}
      {nutrition?.averages && (
        <div className="rpg-card p-5">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Daily Averages ({period})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { label: 'Calories', value: nutrition.averages.calories, unit: 'kcal', color: 'text-accent-gold' },
              { label: 'Protein', value: nutrition.averages.protein, unit: 'g', color: 'text-accent-blue' },
              { label: 'Carbs', value: nutrition.averages.carbs, unit: 'g', color: 'text-accent-green' },
              { label: 'Fat', value: nutrition.averages.fat, unit: 'g', color: 'text-accent-orange' },
              { label: 'Fiber', value: nutrition.averages.fiber, unit: 'g', color: 'text-accent-green' },
              { label: 'Sodium', value: nutrition.averages.sodium, unit: 'mg', color: 'text-accent-red' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-text-muted text-xs uppercase tracking-wide">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-text-muted text-xs">{stat.unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weight History Chart + Weigh-in */}
      <div className="rpg-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Weight History</h2>
          <button
            onClick={() => {
              setShowWeighIn(true);
              setWeighInError(null);
            }}
            disabled={!isSaturday}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isSaturday
                ? 'bg-accent-gold text-bg-primary hover:bg-yellow-400 cursor-pointer'
                : 'bg-bg-secondary text-text-muted cursor-not-allowed'
            }`}
            title={isSaturday ? 'Record your weekly weigh-in' : 'Weigh-ins are only available on Saturdays'}
          >
            {isSaturday ? 'Saturday Weigh-In' : 'Weigh-In (Saturdays Only)'}
          </button>
        </div>

        {weightLoading ? (
          <div className="h-64 flex items-center justify-center text-text-muted">Loading...</div>
        ) : weightChartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-text-muted">
            No weigh-in data yet. Record your first weigh-in on a Saturday!
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weightChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
              <XAxis dataKey="date" stroke="#6c6f85" tick={{ fontSize: 12 }} />
              <YAxis
                stroke="#6c6f85"
                tick={{ fontSize: 12 }}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#16213e',
                  border: '1px solid rgba(245,197,66,0.2)',
                  borderRadius: '8px',
                  color: '#e8e6e3',
                }}
                formatter={(value: number) => [`${value} lbs`, 'Weight']}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#9b59b6"
                strokeWidth={2}
                dot={{ fill: '#9b59b6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Weigh-in Modal */}
      {showWeighIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rpg-card p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-accent-gold mb-4">Saturday Weigh-In</h3>
            <p className="text-text-secondary text-sm mb-4">
              Enter your current weight to track your progress.
            </p>
            <div className="mb-4">
              <label className="block text-text-secondary text-sm mb-1">Weight (lbs)</label>
              <input
                type="number"
                step="0.1"
                min="50"
                max="700"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleWeighIn()}
                className="w-full px-3 py-2 bg-bg-secondary border border-bg-hover rounded-lg text-text-primary focus:outline-none focus:border-accent-gold"
                placeholder="e.g. 185.5"
                autoFocus
              />
              {weighInError && (
                <p className="text-accent-red text-sm mt-1">{weighInError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleWeighIn}
                className="flex-1 bg-accent-gold text-bg-primary py-2 rounded-lg font-medium hover:bg-yellow-400 transition-colors cursor-pointer"
              >
                Record
              </button>
              <button
                onClick={() => {
                  setShowWeighIn(false);
                  setWeightInput('');
                  setWeighInError(null);
                }}
                className="flex-1 bg-bg-secondary text-text-secondary py-2 rounded-lg font-medium hover:bg-bg-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
