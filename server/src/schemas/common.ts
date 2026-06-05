import { z } from 'zod';

// Money is integer cents over the wire. Upper bound is $10,000 (1,000,000 cents)
// per single chore/goal/adjustment — generous enough to only catch abuse/typos.
export const MONEY_MAX = 1_000_000;

// A non-negative reward/target in integer cents. Lenient on input (accepts a
// numeric string like the old `Number(...)` paths did), strict on the result.
export const rewardCents = z.coerce.number().int().min(0).max(MONEY_MAX);

// A signed adjustment in integer cents (may be negative). Strict number so a
// missing/null amount is rejected, matching the prior `amount == null` guard.
export const adjustmentCents = z.number().int().min(-MONEY_MAX).max(MONEY_MAX);

// A strictly-positive target in integer cents (savings goals).
export const positiveCents = z.coerce.number().int().positive().max(MONEY_MAX);

// A trimmed, non-empty, length-capped display name/title.
export const nonEmptyName = z.string().trim().min(1).max(200);

// Recurrence cadence literals (mirrors the shared Recurrence union).
export const recurrence = z.enum(['DAILY', 'WEEKLY', 'MONTHLY']);

// weeklyDays is accepted as a comma string or an array of day numbers/strings;
// the route normalizes it via parseWeeklyDays, so the schema only guards shape.
export const weeklyDays = z.union([
  z.array(z.union([z.number(), z.string()])),
  z.string(),
]);

// A 4-digit child PIN.
export const pin = z.string().regex(/^\d{4}$/, 'PIN must be 4 digits');
