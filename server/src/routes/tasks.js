import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

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

// Project future occurrences of a recurring task within [start, end].
// Walks forward from the task's due date using the same recurrence rules as
// instance spawning. The due date itself is the materialized instance and is
// NOT emitted here. Bounded to guard against runaway daily expansion.
function projectOccurrences(task, start, end) {
  if (!task.isRecurring || !task.recurrence || !task.dueDate) return [];
  const occurrences = [];
  let cursor = new Date(task.dueDate);
  const MAX_STEPS = 400;
  for (let i = 0; i < MAX_STEPS; i++) {
    cursor = nextDueDate(cursor, task.recurrence, task.weeklyDays);
    if (cursor > end) break;
    if (cursor >= start) occurrences.push(new Date(cursor));
  }
  return occurrences;
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
      // Children's tasks, plus the parent's own up-for-grabs chores (open chores
      // have no assignee, so they'd be missed by the assignedToId filter alone).
      where: { OR: [{ assignedToId: { in: childIds } }, { createdById: user.id }] },
      include: { assignedTo: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(tasks);
  }

  const tasks = await prisma.task.findMany({
    // The child's own tasks, plus the household's unclaimed up-for-grabs pool.
    where: {
      OR: [
        { assignedToId: user.id },
        { isUpForGrabs: true, assignedToId: null, createdById: user.parentId },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(tasks);
});

// GET /api/tasks/calendar?start=&end=
// Returns role-scoped tasks with a due date in [start, end], plus projected
// future occurrences of recurring tasks across the same window.
router.get('/calendar', async (req, res) => {
  const { user } = req;
  const { start, end } = req.query;

  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  if (!startDate || !endDate || isNaN(startDate) || isNaN(endDate)) {
    return res.status(400).json({ error: 'start and end query params are required and must be valid dates' });
  }
  if (startDate > endDate) {
    return res.status(400).json({ error: 'start must not be after end' });
  }

  const isParent = user.role === 'PARENT';
  let where;
  if (isParent) {
    const children = await prisma.user.findMany({ where: { parentId: user.id }, select: { id: true } });
    // Children's tasks plus the parent's own (incl. unclaimed) up-for-grabs chores.
    where = { OR: [{ assignedToId: { in: children.map(c => c.id) } }, { createdById: user.id }] };
  } else {
    // The child's own tasks plus the household's unclaimed up-for-grabs pool.
    where = {
      OR: [
        { assignedToId: user.id },
        { isUpForGrabs: true, assignedToId: null, createdById: user.parentId },
      ],
    };
  }

  const tasks = await prisma.task.findMany({
    where,
    include: isParent ? { assignedTo: { select: { id: true, name: true } } } : undefined,
  });

  const events = [];
  for (const task of tasks) {
    const base = {
      taskId: task.id,
      title: task.title,
      status: task.status,
      dollarAmount: task.dollarAmount,
      isRecurring: task.isRecurring,
      recurrence: task.recurrence,
      isUpForGrabs: task.isUpForGrabs,
      ...(isParent && { assignedTo: task.assignedTo }),
    };

    // Materialized instance, if it falls in range
    if (task.dueDate) {
      const due = new Date(task.dueDate);
      if (due >= startDate && due <= endDate) {
        events.push({ ...base, id: task.id, date: due.toISOString(), projected: false });
      }
    }

    // Project future occurrences only from the active tip of a recurring chain.
    // Approved instances already spawned their successor, so projecting from
    // them would duplicate the chain.
    if (task.isRecurring && task.status !== 'APPROVED') {
      for (const date of projectOccurrences(task, startDate, endDate)) {
        events.push({
          ...base,
          id: `${task.id}-proj-${date.toISOString()}`,
          date: date.toISOString(),
          projected: true,
        });
      }
    }
  }

  res.json(events);
});

// POST /api/tasks — parent creates task
router.post('/', requireRole('PARENT'), async (req, res) => {
  const { title, description, dollarAmount, assignedToId, dueDate, isRecurring, recurrence, weeklyDays, isUpForGrabs } = req.body;
  const upForGrabs = Boolean(isUpForGrabs);
  // An up-for-grabs chore has no assignee; every other chore must name a child.
  if (!title || (!assignedToId && !upForGrabs)) {
    return res.status(400).json({ error: 'title and either assignedToId or isUpForGrabs required' });
  }

  // Only validate the assignee when one is given (up-for-grabs chores have none).
  if (assignedToId) {
    const child = await prisma.user.findUnique({ where: { id: assignedToId } });
    if (!child || child.parentId !== req.user.id) return res.status(403).json({ error: 'Cannot assign to this child' });
  }

  const normalizedWeeklyDays =
    isRecurring && recurrence === 'WEEKLY' ? parseWeeklyDays(Array.isArray(weeklyDays) ? weeklyDays.join(',') : weeklyDays) : [];

  const task = await prisma.task.create({
    data: {
      title,
      description,
      dollarAmount: dollarAmount ? Math.round(Number(dollarAmount)) : null,
      // When up-for-grabs, leave the chore unassigned so the whole household can claim it.
      assignedToId: upForGrabs ? null : assignedToId,
      isUpForGrabs: upForGrabs,
      createdById: req.user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      isRecurring: Boolean(isRecurring),
      recurrence: isRecurring ? recurrence : null,
      weeklyDays: normalizedWeeklyDays.length ? normalizedWeeklyDays.join(',') : null,
    },
  });
  res.status(201).json(task);
});

// POST /api/tasks/:id/claim — a child grabs an up-for-grabs chore (first claim wins)
router.post('/:id/claim', requireRole('CHILD'), async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (!task.isUpForGrabs) return res.status(400).json({ error: 'This chore is not up for grabs' });
  if (task.status !== 'PENDING') return res.status(400).json({ error: 'This chore can no longer be claimed' });
  // Same-household check: the chore's creator must be this child's parent.
  if (task.createdById !== req.user.parentId) return res.status(403).json({ error: 'Forbidden' });

  // Atomic claim: only the row that is still unclaimed flips to this child.
  // SQLite serializes the writes, so exactly one concurrent claim wins.
  const { count } = await prisma.task.updateMany({
    where: { id: task.id, assignedToId: null, isUpForGrabs: true },
    data: { assignedToId: req.user.id },
  });
  if (count === 0) return res.status(409).json({ error: 'Already grabbed' });

  const claimed = await prisma.task.findUnique({ where: { id: task.id } });
  res.json(claimed);
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

  // Parent edit — ownership is the creator, which holds even for unassigned
  // up-for-grabs chores (the assignee may be null).
  if (task.createdById !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { title, description, dollarAmount, dueDate, assignedToId } = req.body;
  const updated = await prisma.task.update({
    where: { id: task.id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(dollarAmount !== undefined && { dollarAmount: dollarAmount ? Math.round(Number(dollarAmount)) : null }),
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
  if (task.createdById !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const now = new Date();
  let conflict = false;
  await prisma.$transaction(async (tx) => {
    // Conditional flip closes the race between the status check above and here:
    // a second concurrent approval finds the task no longer COMPLETED and bails,
    // so the allowance is never double-credited and recurring chores spawn once.
    const { count } = await tx.task.updateMany({
      where: { id: task.id, status: 'COMPLETED' },
      data: { status: 'APPROVED', approvedAt: now },
    });
    if (count === 0) {
      conflict = true;
      return;
    }

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
          // Up-for-grabs chores reopen to the whole household; normal chores
          // re-lock to the same child.
          assignedToId: task.isUpForGrabs ? null : task.assignedToId,
          isUpForGrabs: task.isUpForGrabs,
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

  if (conflict) return res.status(409).json({ error: 'Task is not awaiting approval' });
  res.json({ ok: true });
});

// POST /api/tasks/:id/reject — parent rejects, sends back to PENDING
router.post('/:id/reject', requireRole('PARENT'), async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.status !== 'COMPLETED') return res.status(400).json({ error: 'Task is not awaiting approval' });
  if (task.createdById !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  // A rejected up-for-grabs chore stays locked to the claimer (assignedToId is
  // left untouched) — it does not return to the household pool.
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
  if (task.createdById !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  await prisma.task.delete({ where: { id: task.id } });
  res.json({ ok: true });
});

export default router;
