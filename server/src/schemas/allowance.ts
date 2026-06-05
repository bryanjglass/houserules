import { z } from 'zod';
import { adjustmentCents } from './common.js';

// Body for POST /api/allowance/:childId/adjust. The amount is a signed integer
// in cents; the note is optional free text.
export const adjustSchema = z.object({
  amount: adjustmentCents,
  note: z.string().max(500).nullish(),
});
