import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

async function getChildOrFail(childId, parentId, res) {
  const child = await prisma.user.findUnique({ where: { id: childId } });
  if (!child || child.role !== 'CHILD') {
    res.status(404).json({ error: 'Child not found' });
    return null;
  }
  if (child.parentId !== parentId) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  return child;
}

// GET /api/allowance/:childId
// Parent or the child themselves can view
router.get('/:childId', async (req, res) => {
  const { childId } = req.params;

  // Child can only see their own
  if (req.user.role === 'CHILD' && req.user.id !== childId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.user.role === 'PARENT') {
    const child = await prisma.user.findUnique({ where: { id: childId } });
    if (!child || child.parentId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: childId },
    include: { task: { select: { title: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const balance = transactions.reduce((sum, t) => {
    return sum + (t.type === 'EARNED' || t.amount > 0 ? t.amount : t.amount);
  }, 0);

  res.json({ balance: Math.round(balance * 100) / 100, transactions });
});

// POST /api/allowance/:childId/adjust — parent manually adjusts balance
router.post('/:childId/adjust', requireRole('PARENT'), async (req, res) => {
  const child = await getChildOrFail(req.params.childId, req.user.id, res);
  if (!child) return;

  const { amount, note } = req.body;
  if (amount === undefined || amount === null) return res.status(400).json({ error: 'amount required' });
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount)) return res.status(400).json({ error: 'amount must be a number' });

  const transaction = await prisma.transaction.create({
    data: {
      userId: child.id,
      amount: parsedAmount,
      type: 'ADJUSTMENT',
      note: note || null,
    },
  });
  res.status(201).json(transaction);
});

export default router;
