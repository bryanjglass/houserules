// Shared domain string-unions — the single source of truth for the values the
// schema stores as bare strings (see comments at the top of prisma/schema.prisma).
//
// SYNC: this file is mirrored at client/src/types/domain.ts. The two workspaces
// have no shared package, so keep them identical when either changes.

export type Role = 'PARENT' | 'CHILD';

export type TaskStatus = 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED';

export type Recurrence = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type TransactionType = 'EARNED' | 'ADJUSTMENT' | 'REDEEMED';

export type GoalStatus = 'ACTIVE' | 'REDEEM_REQUESTED' | 'REDEEMED';

// The JWT payload signed at login and decoded onto req.user by requireAuth.
// parentId is null for parents and set for children.
export interface AuthUser {
  id: string;
  role: Role;
  name: string;
  parentId: string | null;
}
