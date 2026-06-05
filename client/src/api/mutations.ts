import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import api from './client';
import { keys } from './keys';

// Any task write can affect the lists, a balance (approval credits), goal
// progress (derived from balance), and the calendar. Invalidating this set is
// broad but correct and deduped — precise cache surgery can come later.
function invalidateTaskWorld(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: keys.tasks });
  qc.invalidateQueries({ queryKey: ['task'] });
  qc.invalidateQueries({ queryKey: keys.allowanceAll });
  qc.invalidateQueries({ queryKey: keys.goalAll });
  qc.invalidateQueries({ queryKey: ['calendar'] });
}

// ---- Task mutations -------------------------------------------------------

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/tasks', body).then((r) => r.data),
    onSuccess: () => invalidateTaskWorld(qc),
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.put(`/tasks/${id}`, body).then((r) => r.data),
    onSuccess: () => invalidateTaskWorld(qc),
  });
};

export const useMarkTaskDone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/tasks/${id}`, {}).then((r) => r.data),
    onSuccess: () => invalidateTaskWorld(qc),
  });
};

export const useParentCompleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/tasks/${id}/complete`).then((r) => r.data),
    onSuccess: () => invalidateTaskWorld(qc),
  });
};

export const useApproveTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity?: number }) =>
      api.post(`/tasks/${id}/approve`, quantity !== undefined ? { quantity } : {}).then((r) => r.data),
    onSuccess: () => invalidateTaskWorld(qc),
  });
};

export const useRejectTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/tasks/${id}/reject`).then((r) => r.data),
    onSuccess: () => invalidateTaskWorld(qc),
  });
};

export const useClaimTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/tasks/${id}/claim`).then((r) => r.data),
    onSuccess: () => invalidateTaskWorld(qc),
  });
};

export const useLogUnits = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api.post(`/tasks/${id}/log-units`, { quantity }).then((r) => r.data),
    onSuccess: () => invalidateTaskWorld(qc),
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),
    onSuccess: () => invalidateTaskWorld(qc),
  });
};

// ---- Allowance ------------------------------------------------------------

export const useAdjustAllowance = (childId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { amount: number; note?: string }) =>
      api.post(`/allowance/${childId}/adjust`, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.allowance(childId) });
      qc.invalidateQueries({ queryKey: keys.goal(childId) });
    },
  });
};

// ---- Goals ----------------------------------------------------------------

// A goal write moves (or unblocks) the derived balance, so refresh goals + balances.
function invalidateGoalWorld(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: keys.goalAll });
  qc.invalidateQueries({ queryKey: keys.allowanceAll });
}

export const useCreateGoal = (childId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; targetAmount: number }) =>
      api.post(`/goals/${childId}`, body).then((r) => r.data),
    onSuccess: () => invalidateGoalWorld(qc),
  });
};

export const useUpdateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, body }: { goalId: string; body: { title?: string; targetAmount?: number } }) =>
      api.patch(`/goals/${goalId}`, body).then((r) => r.data),
    onSuccess: () => invalidateGoalWorld(qc),
  });
};

export const useDeleteGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) => api.delete(`/goals/${goalId}`).then((r) => r.data),
    onSuccess: () => invalidateGoalWorld(qc),
  });
};

export const useRequestCashIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) => api.post(`/goals/${goalId}/request-cash-in`).then((r) => r.data),
    onSuccess: () => invalidateGoalWorld(qc),
  });
};

export const useDecideCashIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, action }: { goalId: string; action: 'approve' | 'reject' }) =>
      api.post(`/goals/${goalId}/${action}`).then((r) => r.data),
    onSuccess: () => invalidateGoalWorld(qc),
  });
};

// ---- Children / settings --------------------------------------------------

export const useCreateChild = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; pin: string }) =>
      api.post('/users/children', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.children }),
  });
};

export const useSaveTimezone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (timezone: string) =>
      api.put('/users/timezone', { timezone }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.timezone });
      qc.invalidateQueries({ queryKey: keys.tasks });
      qc.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
};

export const useRotateHouseholdCode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post('/users/household-code/rotate').then((r) => r.data.householdCode as string),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.householdCode }),
  });
};

export const useRevokeDevice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/auth/devices/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.devices }),
  });
};
