import { z } from 'zod';
import { nonEmptyName, pin } from './common.js';

// Body for POST /api/users/children — create a child account. Name and PIN
// required; PIN must be exactly four digits.
export const childCreateSchema = z.object({
  name: nonEmptyName,
  pin,
});

// Body for PUT /api/users/children/:id — update name and/or PIN. Both optional;
// the route applies only the fields present. Name allows an empty value (the
// route skips falsy names), so it is not length-floored here.
export const childUpdateSchema = z.object({
  name: z.string().max(200).optional(),
  pin: pin.optional(),
});
