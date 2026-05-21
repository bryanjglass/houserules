import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import TaskCard from '../../components/TaskCard.jsx';

const STATUS_ORDER = { REJECTED: 0, PENDING: 1, COMPLETED: 2, APPROVED: 3 };

export default function ChildDashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const r = await api.get('/tasks');
    setTasks(r.data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400 text-xl">Loading...</div>;
  }

  const activeTasks = tasks
    .filter(t => t.status !== 'APPROVED')
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));

  const doneTasks = tasks.filter(t => t.status === 'APPROVED');

  const pending = tasks.filter(t => t.status === 'PENDING' || t.status === 'REJECTED').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Kid-friendly top bar */}
      <header className="bg-indigo-600 text-white px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-indigo-200 text-sm">Hey there,</p>
            <h1 className="text-2xl font-bold">{user?.name} 👋</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/allowance"
              className="bg-white/20 text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-white/30 transition"
            >
              💰 My Money
            </Link>
            <button
              onClick={logout}
              className="text-indigo-200 text-sm hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Progress summary */}
        {tasks.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <div className="text-4xl">
              {pending === 0 ? '🎉' : '📋'}
            </div>
            <div>
              {pending === 0 ? (
                <p className="font-bold text-green-600 text-lg">All done! Great job!</p>
              ) : (
                <>
                  <p className="font-bold text-gray-900">{pending} chore{pending !== 1 ? 's' : ''} to do</p>
                  <p className="text-sm text-gray-400">
                    {tasks.filter(t => t.status === 'COMPLETED').length} waiting for approval
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Active tasks */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3">My Chores</h2>
          {activeTasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
              <p className="text-4xl mb-2">🏖️</p>
              <p>No chores right now. Enjoy your free time!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTasks.map(task => (
                <TaskCard key={task.id} task={task} role="CHILD" onUpdate={refresh} />
              ))}
            </div>
          )}
        </section>

        {/* Completed tasks */}
        {doneTasks.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-500 mb-2">Completed ✓</h2>
            <div className="space-y-2">
              {doneTasks.slice(0, 5).map(task => (
                <TaskCard key={task.id} task={task} role="CHILD" onUpdate={refresh} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex shadow-lg">
        <Link
          to="/"
          className="flex-1 flex flex-col items-center py-3 text-indigo-600"
        >
          <span className="text-xl">📋</span>
          <span className="text-xs font-medium mt-0.5">Chores</span>
        </Link>
        <Link
          to="/allowance"
          className="flex-1 flex flex-col items-center py-3 text-gray-400 hover:text-green-600 transition"
        >
          <span className="text-xl">💰</span>
          <span className="text-xs font-medium mt-0.5">My Money</span>
        </Link>
      </nav>
      <div className="h-16" /> {/* spacer for fixed nav */}
    </div>
  );
}
