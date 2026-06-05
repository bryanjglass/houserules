import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTasks, useAllowance, useGoal } from '../../api/queries';
import TaskCard from '../../components/TaskCard';
import SavingsGoalCard from '../../components/SavingsGoalCard';
import Loading from '../../components/Loading';
import { Avatar } from '../../components/Brand';
import { StarIcon } from '../../components/Icons';
import { formatCents } from '../../lib/money';

const STATUS_ORDER: Record<string, number> = { REJECTED: 0, PENDING: 1, COMPLETED: 2, APPROVED: 3 };

export default function ChildDashboard() {
  const { user } = useAuth();
  const tasksQuery = useTasks();
  const allowanceQuery = useAllowance(user?.id);
  const goalQuery = useGoal(user?.id);
  const [tab, setTab] = useState<'todo' | 'done'>('todo');

  // Tasks gate the screen; balance and goal are best-effort (null while loading
  // or on error), mirroring the prior resilient behavior.
  const tasks = tasksQuery.data ?? [];
  const balance = allowanceQuery.data?.balance ?? null;
  const goal = goalQuery.data ?? null;

  if (tasksQuery.isPending) {
    return <Loading />;
  }

  // Unclaimed household chores anyone can grab (server only returns the child's
  // own household pool). Everything else is the child's own task.
  const poolTasks = tasks.filter(t => t.isUpForGrabs && !t.assignedToId);
  const ownTasks = tasks.filter(t => t.assignedToId === user?.id);
  const activeTasks = ownTasks
    .filter(t => t.status !== 'APPROVED')
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));
  const doneTasks = ownTasks.filter(t => t.status === 'APPROVED');
  const list = tab === 'todo' ? activeTasks : doneTasks;

  return (
    <main className="max-w-lg mx-auto px-5 pt-4 pb-2">
        {/* Greeting + balance pill */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Avatar name={user?.name} size={40} />
            <div className="text-[19px] font-extrabold text-ink-900">
              Hi {user?.name}! <span className="text-[18px]">👋</span>
            </div>
          </div>
          {balance != null && (
            <div className="flex items-center gap-1.5 bg-[#FFF8E1] border border-[#FDE68A] px-3 py-1.5 rounded-full">
              <span
                className="w-[18px] h-[18px] rounded-full"
                style={{ background: 'radial-gradient(circle at 30% 30%, #FCD34D, #D97706)', boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,0.08)' }}
              />
              <span className="text-[13px] font-extrabold text-ink-900">{formatCents(balance)}</span>
            </div>
          )}
        </div>

        {/* Savings goal progress (read-only here; cash in from the Wallet) */}
        {goal && (
          <div className="mt-4">
            <SavingsGoalCard goal={goal} />
          </div>
        )}

        {/* Segmented tabs */}
        <div className="mt-4 bg-[#F4F6F8] rounded-xl p-1 grid grid-cols-2">
          {([
            { id: 'todo', label: 'My Tasks', icon: true },
            { id: 'done', label: 'Completed', icon: false },
          ] as const).map(t => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`py-2.5 rounded-[9px] text-[13px] font-bold flex items-center justify-center gap-1.5 transition ${
                  on ? 'bg-brand text-white shadow-brand' : 'text-ink-500'
                }`}
              >
                {t.icon && <StarIcon size={13} />} {t.label}
              </button>
            );
          })}
        </div>

        {/* Up for grabs — open household chores, shown only in the To Do tab */}
        {tab === 'todo' && poolTasks.length > 0 && (
          <div className="mt-[18px]">
            <h2 className="text-[14px] font-bold text-ink-900 flex items-center gap-2">
              Up for Grabs
              <span className="badge badge-grab">First come, first served</span>
            </h2>
            <div className="flex flex-col gap-2.5 mt-2.5">
              {poolTasks.map(task => (
                <TaskCard key={task.id} task={task} role="CHILD" />
              ))}
            </div>
          </div>
        )}

        {/* Task list */}
        <h2 className="mt-[18px] text-[14px] font-bold text-ink-900">
          {tab === 'todo' ? 'My Tasks' : 'Completed'}
        </h2>
        {list.length === 0 ? (
          <div className="card border-dashed p-8 text-center text-ink-400 mt-2.5">
            <p>{tab === 'todo' ? 'No chores right now. Enjoy your free time! 🏖️' : 'Nothing completed yet.'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 mt-2.5">
            {list.map(task => (
              <TaskCard key={task.id} task={task} role="CHILD" />
            ))}
          </div>
        )}
    </main>
  );
}
