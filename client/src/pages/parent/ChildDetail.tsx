import { useState } from 'react';
import type { FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useChildren, useChores, useAllowance, useGoal } from '../../api/queries';
import { useAdjustAllowance, useCreateGoal, useUpdateGoal, useDeleteGoal, useDecideCashIn } from '../../api/mutations';
import ChoreCard from '../../components/ChoreCard';
import BalanceDisplay from '../../components/BalanceDisplay';
import SavingsGoalCard from '../../components/SavingsGoalCard';
import Loading from '../../components/Loading';
import { Avatar } from '../../components/Brand';
import { ChevronLeftIcon, PlusIcon } from '../../components/Icons';
import { formatCents, dollarsToCents } from '../../lib/money';

const STATUS_ORDER: Record<string, number> = { COMPLETED: 0, PENDING: 1, APPROVED: 2 };

export default function ChildDetail() {
  const { childId } = useParams();
  const childrenQuery = useChildren();
  const choresQuery = useChores();
  const allowanceQuery = useAllowance(childId);
  const goalQuery = useGoal(childId);

  const child = childrenQuery.data?.find(c => c.id === childId) ?? null;
  const items = (choresQuery.data?.items ?? []).filter(i => i.childId === childId);
  const allowance = allowanceQuery.data ?? null;
  const goal = goalQuery.data ?? null;

  // Mutations invalidate the cache on success, so the lists/balance/goal refresh
  // automatically — no manual refetch.
  const adjust = useAdjustAllowance(childId ?? '');
  const createGoal = useCreateGoal(childId ?? '');
  const updateGoal = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();
  const decide = useDecideCashIn();

  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [filter, setFilter] = useState<'active' | 'done'>('active');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  const adjustLoading = adjust.isPending;
  const goalBusy = createGoal.isPending || updateGoal.isPending || deleteGoalMutation.isPending || decide.isPending;

  const handleAdjust = async (e: FormEvent) => {
    e.preventDefault();
    const amount = dollarsToCents(adjustAmount);
    if (amount === null) { alert('Enter a valid amount'); return; }
    try {
      await adjust.mutateAsync({ amount, note: adjustNote || undefined });
      setAdjustAmount('');
      setAdjustNote('');
      setShowAdjust(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const submitGoal = async (e: FormEvent) => {
    e.preventDefault();
    const targetAmount = dollarsToCents(goalTarget);
    if (!goalTitle.trim() || !targetAmount || targetAmount <= 0) {
      alert('Enter a title and a positive target amount');
      return;
    }
    try {
      if (goal) {
        await updateGoal.mutateAsync({ goalId: goal.id, body: { title: goalTitle.trim(), targetAmount } });
      } else {
        await createGoal.mutateAsync({ title: goalTitle.trim(), targetAmount });
      }
      setShowGoalForm(false);
      setGoalTitle('');
      setGoalTarget('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save goal');
    }
  };

  const deleteGoal = async () => {
    if (!goal || !confirm(`Delete the goal "${goal.title}"?`)) return;
    try {
      await deleteGoalMutation.mutateAsync(goal.id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete goal');
    }
  };

  const decideCashIn = async (action: 'approve' | 'reject') => {
    if (!goal) return;
    try {
      await decide.mutateAsync({ goalId: goal.id, action });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const openGoalForm = () => {
    setGoalTitle(goal?.title || '');
    setGoalTarget(goal ? (goal.targetAmount / 100).toFixed(2) : '');
    setShowGoalForm(true);
  };

  if (childrenQuery.isPending || !child) return <Loading />;

  const filteredItems = items
    .filter(i => filter === 'active' ? i.status !== 'APPROVED' : i.status === 'APPROVED')
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99));

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-ink-500 hover:text-ink-900 transition" aria-label="Back">
            <ChevronLeftIcon size={22} />
          </Link>
          <Avatar name={child.name} size={36} />
          <h1 className="text-2xl font-extrabold text-ink-900">{child.name}</h1>
        </div>

        {allowance && (
          <div>
            <BalanceDisplay balance={allowance.balance} label={`${child.name}'s Wallet`} />
            <button
              onClick={() => setShowAdjust(!showAdjust)}
              className="btn-ghost mt-2"
            >
              {showAdjust ? 'Cancel' : 'Adjust balance manually'}
            </button>
            {showAdjust && (
              <form onSubmit={handleAdjust} className="card p-4 mt-2 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="label">Amount (use − for debit)</label>
                    <input type="number" step="0.01" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} required placeholder="5.00" className="input" />
                  </div>
                  <div className="flex-1">
                    <label className="label">Note (optional)</label>
                    <input type="text" value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Birthday bonus" className="input" />
                  </div>
                </div>
                <button type="submit" disabled={adjustLoading} className="btn-primary w-full">
                  {adjustLoading ? 'Saving…' : 'Save Adjustment'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Savings Goal */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-ink-900">Savings Goal</h2>
            {goal && !showGoalForm && (
              <div className="flex gap-2 text-xs font-bold">
                <button onClick={openGoalForm} disabled={goalBusy} className="text-brand hover:text-brand-600 transition">Edit</button>
                <button onClick={deleteGoal} disabled={goalBusy} className="text-rose-500 hover:text-rose-600 transition">Delete</button>
              </div>
            )}
          </div>

          {goal && !showGoalForm && (
            <>
              <SavingsGoalCard goal={goal} />
              {goal.status === 'REDEEM_REQUESTED' && (
                <div className="card p-4 mt-2 space-y-3">
                  <p className="text-sm font-bold text-ink-900">
                    {child.name} wants to cash in this goal for {formatCents(goal.targetAmount)}.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => decideCashIn('approve')} disabled={goalBusy} className="btn-primary flex-1">
                      {goalBusy ? 'Working…' : 'Approve'}
                    </button>
                    <button onClick={() => decideCashIn('reject')} disabled={goalBusy} className="btn-secondary flex-1">
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {!goal && !showGoalForm && (
            <button onClick={openGoalForm} className="btn-secondary w-full">
              <PlusIcon size={16} /> Set a savings goal
            </button>
          )}

          {showGoalForm && (
            <form onSubmit={submitGoal} className="card p-4 space-y-3">
              <div>
                <label className="label">Goal</label>
                <input type="text" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} required placeholder="New bike" className="input" />
              </div>
              <div>
                <label className="label">Target amount</label>
                <input type="number" step="0.01" min="0.01" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} required placeholder="50.00" className="input" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={goalBusy} className="btn-primary flex-1">
                  {goalBusy ? 'Saving…' : goal ? 'Save goal' : 'Create goal'}
                </button>
                <button type="button" onClick={() => setShowGoalForm(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          )}
        </section>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">Tasks</h2>
          <div className="flex rounded-[10px] bg-[#F4F6F8] p-0.5 text-xs font-bold">
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition ${filter === 'active' ? 'bg-white shadow-sm text-brand' : 'text-ink-500'}`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('done')}
              className={`px-3 py-1.5 rounded-lg transition ${filter === 'done' ? 'bg-white shadow-sm text-brand' : 'text-ink-500'}`}
            >
              Done
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link to={`/chores/new?childId=${childId}`} className="btn-primary !px-4 !py-2 !text-[13px] !rounded-xl">
            <PlusIcon size={16} /> New Task
          </Link>
        </div>

        {filteredItems.length === 0 ? (
          <div className="card border-dashed p-8 text-center text-ink-400">
            <p>{filter === 'active' ? 'No active tasks.' : 'No completed tasks yet.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map(item => (
              <ChoreCard key={item.id} item={item} role="PARENT" />
            ))}
          </div>
        )}

        {allowance && allowance.transactions.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-ink-900 mb-3">Transaction History</h2>
            <div className="card divide-y divide-line/60">
              {allowance.transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-ink-900">
                      {tx.choreTitle
                        || (tx.goal?.title ? `Cashed in: ${tx.goal.title}` : null)
                        || tx.note
                        || (tx.type === 'ADJUSTMENT' ? 'Manual adjustment' : 'Earned')}
                    </p>
                    <p className="text-xs text-ink-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-extrabold ${tx.amount >= 0 ? 'text-money-600' : 'text-rose-500'}`}>
                    {tx.amount >= 0 ? '+' : '−'}{formatCents(Math.abs(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
    </main>
  );
}
