import { useQuery } from '@tanstack/react-query';
import api from './client';
import { keys } from './keys';
import type {
  Child,
  TaskView,
  Allowance,
  GoalView,
  CalendarEvent,
  TrustedDevice,
} from '../types/models';

// Read hooks — thin useQuery wrappers returning typed data. Child-scoped hooks
// are gated with `enabled` so they no-op until the id is known (auth resolved).

export const useChildren = () =>
  useQuery({
    queryKey: keys.children,
    queryFn: () => api.get('/users/children').then((r) => r.data as Child[]),
  });

export const useTasks = () =>
  useQuery({
    queryKey: keys.tasks,
    queryFn: () => api.get('/tasks').then((r) => r.data as TaskView[]),
  });

export const useTask = (id?: string) =>
  useQuery({
    enabled: !!id,
    queryKey: keys.task(id ?? ''),
    queryFn: () => api.get(`/tasks/${id}`).then((r) => r.data as TaskView),
  });

export const useAllowance = (childId?: string) =>
  useQuery({
    enabled: !!childId,
    queryKey: keys.allowance(childId ?? ''),
    queryFn: () => api.get(`/allowance/${childId}`).then((r) => r.data as Allowance),
  });

export const useGoal = (childId?: string) =>
  useQuery({
    enabled: !!childId,
    queryKey: keys.goal(childId ?? ''),
    queryFn: () =>
      api.get(`/goals/${childId}`).then((r) => (r.data.goal ?? null) as GoalView | null),
  });

export const useCalendar = (startISO: string, endISO: string) =>
  useQuery({
    queryKey: keys.calendar(startISO, endISO),
    queryFn: () =>
      api
        .get('/tasks/calendar', { params: { start: startISO, end: endISO } })
        .then((r) => r.data as CalendarEvent[]),
  });

export const useHouseholdCode = () =>
  useQuery({
    queryKey: keys.householdCode,
    queryFn: () =>
      api.get('/users/household-code').then((r) => (r.data.householdCode ?? '') as string),
  });

export const useTimezone = () =>
  useQuery({
    queryKey: keys.timezone,
    queryFn: () => api.get('/users/timezone').then((r) => (r.data.timezone ?? 'UTC') as string),
  });

export const useDevices = () =>
  useQuery({
    queryKey: keys.devices,
    queryFn: () => api.get('/auth/devices').then((r) => r.data as TrustedDevice[]),
  });
