import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();
const prisma = new PrismaClient();

// Public: look up children by parent email (for child login screen, returns only id+name)
router.get('/children-public', async (req, res) => {
  const { parentEmail } = req.query;
  if (!parentEmail) return res.status(400).json({ error: 'parentEmail required' });
  const parent = await prisma.user.findUnique({ where: { email: parentEmail } });
  if (!parent || parent.role !== 'PARENT') return res.status(404).json({ error: 'Parent not found' });
  const children = await prisma.user.findMany({
    where: { parentId: parent.id },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  res.json(children);
});

router.use(requireAuth);

// List children of the logged-in parent
router.get('/children', requireRole('PARENT'), async (req, res) => {
  const children = await prisma.user.findMany({
    where: { parentId: req.user.id },
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
    const child = await prisma.user.create({
      data: { name, pin, role: 'CHILD', parentId: req.user.id },
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
  if (!child || child.parentId !== req.user.id) return res.status(404).json({ error: 'Child not found' });

  const { name, pin } = req.body;
  if (pin && !/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'PIN must be 4 digits' });

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { ...(name && { name }), ...(pin && { pin }) },
    select: { id: true, name: true },
  });
  res.json(updated);
});

// Delete a child account
router.delete('/children/:id', requireRole('PARENT'), async (req, res) => {
  const child = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!child || child.parentId !== req.user.id) return res.status(404).json({ error: 'Child not found' });

  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
