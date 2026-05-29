import { Router } from 'express';
import { Prisma } from '@prisma/client';
import type { Task } from '@prisma/client';
import type { AuthUser } from '../types/domain.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  familyToday,
  dueDay,
  addDays,
  addMonths,
  dayOfWeek,
  compareDays,
  isFutureDay,
  stampLocalNoon,
  type CalDay,
} from '../lib/tz.js';

const router = Router();

router.use(requireAuth);

// How far back catch-up backfill reaches. Occurrences scheduled before
// (now - CATCHUP_WINDOW_DAYS) are never materialized, so a long-ignored daily
// chore can't explode into hundreds of overdue rows. Tune here, not inline.
const CATCHUP_WINDOW_DAYS = 14;

// Upper bound on schedule steps walked per chain, mirroring projectOccurrences.
const CATCHUP_MAX_STEPS = 400;

function parseWeeklyDays(weeklyDays: string | null | undefined): number[] {
  if (!weeklyDays) return [];
  return [...new Set(
    String(weeklyDays)
      .split(',')
      .map(d => parseInt(d, 10))
      .filter(d => Number.isInteger(d) && d >= 0 && d <= 6)
  )].sort((a, b) => a - b);
}

// A stable per-day key for de-duping occurrences regardless of stored time.
function dayKey(day: CalDay): string {
  return `${day.y}-${day.m}-${day.d}`;
}

// The next scheduled occurrence after `currentDue`, computed in CALENDAR DAYS in
// the household timezone and stamped at local noon so it can't slip across a day
// boundary under DST/offset. Reuses the same weekly/selected-day + monthly rules.
function nextDueDate(
  currentDue: Date | string | null,
  recurrence: string | null,
  weeklyDays: string | null | undefined,
  tz: string
): Date {
  const baseDay = currentDue ? dueDay(currentDue, tz) : familyToday(tz);
  let next: CalDay;
  switch (recurrence) {
    case 'DAILY':
      next = addDays(baseDay, 1);
      break;
    case 'WEEKLY': {
      const days = parseWeeklyDays(weeklyDays);
      if (days.length === 0) {
        next = addDays(baseDay, 7);
        break;
      }
      const daySet = new Set(days);
      let cur = baseDay;
      for (let i = 1; i <= 7; i++) {
        cur = addDays(cur, 1);
        if (daySet.has(dayOfWeek(cur))) break;
      }
      next = cur;
      break;
    }
    case 'MONTHLY':
      next = addMonths(baseDay, 1);
      break;
    default:
      next = baseDay;
  }
  return stampLocalNoon(next, tz);
}

// Resolve the household timezone for a request user (parent's own zone, or a
// child's via parentId) or for a task (via its creator — always the parent).
async function tzForUser(user: AuthUser): Promise<string> {
  const parentId = user.role === 'PARENT' ? user.id : user.parentId;
  if (!parentId) return 'UTC';
  const p = await prisma.user.findUnique({ where: { id: parentId }, select: { timezone: true } });
  return p?.timezone || 'UTC';
}

async function tzForTask(task: Task): Promise<string> {
  const p = await prisma.user.findUnique({ where: { id: task.createdById }, select: { timezone: true } });
  return p?.timezone || 'UTC';
}

// Project future occurrences of a recurring task within [start, end].
// Walks forward from the task's due date using the same recurrence rules as
// instance spawning. The due date itself is the materialized instance and is
// NOT emitted here. Bounded to guard against runaway daily expansion.
function projectOccurrences(task: Task, start: Date, end: Date, tz: string): Date[] {
  if (!task.isRecurring || !task.recurrence || !task.dueDate) return [];
  const occurrences: Date[] = [];
  let cursor = new Date(task.dueDate);
  const MAX_STEPS = 400;
  for (let i = 0; i < MAX_STEPS; i++) {
    cursor = nextDueDate(cursor, task.recurrence, task.weeklyDays, tz);
    if (cursor > end) break;
    if (cursor >= start) occurrences.push(new Date(cursor));
  }
  return occurrences;
}

// Backfill missed occurrences of opt-in catch-up recurring tasks as independent
// PENDING instances. The stack has no job runner, so generation runs lazily on
// read: for each catch-up chain visible under `where`, walk the recurrence
// schedule forward from the chain's latest due date (bounded by
// CATCHUP_MAX_STEPS) and materialize each scheduled date in
// [now - CATCHUP_WINDOW_DAYS, now] that has no instance yet. Idempotent across
// reads; each created row is a normal task the child completes individually and
// the parent approves separately (approval credits but does not spawn — see
// the !catchUp guard in /approve). Non-catch-up, up-for-grabs, and due-date-less
// recurring tasks are excluded and keep the single-tip, approve-time spawn.
async function backfillCatchUpOccurrences(where: Prisma.TaskWhereInput, tz: string): Promise<void> {
  const candidates = await prisma.task.findMany({
    where: {
      AND: [
        where,
        {
          isRecurring: true,
          catchUp: true,
          isUpForGrabs: false,
          assignedToId: { not: null },
          dueDate: { not: null },
          recurrence: { not: null },
        },
      ],
    },
  });
  if (candidates.length === 0) return;

  // Group every visible instance by its chain root. The representative row holds
  // the chain's schedule/settings; `dayKeys` is the set of calendar days already
  // present (compared by day, not timestamp, so pre-existing rows not stamped at
  // local noon still de-dupe). All instances of a catch-up chain stay assigned to
  // the same child, so they all fall under `where` and are seen here.
  const byRoot = new Map<string, { rep: Task; dayKeys: Set<string>; maxDue: Date }>();
  for (const c of candidates) {
    if (!c.dueDate) continue;
    const root = c.templateId || c.id;
    const due = new Date(c.dueDate);
    let entry = byRoot.get(root);
    if (!entry) {
      entry = { rep: c, dayKeys: new Set(), maxDue: due };
      byRoot.set(root, entry);
    }
    entry.dayKeys.add(dayKey(dueDay(due, tz)));
    if (due > entry.maxDue) {
      entry.maxDue = due;
      entry.rep = c;
    }
  }

  const today = familyToday(tz);
  const windowStartDay = addDays(today, -CATCHUP_WINDOW_DAYS);

  for (const [root, { rep, dayKeys, maxDue }] of byRoot) {
    let cursor = new Date(maxDue);
    const toCreate: Date[] = [];
    for (let i = 0; i < CATCHUP_MAX_STEPS; i++) {
      cursor = nextDueDate(cursor, rep.recurrence, rep.weeklyDays, tz);
      const cd = dueDay(cursor, tz);
      if (compareDays(cd, today) > 0) break; // never backfill future days
      if (compareDays(cd, windowStartDay) >= 0 && !dayKeys.has(dayKey(cd))) {
        toCreate.push(new Date(cursor));
        dayKeys.add(dayKey(cd));
      }
    }
    if (toCreate.length === 0) continue;

    // Re-check existence inside the transaction immediately before each insert so
    // two concurrent reads can't both materialize the same (root, day).
    await prisma.$transaction(async (tx) => {
      for (const due of toCreate) {
        const exists = await tx.task.count({
          where: { dueDate: due, OR: [{ id: root }, { templateId: root }] },
        });
        if (exists > 0) continue;
        await tx.task.create({
          data: {
            title: rep.title,
            description: rep.description,
            dollarAmount: rep.dollarAmount,
            assignedToId: rep.assignedToId,
            createdById: rep.createdById,
            isUpForGrabs: false,
            dueDate: due,
            isRecurring: true,
            recurrence: rep.recurrence,
            weeklyDays: rep.weeklyDays,
            catchUp: true,
            templateId: root,
          },
        });
      }
    });
  }
}

// Ensure every assigned (non-up-for-grabs) recurring chain always has one live
// instance, so the chore never disappears from the parent's lists and stays
// editable once prior instances are completed/approved. When a chain has no
// non-APPROVED instance, materialize the next occurrence after its latest due
// day. That occurrence may be in the future (the "tip" the kid sees but can't
// complete until its day — see the future-completion guard). Runs on read; this
// replaces approve-time spawning for assigned recurring tasks. Up-for-grabs
// recurring chores keep their approve-time reopen-to-pool spawn (their pool
// instances aren't uniformly visible per requester, so a read-time tip is unsafe).
async function ensureLiveTips(where: Prisma.TaskWhereInput, tz: string): Promise<void> {
  const candidates = await prisma.task.findMany({
    where: {
      AND: [
        where,
        {
          isRecurring: true,
          isUpForGrabs: false,
          assignedToId: { not: null },
          dueDate: { not: null },
          recurrence: { not: null },
        },
      ],
    },
  });
  if (candidates.length === 0) return;

  const byRoot = new Map<string, { rep: Task; hasLive: boolean; maxDue: Date; dayKeys: Set<string> }>();
  for (const c of candidates) {
    if (!c.dueDate) continue;
    const root = c.templateId || c.id;
    const due = new Date(c.dueDate);
    let entry = byRoot.get(root);
    if (!entry) {
      entry = { rep: c, hasLive: false, maxDue: due, dayKeys: new Set() };
      byRoot.set(root, entry);
    }
    entry.dayKeys.add(dayKey(dueDay(due, tz)));
    if (c.status !== 'APPROVED') entry.hasLive = true;
    if (due > entry.maxDue) {
      entry.maxDue = due;
      entry.rep = c;
    }
  }

  for (const [root, { rep, hasLive, maxDue, dayKeys }] of byRoot) {
    if (hasLive) continue; // a PENDING/COMPLETED/REJECTED instance already exists
    const tipDue = nextDueDate(maxDue, rep.recurrence, rep.weeklyDays, tz);
    if (dayKeys.has(dayKey(dueDay(tipDue, tz)))) continue;

    await prisma.$transaction(async (tx) => {
      const exists = await tx.task.count({
        where: { dueDate: tipDue, OR: [{ id: root }, { templateId: root }] },
      });
      if (exists > 0) return;
      await tx.task.create({
        data: {
          title: rep.title,
          description: rep.description,
          dollarAmount: rep.dollarAmount,
          assignedToId: rep.assignedToId,
          createdById: rep.createdById,
          isUpForGrabs: false,
          dueDate: tipDue,
          isRecurring: true,
          recurrence: rep.recurrence,
          weeklyDays: rep.weeklyDays,
          catchUp: rep.catchUp,
          templateId: root,
        },
      });
    });
  }
}

// GET /api/tasks
// Parent: all tasks for their children
// Child: their own tasks
router.get('/', async (req, res) => {
  const user = req.user!;
  const tz = await tzForUser(user);

  // Tag each task with `upcoming`: a recurring, assigned occurrence whose due day
  // is still in the future. The client uses it to lock the complete action and
  // show an "available later" state; the server guard (PUT, /complete) enforces it.
  const withUpcoming = <T extends Task>(t: T) => ({
    ...t,
    upcoming: t.isRecurring && !t.isUpForGrabs && !!t.dueDate && isFutureDay(t.dueDate, tz),
  });

  if (user.role === 'PARENT') {
    const children = await prisma.user.findMany({ where: { parentId: user.id }, select: { id: true } });
    const childIds = children.map(c => c.id);
    // Children's tasks, plus the parent's own up-for-grabs chores (open chores
    // have no assignee, so they'd be missed by the assignedToId filter alone).
    const where = { OR: [{ assignedToId: { in: childIds } }, { createdById: user.id }] };
    // Generate on read: backfill missed catch-up occurrences, then ensure every
    // assigned recurring chain has a live tip so nothing disappears.
    await backfillCatchUpOccurrences(where, tz);
    await ensureLiveTips(where, tz);
    const tasks = await prisma.task.findMany({
      where,
      include: { assignedTo: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(tasks.map(withUpcoming));
  }

  // The child's own tasks, plus the household's unclaimed up-for-grabs pool.
  const where = {
    OR: [
      { assignedToId: user.id },
      { isUpForGrabs: true, assignedToId: null, createdById: user.parentId as string },
    ],
  };
  await backfillCatchUpOccurrences(where, tz);
  await ensureLiveTips(where, tz);
  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  res.json(tasks.map(withUpcoming));
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

  const tz = await tzForUser(user);
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
      for (const date of projectOccurrences(task, startDate, endDate, tz)) {
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
  const { title, description, dollarAmount, assignedToId, dueDate, isRecurring, recurrence, weeklyDays, isUpForGrabs, isPerUnit, unitReward, catchUp } = req.body;

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
      // catch-up only applies to a recurring, assigned, non-up-for-grabs chore.
      catchUp: Boolean(isRecurring) && !upForGrabs && Boolean(assignedToId) && Boolean(catchUp),
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
    // A future recurring occurrence (the upcoming "tip") can't be completed early.
    if (task.isRecurring && !task.isUpForGrabs && task.dueDate && isFutureDay(task.dueDate, await tzForTask(task))) {
      return res.status(400).json({ error: "This isn't due yet — you can complete it on its day." });
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

  const { title, description, dollarAmount, dueDate, assignedToId, isRecurring, recurrence, weeklyDays, isUpForGrabs, catchUp } = req.body;

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

  // catch-up is only meaningful for a recurring, assigned, non-up-for-grabs chore.
  // Recompute whenever recurrence, assignment, up-for-grabs, or the flag itself
  // changes; turning recurrence off or making the chore up-for-grabs clears it.
  if (catchUp !== undefined || isRecurring !== undefined || isUpForGrabs !== undefined || assignedToId !== undefined) {
    const effectiveRecurring = isRecurring !== undefined ? Boolean(isRecurring) : task.isRecurring;
    const effectiveUpForGrabs = isUpForGrabs !== undefined ? Boolean(isUpForGrabs) : task.isUpForGrabs;
    const effectiveAssignee = assignedToId ?? task.assignedToId;
    const wantCatchUp = catchUp !== undefined ? Boolean(catchUp) : task.catchUp;
    data.catchUp = effectiveRecurring && !effectiveUpForGrabs && !!effectiveAssignee && wantCatchUp;
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
  // A future recurring occurrence (the upcoming "tip") can't be completed early.
  if (task.isRecurring && !task.isUpForGrabs && task.dueDate && isFutureDay(task.dueDate, await tzForTask(task))) {
    return res.status(400).json({ error: "This isn't due yet — it can be completed on its day." });
  }

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
  const tz = await tzForTask(task);
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

    // Spawn next recurring instance — only for up-for-grabs recurring chores,
    // which reopen to the household pool on approval. Assigned recurring tasks no
    // longer spawn here: their next occurrence (the live "tip") is materialized on
    // read by ensureLiveTips, so spawning here too would double-generate.
    if (task.isRecurring && task.recurrence && task.isUpForGrabs) {
      const templateId = task.templateId || task.id;
      await tx.task.create({
        data: {
          title: task.title,
          description: task.description,
          dollarAmount: task.dollarAmount,
          // Up-for-grabs chores reopen unassigned to the whole household.
          assignedToId: null,
          isUpForGrabs: true,
          createdById: req.user!.id,
          dueDate: nextDueDate(task.dueDate, task.recurrence, task.weeklyDays, tz),
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
