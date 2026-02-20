import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import prisma from '../lib/prisma';
import { registerSchema, loginSchema, changePasswordSchema } from '../lib/validation';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function setTokenCookie(res: Response, userId: number) {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
}

router.post('/register', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { username, password } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) throw new AppError('Username already taken', 409);

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { username, passwordHash },
    });

    // Create initial game state
    await prisma.gameState.create({
      data: { userId: user.id },
    });

    setTokenCookie(res, user.id);
    res.status(201).json({
      user: { id: user.id, username: user.username, setupComplete: user.setupComplete },
    });
  } catch (err) { next(err); }
});

router.post('/login', loginLimiter, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) throw new AppError('Invalid username or password', 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError('Invalid username or password', 401);

    setTokenCookie(res, user.id);
    res.json({
      user: { id: user.id, username: user.username, setupComplete: user.setupComplete },
    });
  } catch (err) { next(err); }
});

router.post('/logout', (_req: AuthRequest, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

router.post('/change-password', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw new AppError('User not found', 404);

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AppError('Current password is incorrect', 401);

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: req.userId! },
      data: { passwordHash },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (err) { next(err); }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, username: true, setupComplete: true },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json({ user });
  } catch (err) { next(err); }
});

export default router;
