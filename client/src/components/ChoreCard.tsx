import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Thumb from './Thumb';
import { formatCents } from '../lib/money';
import {
  useCompleteChore,
  useApproveCompletion,
  useRejectCompletion,
  useClaimChore,
  useLogUnits,
  useArchiveChore,
} from '../api/mutations';
import type { Role } from '../types/domain';
import type { ChoreItem } from '../types/models';

// A day key "YYYY-MM-DD" as a local Date (constructed from parts so it can't
// slip a day through UTC parsing).
function dayKeyToDate(key: string): Date {
  return new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10)));
}

function shortDay(key: string): string {
  return dayKeyToDate(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Map an item to a design status pill. Pending items become Overdue / Due Soon
// / To Do based on their due day; completed/approved get their own pills.
function statusPill(item: ChoreItem): { label: string; cls: string } {
  if (item.status === 'COMPLETED') return { label: 'Waiting', cls: 'badge-due' };
  if (item.status === 'APPROVED') return { label: 'Done', cls: 'badge-ok' };

  // An upcoming recurring occurrence is visible but not completable until its day.
  if (item.upcoming && item.dueDay) return { label: `Available ${shortDay(item.dueDay)}`, cls: 'badge-ok' };

  if (item.dueDay) {
    const days = (dayKeyToDate(item.dueDay).getTime() - Date.now()) / 86400000;
    if (days < -1) return { label: 'Overdue', cls: 'badge-over' };
    if (days <= 2) return { label: 'Due Soon', cls: 'badge-due' };
  }
  return { label: 'To Do', cls: 'badge-todo' };
}

function dueLabel(item: ChoreItem): string {
  const bits: string[] = [];
  if (item.child) bits.push(item.child.name);
  if (item.dueDay) bits.push('Due ' + shortDay(item.dueDay));
  return bits.join(' · ');
}

export default function ChoreCard({
  item,
  role,
}: {
  item: ChoreItem;
  role: Role;
}) {
  // A per-unit chore shows two item kinds: the always-open pool entry children
  // log against (no completion), and each child's logged completion.
  const isPerUnitPool = item.kind === 'PER_UNIT' && !item.completionId;
  const isPerUnitLog = item.kind === 'PER_UNIT' && !!item.completionId;
  // An unclaimed open chore: a child grabs it (claiming creates the completion).
  const isOpenGrab = item.kind === 'OPEN' && !item.completionId;

  const navigate = useNavigate();
  const [logQty, setLogQty] = useState('1');
  const [reviewQty, setReviewQty] = useState(String(item.quantity ?? 1));

  // Mutations invalidate the shared cache on success, so every subscribed list
  // (parent dashboard, child dashboard, child detail) refreshes automatically.
  const complete = useCompleteChore();
  const approve = useApproveCompletion();
  const reject = useRejectCompletion();
  const claim = useClaimChore();
  const logUnits = useLogUnits();
  const archive = useArchiveChore();

  const handleComplete = () =>
    complete.mutate({ choreId: item.choreId, occurrenceKey: item.occurrenceKey });
  const handleApprove = () => {
    if (!item.completionId) return;
    approve.mutate({ id: item.completionId, ...(isPerUnitLog ? { quantity: Number(reviewQty) } : {}) });
  };
  const handleReject = () => item.completionId && reject.mutate(item.completionId);
  const handleLog = async () => {
    const n = Number(logQty);
    if (!Number.isInteger(n) || n < 1) { alert('Enter a whole number of at least 1'); return; }
    await logUnits.mutateAsync({ choreId: item.choreId, quantity: n });
    setLogQty('1');
  };
  const handleGrab = async () => {
    try {
      await claim.mutateAsync(item.choreId);
    } catch (err: any) {
      if (err.response?.status === 409) alert('Someone already grabbed this chore!');
    }
  };
  const handleArchive = () => {
    if (!confirm(`Archive "${item.title}"? It disappears from everyone's lists; history is kept.`)) return;
    archive.mutate(item.choreId, {
      onError: (err: any) => alert(err.response?.data?.error || 'Failed to archive'),
    });
  };

  const pill = statusPill(item);
  const meta = dueLabel(item);

  const unitPrice = isPerUnitLog && item.quantity ? Math.round((item.rewardCents ?? 0) / item.quantity) : item.unitRewardCents;

  const childCanGrab = role === 'CHILD' && isOpenGrab;
  const childCanLog = role === 'CHILD' && isPerUnitPool;
  // An upcoming recurring occurrence can't be completed until its day (server-enforced).
  const childCanAct =
    role === 'CHILD' && !isOpenGrab && item.kind !== 'PER_UNIT' && !item.upcoming && item.status === 'PENDING';
  const parentCanReview = role === 'PARENT' && item.status === 'COMPLETED' && !!item.completionId;
  // A parent can mark a child's chore done on their behalf (per-unit logs have
  // their own flow, and an unclaimed open chore has no one to credit yet).
  const parentCanMarkDone =
    role === 'PARENT' && !!item.childId && item.kind !== 'PER_UNIT' && !item.upcoming && item.status === 'PENDING';
  // Definitions are always editable — edits only affect future occurrences.
  const hasActions = childCanGrab || childCanLog || childCanAct || parentCanReview || role === 'PARENT';

  return (
    <div className="card p-3">
      <div className="flex items-center gap-3">
        <Thumb size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[14px] font-bold text-ink-900 truncate">{item.title}</h3>
            {item.kind === 'PER_UNIT' ? (
              <span className="badge badge-grab">Per item</span>
            ) : item.kind === 'OPEN' ? (
              <span className="badge badge-grab">Up for grabs</span>
            ) : null}
            {item.recurrence && (
              <span className="badge badge-todo capitalize">{item.recurrence.toLowerCase()}</span>
            )}
          </div>
          {item.description && (
            <p className="text-[11.5px] text-ink-500 mt-0.5 truncate">{item.description}</p>
          )}
          {meta && <p className="text-[11.5px] text-ink-400 mt-0.5">{meta}</p>}
          {isPerUnitLog && (
            <p className="text-[11.5px] text-ink-500 mt-0.5">{item.quantity} × {formatCents(unitPrice)}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          {isPerUnitPool ? (
            <div className="text-[14px] font-extrabold text-money-600">
              {formatCents(item.unitRewardCents)}<span className="text-[11px] font-semibold text-ink-400">/item</span>
            </div>
          ) : item.rewardCents ? (
            <div className={`text-[14px] font-extrabold ${isPerUnitLog ? 'text-money-600' : 'text-ink-900'}`}>
              {formatCents(item.rewardCents)}
            </div>
          ) : (
            <div className="text-[12px] text-ink-300 font-semibold">No pay</div>
          )}
          <span className={`${pill.cls} mt-1`}>{pill.label}</span>
        </div>
      </div>

      {hasActions && (
        <div className="flex gap-2 mt-3">
          {childCanGrab && (
            <button
              onClick={handleGrab}
              className="flex-1 bg-violet-600 text-white text-[14px] font-bold py-2 rounded-[14px] hover:brightness-95 active:scale-[0.98] transition"
            >
              Grab it
            </button>
          )}
          {childCanLog && (
            <div className="flex gap-2 flex-1">
              <input
                type="number" min={1} step={1} value={logQty}
                onChange={e => setLogQty(e.target.value)}
                aria-label="How many"
                className="w-16 border-[1.5px] border-line rounded-[14px] px-3 py-2 text-[14px] font-bold text-ink-900 outline-none focus:border-brand"
              />
              <button
                onClick={handleLog}
                className="flex-1 bg-violet-600 text-white text-[14px] font-bold py-2 rounded-[14px] hover:brightness-95 active:scale-[0.98] transition"
              >
                Log it
              </button>
            </div>
          )}
          {childCanAct && (
            <button onClick={handleComplete} className="btn-primary flex-1 !py-2 !text-[14px]">
              Mark Done
            </button>
          )}
          {parentCanReview && (
            <>
              {isPerUnitLog && (
                <input
                  type="number" min={1} step={1} value={reviewQty}
                  onChange={e => setReviewQty(e.target.value)}
                  aria-label="Approved count"
                  className="w-16 border-[1.5px] border-line rounded-[14px] px-3 py-2 text-[14px] font-bold text-ink-900 outline-none focus:border-brand"
                />
              )}
              <button
                onClick={handleApprove}
                className="flex-1 bg-money-600 text-white text-[14px] font-bold py-2 rounded-[14px] hover:bg-money-700 active:scale-[0.98] transition"
              >
                Approve
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-rose-50 text-rose-600 text-[14px] font-bold py-2 rounded-[14px] hover:brightness-95 active:scale-[0.98] transition"
              >
                Reject
              </button>
            </>
          )}
          {parentCanMarkDone && (
            <button
              onClick={handleComplete}
              className="flex-1 bg-brand-50 text-brand text-[14px] font-bold py-2 rounded-[14px] hover:brightness-95 active:scale-[0.98] transition"
            >
              Mark Done
            </button>
          )}
          {role === 'PARENT' && (
            <>
              <button
                onClick={() => navigate(`/chores/${item.choreId}/edit`)}
                className="text-ink-400 hover:text-brand text-[13px] font-semibold px-3 py-2 transition"
                title="Edit chore"
              >
                Edit
              </button>
              <button
                onClick={handleArchive}
                className="text-ink-400 hover:text-rose-500 text-[13px] font-semibold px-3 py-2 transition"
                title="Archive chore"
              >
                Archive
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
