import { Router, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { profileSetupSchema, weighInSchema } from '../lib/validation';
import { calculateTDEE, calculateDailyCalories, calculateProteinGoal } from '../lib/calories';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Complete profile setup
router.post('/setup', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = profileSetupSchema.parse(req.body);
    const tdee = calculateTDEE(data.sex, data.currentWeight, data.heightInches, data.age, data.activityLevel);
    const dailyCalories = calculateDailyCalories(tdee, data.mode, data.sex);
    const dailyProtein = calculateProteinGoal(data.goalWeight);

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: {
        ...data,
        dailyCalories,
        dailyProtein,
        setupComplete: true,
      },
      select: {
        id: true, username: true, setupComplete: true,
        mode: true, sex: true, heightInches: true, currentWeight: true,
        goalWeight: true, age: true, activityLevel: true,
        dailyCalories: true, dailyProtein: true, waterGoalOz: true,
      },
    });

    res.json({ user, tdee, dailyCalories, dailyProtein });
  } catch (err) { next(err); }
});

// Get profile
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true, username: true, setupComplete: true,
        mode: true, sex: true, heightInches: true, currentWeight: true,
        goalWeight: true, age: true, activityLevel: true,
        dailyCalories: true, dailyProtein: true, waterGoalOz: true,
      },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json({ user });
  } catch (err) { next(err); }
});

// Update profile
router.put('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = profileSetupSchema.parse(req.body);
    const tdee = calculateTDEE(data.sex, data.currentWeight, data.heightInches, data.age, data.activityLevel);
    const dailyCalories = calculateDailyCalories(tdee, data.mode, data.sex);
    const dailyProtein = calculateProteinGoal(data.goalWeight);

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: { ...data, dailyCalories, dailyProtein },
      select: {
        id: true, username: true, setupComplete: true,
        mode: true, sex: true, heightInches: true, currentWeight: true,
        goalWeight: true, age: true, activityLevel: true,
        dailyCalories: true, dailyProtein: true, waterGoalOz: true,
      },
    });

    res.json({ user, tdee, dailyCalories, dailyProtein });
  } catch (err) { next(err); }
});

// Weigh-in (Saturday only)
router.post('/weigh-in', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { weight } = weighInSchema.parse(req.body);
    const today = new Date();

    if (today.getUTCDay() !== 6) {
      throw new AppError('Weigh-ins are only allowed on Saturdays', 400);
    }

    const dateStr = today.toISOString().split('T')[0];
    const date = new Date(dateStr + 'T00:00:00.000Z');

    const weighIn = await prisma.weighIn.upsert({
      where: { userId_date: { userId: req.userId!, date } },
      update: { weight },
      create: { userId: req.userId!, date, weight },
    });

    await prisma.user.update({
      where: { id: req.userId! },
      data: { currentWeight: weight },
    });

    res.json({ weighIn });
  } catch (err) { next(err); }
});

// Get weight history
router.get('/weight-history', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const weighIns = await prisma.weighIn.findMany({
      where: { userId: req.userId! },
      orderBy: { date: 'asc' },
    });
    res.json({ weighIns });
  } catch (err) { next(err); }
});

export default router;
