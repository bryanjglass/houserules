// View models for API responses. Mirrors what the server routes return; the
// shared string-unions come from ./domain so client and server agree on literals.
import type { TaskStatus, Recurrence, TransactionType, GoalStatus } from './domain';

export interface Child {
  id: string;
  name: string;
  createdAt?: string;
}

export interface TaskView {
  id: string;
  title: string;
  description?: string | null;
  dollarAmount: number | null;
  status: TaskStatus;
  isUpForGrabs: boolean;
  isPerUnit?: boolean;
  unitReward?: number | null;
  quantity?: number | null;
  assignedToId: string | null;
  createdById: string;
  dueDate: string | null;
  completedAt?: string | null;
  approvedAt?: string | null;
  isRecurring: boolean;
  recurrence: Recurrence | null;
  weeklyDays?: string | null;
  catchUp?: boolean;
  templateId?: string | null;
  createdAt?: string;
  assignedTo?: { id: string; name: string } | null;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  note?: string | null;
  createdAt: string;
  task?: { title: string } | null;
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
  taskId: string;
  title: string;
  status: TaskStatus;
  dollarAmount: number | null;
  isRecurring: boolean;
  recurrence: Recurrence | null;
  isUpForGrabs: boolean;
  assignedTo?: { id: string; name: string } | null;
  date: string;
  projected: boolean;
}
