// Augment Express's Request so req.user (populated by requireAuth) is typed
// across every route handler — no per-handler cast needed.
import type { AuthUser } from './domain.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
