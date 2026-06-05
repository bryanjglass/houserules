// Central query-key factory so reads and invalidations can't drift. Child-scoped
// keys have an array prefix (`allowanceAll`/`goalAll`) used to invalidate every
// child's entry at once after a balance-affecting write.
export const keys = {
  children: ['children'] as const,
  tasks: ['tasks'] as const,
  task: (id: string) => ['task', id] as const,
  allowance: (childId: string) => ['allowance', childId] as const,
  allowanceAll: ['allowance'] as const,
  goal: (childId: string) => ['goal', childId] as const,
  goalAll: ['goal'] as const,
  calendar: (startISO: string, endISO: string) => ['calendar', startISO, endISO] as const,
  householdCode: ['householdCode'] as const,
  timezone: ['timezone'] as const,
  devices: ['devices'] as const,
};
