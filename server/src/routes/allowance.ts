import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validateBody } from '../lib/validation.js';
import { getChildOrFail } from '../lib/guards.js';
import { adjustSchema } from '../schemas/allowance.js';

const router = Router();

router.use(requireAuth);

// GET /api/allowance/:childId
// Parent or the child themselves can view
router.get('/:childId', async (req, res) => {
  const { childId } = req.params;

  // Child can only see their own
  if (req.user!.role === 'CHILD' && req.user!.id !== childId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.user!.role === 'PARENT') {
    const child = await prisma.user.findUnique({ where: { id: childId } });
    if (!child || child.parentId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: childId },
    include: { task: { select: { title: true } }, goal: { select: { title: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // Amounts are signed integer cents (EARNED is positive, ADJUSTMENT may be
  // negative), so the balance is simply their sum.
  const balance = transactions.reduce((sum, t) => sum + t.amount, 0);

  res.json({ balance, transactions });
});

// POST /api/allowance/:childId/adjust — parent manually adjusts balance
router.post('/:childId/adjust', requireRole('PARENT'), validateBody(adjustSchema), async (req, res) => {
  const child = await getChildOrFail(req.params.childId, req.user!.id, res);
  if (!child) return;

  // amount is a validated signed integer (cents); note is optional.
  const { amount, note } = req.body;
  const transaction = await prisma.transaction.create({
    data: {
      userId: child.id,
      amount,
      type: 'ADJUSTMENT',
      note: note || null,
    },
  });
  res.status(201).json(transaction);
});

export default router;
