// Mifflin-St Jeor TDEE calculation
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateTDEE(
  sex: string,
  weightLbs: number,
  heightInches: number,
  age: number,
  activityLevel: string
): number {
  const weightKg = weightLbs * 0.453592;
  const heightCm = heightInches * 2.54;

  // Mifflin-St Jeor
  let bmr: number;
  if (sex === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

export function calculateDailyCalories(
  tdee: number,
  mode: string,
  sex: string
): number {
  let calories: number;
  switch (mode) {
    case 'lose':
      calories = tdee - 500; // ~1lb/week deficit
      break;
    case 'gain':
      calories = tdee + 300; // lean bulk surplus
      break;
    default:
      calories = tdee;
  }

  // Floor enforcement
  const floor = sex === 'female' ? 1200 : 1500;
  return Math.max(calories, floor);
}

export function calculateProteinGoal(goalWeightLbs: number): number {
  // 0.8g per lb of goal weight
  return Math.round(goalWeightLbs * 0.8);
}
