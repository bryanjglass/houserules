import { Router } from 'express';
import type { Request, Response, CookieOptions } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { generateHouseholdCode, generateDeviceToken, hashToken } from '../lib/codes.js';

const router = Router();

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const DEVICE_MAX_AGE = 90 * 24 * 60 * 60 * 1000; // 90 days

const COOKIE_OPTS: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 24 * 60 * 60 * 1000,
};

const DEVICE_COOKIE_OPTS: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: DEVICE_MAX_AGE,
};

function signToken(user: Pick<User, 'id' | 'role' | 'name' | 'parentId'>): string {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, parentId: user.parentId },
    process.env.JWT_SECRET as string,
    { expiresIn: '24h' }
  );
}

async function uniqueHouseholdCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = generateHouseholdCode();
    const exists = await prisma.user.findUnique({ where: { householdCode: code } });
    if (!exists) return code;
  }
  throw new Error('Could not generate a unique household code');
}

// Resolve a valid (non-expired) trusted device from the request's device cookie.
async function deviceFromCookie(req: Request) {
  const token = req.cookies.device;
  if (!token) return null;
  const device = await prisma.trustedDevice.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { children: { select: { id: true, name: true, role: true, parentId: true } } },
  });
  if (!device || device.expiresAt < new Date()) return null;
  return device;
}

// Mark a child as remembered on this device, creating/refreshing the trusted device.
async function rememberDeviceForChild(
  req: Request,
  res: Response,
  child: Pick<User, 'id' | 'parentId'>
) {
  const expiresAt = new Date(Date.now() + DEVICE_MAX_AGE);
  const existing = await deviceFromCookie(req);
  if (existing && existing.parentId === child.parentId) {
    await prisma.trustedDevice.update({
      where: { id: existing.id },
      data: { lastUsedAt: new Date(), expiresAt, children: { connect: { id: child.id } } },
    });
    return;
  }
  const token = generateDeviceToken();
  await prisma.trustedDevice.create({
    data: {
      tokenHash: hashToken(token),
      parentId: child.parentId as string,
      expiresAt,
      children: { connect: { id: child.id } },
    },
  });
  res.cookie('device', token, DEVICE_COOKIE_OPTS);
}

// Parent login: email + password
// Child login: householdCode + childId + pin (+ optional rememberDevice)
router.post('/login', authLimiter, async (req, res) => {
  const { email, password, householdCode, childId, pin, rememberDevice } = req.body;

  try {
    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      res.cookie('token', signToken(user), COOKIE_OPTS);
      return res.json({ id: user.id, name: user.name, role: user.role });
    }

    if (childId && pin) {
      if (!householdCode) return res.status(400).json({ error: 'Household code required' });
      const child = await prisma.user.findUnique({ where: { id: childId } });
      if (!child || child.role !== 'CHILD') return res.status(401).json({ error: 'Invalid credentials' });

      // The household code must belong to this child's parent.
      const parent = await prisma.user.findUnique({ where: { householdCode } });
      if (!parent || parent.id !== child.parentId) return res.status(401).json({ error: 'Invalid credentials' });

      if (child.pinLockedUntil && child.pinLockedUntil > new Date()) {
        return res.status(423).json({ error: 'Too many tries. Locked — try again later.' });
      }

      const ok = child.pinHash && (await bcrypt.compare(pin, child.pinHash));
      if (!ok) {
        const attempts = child.pinFailedAttempts + 1;
        const locked = attempts >= MAX_PIN_ATTEMPTS;
        await prisma.user.update({
          where: { id: child.id },
          data: {
            pinFailedAttempts: locked ? 0 : attempts,
            pinLockedUntil: locked ? new Date(Date.now() + LOCKOUT_MS) : null,
          },
        });
        if (locked) return res.status(423).json({ error: 'Too many tries. Locked — try again later.' });
        return res.status(401).json({ error: 'Wrong PIN' });
      }

      if (child.pinFailedAttempts !== 0 || child.pinLockedUntil) {
        await prisma.user.update({
          where: { id: child.id },
          data: { pinFailedAttempts: 0, pinLockedUntil: null },
        });
      }

      if (rememberDevice) await rememberDeviceForChild(req, res, child);

      res.cookie('token', signToken(child), COOKIE_OPTS);
      return res.json({ id: child.id, name: child.name, role: child.role });
    }

    res.status(400).json({ error: 'Provide email+password or householdCode+childId+pin' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Children remembered on the current device (for one-tap login). Empty if untrusted.
router.get('/remembered', async (req, res) => {
  try {
    const device = await deviceFromCookie(req);
    if (!device) return res.json({ children: [] });
    await prisma.trustedDevice.update({ where: { id: device.id }, data: { lastUsedAt: new Date() } });
    const children = device.children
      .filter((c) => c.role === 'CHILD' && c.parentId === device.parentId)
      .map((c) => ({ id: c.id, name: c.name }));
    res.json({ children });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Passwordless login on a trusted device — no PIN.
router.post('/device-login', authLimiter, async (req, res) => {
  const { childId } = req.body;
  try {
    const device = await deviceFromCookie(req);
    if (!device) return res.status(401).json({ error: 'Device not recognized' });
    const child = device.children.find(
      (c) => c.id === childId && c.role === 'CHILD' && c.parentId === device.parentId
    );
    if (!child) return res.status(401).json({ error: 'Device not recognized' });
    await prisma.trustedDevice.update({ where: { id: device.id }, data: { lastUsedAt: new Date() } });
    res.cookie('token', signToken(child), COOKIE_OPTS);
    res.json({ id: child.id, name: child.name, role: child.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// First-time parent registration
router.post('/register', authLimiter, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, and password required' });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const householdCode = await uniqueHouseholdCode();
    const user = await prisma.user.create({
      data: { name, email, passwordHash, householdCode, role: 'PARENT' },
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
    where: { id: req.user!.id },
    select: { id: true, name: true, role: true, email: true, parentId: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// List trusted devices for the parent's household.
router.get('/devices', requireAuth, requireRole('PARENT'), async (req, res) => {
  const devices = await prisma.trustedDevice.findMany({
    where: { parentId: req.user!.id },
    select: {
      id: true,
      label: true,
      createdAt: true,
      lastUsedAt: true,
      children: { select: { id: true, name: true } },
    },
    orderBy: { lastUsedAt: 'desc' },
  });
  res.json(devices);
});

// Revoke a trusted device.
router.delete('/devices/:id', requireAuth, requireRole('PARENT'), async (req, res) => {
  const device = await prisma.trustedDevice.findUnique({ where: { id: req.params.id } });
  if (!device || device.parentId !== req.user!.id) return res.status(404).json({ error: 'Device not found' });
  await prisma.trustedDevice.delete({ where: { id: device.id } });
  res.json({ ok: true });
});

export default router;
