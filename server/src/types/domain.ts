// Shared domain string-unions — the single source of truth for the values the
// schema stores as bare strings (see comments at the top of prisma/schema.prisma).
//
// SYNC: this file is mirrored at client/src/types/domain.ts. The two workspaces
// have no shared package, so keep them identical when either changes.

export type Role = 'PARENT' | 'CHILD';

// What a chore definition is: assigned to one child, open to the household pool
// (claimed per occurrence), or per-unit (logged per item, never recurring).
export type ChoreKind = 'ASSIGNED' | 'OPEN' | 'PER_UNIT';

// Lifecycle of a ChoreCompletion (a child's work record). Rejection returns a
// completion to PENDING (per-unit logs are deleted instead).
export type CompletionStatus = 'PENDING' | 'COMPLETED' | 'APPROVED';

export type Recurrence = 'DAILY' | 'WEEKLY' | 'MONTHLY';

// How missed occurrences of a recurring ASSIGNED chore surface at read time:
// only the earliest unresolved one, or every unresolved day in the last 14 days.
export type MissedPolicy = 'CURRENT_ONLY' | 'BACKFILL_14D';

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
