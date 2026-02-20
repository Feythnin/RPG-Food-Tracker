import { useState, useEffect, useMemo } from 'react';
import {
  useFoodLogs,
  useLogFood,
  useDeleteFood,
  useSearchUSDA,
  useSearchRecipe,
  useFavorites,
  useAddFavorite,
  useRecentFoods,
} from '../hooks/useFood';
import { useEvaluateTasks } from '../hooks/useGame';

// ---- Types ----

interface FoodEntry {
  id: number;
  mealType: string;
  foodName: string;
  servingSize?: string | null;
  servingQty: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  isFruit: boolean;
  isVegetable: boolean;
  barcode?: string | null;
  fdcId?: string | null;
  createdAt: string;
}

interface USDAFood {
  fdcId: string;
  description: string;
  brandOwner?: string;
  servingSize?: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
}

interface FavoriteFood {
  id: number;
  foodName: string;
  servingSize?: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  isFruit: boolean;
  isVegetable: boolean;
  barcode?: string | null;
  fdcId?: string | null;
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type ModalTab = 'manual' | 'usda' | 'recipe' | 'favorites' | 'recent';

const MEAL_TYPES: { key: MealType; label: string; icon: string }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { key: 'lunch', label: 'Lunch', icon: '☀️' },
  { key: 'dinner', label: 'Dinner', icon: '🌙' },
  { key: 'snack', label: 'Snacks', icon: '🍿' },
];

// ---- Helpers ----

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

interface FormState {
  foodName: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sodium: string;
  servingSize: string;
  servingQty: string;
  isFruit: boolean;
  isVegetable: boolean;
  // Base per-serving values (set when populating from search)
  baseCalories: number | null;
  baseProtein: number | null;
  baseCarbs: number | null;
  baseFat: number | null;
  baseFiber: number | null;
  baseSodium: number | null;
}

const emptyForm: FormState = {
  foodName: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  fiber: '',
  sodium: '',
  servingSize: '',
  servingQty: '1',
  isFruit: false,
  isVegetable: false,
  baseCalories: null,
  baseProtein: null,
  baseCarbs: null,
  baseFat: null,
  baseFiber: null,
  baseSodium: null,
};

// ---- Sub-components ----

function MealSection({
  meal,
  entries,
  onAdd,
  onDelete,
  onFavorite,
}: {
  meal: (typeof MEAL_TYPES)[number];
  entries: FoodEntry[];
  onAdd: () => void;
  onDelete: (id: number) => void;
  onFavorite: (entry: FoodEntry) => void;
}) {
  const [open, setOpen] = useState(true);
  const mealCals = entries.reduce((s, e) => s + e.calories, 0);

  return (
    <div className="rpg-card mb-3">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-hover/40 rounded-t-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{meal.icon}</span>
          <span className="font-semibold text-text-primary">{meal.label}</span>
          <span className="text-text-muted text-sm">({entries.length})</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-accent-gold font-medium text-sm">
            {mealCals} cal
          </span>
          <svg
            className={`w-4 h-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 pb-3">
          {entries.length === 0 && (
            <p className="text-text-muted text-sm py-2">No foods logged yet.</p>
          )}

          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between py-2 border-b border-bg-hover/30 last:border-0 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-text-primary text-sm font-medium truncate">
                    {entry.foodName}
                  </span>
                  {entry.isFruit && <span className="text-xs" title="Fruit">🍎</span>}
                  {entry.isVegetable && <span className="text-xs" title="Vegetable">🥦</span>}
                </div>
                <div className="flex gap-3 mt-0.5 text-xs text-text-muted">
                  <span className="text-accent-gold">{entry.calories} cal</span>
                  <span>P: {entry.protein}g</span>
                  <span>C: {entry.carbs}g</span>
                  <span>F: {entry.fat}g</span>
                  {entry.servingSize && (
                    <span className="text-text-muted">
                      {entry.servingQty > 1 ? `${entry.servingQty} x ` : ''}
                      {entry.servingSize}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onFavorite(entry)}
                  className="p-1.5 rounded hover:bg-bg-hover text-accent-gold/60 hover:text-accent-gold transition-colors"
                  title="Add to Favorites"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="p-1.5 rounded hover:bg-accent-red/20 text-text-muted hover:text-accent-red transition-colors"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={onAdd}
            className="mt-2 w-full py-2 rounded-lg border border-dashed border-accent-gold/30 text-accent-gold/70 hover:text-accent-gold hover:border-accent-gold/60 hover:bg-bg-hover/30 transition-colors text-sm font-medium"
          >
            + Add Food
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Add Food Modal ----

function AddFoodModal({
  mealType,
  date,
  onClose,
  onLogged,
}: {
  mealType: MealType;
  date: string;
  onClose: () => void;
  onLogged: () => void;
}) {
  const [tab, setTab] = useState<ModalTab>('manual');
  const [form, setForm] = useState({ ...emptyForm });
  const [usdaQuery, setUsdaQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recipeQuery, setRecipeQuery] = useState('');
  const [debouncedRecipeQuery, setDebouncedRecipeQuery] = useState('');

  const logFood = useLogFood();
  const evaluateTasks = useEvaluateTasks();
  const { data: usdaResults, isLoading: usdaLoading } = useSearchUSDA(debouncedQuery);
  const { data: recipeResults, isLoading: recipeLoading } = useSearchRecipe(debouncedRecipeQuery);
  const { data: favorites } = useFavorites();
  const { data: recentFoods } = useRecentFoods();

  // Debounce USDA search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(usdaQuery), 400);
    return () => clearTimeout(timer);
  }, [usdaQuery]);

  // Debounce recipe search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedRecipeQuery(recipeQuery), 400);
    return () => clearTimeout(timer);
  }, [recipeQuery]);

  function populateForm(food: {
    foodName?: string;
    description?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sodium?: number;
    servingSize?: string | null;
    isFruit?: boolean;
    isVegetable?: boolean;
  }) {
    const cal = food.calories ?? 0;
    const prot = food.protein ?? 0;
    const carb = food.carbs ?? 0;
    const f = food.fat ?? 0;
    const fib = food.fiber ?? 0;
    const sod = food.sodium ?? 0;
    setForm({
      foodName: food.foodName || food.description || '',
      calories: String(cal),
      protein: String(prot),
      carbs: String(carb),
      fat: String(f),
      fiber: String(fib),
      sodium: String(sod),
      servingSize: food.servingSize || '',
      servingQty: '1',
      isFruit: food.isFruit ?? false,
      isVegetable: food.isVegetable ?? false,
      baseCalories: cal,
      baseProtein: prot,
      baseCarbs: carb,
      baseFat: f,
      baseFiber: fib,
      baseSodium: sod,
    });
    setTab('manual');
  }

  function handleQtyChange(newQty: string) {
    const qty = parseFloat(newQty) || 0;
    const hasBase = form.baseCalories !== null;
    if (hasBase && qty > 0) {
      setForm({
        ...form,
        servingQty: newQty,
        calories: String(Math.round(form.baseCalories! * qty)),
        protein: String(Math.round(form.baseProtein! * qty * 10) / 10),
        carbs: String(Math.round(form.baseCarbs! * qty * 10) / 10),
        fat: String(Math.round(form.baseFat! * qty * 10) / 10),
        fiber: String(Math.round(form.baseFiber! * qty * 10) / 10),
        sodium: String(Math.round(form.baseSodium! * qty)),
      });
    } else {
      setForm({ ...form, servingQty: newQty });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.foodName || !form.calories) return;

    await logFood.mutateAsync({
      mealType,
      date,
      foodName: form.foodName,
      calories: parseInt(form.calories) || 0,
      protein: parseFloat(form.protein) || 0,
      carbs: parseFloat(form.carbs) || 0,
      fat: parseFloat(form.fat) || 0,
      fiber: parseFloat(form.fiber) || 0,
      sodium: parseFloat(form.sodium) || 0,
      servingSize: form.servingSize || undefined,
      servingQty: parseFloat(form.servingQty) || 1,
      isFruit: form.isFruit,
      isVegetable: form.isVegetable,
    });

    evaluateTasks.mutate();
    onLogged();
  }

  const mealLabel = MEAL_TYPES.find((m) => m.key === mealType)?.label ?? mealType;

  const tabs: { key: ModalTab; label: string }[] = [
    { key: 'manual', label: 'Manual' },
    { key: 'recipe', label: 'Recipe' },
    { key: 'usda', label: 'USDA' },
    { key: 'favorites', label: 'Favorites' },
    { key: 'recent', label: 'Recent' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-bg-secondary border border-accent-gold/20 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bg-hover/50">
          <h2 className="text-lg font-bold text-accent-gold">
            Add to {mealLabel}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-bg-hover/50">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'text-accent-gold border-b-2 border-accent-gold'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Manual entry form */}
          {tab === 'manual' && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-text-secondary text-sm mb-1">Food Name *</label>
                <input
                  type="text"
                  value={form.foodName}
                  onChange={(e) => setForm({ ...form, foodName: e.target.value })}
                  className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-gold/50"
                  placeholder="e.g. Grilled Chicken Breast"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-text-secondary text-sm mb-1">Serving Size</label>
                  <input
                    type="text"
                    value={form.servingSize}
                    onChange={(e) => setForm({ ...form, servingSize: e.target.value })}
                    className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-gold/50"
                    placeholder="e.g. 100g"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm mb-1">Servings</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={form.servingQty}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-gold/50"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm mb-1">Calories *</label>
                  <input
                    type="number"
                    value={form.calories}
                    onChange={(e) => setForm({ ...form, calories: e.target.value, baseCalories: null })}
                    className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-gold/50"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
              </div>
              {form.baseCalories !== null && (
                <p className="text-text-muted text-xs -mt-1">
                  {form.baseCalories} cal per serving &times; {form.servingQty} = {form.calories} cal
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary text-sm mb-1">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.protein}
                    onChange={(e) => setForm({ ...form, protein: e.target.value })}
                    className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-gold/50"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.carbs}
                    onChange={(e) => setForm({ ...form, carbs: e.target.value })}
                    className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-gold/50"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary text-sm mb-1">Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.fat}
                    onChange={(e) => setForm({ ...form, fat: e.target.value })}
                    className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-gold/50"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm mb-1">Fiber (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.fiber}
                    onChange={(e) => setForm({ ...form, fiber: e.target.value })}
                    className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-gold/50"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-1">Sodium (mg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.sodium}
                  onChange={(e) => setForm({ ...form, sodium: e.target.value })}
                  className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-gold/50"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="flex gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFruit}
                    onChange={(e) => setForm({ ...form, isFruit: e.target.checked })}
                    className="accent-accent-green w-4 h-4"
                  />
                  Fruit
                </label>
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isVegetable}
                    onChange={(e) => setForm({ ...form, isVegetable: e.target.checked })}
                    className="accent-accent-green w-4 h-4"
                  />
                  Vegetable
                </label>
              </div>

              <button
                type="submit"
                disabled={logFood.isPending || !form.foodName || !form.calories}
                className="w-full mt-2 py-2.5 rounded-lg bg-accent-gold text-bg-primary font-bold text-sm hover:bg-accent-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {logFood.isPending ? 'Logging...' : 'Log Food'}
              </button>
            </form>
          )}

          {/* USDA Search */}
          {tab === 'usda' && (
            <div>
              <input
                type="text"
                value={usdaQuery}
                onChange={(e) => setUsdaQuery(e.target.value)}
                className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-gold/50 mb-3"
                placeholder="Search USDA database..."
                autoFocus
              />
              {usdaLoading && (
                <p className="text-text-muted text-sm text-center py-4">Searching...</p>
              )}
              {!usdaLoading && usdaResults && usdaResults.length === 0 && debouncedQuery.length >= 2 && (
                <p className="text-text-muted text-sm text-center py-4">No results found.</p>
              )}
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {(usdaResults as USDAFood[] | undefined)?.map((food) => (
                  <button
                    key={food.fdcId}
                    onClick={() => populateForm(food)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-bg-hover/60 transition-colors"
                  >
                    <div className="text-text-primary text-sm font-medium truncate">
                      {food.description}
                    </div>
                    <div className="flex gap-3 text-xs text-text-muted mt-0.5">
                      <span className="text-accent-gold">{food.calories} cal</span>
                      <span>P: {food.protein}g</span>
                      <span>C: {food.carbs}g</span>
                      <span>F: {food.fat}g</span>
                      {food.servingSize && <span>{food.servingSize}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recipe Search (CalorieNinjas) */}
          {tab === 'recipe' && (
            <div>
              <input
                type="text"
                value={recipeQuery}
                onChange={(e) => setRecipeQuery(e.target.value)}
                className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-gold/50 mb-3"
                placeholder="e.g. eggs benedict, pad thai, burrito..."
                autoFocus
              />
              {recipeLoading && (
                <p className="text-text-muted text-sm text-center py-4">Searching...</p>
              )}
              {!recipeLoading && recipeResults && recipeResults.length === 0 && debouncedRecipeQuery.length >= 2 && (
                <p className="text-text-muted text-sm text-center py-4">No results found.</p>
              )}
              {!recipeLoading && debouncedRecipeQuery.length < 2 && (
                <p className="text-text-muted text-sm text-center py-4">
                  Search for prepared foods, dishes, and recipes.
                </p>
              )}
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {(recipeResults as USDAFood[] | undefined)?.map((food, i) => (
                  <button
                    key={`${food.description}-${i}`}
                    onClick={() => populateForm(food)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-bg-hover/60 transition-colors"
                  >
                    <div className="text-text-primary text-sm font-medium truncate capitalize">
                      {food.description}
                    </div>
                    <div className="flex gap-3 text-xs text-text-muted mt-0.5">
                      <span className="text-accent-gold">{food.calories} cal</span>
                      <span>P: {food.protein}g</span>
                      <span>C: {food.carbs}g</span>
                      <span>F: {food.fat}g</span>
                      {food.servingSize && <span>{food.servingSize}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Favorites */}
          {tab === 'favorites' && (
            <div>
              {(!favorites || (favorites as FavoriteFood[]).length === 0) ? (
                <p className="text-text-muted text-sm text-center py-8">
                  No favorites saved yet. Log foods and star them to add favorites.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-96 overflow-y-auto">
                  {(favorites as FavoriteFood[]).map((fav) => (
                    <button
                      key={fav.id}
                      onClick={() =>
                        populateForm({
                          foodName: fav.foodName,
                          calories: fav.calories,
                          protein: fav.protein,
                          carbs: fav.carbs,
                          fat: fav.fat,
                          fiber: fav.fiber,
                          sodium: fav.sodium,
                          servingSize: fav.servingSize,
                          isFruit: fav.isFruit,
                          isVegetable: fav.isVegetable,
                        })
                      }
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-bg-hover/60 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-accent-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-text-primary text-sm font-medium truncate">
                          {fav.foodName}
                        </span>
                      </div>
                      <div className="flex gap-3 text-xs text-text-muted mt-0.5 ml-5">
                        <span className="text-accent-gold">{fav.calories} cal</span>
                        <span>P: {fav.protein}g</span>
                        <span>C: {fav.carbs}g</span>
                        <span>F: {fav.fat}g</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent */}
          {tab === 'recent' && (
            <div>
              {(!recentFoods || (recentFoods as FoodEntry[]).length === 0) ? (
                <p className="text-text-muted text-sm text-center py-8">
                  No recent foods yet. Start logging to see your history here.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-96 overflow-y-auto">
                  {(recentFoods as FoodEntry[]).map((food) => (
                    <button
                      key={food.id}
                      onClick={() =>
                        populateForm({
                          foodName: food.foodName,
                          calories: food.calories,
                          protein: food.protein,
                          carbs: food.carbs,
                          fat: food.fat,
                          fiber: food.fiber,
                          sodium: food.sodium,
                          servingSize: food.servingSize,
                          isFruit: food.isFruit,
                          isVegetable: food.isVegetable,
                        })
                      }
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-bg-hover/60 transition-colors"
                    >
                      <div className="text-text-primary text-sm font-medium truncate">
                        {food.foodName}
                      </div>
                      <div className="flex gap-3 text-xs text-text-muted mt-0.5">
                        <span className="text-accent-gold">{food.calories} cal</span>
                        <span>P: {food.protein}g</span>
                        <span>C: {food.carbs}g</span>
                        <span>F: {food.fat}g</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Main Page ----

export default function FoodLog() {
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [addingMeal, setAddingMeal] = useState<MealType | null>(null);

  const { data, isLoading } = useFoodLogs(selectedDate);
  const deleteFood = useDeleteFood();
  const addFavorite = useAddFavorite();
  const evaluateTasks = useEvaluateTasks();

  const logs: FoodEntry[] = data?.logs ?? [];
  const summary = data?.summary ?? { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 };

  const logsByMeal = useMemo(() => {
    const grouped: Record<MealType, FoodEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const log of logs) {
      const key = log.mealType as MealType;
      if (grouped[key]) grouped[key].push(log);
    }
    return grouped;
  }, [logs]);

  function handleDelete(id: number) {
    deleteFood.mutate(id, {
      onSuccess: () => evaluateTasks.mutate(),
    });
  }

  function handleFavorite(entry: FoodEntry) {
    addFavorite.mutate({
      foodName: entry.foodName,
      servingSize: entry.servingSize,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      fiber: entry.fiber,
      sodium: entry.sodium,
      sugar: entry.sugar,
      isFruit: entry.isFruit,
      isVegetable: entry.isVegetable,
      barcode: entry.barcode,
      fdcId: entry.fdcId,
    });
  }

  function navigateDate(delta: number) {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  }

  const isToday = selectedDate === todayStr();

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Page Header */}
      <h1 className="text-2xl font-bold text-accent-gold mb-4">Food Log</h1>

      {/* Date Picker */}
      <div className="rpg-card flex items-center justify-between px-4 py-3 mb-4">
        <button
          onClick={() => navigateDate(-1)}
          className="p-1.5 rounded-lg hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={todayStr()}
            className="bg-transparent text-text-primary text-sm font-medium focus:outline-none cursor-pointer [color-scheme:dark]"
          />
          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayStr())}
              className="text-xs text-accent-blue hover:text-accent-blue/80 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={() => navigateDate(1)}
          disabled={isToday}
          className="p-1.5 rounded-lg hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12 text-text-muted">Loading food logs...</div>
      )}

      {/* Meal Sections */}
      {!isLoading &&
        MEAL_TYPES.map((meal) => (
          <MealSection
            key={meal.key}
            meal={meal}
            entries={logsByMeal[meal.key]}
            onAdd={() => setAddingMeal(meal.key)}
            onDelete={handleDelete}
            onFavorite={handleFavorite}
          />
        ))}

      {/* Daily Summary Bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 md:left-56 right-0 bg-bg-secondary/95 backdrop-blur-sm border-t border-accent-gold/20 px-4 py-3 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-accent-gold font-bold text-lg">{summary.calories}</span>
            <span className="text-text-muted text-xs">cal</span>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="text-accent-blue font-semibold">{summary.protein}g</div>
              <div className="text-text-muted text-xs">Protein</div>
            </div>
            <div className="text-center">
              <div className="text-accent-orange font-semibold">{summary.carbs}g</div>
              <div className="text-text-muted text-xs">Carbs</div>
            </div>
            <div className="text-center">
              <div className="text-accent-red font-semibold">{summary.fat}g</div>
              <div className="text-text-muted text-xs">Fat</div>
            </div>
            <div className="text-center hidden sm:block">
              <div className="text-accent-green font-semibold">{summary.fiber}g</div>
              <div className="text-text-muted text-xs">Fiber</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Food Modal */}
      {addingMeal && (
        <AddFoodModal
          mealType={addingMeal}
          date={selectedDate}
          onClose={() => setAddingMeal(null)}
          onLogged={() => setAddingMeal(null)}
        />
      )}
    </div>
  );
}
