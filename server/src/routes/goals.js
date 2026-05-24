import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { getBalance } from '../lib/balance.js';

const router = Router();

router.use(requireAuth);

// A goal is "current" while it has not been cashed in. v1 allows only one of
// these per child; the multi-goal future is just lifting that guard.
const OPEN_STATUSES = ['ACTIVE', 'REDEEM_REQUESTED'];

// Resolve a child and confirm it belongs to the requesting parent.
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

// Resolve a goal with its child loaded for ownership checks.
async function getGoal(goalId, res) {
  const goal = await prisma.savingsGoal.findUnique({
    where: { id: goalId },
    include: { child: true },
  });
  if (!goal) {
    res.status(404).json({ error: 'Goal not found' });
    return null;
  }
  return goal;
}

function parseTarget(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

// Shape a goal for the client with derived progress (balance is never stored on
// the goal — it is summed on the fly so multiple goals would share one pool).
function withProgress(goal, balance) {
  return {
    id: goal.id,
    childId: goal.childId,
    title: goal.title,
    targetAmount: goal.targetAmount,
    status: goal.status,
    createdAt: goal.createdAt,
    redeemedAt: goal.redeemedAt,
    balance,
    reachable: balance >= goal.targetAmount,
  };
}

// GET /api/goals/:childId — the child's current (non-redeemed) goal + progress.
// Parent of the child, or the child themselves.
router.get('/:childId', async (req, res) => {
  const { childId } = req.params;

  if (req.user.role === 'CHILD') {
    if (req.user.id !== childId) return res.status(403).json({ error: 'Forbidden' });
  } else if (!(await getChildOrFail(childId, req.user.id, res))) {
    return;
  }

  const goal = await prisma.savingsGoal.findFirst({
    where: { childId, status: { in: OPEN_STATUSES } },
    orderBy: { createdAt: 'desc' },
  });
  if (!goal) return res.json({ goal: null });

  const balance = await getBalance(childId);
  res.json({ goal: withProgress(goal, balance) });
});

// POST /api/goals/:childId — parent creates a goal for their child.
router.post('/:childId', requireRole('PARENT'), async (req, res) => {
  const child = await getChildOrFail(req.params.childId, req.user.id, res);
  if (!child) return;

  const { title } = req.body;
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'title required' });
  const targetAmount = parseTarget(req.body.targetAmount);
  if (targetAmount === null) return res.status(400).json({ error: 'targetAmount must be a positive integer (cents)' });

  // One open goal per child in v1.
  const existing = await prisma.savingsGoal.findFirst({
    where: { childId: child.id, status: { in: OPEN_STATUSES } },
  });
  if (existing) return res.status(409).json({ error: 'This child already has an active savings goal' });

  const goal = await prisma.savingsGoal.create({
    data: {
      childId: child.id,
      createdById: req.user.id,
      title: String(title).trim(),
      targetAmount,
    },
  });
  const balance = await getBalance(child.id);
  res.status(201).json(withProgress(goal, balance));
});

// PATCH /api/goals/:goalId — parent edits title/target on a non-redeemed goal.
router.patch('/:goalId', requireRole('PARENT'), async (req, res) => {
  const goal = await getGoal(req.params.goalId, res);
  if (!goal) return;
  if (goal.child.parentId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (goal.status === 'REDEEMED') return res.status(400).json({ error: 'A redeemed goal cannot be edited' });

  const data = {};
  if (req.body.title !== undefined) {
    if (!String(req.body.title).trim()) return res.status(400).json({ error: 'title required' });
    data.title = String(req.body.title).trim();
  }
  if (req.body.targetAmount !== undefined) {
    const targetAmount = parseTarget(req.body.targetAmount);
    if (targetAmount === null) return res.status(400).json({ error: 'targetAmount must be a positive integer (cents)' });
    data.targetAmount = targetAmount;
  }

  const updated = await prisma.savingsGoal.update({ where: { id: goal.id }, data });
  const balance = await getBalance(goal.childId);
  res.json(withProgress(updated, balance));
});

// DELETE /api/goals/:goalId — parent deletes a non-redeemed goal.
router.delete('/:goalId', requireRole('PARENT'), async (req, res) => {
  const goal = await getGoal(req.params.goalId, res);
  if (!goal) return;
  if (goal.child.parentId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  // Keep redeemed goals so their REDEEMED transaction keeps its title via the join.
  if (goal.status === 'REDEEMED') return res.status(400).json({ error: 'A redeemed goal cannot be deleted' });

  await prisma.savingsGoal.delete({ where: { id: goal.id } });
  res.json({ ok: true });
});

// POST /api/goals/:goalId/request-cash-in — child asks to cash in their own
// reachable goal. Moves no money; just flips ACTIVE -> REDEEM_REQUESTED.
router.post('/:goalId/request-cash-in', requireRole('CHILD'), async (req, res) => {
  const goal = await getGoal(req.params.goalId, res);
  if (!goal) return;
  if (goal.childId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (goal.status !== 'ACTIVE') return res.status(400).json({ error: 'Goal is not available to cash in' });

  const balance = await getBalance(goal.childId);
  if (balance < goal.targetAmount) return res.status(400).json({ error: 'Balance has not reached the goal yet' });

  const updated = await prisma.savingsGoal.update({
    where: { id: goal.id },
    data: { status: 'REDEEM_REQUESTED' },
  });
  res.json(withProgress(updated, balance));
});

// POST /api/goals/:goalId/approve — parent approves a cash-in request. Inside a
// transaction: re-verify the balance still covers the target, flip to REDEEMED,
// and write the single negative REDEEMED transaction.
router.post('/:goalId/approve', requireRole('PARENT'), async (req, res) => {
  const goal = await getGoal(req.params.goalId, res);
  if (!goal) return;
  if (goal.child.parentId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (goal.status !== 'REDEEM_REQUESTED') return res.status(400).json({ error: 'Goal is not awaiting approval' });

  let shortfall = false;
  await prisma.$transaction(async (tx) => {
    const { _sum } = await tx.transaction.aggregate({
      where: { userId: goal.childId },
      _sum: { amount: true },
    });
    const balance = _sum.amount ?? 0;
    if (balance < goal.targetAmount) {
      shortfall = true;
      return;
    }

    // Conditional flip closes the race against a concurrent approval, mirroring
    // task approval — only the row still REDEEM_REQUESTED gets redeemed.
    const { count } = await tx.savingsGoal.updateMany({
      where: { id: goal.id, status: 'REDEEM_REQUESTED' },
      data: { status: 'REDEEMED', redeemedAt: new Date() },
    });
    if (count === 0) {
      shortfall = true;
      return;
    }

    await tx.transaction.create({
      data: {
        userId: goal.childId,
        goalId: goal.id,
        amount: -goal.targetAmount,
        type: 'REDEEMED',
      },
    });
  });

  if (shortfall) return res.status(400).json({ error: 'Balance no longer covers this goal' });
  res.json({ ok: true });
});

// POST /api/goals/:goalId/reject — parent declines a cash-in request; the goal
// returns to ACTIVE with no money moved.
router.post('/:goalId/reject', requireRole('PARENT'), async (req, res) => {
  const goal = await getGoal(req.params.goalId, res);
  if (!goal) return;
  if (goal.child.parentId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (goal.status !== 'REDEEM_REQUESTED') return res.status(400).json({ error: 'Goal is not awaiting approval' });

  const updated = await prisma.savingsGoal.update({
    where: { id: goal.id },
    data: { status: 'ACTIVE' },
  });
  const balance = await getBalance(goal.childId);
  res.json(withProgress(updated, balance));
});

export default router;
