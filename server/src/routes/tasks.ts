import { Router } from 'express';
import { Prisma } from '@prisma/client';
import type { Task } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

router.use(requireAuth);

function parseWeeklyDays(weeklyDays: string | null | undefined): number[] {
  if (!weeklyDays) return [];
  return [...new Set(
    String(weeklyDays)
      .split(',')
      .map(d => parseInt(d, 10))
      .filter(d => Number.isInteger(d) && d >= 0 && d <= 6)
  )].sort((a, b) => a - b);
}

function nextDueDate(
  currentDue: Date | string | null,
  recurrence: string | null,
  weeklyDays: string | null | undefined
): Date {
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
function projectOccurrences(task: Task, start: Date, end: Date): Date[] {
  if (!task.isRecurring || !task.recurrence || !task.dueDate) return [];
  const occurrences: Date[] = [];
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
  const user = req.user!;

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
        { isUpForGrabs: true, assignedToId: null, createdById: user.parentId as string },
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
  const user = req.user!;
  const start = typeof req.query.start === 'string' ? req.query.start : undefined;
  const end = typeof req.query.end === 'string' ? req.query.end : undefined;

  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({ error: 'start and end query params are required and must be valid dates' });
  }
  if (startDate > endDate) {
    return res.status(400).json({ error: 'start must not be after end' });
  }

  const isParent = user.role === 'PARENT';
  let where: Prisma.TaskWhereInput;
  if (isParent) {
    const children = await prisma.user.findMany({ where: { parentId: user.id }, select: { id: true } });
    // Children's tasks plus the parent's own (incl. unclaimed) up-for-grabs chores.
    where = { OR: [{ assignedToId: { in: children.map(c => c.id) } }, { createdById: user.id }] };
  } else {
    // The child's own tasks plus the household's unclaimed up-for-grabs pool.
    where = {
      OR: [
        { assignedToId: user.id },
        { isUpForGrabs: true, assignedToId: null, createdById: user.parentId as string },
      ],
    };
  }

  const tasks = (await prisma.task.findMany({
    where,
    include: isParent ? { assignedTo: { select: { id: true, name: true } } } : undefined,
  })) as Array<Task & { assignedTo?: { id: string; name: string } | null }>;

  const events: Array<Record<string, unknown>> = [];
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

// GET /api/tasks/:id — a single task, scoped to the requester (parent owner or
// assigned child). Used by the parent edit form to pre-populate fields.
router.get('/:id', async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: { assignedTo: { select: { id: true, name: true } } },
  });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const user = req.user!;
  const owns = user.role === 'PARENT' ? task.createdById === user.id : task.assignedToId === user.id;
  if (!owns) return res.status(403).json({ error: 'Forbidden' });
  res.json(task);
});

// POST /api/tasks — parent creates task
router.post('/', requireRole('PARENT'), async (req, res) => {
  const { title, description, dollarAmount, assignedToId, dueDate, isRecurring, recurrence, weeklyDays, isUpForGrabs, isPerUnit, unitReward } = req.body;

  // Per-unit chore: an open, per-item-priced definition that lives in the
  // household pool forever. No assignee, never recurring, dollarAmount stays
  // null (the credit comes from unitReward * quantity at approval).
  if (isPerUnit) {
    if (!title) return res.status(400).json({ error: 'title required' });
    const reward = unitReward ? Math.round(Number(unitReward)) : null;
    if (!reward || reward <= 0) return res.status(400).json({ error: 'unitReward required for per-unit chores' });
    const task = await prisma.task.create({
      data: {
        title,
        description,
        isPerUnit: true,
        unitReward: reward,
        isUpForGrabs: true,
        assignedToId: null,
        createdById: req.user!.id,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
    return res.status(201).json(task);
  }

  const upForGrabs = Boolean(isUpForGrabs);
  // An up-for-grabs chore has no assignee; every other chore must name a child.
  if (!title || (!assignedToId && !upForGrabs)) {
    return res.status(400).json({ error: 'title and either assignedToId or isUpForGrabs required' });
  }

  // Only validate the assignee when one is given (up-for-grabs chores have none).
  if (assignedToId) {
    const child = await prisma.user.findUnique({ where: { id: assignedToId } });
    if (!child || child.parentId !== req.user!.id) return res.status(403).json({ error: 'Cannot assign to this child' });
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
      createdById: req.user!.id,
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
  // Per-unit definitions ride the same pool but are logged against, not claimed.
  if (task.isPerUnit) return res.status(400).json({ error: 'This chore is logged, not claimed' });
  if (task.status !== 'PENDING') return res.status(400).json({ error: 'This chore can no longer be claimed' });
  // Same-household check: the chore's creator must be this child's parent.
  if (task.createdById !== req.user!.parentId) return res.status(403).json({ error: 'Forbidden' });

  // Atomic claim: only the row that is still unclaimed flips to this child.
  // SQLite serializes the writes, so exactly one concurrent claim wins.
  const { count } = await prisma.task.updateMany({
    where: { id: task.id, assignedToId: null, isUpForGrabs: true },
    data: { assignedToId: req.user!.id },
  });
  if (count === 0) return res.status(409).json({ error: 'Already grabbed' });

  const claimed = await prisma.task.findUnique({ where: { id: task.id } });
  res.json(claimed);
});

// POST /api/tasks/:id/log-units — a child logs how many units of a per-unit
// chore they did. Spawns a per-child completion instance; the shared definition
// stays open so anyone (incl. this child) can log against it again.
router.post('/:id/log-units', requireRole('CHILD'), async (req, res) => {
  const n = Math.round(Number(req.body?.quantity));
  if (!Number.isInteger(n) || n < 1) return res.status(400).json({ error: 'quantity must be a whole number of at least 1' });

  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  // Must be the open per-unit definition (not a completion instance) in this child's household.
  if (!task.isPerUnit || !task.isUpForGrabs || task.assignedToId !== null) {
    return res.status(400).json({ error: 'This chore cannot be logged' });
  }
  if (task.status !== 'PENDING') return res.status(400).json({ error: 'This chore is not open' });
  if (task.createdById !== req.user!.parentId) return res.status(403).json({ error: 'Forbidden' });

  const instance = await prisma.task.create({
    data: {
      title: task.title,
      description: task.description,
      isPerUnit: true,
      unitReward: task.unitReward,
      quantity: n,
      isUpForGrabs: false,
      assignedToId: req.user!.id,
      createdById: task.createdById,
      templateId: task.templateId || task.id,
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });
  res.status(201).json(instance);
});

// PUT /api/tasks/:id
// Parent: edit title/description/amount
// Child: mark as COMPLETED
router.put('/:id', async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (req.user!.role === 'CHILD') {
    if (task.assignedToId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });
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
  if (task.createdById !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });

  // An approved task has already credited the allowance; its details are part of
  // the transaction record and must not change.
  if (task.status === 'APPROVED') return res.status(400).json({ error: 'Approved tasks cannot be edited' });

  const { title, description, dollarAmount, dueDate, assignedToId, isRecurring, recurrence, weeklyDays, isUpForGrabs } = req.body;

  const data: Prisma.TaskUpdateInput = {
    ...(title && { title }),
    ...(description !== undefined && { description }),
    ...(dollarAmount !== undefined && { dollarAmount: dollarAmount ? Math.round(Number(dollarAmount)) : null }),
    ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    ...(assignedToId && { assignedTo: { connect: { id: assignedToId } } }),
    ...(isUpForGrabs !== undefined && { isUpForGrabs: Boolean(isUpForGrabs) }),
  };

  // Recurrence is edited as a unit: the toggle, the cadence, and (for weekly) the
  // selected days. Serialize weeklyDays the same comma-separated way as create;
  // turning recurrence off clears the cadence and days.
  if (isRecurring !== undefined) {
    const recurring = Boolean(isRecurring);
    data.isRecurring = recurring;
    data.recurrence = recurring ? recurrence ?? null : null;
    const normalizedWeeklyDays =
      recurring && recurrence === 'WEEKLY'
        ? parseWeeklyDays(Array.isArray(weeklyDays) ? weeklyDays.join(',') : weeklyDays)
        : [];
    data.weeklyDays = normalizedWeeklyDays.length ? normalizedWeeklyDays.join(',') : null;
  }

  const updated = await prisma.task.update({ where: { id: task.id }, data });
  res.json(updated);
});

// POST /api/tasks/:id/complete — parent marks an assigned task as done on the
// child's behalf. This is a pure status transition with no credit; the parent
// still approves separately to credit the allowance.
router.post('/:id/complete', requireRole('PARENT'), async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.createdById !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });
  // No assignee means no one to credit on approval — an open up-for-grabs chore
  // must be claimed first.
  if (!task.assignedToId) return res.status(400).json({ error: 'Assign the chore to a child before marking it done' });
  if (task.status === 'APPROVED') return res.status(400).json({ error: 'Task is already approved' });
  // Idempotent: already awaiting approval, nothing to do.
  if (task.status === 'COMPLETED') return res.json(task);

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });
  res.json(updated);
});

// POST /api/tasks/:id/approve — parent approves, credits allowance
router.post('/:id/approve', requireRole('PARENT'), async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.status !== 'COMPLETED') return res.status(400).json({ error: 'Task is not awaiting approval' });
  if (task.createdById !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });

  // Per-unit completions credit unitReward * count; the parent may adjust the
  // count at approval. Other tasks pay the flat dollarAmount.
  const rawQty = req.body?.quantity;
  const adjustedQty = rawQty !== undefined ? Math.round(Number(rawQty)) : null;
  const effectiveQty =
    task.isPerUnit && adjustedQty !== null && Number.isInteger(adjustedQty) && adjustedQty >= 1
      ? adjustedQty
      : task.quantity;

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

    if (task.isPerUnit && task.unitReward && effectiveQty && effectiveQty >= 1) {
      if (effectiveQty !== task.quantity) {
        await tx.task.update({ where: { id: task.id }, data: { quantity: effectiveQty } });
      }
      await tx.transaction.create({
        data: {
          userId: task.assignedToId!,
          taskId: task.id,
          amount: task.unitReward * effectiveQty,
          type: 'EARNED',
        },
      });
    } else if (!task.isPerUnit && task.dollarAmount) {
      await tx.transaction.create({
        data: {
          // A COMPLETED task always has a claimer, so assignedToId is set here.
          userId: task.assignedToId!,
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
          createdById: req.user!.id,
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
  if (task.createdById !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });

  // A rejected per-unit completion is discarded — the child re-logs a corrected
  // count from the still-open definition; there is no in-place edit path.
  if (task.isPerUnit) {
    await prisma.task.delete({ where: { id: task.id } });
    return res.json({ ok: true, deleted: true });
  }

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
  if (task.createdById !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });

  // Deleting a per-unit definition would orphan its completions (templateId is
  // SET NULL on delete, and each completion already carries its own
  // unitReward/quantity, so approved history survives). Refuse only when logs
  // are still awaiting review, so the parent can't silently lose them.
  if (task.isPerUnit && task.isUpForGrabs && !task.assignedToId) {
    const pending = await prisma.task.count({ where: { templateId: task.id, status: 'COMPLETED' } });
    if (pending > 0) {
      return res.status(409).json({ error: `Review the ${pending} pending log${pending === 1 ? '' : 's'} before deleting this chore` });
    }
  }

  await prisma.task.delete({ where: { id: task.id } });
  res.json({ ok: true });
});

export default router;
