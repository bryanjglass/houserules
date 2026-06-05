import { z } from 'zod';
import { nonEmptyName, positiveCents } from './common.js';

// Body for POST /api/goals/:childId — a new savings goal for a child.
export const goalCreateSchema = z.object({
  title: nonEmptyName,
  targetAmount: positiveCents,
});

// Body for PATCH /api/goals/:goalId — edit title and/or target on a goal.
// Both optional; the route applies only the fields that are present.
export const goalUpdateSchema = z.object({
  title: nonEmptyName.optional(),
  targetAmount: positiveCents.optional(),
});
