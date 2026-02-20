import { Router, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateDailyTasks, evaluateTasks, dealDamageToEnemy, updateThirstMeter, weeklyReset } from '../lib/gameEngine';
import { todayDateKey } from '../lib/dates';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Get game state
router.get('/state', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await weeklyReset(req.userId!);
    await generateDailyTasks(req.userId!);

    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    if (!gameState) throw new AppError('Game state not found', 404);

    const date = todayDateKey();
    const tasks = await prisma.dailyTask.findMany({
      where: { userId: req.userId!, date },
      orderBy: { id: 'asc' },
    });

    res.json({ gameState, tasks });
  } catch (err) { next(err); }
});

// Evaluate tasks and update game state
router.post('/evaluate', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { completed, total, newlyCompleted } = await evaluateTasks(req.userId!);
    const damageResult = await dealDamageToEnemy(req.userId!, newlyCompleted);
    const thirstMeter = await updateThirstMeter(req.userId!);

    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });

    const date = todayDateKey();
    const tasks = await prisma.dailyTask.findMany({
      where: { userId: req.userId!, date },
      orderBy: { id: 'asc' },
    });

    res.json({
      gameState,
      tasks,
      evaluation: { completed, total },
      combat: damageResult,
      thirstMeter,
    });
  } catch (err) { next(err); }
});

// Toggle a manual task (exercise)
router.post('/task/:id/toggle', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) throw new AppError('Invalid ID', 400);

    const task = await prisma.dailyTask.findUnique({ where: { id } });
    if (!task || task.userId !== req.userId!) throw new AppError('Task not found', 404);

    const manualTypes = ['exercise_arms', 'exercise_legs', 'exercise_cardio'];
    if (!manualTypes.includes(task.taskType)) {
      throw new AppError('This task cannot be toggled manually', 400);
    }

    const updated = await prisma.dailyTask.update({
      where: { id },
      data: { completed: !task.completed },
    });

    res.json({ task: updated });
  } catch (err) { next(err); }
});

// Get weekly records
router.get('/history', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const records = await prisma.weeklyRecord.findMany({
      where: { userId: req.userId! },
      orderBy: { weekStart: 'desc' },
      take: 12,
    });
    res.json({ records });
  } catch (err) { next(err); }
});

export default router;
