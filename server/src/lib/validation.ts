import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(8).max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const profileSetupSchema = z.object({
  mode: z.enum(['lose', 'gain', 'maintain']),
  sex: z.enum(['male', 'female']),
  heightInches: z.number().int().min(48).max(96),
  currentWeight: z.number().min(50).max(700),
  goalWeight: z.number().min(50).max(700),
  age: z.number().int().min(13).max(120),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  waterGoalOz: z.number().int().min(32).max(256).optional(),
});

export const foodLogSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  foodName: z.string().min(1).max(200),
  servingSize: z.string().optional(),
  servingQty: z.number().min(0.1).max(100).optional(),
  calories: z.number().int().min(0).max(10000),
  protein: z.number().min(0).max(1000).optional(),
  carbs: z.number().min(0).max(1000).optional(),
  fat: z.number().min(0).max(1000).optional(),
  fiber: z.number().min(0).max(200).optional(),
  sodium: z.number().min(0).max(50000).optional(),
  sugar: z.number().min(0).max(1000).optional(),
  isFruit: z.boolean().optional(),
  isVegetable: z.boolean().optional(),
  barcode: z.string().optional(),
  fdcId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
});

export const waterLogSchema = z.object({
  glasses: z.number().int().min(1).max(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
});

export const weighInSchema = z.object({
  weight: z.number().min(50).max(700),
});

export const favoriteFoodSchema = z.object({
  foodName: z.string().min(1).max(200),
  servingSize: z.string().max(100).optional(),
  calories: z.number().int().min(0).max(10000),
  protein: z.number().min(0).max(1000).optional().default(0),
  carbs: z.number().min(0).max(1000).optional().default(0),
  fat: z.number().min(0).max(1000).optional().default(0),
  fiber: z.number().min(0).max(200).optional().default(0),
  sodium: z.number().min(0).max(50000).optional().default(0),
  sugar: z.number().min(0).max(1000).optional().default(0),
  isFruit: z.boolean().optional().default(false),
  isVegetable: z.boolean().optional().default(false),
  barcode: z.string().max(50).optional(),
  fdcId: z.string().max(50).optional(),
});

export const dateQuerySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const periodSchema = z.enum(['day', 'week', 'month']);

export const barcodeSchema = z.string().regex(/^[0-9]{8,14}$/, 'Invalid barcode format');

export const usdaQuerySchema = z.string().min(2).max(100);

export const shopEffectSchema = z.object({
  type: z.enum(['heal', 'xp', 'shield', 'double_coins', 'mystery', 'cosmetic']).optional(),
  amount: z.number().optional(),
  slot: z.string().optional(),
  color: z.string().optional(),
  pool: z.array(z.string()).optional(),
  weights: z.array(z.number()).optional(),
  duration: z.string().optional(),
});
