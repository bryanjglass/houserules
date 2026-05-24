import { prisma } from './prisma.js';

// The allowance balance is DERIVED, never stored: it is the sum of every one of
// the child's transactions (EARNED + ADJUSTMENT + REDEEMED). Amounts are integer
// cents and already signed, so a plain sum is correct — no per-type special-casing.
export async function getBalance(childId) {
  const { _sum } = await prisma.transaction.aggregate({
    where: { userId: childId },
    _sum: { amount: true },
  });
  return _sum.amount ?? 0;
}
