import { z } from 'zod';
import { rewardCents, nonEmptyName, recurrence, weeklyDays } from './common.js';

// Body for POST /api/tasks. The schema validates structure and bounds; the route
// keeps the domain forks (per-unit vs normal, assignee-required-unless-up-for-grabs,
// catchUp eligibility). Unknown keys are stripped.
export const taskCreateSchema = z.object({
  title: nonEmptyName,
  description: z.string().max(2000).nullish(),
  dollarAmount: rewardCents.nullish(),
  assignedToId: z.string().nullish(),
  dueDate: z.string().nullish(),
  isRecurring: z.boolean().nullish(),
  recurrence: recurrence.nullish(),
  weeklyDays: weeklyDays.nullish(),
  isUpForGrabs: z.boolean().nullish(),
  isPerUnit: z.boolean().nullish(),
  unitReward: rewardCents.nullish(),
  catchUp: z.boolean().nullish(),
});

// Body for PUT /api/tasks/:id. Every field is optional — the route applies only
// the keys that are present (parent edit) and the child-complete path sends none.
export const taskUpdateSchema = z.object({
  title: nonEmptyName.optional(),
  description: z.string().max(2000).nullish(),
  dollarAmount: rewardCents.nullish(),
  assignedToId: z.string().nullish(),
  dueDate: z.string().nullish(),
  isRecurring: z.boolean().nullish(),
  recurrence: recurrence.nullish(),
  weeklyDays: weeklyDays.nullish(),
  isUpForGrabs: z.boolean().nullish(),
  catchUp: z.boolean().nullish(),
});
