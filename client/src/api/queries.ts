import { useQuery } from '@tanstack/react-query';
import api from './client';
import { keys } from './keys';
import type {
  Child,
  ChoreView,
  ChoresResponse,
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

export const useChores = () =>
  useQuery({
    queryKey: keys.chores,
    queryFn: () => api.get('/chores').then((r) => r.data as ChoresResponse),
  });

export const useChore = (id?: string) =>
  useQuery({
    enabled: !!id,
    queryKey: keys.chore(id ?? ''),
    queryFn: () => api.get(`/chores/${id}`).then((r) => r.data as ChoreView),
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

export const useCalendar = (startDay: string, endDay: string) =>
  useQuery({
    queryKey: keys.calendar(startDay, endDay),
    queryFn: () =>
      api
        .get('/chores/calendar', { params: { start: startDay, end: endDay } })
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
