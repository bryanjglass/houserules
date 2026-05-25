// Shared domain string-unions — the single source of truth for the values the
// API sends as bare strings (see comments at the top of server/prisma/schema.prisma).
//
// SYNC: this file is mirrored at server/src/types/domain.ts. The two workspaces
// have no shared package, so keep them identical when either changes.

export type Role = 'PARENT' | 'CHILD';

export type TaskStatus = 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED';

export type Recurrence = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type TransactionType = 'EARNED' | 'ADJUSTMENT' | 'REDEEMED';

export type GoalStatus = 'ACTIVE' | 'REDEEM_REQUESTED' | 'REDEEMED';

// The authenticated user as returned by the API (GET /auth/me, login).
// parentId is null for parents and set for children.
export interface AuthUser {
  id: string;
  role: Role;
  name: string;
  parentId: string | null;
}
