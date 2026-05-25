import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { publicLimiter } from '../middleware/rateLimit.js';
import { generateHouseholdCode } from '../lib/codes.js';

const router = Router();

async function uniqueHouseholdCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = generateHouseholdCode();
    const exists = await prisma.user.findUnique({ where: { householdCode: code } });
    if (!exists) return code;
  }
  throw new Error('Could not generate a unique household code');
}

// Public: look up children by household code (for child login screen, returns only id+name)
router.get('/children-public', publicLimiter, async (req, res) => {
  const householdCode = typeof req.query.householdCode === 'string' ? req.query.householdCode : undefined;
  if (!householdCode) return res.status(400).json({ error: 'Household code required' });
  const parent = await prisma.user.findUnique({ where: { householdCode } });
  if (!parent || parent.role !== 'PARENT') return res.status(404).json({ error: 'Household not found' });
  const children = await prisma.user.findMany({
    where: { parentId: parent.id },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  res.json(children);
});

router.use(requireAuth);

// Read the logged-in parent's household code (for sharing with their kids)
router.get('/household-code', requireRole('PARENT'), async (req, res) => {
  const parent = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { householdCode: true },
  });
  res.json({ householdCode: parent?.householdCode ?? null });
});

// Rotate the household code (invalidates the old one immediately)
router.post('/household-code/rotate', requireRole('PARENT'), async (req, res) => {
  try {
    const householdCode = await uniqueHouseholdCode();
    await prisma.user.update({ where: { id: req.user!.id }, data: { householdCode } });
    res.json({ householdCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List children of the logged-in parent
router.get('/children', requireRole('PARENT'), async (req, res) => {
  const children = await prisma.user.findMany({
    where: { parentId: req.user!.id },
    select: { id: true, name: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
  res.json(children);
});

// Create a child account
router.post('/children', requireRole('PARENT'), async (req, res) => {
  const { name, pin } = req.body;
  if (!name || !pin) return res.status(400).json({ error: 'name and pin required' });
  if (!/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'PIN must be 4 digits' });

  try {
    const pinHash = await bcrypt.hash(pin, 10);
    const child = await prisma.user.create({
      data: { name, pinHash, role: 'CHILD', parentId: req.user!.id },
    });
    res.status(201).json({ id: child.id, name: child.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update child name or PIN
router.put('/children/:id', requireRole('PARENT'), async (req, res) => {
  const child = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!child || child.parentId !== req.user!.id) return res.status(404).json({ error: 'Child not found' });

  const { name, pin } = req.body;
  if (pin && !/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'PIN must be 4 digits' });

  // Resetting the PIN also clears any active lockout.
  const pinData = pin
    ? { pinHash: await bcrypt.hash(pin, 10), pinFailedAttempts: 0, pinLockedUntil: null }
    : {};

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { ...(name && { name }), ...pinData },
    select: { id: true, name: true },
  });
  res.json(updated);
});

// Delete a child account
router.delete('/children/:id', requireRole('PARENT'), async (req, res) => {
  const child = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!child || child.parentId !== req.user!.id) return res.status(404).json({ error: 'Child not found' });

  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
