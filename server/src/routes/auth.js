import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 24 * 60 * 60 * 1000,
};

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, parentId: user.parentId },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Parent login: email + password
// Child login: parentId + childId + pin
router.post('/login', async (req, res) => {
  const { email, password, childId, pin } = req.body;

  try {
    if (email) {
      // Parent login
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      res.cookie('token', signToken(user), COOKIE_OPTS);
      return res.json({ id: user.id, name: user.name, role: user.role });
    }

    if (childId && pin) {
      // Child login
      const child = await prisma.user.findUnique({ where: { id: childId } });
      if (!child || child.role !== 'CHILD') return res.status(401).json({ error: 'Invalid credentials' });
      if (child.pin !== pin) return res.status(401).json({ error: 'Wrong PIN' });
      res.cookie('token', signToken(child), COOKIE_OPTS);
      return res.json({ id: child.id, name: child.name, role: child.role });
    }

    res.status(400).json({ error: 'Provide email+password or childId+pin' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// First-time parent registration
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, and password required' });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'PARENT' },
    });
    res.cookie('token', signToken(user), COOKIE_OPTS);
    res.status(201).json({ id: user.id, name: user.name, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, role: true, email: true, parentId: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

export default router;
