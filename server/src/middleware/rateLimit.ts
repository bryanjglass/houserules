import rateLimit from 'express-rate-limit';

const json = (message: string) => ({
  windowMs: 15 * 60 * 1000,
  standardHeaders: 'draft-7' as const,
  legacyHeaders: false,
  message: { error: message },
});

// Brute-force protection for credential endpoints (login, register, device-login).
export const authLimiter = rateLimit({ ...json('Too many attempts. Please try again later.'), limit: 20 });

// The unauthenticated household lookup leaks child names by household code,
// so throttle enumeration attempts.
export const publicLimiter = rateLimit({ ...json('Too many requests. Please try again later.'), limit: 40 });
