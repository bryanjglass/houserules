import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import TaskCard from '../../components/TaskCard.jsx';
import BottomTabBar from '../../components/BottomTabBar.jsx';
import { Avatar } from '../../components/Brand.jsx';
import { StarIcon } from '../../components/Icons.jsx';

const STATUS_ORDER = { REJECTED: 0, PENDING: 1, COMPLETED: 2, APPROVED: 3 };

export default function ChildDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [balance, setBalance] = useState(null);
  const [tab, setTab] = useState('todo'); // 'todo' | 'done'
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [tasksRes, allowanceRes] = await Promise.all([
      api.get('/tasks'),
      user ? api.get(`/allowance/${user.id}`).catch(() => null) : Promise.resolve(null),
    ]);
    setTasks(tasksRes.data);
    setBalance(allowanceRes?.data?.balance ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-ink-400 text-xl">Loading…</div>;
  }

  const activeTasks = tasks
    .filter(t => t.status !== 'APPROVED')
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));
  const doneTasks = tasks.filter(t => t.status === 'APPROVED');
  const list = tab === 'todo' ? activeTasks : doneTasks;

  return (
    <div className="min-h-screen bg-white">
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
              <span className="text-[13px] font-extrabold text-ink-900">${balance.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Segmented tabs */}
        <div className="mt-4 bg-[#F4F6F8] rounded-xl p-1 grid grid-cols-2">
          {[
            { id: 'todo', label: 'My Tasks', icon: true },
            { id: 'done', label: 'Completed', icon: false },
          ].map(t => {
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
              <TaskCard key={task.id} task={task} role="CHILD" onUpdate={refresh} />
            ))}
          </div>
        )}
      </main>

      <BottomTabBar />
    </div>
  );
}
