// View models for API responses. Mirrors what the server routes return; the
// shared string-unions come from ./domain so client and server agree on literals.
import type {
  ChoreKind,
  CompletionStatus,
  MissedPolicy,
  Recurrence,
  TransactionType,
  GoalStatus,
} from './domain';

export interface Child {
  id: string;
  name: string;
  createdAt?: string;
}

// A chore definition — what parents create and edit. Carries no lifecycle
// status; work appears as ChoreItems.
export interface ChoreView {
  id: string;
  kind: ChoreKind;
  title: string;
  description?: string | null;
  rewardCents: number | null;
  unitRewardCents: number | null;
  assigneeId: string | null;
  assignee?: { id: string; name: string } | null;
  recurrence: Recurrence | null;
  weeklyDays: string | null;
  // Household-local "YYYY-MM-DD": a one-off's due day or the schedule anchor.
  startDay: string | null;
  missedPolicy: MissedPolicy;
  archivedAt?: string | null;
  createdAt?: string;
}

// One visible unit of work: a completion row (completionId set) or a projected
// occurrence / pool entry (completionId null — acting on it creates the row).
export interface ChoreItem {
  id: string;
  choreId: string;
  completionId: string | null;
  // "YYYY-MM-DD" occurrence day, "once" for one-offs, null for per-unit logs.
  occurrenceKey: string | null;
  kind: ChoreKind;
  title: string;
  description?: string | null;
  recurrence: Recurrence | null;
  status: CompletionStatus;
  rewardCents: number | null;
  unitRewardCents: number | null;
  quantity: number | null;
  childId: string | null;
  child?: { id: string; name: string } | null;
  dueDay: string | null;
  // A recurring occurrence whose day is still ahead: visible but locked until
  // its day (server-enforced).
  upcoming: boolean;
  completedAt?: string | null;
  approvedAt?: string | null;
  createdAt?: string;
}

export interface ChoresResponse {
  chores: ChoreView[];
  items: ChoreItem[];
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  note?: string | null;
  createdAt: string;
  choreTitle?: string | null;
  goal?: { title: string } | null;
}

export interface Allowance {
  balance: number;
  transactions: Transaction[];
}

export interface GoalView {
  id: string;
  childId: string;
  title: string;
  targetAmount: number;
  status: GoalStatus;
  createdAt?: string;
  redeemedAt?: string | null;
  balance: number;
  reachable: boolean;
}

export interface TrustedDevice {
  id: string;
  label?: string | null;
  createdAt: string;
  lastUsedAt: string;
  children: { id: string; name: string }[];
}

export interface CalendarEvent {
  id: string;
  choreId: string;
  completionId: string | null;
  title: string;
  status: CompletionStatus;
  rewardCents: number | null;
  kind: ChoreKind;
  recurrence: Recurrence | null;
  child?: { id: string; name: string } | null;
  // Household-local day key "YYYY-MM-DD".
  date: string;
  projected: boolean;
}
