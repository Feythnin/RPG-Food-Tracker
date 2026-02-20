import prisma from './prisma';

const TIER_TASKS: Record<number, number> = { 1: 5, 2: 6, 3: 7 };

const TASK_POOL = [
  { taskType: 'log_breakfast', description: 'Log your breakfast' },
  { taskType: 'log_lunch', description: 'Log your lunch' },
  { taskType: 'log_dinner', description: 'Log your dinner' },
  { taskType: 'calorie_target', description: 'Stay within calorie target' },
  { taskType: 'protein_target', description: 'Hit your protein goal' },
  { taskType: 'fruit_veg', description: 'Eat a fruit or vegetable' },
  { taskType: 'fiber', description: 'Get 25g+ fiber today' },
  { taskType: 'sodium', description: 'Keep sodium under 2300mg' },
  { taskType: 'water_goal', description: 'Drink your water goal' },
];

export async function generateDailyTasks(userId: number): Promise<void> {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const date = new Date(dateStr + 'T00:00:00.000Z');

  // Check if tasks already exist for today
  const existing = await prisma.dailyTask.findFirst({
    where: { userId, date },
  });
  if (existing) return;

  const gameState = await prisma.gameState.findUnique({ where: { userId } });
  if (!gameState) return;

  const tier = gameState.dungeonTier;
  const taskCount = TIER_TASKS[tier] || 5;

  // Always include meal logging + core tasks, then add more based on tier
  const coreTasks = TASK_POOL.slice(0, 3); // meals
  const extraPool = TASK_POOL.slice(3);

  // Shuffle extra pool and pick remaining
  const shuffled = extraPool.sort(() => Math.random() - 0.5);
  const selected = [...coreTasks, ...shuffled.slice(0, taskCount - 3)];

  await prisma.dailyTask.createMany({
    data: selected.map((task) => ({
      userId,
      date,
      taskType: task.taskType,
      description: task.description,
      xpReward: 25,
    })),
  });
}

export async function evaluateTasks(userId: number): Promise<{ completed: number; total: number; newlyCompleted: number }> {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const date = new Date(dateStr + 'T00:00:00.000Z');

  const tasks = await prisma.dailyTask.findMany({
    where: { userId, date },
  });
  if (tasks.length === 0) return { completed: 0, total: 0, newlyCompleted: 0 };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { completed: 0, total: tasks.length, newlyCompleted: 0 };

  // Get today's food logs
  const foodLogs = await prisma.foodLog.findMany({
    where: { userId, date },
  });

  // Get today's water logs
  const waterLogs = await prisma.waterLog.findMany({
    where: { userId, date },
  });

  const totalCalories = foodLogs.reduce((sum, l) => sum + l.calories, 0);
  const totalProtein = foodLogs.reduce((sum, l) => sum + l.protein, 0);
  const totalFiber = foodLogs.reduce((sum, l) => sum + l.fiber, 0);
  const totalSodium = foodLogs.reduce((sum, l) => sum + l.sodium, 0);
  const hasFruitVeg = foodLogs.some((l) => l.isFruit || l.isVegetable);
  const totalWaterGlasses = waterLogs.reduce((sum, l) => sum + l.glasses, 0);
  const waterGoalGlasses = Math.ceil((user.waterGoalOz || 64) / 8);

  const mealTypes = new Set(foodLogs.map((l) => l.mealType));

  let newlyCompleted = 0;

  for (const task of tasks) {
    let completed = false;
    switch (task.taskType) {
      case 'log_breakfast': completed = mealTypes.has('breakfast'); break;
      case 'log_lunch': completed = mealTypes.has('lunch'); break;
      case 'log_dinner': completed = mealTypes.has('dinner'); break;
      case 'calorie_target':
        completed = totalCalories > 0 && totalCalories <= (user.dailyCalories || 2000) * 1.1;
        break;
      case 'protein_target':
        completed = totalProtein >= (user.dailyProtein || 100);
        break;
      case 'fruit_veg': completed = hasFruitVeg; break;
      case 'fiber': completed = totalFiber >= 25; break;
      case 'sodium': completed = totalCalories > 0 && totalSodium <= 2300; break;
      case 'water_goal': completed = totalWaterGlasses >= waterGoalGlasses; break;
    }

    if (completed !== task.completed) {
      await prisma.dailyTask.update({
        where: { id: task.id },
        data: { completed },
      });
      // Only count tasks that just flipped from incomplete to complete
      if (completed) newlyCompleted++;
    }
  }

  const updatedTasks = await prisma.dailyTask.findMany({ where: { userId, date } });
  const completedCount = updatedTasks.filter((t) => t.completed).length;

  return { completed: completedCount, total: updatedTasks.length, newlyCompleted };
}

export async function dealDamageToEnemy(userId: number, newlyCompleted: number): Promise<{
  enemyDefeated: boolean;
  xpGained: number;
  coinsGained: number;
  leveledUp: boolean;
  newLevel?: number;
}> {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const date = new Date(dateStr + 'T00:00:00.000Z');

  const tasks = await prisma.dailyTask.findMany({ where: { userId, date } });
  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;

  const gameState = await prisma.gameState.findUnique({ where: { userId } });
  if (!gameState) return { enemyDefeated: false, xpGained: 0, coinsGained: 0, leveledUp: false };

  // Each completed task = 1 damage
  const newEnemyHp = Math.max(0, gameState.enemyMaxHp - completed);
  const enemyDefeated = newEnemyHp === 0 && completed === total;

  // Only award XP for tasks that just became completed this evaluation
  let xpGained = newlyCompleted * 25;
  let coinsGained = 0;
  let leveledUp = false;
  let newLevel = gameState.level;

  if (enemyDefeated) {
    xpGained += 50 * gameState.dungeonTier; // bonus XP for defeating enemy
    coinsGained = 20 * gameState.dungeonTier;
  }

  let newXp = gameState.xp + xpGained;
  let xpToNext = gameState.xpToNext;

  // Check for level up
  while (newXp >= xpToNext) {
    newXp -= xpToNext;
    newLevel++;
    xpToNext = newLevel * 100;
    leveledUp = true;
  }

  // Calculate new dungeon tier based on level
  let newTier = gameState.dungeonTier;
  if (enemyDefeated) {
    if (newLevel >= 15) newTier = 3;
    else if (newLevel >= 7) newTier = 2;
    else newTier = 1;
  }

  // New enemy HP based on tier
  const newEnemyMaxHp = TIER_TASKS[newTier] || 5;

  await prisma.gameState.update({
    where: { userId },
    data: {
      level: newLevel,
      xp: newXp,
      xpToNext,
      coins: gameState.coins + coinsGained,
      enemyHp: enemyDefeated ? newEnemyMaxHp : newEnemyHp,
      enemyMaxHp: enemyDefeated ? newEnemyMaxHp : gameState.enemyMaxHp,
      dungeonTier: newTier,
    },
  });

  return { enemyDefeated, xpGained, coinsGained, leveledUp, newLevel: leveledUp ? newLevel : undefined };
}

export async function processEndOfDay(userId: number): Promise<{ healthLost: boolean }> {
  const { completed, total } = await evaluateTasks(userId);
  const gameState = await prisma.gameState.findUnique({ where: { userId } });
  if (!gameState) return { healthLost: false };

  // If fewer than half tasks completed, lose health
  const healthLost = completed < Math.ceil(total / 2);

  if (healthLost && gameState.health > 0) {
    await prisma.gameState.update({
      where: { userId },
      data: { health: gameState.health - 1 },
    });
  }

  return { healthLost };
}

export async function updateThirstMeter(userId: number): Promise<number> {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const date = new Date(dateStr + 'T00:00:00.000Z');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const waterLogs = await prisma.waterLog.findMany({ where: { userId, date } });
  const totalGlasses = waterLogs.reduce((sum, l) => sum + l.glasses, 0);
  const goal = Math.ceil((user?.waterGoalOz || 64) / 8);

  const gameState = await prisma.gameState.findUnique({ where: { userId } });
  if (!gameState) return 0;

  // Thirst meter fills up when you DON'T drink enough
  // Lower is better (0 = fully hydrated, 7 = max thirst)
  const hydrationRatio = Math.min(totalGlasses / goal, 1);
  const thirstMeter = Math.round((1 - hydrationRatio) * 7);

  await prisma.gameState.update({
    where: { userId },
    data: { thirstMeter },
  });

  return thirstMeter;
}

export async function weeklyReset(userId: number): Promise<void> {
  const gameState = await prisma.gameState.findUnique({ where: { userId } });
  if (!gameState) return;

  const now = new Date();
  const weekStart = new Date(gameState.weekStartDate);
  const daysSinceStart = Math.floor((now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceStart < 7) return;

  // Record the week
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  // If health reached 0, restart level
  const restartLevel = gameState.health <= 0;

  await prisma.gameState.update({
    where: { userId },
    data: {
      health: 7,
      thirstMeter: 0,
      weekStartDate: now,
      ...(restartLevel ? { xp: 0 } : {}),
    },
  });
}
