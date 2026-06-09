import { Router } from 'express';
import { Prisma } from '@prisma/client';
import type { Chore, ChoreCompletion } from '@prisma/client';
import type { AuthUser } from '../types/domain.js';
import { prisma } from '../lib/prisma.js';
import { notifyUser } from '../lib/push.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validateBody } from '../lib/validation.js';
import { choreCreateSchema, choreUpdateSchema, completeSchema, logUnitsSchema } from '../schemas/chore.js';
import { todayKey, parseDayKeyInput, compareDayKeys, DAY_KEY_RE, type DayKey } from '../lib/tz.js';
import { firstOccurrenceKey, parseWeeklyDays } from '../lib/recurrence.js';
import {
  ONCE_KEY,
  assignedOccurrences,
  firstUnresolvedKey,
  occurrenceKeysInWindow,
} from '../lib/projection.js';

const router = Router();

router.use(requireAuth);

type ChildRef = { id: string; name: string } | null;
type ChoreWithAssignee = Chore & { assignee?: ChildRef };
type CompletionWithChild = ChoreCompletion & { child?: ChildRef };

// Resolve the household timezone for a request user (parent's own zone, or a
// child's via parentId).
async function tzForUser(user: AuthUser): Promise<string> {
  const parentId = user.role === 'PARENT' ? user.id : user.parentId;
  if (!parentId) return 'UTC';
  const p = await prisma.user.findUnique({ where: { id: parentId }, select: { timezone: true } });
  return p?.timezone || 'UTC';
}

// True when a Prisma error is the (choreId, occurrenceKey) unique-constraint
// violation — the loser of a claim/complete race.
function isOccurrenceConflict(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

// The calendar day an item shows under: a day-like occurrence key is its own
// day; "once" (and per-unit logs) fall back to the chore's startDay.
function dueDayOf(occurrenceKey: string | null, chore: Chore): DayKey | null {
  if (occurrenceKey && DAY_KEY_RE.test(occurrenceKey)) return occurrenceKey;
  return chore.startDay;
}

// ---- View building ---------------------------------------------------------
// An "item" is one visible unit of work: a completion row, or a projected
// occurrence / pool entry that has no row yet. Projections carry a synthetic id
// (`choreId:key`) and a null completionId; acting on one creates the row.

function completionItem(c: CompletionWithChild, chore: Chore) {
  return {
    id: c.id,
    choreId: chore.id,
    completionId: c.id,
    occurrenceKey: c.occurrenceKey,
    kind: chore.kind,
    title: chore.title,
    description: chore.description,
    recurrence: chore.recurrence,
    status: c.status,
    rewardCents: c.rewardCents,
    unitRewardCents: chore.unitRewardCents,
    quantity: c.quantity,
    childId: c.childId,
    child: c.child ?? null,
    dueDay: dueDayOf(c.occurrenceKey, chore),
    upcoming: false,
    completedAt: c.completedAt,
    approvedAt: c.approvedAt,
    createdAt: c.createdAt,
  };
}

function projectedItem(chore: ChoreWithAssignee, occurrenceKey: string | null, upcoming: boolean) {
  const assigned = chore.kind === 'ASSIGNED';
  return {
    id: `${chore.id}:${occurrenceKey ?? 'log'}`,
    choreId: chore.id,
    completionId: null,
    occurrenceKey,
    kind: chore.kind,
    title: chore.title,
    description: chore.description,
    recurrence: chore.recurrence,
    status: 'PENDING',
    rewardCents: chore.rewardCents,
    unitRewardCents: chore.unitRewardCents,
    quantity: null,
    childId: assigned ? chore.assigneeId : null,
    child: assigned ? (chore.assignee ?? null) : null,
    dueDay: dueDayOf(occurrenceKey, chore),
    upcoming,
    completedAt: null,
    approvedAt: null,
    createdAt: chore.createdAt,
  };
}

// Group a chore's completions and derive the projection inputs: the set of
// resolved occurrence keys (any status) and whether un-approved work exists.
function projectionInputs(completions: ChoreCompletion[]) {
  const resolved = new Set<string>();
  let hasOpenWork = false;
  for (const c of completions) {
    if (c.occurrenceKey) resolved.add(c.occurrenceKey);
    if (c.status !== 'APPROVED') hasOpenWork = true;
  }
  return { resolved, hasOpenWork };
}

// Build the merged item list for a viewer. `chores` is every household chore
// (including archived, for completion titles); `allCompletions` is every
// completion visible for pool resolution; `visibleCompletions` is the subset
// the viewer actually sees as items (a child sees only their own).
function buildItems(
  chores: ChoreWithAssignee[],
  allCompletions: CompletionWithChild[],
  visibleCompletions: CompletionWithChild[],
  viewer: AuthUser,
  today: DayKey
) {
  const choreById = new Map(chores.map(c => [c.id, c]));
  const byChore = new Map<string, ChoreCompletion[]>();
  for (const c of allCompletions) {
    let list = byChore.get(c.choreId);
    if (!list) byChore.set(c.choreId, (list = []));
    list.push(c);
  }

  const items: ReturnType<typeof completionItem | typeof projectedItem>[] = [];
  for (const c of visibleCompletions) {
    const chore = choreById.get(c.choreId);
    if (chore) items.push(completionItem(c, chore));
  }

  for (const chore of chores) {
    if (chore.archivedAt) continue; // archived chores stop projecting
    const { resolved, hasOpenWork } = projectionInputs(byChore.get(chore.id) ?? []);

    if (chore.kind === 'ASSIGNED') {
      if (viewer.role === 'CHILD' && chore.assigneeId !== viewer.id) continue;
      for (const occ of assignedOccurrences(chore, resolved, hasOpenWork, today)) {
        items.push(projectedItem(chore, occ.key, occ.upcoming));
      }
    } else if (chore.kind === 'OPEN') {
      // Pool entry: the current occurrence, shown only while unclaimed.
      if (!chore.recurrence) {
        if ((byChore.get(chore.id) ?? []).length === 0) items.push(projectedItem(chore, ONCE_KEY, false));
      } else {
        const key = firstUnresolvedKey(chore, resolved);
        if (key) items.push(projectedItem(chore, key, compareDayKeys(key, today) > 0));
      }
    } else if (chore.kind === 'PER_UNIT') {
      // Always loggable while active; logs don't resolve anything.
      items.push(projectedItem(chore, null, false));
    }
  }
  return items;
}

// Fetch the viewer-scoped chores and completions. Children additionally see
// every completion of the household's OPEN chores (needed to resolve the pool),
// but only their own completions become items.
async function loadView(user: AuthUser) {
  const householdId = user.role === 'PARENT' ? user.id : user.parentId!;
  const chores: ChoreWithAssignee[] = await prisma.chore.findMany({
    where: { householdId },
    include: { assignee: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const allCompletions: CompletionWithChild[] = await prisma.choreCompletion.findMany({
    where: { chore: { householdId } },
    include: { child: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const visibleCompletions =
    user.role === 'PARENT' ? allCompletions : allCompletions.filter(c => c.childId === user.id);
  return { chores, allCompletions, visibleCompletions };
}

// GET /api/chores — definitions plus the merged actionable item list.
// Parent: every household chore and every completion. Child: their own work,
// the household pool, and the chore definitions for context. Pure read.
router.get('/', async (req, res) => {
  const user = req.user!;
  const tz = await tzForUser(user);
  const today = todayKey(tz);
  const { chores, allCompletions, visibleCompletions } = await loadView(user);
  const items = buildItems(chores, allCompletions, visibleCompletions, user, today);
  res.json({
    chores: chores.filter(c => !c.archivedAt),
    items,
  });
});

// GET /api/chores/calendar?start=&end= — completions plus schedule projections
// across a day-key range. Events carry `date` as a day key; `projected` marks
// future occurrences with no completion (dashed in the UI).
router.get('/calendar', async (req, res) => {
  const start = parseDayKeyInput(typeof req.query.start === 'string' ? req.query.start : null);
  const end = parseDayKeyInput(typeof req.query.end === 'string' ? req.query.end : null);
  if (!start || !end) {
    return res.status(400).json({ error: 'start and end query params are required as YYYY-MM-DD' });
  }
  if (compareDayKeys(start, end) > 0) {
    return res.status(400).json({ error: 'start must not be after end' });
  }

  const user = req.user!;
  const tz = await tzForUser(user);
  const today = todayKey(tz);
  const isParent = user.role === 'PARENT';
  const { chores, allCompletions, visibleCompletions } = await loadView(user);

  const byChore = new Map<string, ChoreCompletion[]>();
  for (const c of allCompletions) {
    let list = byChore.get(c.choreId);
    if (!list) byChore.set(c.choreId, (list = []));
    list.push(c);
  }
  const choreById = new Map(chores.map(c => [c.id, c]));

  const events: Array<Record<string, unknown>> = [];
  const base = (chore: ChoreWithAssignee) => ({
    choreId: chore.id,
    title: chore.title,
    kind: chore.kind,
    recurrence: chore.recurrence,
  });

  // Completion events on the day they resolve (per-unit logs have no day and
  // stay off the calendar).
  for (const c of visibleCompletions) {
    const chore = choreById.get(c.choreId);
    if (!chore) continue;
    const day = dueDayOf(c.occurrenceKey, chore);
    if (!day || compareDayKeys(day, start) < 0 || compareDayKeys(day, end) > 0) continue;
    events.push({
      ...base(chore),
      id: c.id,
      completionId: c.id,
      status: c.status,
      rewardCents: c.rewardCents,
      child: isParent ? (c.child ?? null) : null,
      date: day,
      projected: false,
    });
  }

  // Projected occurrences from each active chore's schedule. Days resolved by
  // ANY completion are excluded (the claimer/assignee shows the row instead;
  // siblings simply don't see a claimed occurrence).
  for (const chore of chores) {
    if (chore.archivedAt) continue;
    if (chore.kind === 'ASSIGNED' && user.role === 'CHILD' && chore.assigneeId !== user.id) continue;

    const { resolved } = projectionInputs(byChore.get(chore.id) ?? []);
    const projectionEvent = (day: DayKey) => ({
      ...base(chore),
      id: `${chore.id}:${day}`,
      completionId: null,
      status: 'PENDING',
      rewardCents: chore.rewardCents,
      child: isParent && chore.kind === 'ASSIGNED' ? (chore.assignee ?? null) : null,
      date: day,
      projected: compareDayKeys(day, today) > 0,
    });

    if (chore.recurrence) {
      for (const day of occurrenceKeysInWindow(chore, start, end)) {
        if (!resolved.has(day)) events.push(projectionEvent(day));
      }
    } else if (chore.startDay && !resolved.has(ONCE_KEY) && (byChore.get(chore.id) ?? []).length === 0) {
      if (compareDayKeys(chore.startDay, start) >= 0 && compareDayKeys(chore.startDay, end) <= 0) {
        events.push(projectionEvent(chore.startDay));
      }
    }
  }

  res.json(events);
});

// GET /api/chores/:id — a single definition, for the parent edit form.
router.get('/:id', requireRole('PARENT'), async (req, res) => {
  const chore = await prisma.chore.findUnique({
    where: { id: req.params.id },
    include: { assignee: { select: { id: true, name: true } } },
  });
  if (!chore) return res.status(404).json({ error: 'Chore not found' });
  if (chore.householdId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });
  res.json(chore);
});

// POST /api/chores — parent creates a chore definition.
router.post('/', requireRole('PARENT'), validateBody(choreCreateSchema), async (req, res) => {
  const { title, description, kind, rewardCents, unitRewardCents, assigneeId, startDay, recurrence, weeklyDays, missedPolicy } = req.body;
  const tz = await tzForUser(req.user!);

  // Per-kind invariants.
  if (kind === 'ASSIGNED') {
    if (!assigneeId) return res.status(400).json({ error: 'assigneeId required for an assigned chore' });
    const child = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (!child || child.parentId !== req.user!.id) return res.status(403).json({ error: 'Cannot assign to this child' });
  }
  if (kind === 'PER_UNIT') {
    if (!unitRewardCents || unitRewardCents <= 0) return res.status(400).json({ error: 'unitRewardCents required for a per-unit chore' });
    if (recurrence) return res.status(400).json({ error: 'A per-unit chore cannot be recurring' });
  }

  const isRecurring = kind !== 'PER_UNIT' && !!recurrence;
  const normalizedDays =
    isRecurring && recurrence === 'WEEKLY'
      ? parseWeeklyDays(Array.isArray(weeklyDays) ? weeklyDays.join(',') : weeklyDays)
      : [];
  const weeklyDaysStr = normalizedDays.length ? normalizedDays.join(',') : null;

  // A recurring chore is always anchored to a concrete first scheduled
  // occurrence: an empty start means "from today", and weekly-with-days snaps
  // forward onto the schedule. A one-off keeps the chosen day (or none).
  const inputDay = parseDayKeyInput(startDay ?? null);
  const finalStartDay = isRecurring
    ? firstOccurrenceKey(inputDay ?? todayKey(tz), recurrence!, weeklyDaysStr)
    : inputDay;

  const chore = await prisma.chore.create({
    data: {
      householdId: req.user!.id,
      kind,
      title,
      description: description ?? null,
      rewardCents: kind === 'PER_UNIT' ? null : rewardCents || null,
      unitRewardCents: kind === 'PER_UNIT' ? unitRewardCents! : null,
      assigneeId: kind === 'ASSIGNED' ? assigneeId! : null,
      recurrence: isRecurring ? recurrence! : null,
      weeklyDays: weeklyDaysStr,
      startDay: finalStartDay,
      // The missed policy only means something for a recurring assigned chore.
      missedPolicy: kind === 'ASSIGNED' && isRecurring && missedPolicy ? missedPolicy : 'CURRENT_ONLY',
    },
  });

  if (chore.assigneeId) {
    notifyUser(chore.assigneeId, { title: 'New chore', body: chore.title });
  }

  res.status(201).json(chore);
});

// PUT /api/chores/:id — parent edits the definition. Edits never touch existing
// completions (their snapshot rewards are fixed), only future occurrences.
router.put('/:id', requireRole('PARENT'), validateBody(choreUpdateSchema), async (req, res) => {
  const chore = await prisma.chore.findUnique({ where: { id: req.params.id } });
  if (!chore) return res.status(404).json({ error: 'Chore not found' });
  if (chore.householdId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });
  if (chore.archivedAt) return res.status(400).json({ error: 'Archived chores cannot be edited' });

  const { title, description, rewardCents, unitRewardCents, assigneeId, startDay, recurrence, weeklyDays, missedPolicy } = req.body;
  const tz = await tzForUser(req.user!);

  if (assigneeId !== undefined && assigneeId !== null) {
    if (chore.kind !== 'ASSIGNED') return res.status(400).json({ error: 'Only an assigned chore has an assignee' });
    const child = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (!child || child.parentId !== req.user!.id) return res.status(403).json({ error: 'Cannot assign to this child' });
  }

  // Recurrence is edited as a unit: cadence, weekly days, and start day. The
  // effective values fall back to the stored chore for fields not in the request.
  const recurrenceProvided = recurrence !== undefined;
  const effectiveRecurrence = recurrenceProvided ? recurrence ?? null : chore.recurrence;
  if (chore.kind === 'PER_UNIT' && effectiveRecurrence) {
    return res.status(400).json({ error: 'A per-unit chore cannot be recurring' });
  }
  const daysProvided = weeklyDays !== undefined;
  const normalizedDays =
    effectiveRecurrence === 'WEEKLY'
      ? parseWeeklyDays(
          daysProvided ? (Array.isArray(weeklyDays) ? weeklyDays.join(',') : weeklyDays) : chore.weeklyDays
        )
      : [];
  const weeklyDaysStr = normalizedDays.length ? normalizedDays.join(',') : null;

  const data: Prisma.ChoreUpdateInput = {
    ...(title && { title }),
    ...(description !== undefined && { description }),
    ...(rewardCents !== undefined && chore.kind !== 'PER_UNIT' && { rewardCents: rewardCents || null }),
    ...(unitRewardCents !== undefined && chore.kind === 'PER_UNIT' && unitRewardCents
      ? { unitRewardCents }
      : {}),
    ...(assigneeId && chore.kind === 'ASSIGNED' && { assignee: { connect: { id: assigneeId } } }),
  };

  const startProvided = startDay !== undefined;
  const inputDay = startProvided ? parseDayKeyInput(startDay) : null;
  if (recurrenceProvided || daysProvided || startProvided) {
    data.recurrence = effectiveRecurrence;
    data.weeklyDays = weeklyDaysStr;
    if (effectiveRecurrence) {
      // Re-anchor to the first scheduled occurrence on/after the chosen (or
      // current, or today's) day so projections stay on-schedule.
      const anchor = inputDay ?? chore.startDay ?? todayKey(tz);
      data.startDay = firstOccurrenceKey(anchor, effectiveRecurrence, weeklyDaysStr);
    } else {
      data.startDay = startProvided ? inputDay : chore.startDay;
    }
  }

  // The missed policy stays meaningful only while the chore is assigned + recurring.
  if (missedPolicy !== undefined || recurrenceProvided) {
    const wantPolicy = missedPolicy ?? chore.missedPolicy;
    data.missedPolicy = chore.kind === 'ASSIGNED' && effectiveRecurrence ? wantPolicy : 'CURRENT_ONLY';
  }

  const updated = await prisma.chore.update({ where: { id: chore.id }, data });
  res.json(updated);
});

// Resolve the occurrence a request targets: one-offs always resolve "once";
// recurring chores need a concrete day key.
function requestedKey(chore: Chore, raw: string | null | undefined): string | null {
  if (!chore.recurrence) return ONCE_KEY;
  return parseDayKeyInput(raw ?? null);
}

// POST /api/chores/:id/complete — resolve an occurrence as done, awaiting
// approval. A child completes their own work (assigned occurrence, or an
// occurrence they claimed); a parent may complete on the child's behalf. Either
// flips an existing PENDING row or creates the row — the unique constraint on
// (choreId, occurrenceKey) serializes concurrent attempts.
router.post('/:id/complete', validateBody(completeSchema), async (req, res) => {
  const user = req.user!;
  const chore = await prisma.chore.findUnique({ where: { id: req.params.id } });
  if (!chore) return res.status(404).json({ error: 'Chore not found' });
  const householdId = user.role === 'PARENT' ? user.id : user.parentId;
  if (chore.householdId !== householdId) return res.status(403).json({ error: 'Forbidden' });
  if (chore.archivedAt) return res.status(400).json({ error: 'This chore is archived' });
  if (chore.kind === 'PER_UNIT') return res.status(400).json({ error: 'This chore is logged, not completed' });

  const key = requestedKey(chore, req.body.occurrenceKey);
  if (!key) return res.status(400).json({ error: 'occurrenceKey required for a recurring chore' });

  const existing = await prisma.choreCompletion.findUnique({
    where: { choreId_occurrenceKey: { choreId: chore.id, occurrenceKey: key } },
  });

  if (existing) {
    if (user.role === 'CHILD' && existing.childId !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (existing.status === 'APPROVED') return res.status(400).json({ error: 'Already approved' });
    if (existing.status === 'COMPLETED') return res.json(existing); // idempotent
    const updated = await prisma.choreCompletion.update({
      where: { id: existing.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    if (user.role === 'CHILD') {
      notifyUser(chore.householdId, { title: 'Chore done — needs approval', body: chore.title });
    }
    return res.json(updated);
  }

  // No row yet: only an ASSIGNED occurrence can be completed directly (an OPEN
  // chore must be claimed first, which creates the row).
  if (chore.kind !== 'ASSIGNED' || !chore.assigneeId) {
    return res.status(400).json({ error: 'This chore must be claimed before it can be completed' });
  }
  if (user.role === 'CHILD' && chore.assigneeId !== user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // The key must be an occurrence that is actionable right now — this enforces
  // both the schedule and the future-day lock on recurring tips.
  const tz = await tzForUser(user);
  const today = todayKey(tz);
  const others = await prisma.choreCompletion.findMany({ where: { choreId: chore.id } });
  const { resolved, hasOpenWork } = projectionInputs(others);
  const occurrences = assignedOccurrences(chore, resolved, hasOpenWork, today);
  const occ = occurrences.find(o => o.key === key);
  if (!occ) return res.status(400).json({ error: 'This occurrence cannot be completed' });
  if (occ.upcoming) return res.status(400).json({ error: "This isn't due yet — it can be completed on its day." });

  try {
    const created = await prisma.choreCompletion.create({
      data: {
        choreId: chore.id,
        childId: chore.assigneeId,
        occurrenceKey: key,
        status: 'COMPLETED',
        rewardCents: chore.rewardCents,
        completedAt: new Date(),
      },
    });
    if (user.role === 'CHILD') {
      notifyUser(chore.householdId, { title: 'Chore done — needs approval', body: chore.title });
    }
    return res.status(201).json(created);
  } catch (err) {
    if (isOccurrenceConflict(err)) return res.status(409).json({ error: 'Already completed' });
    throw err;
  }
});

// POST /api/chores/:id/claim — a child grabs the current occurrence of an OPEN
// chore. The unique constraint makes the race atomic: first insert wins.
router.post('/:id/claim', requireRole('CHILD'), async (req, res) => {
  const chore = await prisma.chore.findUnique({ where: { id: req.params.id } });
  if (!chore) return res.status(404).json({ error: 'Chore not found' });
  if (chore.householdId !== req.user!.parentId) return res.status(403).json({ error: 'Forbidden' });
  if (chore.kind === 'PER_UNIT') return res.status(400).json({ error: 'This chore is logged, not claimed' });
  if (chore.kind !== 'OPEN') return res.status(400).json({ error: 'This chore is not up for grabs' });
  if (chore.archivedAt) return res.status(400).json({ error: 'This chore is archived' });

  let key: string | null;
  if (!chore.recurrence) {
    const taken = await prisma.choreCompletion.count({ where: { choreId: chore.id } });
    if (taken > 0) return res.status(409).json({ error: 'Already grabbed' });
    key = ONCE_KEY;
  } else {
    const completions = await prisma.choreCompletion.findMany({ where: { choreId: chore.id } });
    const { resolved } = projectionInputs(completions);
    key = firstUnresolvedKey(chore, resolved);
    if (!key) return res.status(400).json({ error: 'This chore can no longer be claimed' });
  }

  try {
    const claimed = await prisma.choreCompletion.create({
      data: {
        choreId: chore.id,
        childId: req.user!.id,
        occurrenceKey: key,
        status: 'PENDING',
        rewardCents: chore.rewardCents,
      },
    });
    return res.json(claimed);
  } catch (err) {
    if (isOccurrenceConflict(err)) return res.status(409).json({ error: 'Already grabbed' });
    throw err;
  }
});

// POST /api/chores/:id/log-units — a child logs how many units of a per-unit
// chore they did. Logs carry no occurrence key, so they are unlimited and
// concurrent logs never conflict; the chore stays open in the pool.
router.post('/:id/log-units', requireRole('CHILD'), validateBody(logUnitsSchema), async (req, res) => {
  const { quantity } = req.body;
  const chore = await prisma.chore.findUnique({ where: { id: req.params.id } });
  if (!chore) return res.status(404).json({ error: 'Chore not found' });
  if (chore.kind !== 'PER_UNIT' || !chore.unitRewardCents) {
    return res.status(400).json({ error: 'This chore cannot be logged' });
  }
  if (chore.householdId !== req.user!.parentId) return res.status(403).json({ error: 'Forbidden' });
  if (chore.archivedAt) return res.status(400).json({ error: 'This chore is archived' });

  const log = await prisma.choreCompletion.create({
    data: {
      choreId: chore.id,
      childId: req.user!.id,
      occurrenceKey: null,
      status: 'COMPLETED',
      quantity,
      // Snapshot at log time: approval pays this even if the parent later edits
      // the chore's unit reward.
      rewardCents: chore.unitRewardCents * quantity,
      completedAt: new Date(),
    },
  });
  notifyUser(chore.householdId, { title: 'Chore done — needs approval', body: chore.title });
  res.status(201).json(log);
});

// DELETE /api/chores/:id — archive. Refused while completions await review so
// un-reviewed work is never silently dropped; approved history is preserved.
router.delete('/:id', requireRole('PARENT'), async (req, res) => {
  const chore = await prisma.chore.findUnique({ where: { id: req.params.id } });
  if (!chore) return res.status(404).json({ error: 'Chore not found' });
  if (chore.householdId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });
  if (chore.archivedAt) return res.json({ ok: true });

  const pending = await prisma.choreCompletion.count({
    where: { choreId: chore.id, status: 'COMPLETED' },
  });
  if (pending > 0) {
    return res.status(409).json({
      error: `Review the ${pending} pending completion${pending === 1 ? '' : 's'} before archiving this chore`,
    });
  }

  await prisma.chore.update({ where: { id: chore.id }, data: { archivedAt: new Date() } });
  res.json({ ok: true });
});

export default router;
