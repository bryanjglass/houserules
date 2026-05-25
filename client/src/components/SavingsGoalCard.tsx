import Thumb from './Thumb';
import { formatCents } from '../lib/money';
import type { GoalView } from '../types/models';

// The child's savings goal — DESIGN §5 Screen 6: thumb + title + target +
// teal→brand gradient progress bar + saved / %. Progress is derived from the
// live balance, so no money is reserved; the goal only spends at cash-in.
export default function SavingsGoalCard({
  goal,
  onCashIn,
  busy = false,
}: {
  goal: GoalView | null;
  onCashIn?: () => void;
  busy?: boolean;
}) {
  if (!goal) return null;

  const { title, targetAmount, balance, status, reachable } = goal;
  const pct = targetAmount > 0 ? Math.min(100, Math.round((balance / targetAmount) * 100)) : 0;
  const requested = status === 'REDEEM_REQUESTED';

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2.5">
        <Thumb size={34} tint="#DCFCE7" color="#16A34A" />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-ink-900 truncate">{title}</div>
          <div className="text-[10.5px] text-ink-400">
            Goal: <span className="font-bold text-money-600">{formatCents(targetAmount)}</span>
          </div>
        </div>
        {requested ? (
          <span className="badge badge-due">Waiting for approval</span>
        ) : reachable ? (
          <span className="badge badge-ok">Ready!</span>
        ) : (
          <span className="badge badge-todo">{pct}%</span>
        )}
      </div>

      {/* Gradient progress bar (teal → brand) */}
      <div className="mt-3 h-2.5 rounded-full bg-[#F4F6F8] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #34D399 0%, #2D7FF9 100%)' }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-ink-400">
        <span><span className="font-bold text-money-600">{formatCents(balance)}</span> saved</span>
        <span>{pct}% there</span>
      </div>

      {onCashIn && !requested && (
        <button
          onClick={onCashIn}
          disabled={!reachable || busy}
          className="btn-primary w-full mt-3 disabled:opacity-50 disabled:shadow-none"
        >
          {busy ? 'Sending…' : reachable ? 'Cash in this goal' : `${formatCents(targetAmount - balance)} to go`}
        </button>
      )}
      {requested && (
        <p className="mt-3 text-[11.5px] text-amber-600 font-semibold text-center">
          Asked to cash in — waiting for a parent to approve.
        </p>
      )}
    </div>
  );
}
