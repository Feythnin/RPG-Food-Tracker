import { Router, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { shopEffectSchema } from '../lib/validation';

const router = Router();

function parseEffect(raw: string | null) {
  const parsed = JSON.parse(raw || '{}');
  return shopEffectSchema.parse(parsed);
}

// Get all shop items
router.get('/items', authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.shopItem.findMany({
      orderBy: [{ category: 'asc' }, { cost: 'asc' }],
    });
    res.json({ items });
  } catch (err) { next(err); }
});

// Purchase item
router.post('/buy/:itemId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const itemId = parseInt(req.params.itemId as string);
    if (isNaN(itemId)) throw new AppError('Invalid item ID', 400);

    const item = await prisma.shopItem.findUnique({ where: { id: itemId } });
    if (!item) throw new AppError('Item not found', 404);

    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    if (!gameState) throw new AppError('Game state not found', 404);

    if (gameState.coins < item.cost) {
      throw new AppError('Not enough coins', 400);
    }

    // Deduct coins
    await prisma.gameState.update({
      where: { userId: req.userId! },
      data: { coins: gameState.coins - item.cost },
    });

    // Handle mystery box
    if (item.category === 'mystery_box') {
      const effect = parseEffect(item.effect);
      const pool = effect.pool || ['common'];
      const weights = effect.weights || [100];

      // Weighted random selection
      const total = weights.reduce((s: number, w: number) => s + w, 0);
      let random = Math.random() * total;
      let selectedRarity = pool[0];
      for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) { selectedRarity = pool[i]; break; }
      }

      // Pick a random item of that rarity
      const eligibleItems = await prisma.shopItem.findMany({
        where: { rarity: selectedRarity, category: { not: 'mystery_box' } },
      });

      if (eligibleItems.length === 0) {
        // Refund if no items found
        await prisma.gameState.update({
          where: { userId: req.userId! },
          data: { coins: gameState.coins },
        });
        throw new AppError('No items available in mystery box', 500);
      }

      const wonItem = eligibleItems[Math.floor(Math.random() * eligibleItems.length)];

      // Add to inventory
      await prisma.inventoryItem.upsert({
        where: { userId_shopItemId: { userId: req.userId!, shopItemId: wonItem.id } },
        update: { quantity: { increment: 1 } },
        create: { userId: req.userId!, shopItemId: wonItem.id, quantity: 1 },
      });

      return res.json({ purchase: 'mystery_box', wonItem, rarity: selectedRarity });
    }

    // Regular purchase - add to inventory
    await prisma.inventoryItem.upsert({
      where: { userId_shopItemId: { userId: req.userId!, shopItemId: itemId } },
      update: { quantity: { increment: 1 } },
      create: { userId: req.userId!, shopItemId: itemId, quantity: 1 },
    });

    res.json({ purchase: 'success', item });
  } catch (err) { next(err); }
});

// Get inventory
router.get('/inventory', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      where: { userId: req.userId! },
      include: { shopItem: true },
      orderBy: { shopItem: { category: 'asc' } },
    });
    res.json({ items });
  } catch (err) { next(err); }
});

// Use consumable item
router.post('/use/:inventoryId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const inventoryId = parseInt(req.params.inventoryId as string);
    if (isNaN(inventoryId)) throw new AppError('Invalid inventory ID', 400);

    const invItem = await prisma.inventoryItem.findUnique({
      where: { id: inventoryId },
      include: { shopItem: true },
    });

    if (!invItem || invItem.userId !== req.userId!) throw new AppError('Item not found', 404);
    if (invItem.shopItem.category !== 'consumable') throw new AppError('Item is not consumable', 400);
    if (invItem.quantity <= 0) throw new AppError('No items remaining', 400);

    const effect = parseEffect(invItem.shopItem.effect);
    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    if (!gameState) throw new AppError('Game state not found', 404);

    let update: any = {};
    switch (effect.type) {
      case 'heal':
        update.health = Math.min(gameState.health + (effect.amount || 0), gameState.maxHealth);
        break;
      case 'xp':
        let newXp = gameState.xp + (effect.amount || 0);
        let newLevel = gameState.level;
        let xpToNext = gameState.xpToNext;
        while (newXp >= xpToNext) {
          newXp -= xpToNext;
          newLevel++;
          xpToNext = newLevel * 100;
        }
        update = { xp: newXp, level: newLevel, xpToNext };
        break;
    }

    if (Object.keys(update).length > 0) {
      await prisma.gameState.update({ where: { userId: req.userId! }, data: update });
    }

    // Decrement quantity
    if (invItem.quantity <= 1) {
      await prisma.inventoryItem.delete({ where: { id: inventoryId } });
    } else {
      await prisma.inventoryItem.update({
        where: { id: inventoryId },
        data: { quantity: { decrement: 1 } },
      });
    }

    const updatedState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    res.json({ message: 'Item used', effect, gameState: updatedState });
  } catch (err) { next(err); }
});

// Equip/unequip cosmetic
router.post('/equip/:inventoryId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const inventoryId = parseInt(req.params.inventoryId as string);
    if (isNaN(inventoryId)) throw new AppError('Invalid inventory ID', 400);

    const invItem = await prisma.inventoryItem.findUnique({
      where: { id: inventoryId },
      include: { shopItem: true },
    });

    if (!invItem || invItem.userId !== req.userId!) throw new AppError('Item not found', 404);
    if (invItem.shopItem.category !== 'cosmetic') throw new AppError('Item is not a cosmetic', 400);

    // Unequip other items in the same slot
    const effect = parseEffect(invItem.shopItem.effect);
    if (effect.slot) {
      const sameSlotItems = await prisma.inventoryItem.findMany({
        where: { userId: req.userId!, equipped: true },
        include: { shopItem: true },
      });
      for (const ssi of sameSlotItems) {
        const ssiEffect = parseEffect(ssi.shopItem.effect);
        if (ssiEffect.slot === effect.slot && ssi.id !== inventoryId) {
          await prisma.inventoryItem.update({ where: { id: ssi.id }, data: { equipped: false } });
        }
      }
    }

    await prisma.inventoryItem.update({
      where: { id: inventoryId },
      data: { equipped: !invItem.equipped },
    });

    res.json({ message: invItem.equipped ? 'Unequipped' : 'Equipped' });
  } catch (err) { next(err); }
});

export default router;
