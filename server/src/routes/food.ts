import { Router, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { foodLogSchema, favoriteFoodSchema, dateQuerySchema, barcodeSchema, usdaQuerySchema } from '../lib/validation';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const usdaCache = new NodeCache({ stdTTL: 86400 }); // 24hr cache

// Log food
router.post('/log', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = foodLogSchema.parse(req.body);
    const dateStr = data.date || new Date().toISOString().split('T')[0];
    const date = new Date(dateStr + 'T00:00:00.000Z');

    const foodLog = await prisma.foodLog.create({
      data: {
        userId: req.userId!,
        date,
        mealType: data.mealType,
        foodName: data.foodName,
        servingSize: data.servingSize,
        servingQty: data.servingQty || 1,
        calories: data.calories,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
        fiber: data.fiber || 0,
        sodium: data.sodium || 0,
        sugar: data.sugar || 0,
        isFruit: data.isFruit || false,
        isVegetable: data.isVegetable || false,
        barcode: data.barcode,
        fdcId: data.fdcId,
      },
    });

    res.status(201).json({ foodLog });
  } catch (err) { next(err); }
});

// Get food logs for a date
router.get('/logs', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rawDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const dateStr = dateQuerySchema.parse(rawDate);
    const date = new Date(dateStr + 'T00:00:00.000Z');

    const logs = await prisma.foodLog.findMany({
      where: { userId: req.userId!, date },
      orderBy: { createdAt: 'asc' },
    });

    const summary = {
      calories: logs.reduce((s, l) => s + l.calories, 0),
      protein: logs.reduce((s, l) => s + l.protein, 0),
      carbs: logs.reduce((s, l) => s + l.carbs, 0),
      fat: logs.reduce((s, l) => s + l.fat, 0),
      fiber: logs.reduce((s, l) => s + l.fiber, 0),
      sodium: logs.reduce((s, l) => s + l.sodium, 0),
    };

    res.json({ logs, summary });
  } catch (err) { next(err); }
});

// Delete food log
router.delete('/log/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) throw new AppError('Invalid ID', 400);

    const log = await prisma.foodLog.findUnique({ where: { id } });
    if (!log || log.userId !== req.userId!) throw new AppError('Food log not found', 404);

    await prisma.foodLog.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

// Update food log
router.put('/log/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) throw new AppError('Invalid ID', 400);

    const existing = await prisma.foodLog.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId!) throw new AppError('Food log not found', 404);

    const data = foodLogSchema.parse(req.body);
    const foodLog = await prisma.foodLog.update({
      where: { id },
      data: {
        mealType: data.mealType,
        foodName: data.foodName,
        servingSize: data.servingSize,
        servingQty: data.servingQty || 1,
        calories: data.calories,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
        fiber: data.fiber || 0,
        sodium: data.sodium || 0,
        sugar: data.sugar || 0,
        isFruit: data.isFruit || false,
        isVegetable: data.isVegetable || false,
      },
    });

    res.json({ foodLog });
  } catch (err) { next(err); }
});

// Search USDA FoodData Central
router.get('/search/usda', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = usdaQuerySchema.parse(req.query.q);

    const cacheKey = `usda:${query.toLowerCase()}`;
    const cached = usdaCache.get(cacheKey);
    if (cached) return res.json(cached);

    const apiKey = process.env.USDA_API_KEY;
    if (!apiKey) throw new AppError('USDA API key not configured', 500);

    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=20&dataType=Survey (FNDDS),SR Legacy`;

    const response = await fetch(url);
    if (!response.ok) throw new AppError('USDA API error', 502);

    const data = await response.json() as any;
    const foods = (data.foods || []).map((food: any) => {
      const nutrients = food.foodNutrients || [];
      const getNutrient = (name: string) => {
        const n = nutrients.find((n: any) => n.nutrientName === name);
        return n ? Math.round(n.value * 10) / 10 : 0;
      };

      return {
        fdcId: String(food.fdcId),
        description: food.description,
        brandOwner: food.brandOwner,
        servingSize: food.servingSize ? `${food.servingSize}${food.servingSizeUnit || 'g'}` : null,
        calories: getNutrient('Energy'),
        protein: getNutrient('Protein'),
        carbs: getNutrient('Carbohydrate, by difference'),
        fat: getNutrient('Total lipid (fat)'),
        fiber: getNutrient('Fiber, total dietary'),
        sodium: getNutrient('Sodium, Na'),
        sugar: getNutrient('Sugars, total including NLEA'),
      };
    });

    const result = { foods };
    usdaCache.set(cacheKey, result);
    res.json(result);
  } catch (err) { next(err); }
});

// Recipe/prepared food search via CalorieNinjas
router.get('/search/recipe', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = usdaQuerySchema.parse(req.query.q);

    const cacheKey = `recipe:${query.toLowerCase()}`;
    const cached = usdaCache.get(cacheKey);
    if (cached) return res.json(cached);

    const apiKey = process.env.CALORIENINJAS_API_KEY;
    if (!apiKey) throw new AppError('CalorieNinjas API key not configured', 500);

    const response = await fetch(
      `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`,
      { headers: { 'X-Api-Key': apiKey } }
    );
    if (!response.ok) throw new AppError('CalorieNinjas API error', 502);

    const data = await response.json() as any;
    const foods = (data.items || []).map((item: any) => ({
      description: item.name,
      servingSize: `${item.serving_size_g}g`,
      calories: Math.round(item.calories || 0),
      protein: Math.round((item.protein_g || 0) * 10) / 10,
      carbs: Math.round((item.carbohydrates_total_g || 0) * 10) / 10,
      fat: Math.round((item.fat_total_g || 0) * 10) / 10,
      fiber: Math.round((item.fiber_g || 0) * 10) / 10,
      sodium: Math.round((item.sodium_mg || 0)),
      sugar: Math.round((item.sugar_g || 0) * 10) / 10,
    }));

    const result = { foods };
    usdaCache.set(cacheKey, result);
    res.json(result);
  } catch (err) { next(err); }
});

// Barcode lookup via Open Food Facts
router.get('/search/barcode/:barcode', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const barcode = barcodeSchema.parse(req.params.barcode as string);

    const cacheKey = `barcode:${barcode}`;
    const cached = usdaCache.get(cacheKey);
    if (cached) return res.json(cached);

    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    if (!response.ok) throw new AppError('Open Food Facts API error', 502);

    const data = await response.json() as any;
    if (data.status !== 1) throw new AppError('Product not found', 404);

    const product = data.product;
    const nutriments = product.nutriments || {};

    const result = {
      barcode,
      foodName: product.product_name || 'Unknown Product',
      brand: product.brands,
      servingSize: product.serving_size,
      calories: Math.round(nutriments['energy-kcal_100g'] || 0),
      protein: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
      carbs: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
      fat: Math.round((nutriments.fat_100g || 0) * 10) / 10,
      fiber: Math.round((nutriments.fiber_100g || 0) * 10) / 10,
      sodium: Math.round((nutriments.sodium_100g || 0) * 1000), // convert g to mg
      sugar: Math.round((nutriments.sugars_100g || 0) * 10) / 10,
    };

    usdaCache.set(cacheKey, result);
    res.json(result);
  } catch (err) { next(err); }
});

// Favorite foods
router.get('/favorites', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const favorites = await prisma.favoriteFood.findMany({
      where: { userId: req.userId! },
      orderBy: { foodName: 'asc' },
    });
    res.json({ favorites });
  } catch (err) { next(err); }
});

router.post('/favorites', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = favoriteFoodSchema.parse(req.body);
    const favorite = await prisma.favoriteFood.upsert({
      where: { userId_foodName: { userId: req.userId!, foodName: data.foodName } },
      update: data,
      create: { ...data, userId: req.userId! },
    });
    res.status(201).json({ favorite });
  } catch (err) { next(err); }
});

router.delete('/favorites/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) throw new AppError('Invalid ID', 400);

    const fav = await prisma.favoriteFood.findUnique({ where: { id } });
    if (!fav || fav.userId !== req.userId!) throw new AppError('Favorite not found', 404);

    await prisma.favoriteFood.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

// Recent foods (last 20 unique)
router.get('/recent', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const recent = await prisma.foodLog.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      distinct: ['foodName'],
      take: 20,
    });
    res.json({ recent });
  } catch (err) { next(err); }
});

export default router;
