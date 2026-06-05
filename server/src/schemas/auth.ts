import { z } from 'zod';
import { nonEmptyName } from './common.js';

// Body for POST /api/auth/register — first-time parent registration. Adds the
// email-format check the route previously lacked (presence-only before).
export const registerSchema = z.object({
  name: nonEmptyName,
  email: z.string().trim().email(),
  password: z.string().min(1),
});
