import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

function parseWeeklyDays(weeklyDays) {
  if (!weeklyDays) return [];
  return [...new Set(
    String(weeklyDays)
      .split(',')
      .map(d => parseInt(d, 10))
      .filter(d => Number.isInteger(d) && d >= 0 && d <= 6)
  )].sort((a, b) => a - b);
}

function nextDueDate(currentDue, recurrence, weeklyDays) {
  const base = currentDue ? new Date(currentDue) : new Date();
  switch (recurrence) {
    case 'DAILY':   base.setDate(base.getDate() + 1); break;
    case 'WEEKLY': {
      const days = parseWeeklyDays(weeklyDays);
      if (days.length === 0) {
        base.setDate(base.getDate() + 7);
        break;
      }
      const daySet = new Set(days);
      for (let i = 1; i <= 7; i++) {
        base.setDate(base.getDate() + 1);
        if (daySet.has(base.getDay())) break;
      }
      break;
    }
    case 'MONTHLY': base.setMonth(base.getMonth() + 1); break;
  }
  return base;
}

// GET /api/tasks
// Parent: all tasks for their children
// Child: their own tasks
router.get('/', async (req, res) => {
  const { user } = req;

  if (user.role === 'PARENT') {
    const children = await prisma.user.findMany({ where: { parentId: user.id }, select: { id: true } });
    const childIds = children.map(c => c.id);
    const tasks = await prisma.task.findMany({
      where: { assignedToId: { in: childIds } },
      include: { assignedTo: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(tasks);
  }

  const tasks = await prisma.task.findMany({
    where: { assignedToId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(tasks);
});

// POST /api/tasks — parent creates task
router.post('/', requireRole('PARENT'), async (req, res) => {
  const { title, description, dollarAmount, assignedToId, dueDate, isRecurring, recurrence, weeklyDays } = req.body;
  if (!title || !assignedToId) return res.status(400).json({ error: 'title and assignedToId required' });

  const child = await prisma.user.findUnique({ where: { id: assignedToId } });
  if (!child || child.parentId !== req.user.id) return res.status(403).json({ error: 'Cannot assign to this child' });

  const normalizedWeeklyDays =
    isRecurring && recurrence === 'WEEKLY' ? parseWeeklyDays(Array.isArray(weeklyDays) ? weeklyDays.join(',') : weeklyDays) : [];

  const task = await prisma.task.create({
    data: {
      title,
      description,
      dollarAmount: dollarAmount ? parseFloat(dollarAmount) : null,
      assignedToId,
      createdById: req.user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      isRecurring: Boolean(isRecurring),
      recurrence: isRecurring ? recurrence : null,
      weeklyDays: normalizedWeeklyDays.length ? normalizedWeeklyDays.join(',') : null,
    },
  });
  res.status(201).json(task);
});

// PUT /api/tasks/:id
// Parent: edit title/description/amount
// Child: mark as COMPLETED
router.put('/:id', async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (req.user.role === 'CHILD') {
    if (task.assignedToId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (task.status !== 'PENDING' && task.status !== 'REJECTED') {
      return res.status(400).json({ error: 'Task cannot be marked complete in its current state' });
    }
    const updated = await prisma.task.update({
      where: { id: task.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    return res.json(updated);
  }

  // Parent edit
  const child = await prisma.user.findUnique({ where: { id: task.assignedToId } });
  if (!child || child.parentId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { title, description, dollarAmount, dueDate, assignedToId } = req.body;
  const updated = await prisma.task.update({
    where: { id: task.id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(dollarAmount !== undefined && { dollarAmount: dollarAmount ? parseFloat(dollarAmount) : null }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(assignedToId && { assignedToId }),
    },
  });
  res.json(updated);
});

// POST /api/tasks/:id/approve — parent approves, credits allowance
router.post('/:id/approve', requireRole('PARENT'), async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.status !== 'COMPLETED') return res.status(400).json({ error: 'Task is not awaiting approval' });

  const child = await prisma.user.findUnique({ where: { id: task.assignedToId } });
  if (!child || child.parentId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: task.id },
      data: { status: 'APPROVED', approvedAt: now },
    });

    if (task.dollarAmount) {
      await tx.transaction.create({
        data: {
          userId: task.assignedToId,
          taskId: task.id,
          amount: task.dollarAmount,
          type: 'EARNED',
        },
      });
    }

    // Spawn next recurring instance
    if (task.isRecurring && task.recurrence) {
      const templateId = task.templateId || task.id;
      await tx.task.create({
        data: {
          title: task.title,
          description: task.description,
          dollarAmount: task.dollarAmount,
          assignedToId: task.assignedToId,
          createdById: req.user.id,
          dueDate: nextDueDate(task.dueDate, task.recurrence, task.weeklyDays),
          isRecurring: true,
          recurrence: task.recurrence,
          weeklyDays: task.weeklyDays,
          templateId,
        },
      });
    }
  });

  res.json({ ok: true });
});

// POST /api/tasks/:id/reject — parent rejects, sends back to PENDING
router.post('/:id/reject', requireRole('PARENT'), async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.status !== 'COMPLETED') return res.status(400).json({ error: 'Task is not awaiting approval' });

  const child = await prisma.user.findUnique({ where: { id: task.assignedToId } });
  if (!child || child.parentId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { status: 'PENDING', completedAt: null },
  });
  res.json(updated);
});

// DELETE /api/tasks/:id
router.delete('/:id', requireRole('PARENT'), async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const child = await prisma.user.findUnique({ where: { id: task.assignedToId } });
  if (!child || child.parentId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  await prisma.task.delete({ where: { id: task.id } });
  res.json({ ok: true });
});

export default router;
