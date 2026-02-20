import { Router, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { dateQuerySchema, periodSchema } from '../lib/validation';
import { getLocalDateStr, toDateKey } from '../lib/dates';

const router = Router();

// Get nutrition summary for a date range
router.get('/summary', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const period = periodSchema.parse(req.query.period || 'day');
    const rawDate = (req.query.date as string) || getLocalDateStr();
    const dateStr = dateQuerySchema.parse(rawDate);
    const endDate = new Date(dateStr + 'T23:59:59.999Z');

    let startDate: Date;
    switch (period) {
      case 'week':
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = new Date(dateStr + 'T00:00:00.000Z');
    }

    const foodLogs = await prisma.foodLog.findMany({
      where: {
        userId: req.userId!,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    // Group by date
    const byDate: Record<string, typeof foodLogs> = {};
    for (const log of foodLogs) {
      const key = log.date.toISOString().split('T')[0];
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(log);
    }

    const dailyData = Object.entries(byDate).map(([date, logs]) => ({
      date,
      calories: logs.reduce((s, l) => s + l.calories, 0),
      protein: logs.reduce((s, l) => s + l.protein, 0),
      carbs: logs.reduce((s, l) => s + l.carbs, 0),
      fat: logs.reduce((s, l) => s + l.fat, 0),
      fiber: logs.reduce((s, l) => s + l.fiber, 0),
      sodium: logs.reduce((s, l) => s + l.sodium, 0),
    }));

    // Overall totals
    const totals = {
      calories: foodLogs.reduce((s, l) => s + l.calories, 0),
      protein: foodLogs.reduce((s, l) => s + l.protein, 0),
      carbs: foodLogs.reduce((s, l) => s + l.carbs, 0),
      fat: foodLogs.reduce((s, l) => s + l.fat, 0),
      fiber: foodLogs.reduce((s, l) => s + l.fiber, 0),
      sodium: foodLogs.reduce((s, l) => s + l.sodium, 0),
    };

    const days = Object.keys(byDate).length || 1;
    const averages = {
      calories: Math.round(totals.calories / days),
      protein: Math.round(totals.protein / days),
      carbs: Math.round(totals.carbs / days),
      fat: Math.round(totals.fat / days),
      fiber: Math.round(totals.fiber / days),
      sodium: Math.round(totals.sodium / days),
    };

    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { dailyCalories: true, dailyProtein: true, waterGoalOz: true },
    });

    res.json({ dailyData, totals, averages, goals: user, period });
  } catch (err) { next(err); }
});

// Get water summary for date range
router.get('/water-summary', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const period = periodSchema.parse(req.query.period || 'week');
    const rawDate = (req.query.date as string) || getLocalDateStr();
    const dateStr = dateQuerySchema.parse(rawDate);
    const endDate = new Date(dateStr + 'T23:59:59.999Z');

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (period === 'month' ? 29 : 6));
    startDate.setHours(0, 0, 0, 0);

    const waterLogs = await prisma.waterLog.findMany({
      where: {
        userId: req.userId!,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    const byDate: Record<string, number> = {};
    for (const log of waterLogs) {
      const key = log.date.toISOString().split('T')[0];
      byDate[key] = (byDate[key] || 0) + log.glasses;
    }

    const dailyData = Object.entries(byDate).map(([date, glasses]) => ({
      date,
      glasses,
      oz: glasses * 8,
    }));

    res.json({ dailyData });
  } catch (err) { next(err); }
});

// Export all data as JSON
router.get('/export', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        username: true, mode: true, sex: true, heightInches: true,
        currentWeight: true, goalWeight: true, age: true, activityLevel: true,
        dailyCalories: true, dailyProtein: true, waterGoalOz: true,
      },
    });

    const foodLogs = await prisma.foodLog.findMany({
      where: { userId: req.userId! },
      orderBy: { date: 'desc' },
    });

    const waterLogs = await prisma.waterLog.findMany({
      where: { userId: req.userId! },
      orderBy: { date: 'desc' },
    });

    const weighIns = await prisma.weighIn.findMany({
      where: { userId: req.userId! },
      orderBy: { date: 'desc' },
    });

    res.json({
      exportDate: new Date().toISOString(),
      profile: user,
      foodLogs,
      waterLogs,
      weighIns,
    });
  } catch (err) { next(err); }
});

export default router;
