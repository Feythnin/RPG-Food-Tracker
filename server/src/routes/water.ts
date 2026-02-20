import { Router, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { waterLogSchema, dateQuerySchema } from '../lib/validation';
import { updateThirstMeter } from '../lib/gameEngine';
import { getLocalDateStr, toDateKey } from '../lib/dates';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Log water
router.post('/log', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { glasses, date: dateInput } = waterLogSchema.parse(req.body);
    const dateStr = dateInput || getLocalDateStr();
    const date = toDateKey(dateStr);

    const waterLog = await prisma.waterLog.create({
      data: { userId: req.userId!, date, glasses },
    });

    // Update thirst meter
    const thirstMeter = await updateThirstMeter(req.userId!);

    // Award XP for each glass
    const xpGained = glasses * 20;
    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    if (gameState) {
      let newXp = gameState.xp + xpGained;
      let newLevel = gameState.level;
      let xpToNext = gameState.xpToNext;

      while (newXp >= xpToNext) {
        newXp -= xpToNext;
        newLevel++;
        xpToNext = newLevel * 100;
      }

      await prisma.gameState.update({
        where: { userId: req.userId! },
        data: { xp: newXp, level: newLevel, xpToNext },
      });
    }

    res.status(201).json({ waterLog, xpGained, thirstMeter });
  } catch (err) { next(err); }
});

// Get water logs for a date
router.get('/logs', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rawDate = (req.query.date as string) || getLocalDateStr();
    const dateStr = dateQuerySchema.parse(rawDate);
    const date = toDateKey(dateStr);

    const logs = await prisma.waterLog.findMany({
      where: { userId: req.userId!, date },
      orderBy: { createdAt: 'asc' },
    });

    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { waterGoalOz: true },
    });

    const totalGlasses = logs.reduce((s, l) => s + l.glasses, 0);
    const goalGlasses = Math.ceil((user?.waterGoalOz || 64) / 8);

    res.json({
      logs,
      totalGlasses,
      goalGlasses,
      totalOz: totalGlasses * 8,
      goalOz: user?.waterGoalOz || 64,
    });
  } catch (err) { next(err); }
});

// Delete water log
router.delete('/log/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) throw new AppError('Invalid ID', 400);

    const log = await prisma.waterLog.findUnique({ where: { id } });
    if (!log || log.userId !== req.userId!) {
      throw new AppError('Water log not found', 404);
    }

    await prisma.waterLog.delete({ where: { id } });
    const thirstMeter = await updateThirstMeter(req.userId!);

    res.json({ message: 'Deleted', thirstMeter });
  } catch (err) { next(err); }
});

export default router;
