import { z } from 'zod';
import { rewardCents, nonEmptyName, recurrence, weeklyDays } from './common.js';

// Kind and missed-occurrence policy literals (mirror the shared domain unions).
export const choreKind = z.enum(['ASSIGNED', 'OPEN', 'PER_UNIT']);
export const missedPolicy = z.enum(['CURRENT_ONLY', 'BACKFILL_14D']);

// A household-local calendar day from <input type="date">. The route normalizes
// '' to null via parseDayKeyInput, so the schema only guards shape.
const dayInput = z.string().max(30);

// Body for POST /api/chores. The schema validates structure and bounds; the
// route enforces the per-kind invariants (ASSIGNED needs an assignee, PER_UNIT
// needs a positive unit reward and no recurrence). Unknown keys are stripped.
export const choreCreateSchema = z.object({
  title: nonEmptyName,
  description: z.string().max(2000).nullish(),
  kind: choreKind,
  rewardCents: rewardCents.nullish(),
  unitRewardCents: rewardCents.nullish(),
  assigneeId: z.string().nullish(),
  startDay: dayInput.nullish(),
  recurrence: recurrence.nullish(),
  weeklyDays: weeklyDays.nullish(),
  missedPolicy: missedPolicy.nullish(),
});

// Body for PUT /api/chores/:id. Every field is optional — the route applies
// only the keys that are present. Kind is immutable and not accepted here.
export const choreUpdateSchema = z.object({
  title: nonEmptyName.optional(),
  description: z.string().max(2000).nullish(),
  rewardCents: rewardCents.nullish(),
  unitRewardCents: rewardCents.nullish(),
  assigneeId: z.string().nullish(),
  startDay: dayInput.nullish(),
  recurrence: recurrence.nullish(),
  weeklyDays: weeklyDays.nullish(),
  missedPolicy: missedPolicy.nullish(),
});

// Body for POST /api/chores/:id/complete — the occurrence being resolved.
// Optional for one-offs (which always resolve "once").
export const completeSchema = z.object({
  occurrenceKey: z.string().max(30).nullish(),
});

// Body for POST /api/chores/:id/log-units.
export const logUnitsSchema = z.object({
  quantity: z.coerce.number().int().min(1),
});

// Body for POST /api/completions/:id/approve — optional per-unit count adjust.
export const approveSchema = z.object({
  quantity: z.coerce.number().int().min(1).nullish(),
});
