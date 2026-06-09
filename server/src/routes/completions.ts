import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { notifyUser } from '../lib/push.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validateBody } from '../lib/validation.js';
import { approveSchema } from '../schemas/chore.js';

const router = Router();

router.use(requireAuth, requireRole('PARENT'));

// POST /api/completions/:id/approve — flip COMPLETED -> APPROVED and credit the
// child the completion's snapshot reward. For a per-unit log the parent may
// adjust the count; the snapshot is recomputed from its own unit price (not the
// chore's current one) so definition edits never change in-flight work.
router.post('/:id/approve', validateBody(approveSchema), async (req, res) => {
  const completion = await prisma.choreCompletion.findUnique({
    where: { id: req.params.id },
    include: { chore: true },
  });
  if (!completion) return res.status(404).json({ error: 'Completion not found' });
  if (completion.chore.householdId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });
  if (completion.status !== 'COMPLETED') return res.status(400).json({ error: 'Not awaiting approval' });

  // Per-unit count adjustment: derive the snapshot unit price from the log.
  const isPerUnit = completion.chore.kind === 'PER_UNIT';
  const adjustedQty = req.body.quantity ?? null;
  let finalQty = completion.quantity;
  let finalReward = completion.rewardCents;
  if (isPerUnit && completion.quantity && completion.rewardCents && adjustedQty && adjustedQty !== completion.quantity) {
    const unitPrice = Math.round(completion.rewardCents / completion.quantity);
    finalQty = adjustedQty;
    finalReward = unitPrice * adjustedQty;
  }

  let conflict = false;
  await prisma.$transaction(async (tx) => {
    // Conditional flip closes the race between the status check above and here:
    // a concurrent approval finds the row no longer COMPLETED and bails, so the
    // allowance is never double-credited.
    const { count } = await tx.choreCompletion.updateMany({
      where: { id: completion.id, status: 'COMPLETED' },
      data: { status: 'APPROVED', approvedAt: new Date(), quantity: finalQty, rewardCents: finalReward },
    });
    if (count === 0) {
      conflict = true;
      return;
    }
    if (finalReward && finalReward > 0) {
      await tx.transaction.create({
        data: {
          userId: completion.childId,
          completionId: completion.id,
          amount: finalReward,
          type: 'EARNED',
        },
      });
    }
  });
  if (conflict) return res.status(409).json({ error: 'Not awaiting approval' });

  const body = finalReward
    ? `${completion.chore.title} — you earned $${(finalReward / 100).toFixed(2)}!`
    : `${completion.chore.title} approved`;
  notifyUser(completion.childId, { title: 'Chore approved! 🎉', body });

  res.json({ ok: true });
});

// POST /api/completions/:id/reject — send work back. A per-unit log is
// discarded (the child re-logs a corrected count from the still-open chore);
// anything else returns to PENDING, staying locked to its child and occurrence.
router.post('/:id/reject', async (req, res) => {
  const completion = await prisma.choreCompletion.findUnique({
    where: { id: req.params.id },
    include: { chore: true },
  });
  if (!completion) return res.status(404).json({ error: 'Completion not found' });
  if (completion.chore.householdId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });
  if (completion.status !== 'COMPLETED') return res.status(400).json({ error: 'Not awaiting approval' });

  notifyUser(completion.childId, { title: 'Chore needs another look', body: completion.chore.title });

  if (completion.chore.kind === 'PER_UNIT') {
    await prisma.choreCompletion.delete({ where: { id: completion.id } });
    return res.json({ ok: true, deleted: true });
  }

  const updated = await prisma.choreCompletion.update({
    where: { id: completion.id },
    data: { status: 'PENDING', completedAt: null },
  });
  res.json(updated);
});

export default router;
