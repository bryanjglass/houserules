import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import NavBar from '../../components/NavBar.jsx';
import TaskCard from '../../components/TaskCard.jsx';
import AddChildModal from './AddChildModal.jsx';

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [childrenRes, tasksRes] = await Promise.all([
      api.get('/users/children'),
      api.get('/tasks'),
    ]);
    setChildren(childrenRes.data);
    setTasks(tasksRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const pendingApprovals = tasks.filter(t => t.status === 'COMPLETED');

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Pending approvals banner */}
        {pendingApprovals.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-semibold text-amber-800">
              ⏳ {pendingApprovals.length} chore{pendingApprovals.length > 1 ? 's' : ''} waiting for your approval
            </p>
          </div>
        )}

        {/* Children cards */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800">Kids</h2>
            <button
              onClick={() => setShowAddChild(true)}
              className="text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition"
            >
              + Add Kid
            </button>
          </div>

          {children.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
              <p className="text-4xl mb-2">👶</p>
              <p>No kids yet. Add one to get started!</p>
              <button
                onClick={() => setShowAddChild(true)}
                className="mt-3 text-indigo-600 font-medium text-sm"
              >
                Add a kid →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {children.map(child => {
                const childTasks = tasks.filter(t => t.assignedToId === child.id);
                const pending = childTasks.filter(t => t.status === 'COMPLETED').length;
                const todo = childTasks.filter(t => t.status === 'PENDING' || t.status === 'REJECTED').length;
                return (
                  <Link
                    key={child.id}
                    to={`/children/${child.id}`}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition block"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{child.name}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {todo} to do
                          {pending > 0 && <span className="ml-2 text-amber-600 font-medium">· {pending} pending ✓</span>}
                        </p>
                      </div>
                      <span className="text-3xl">👦</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Pending approvals list */}
        {pendingApprovals.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">Needs Approval</h2>
            <div className="space-y-3">
              {pendingApprovals.map(task => (
                <TaskCard key={task.id} task={task} role="PARENT" onUpdate={refresh} />
              ))}
            </div>
          </section>
        )}

        {/* All tasks by child */}
        {children.map(child => {
          const childTasks = tasks.filter(t => t.assignedToId === child.id && t.status !== 'COMPLETED');
          if (childTasks.length === 0) return null;
          return (
            <section key={child.id}>
              <h2 className="text-lg font-bold text-gray-800 mb-3">{child.name}'s Tasks</h2>
              <div className="space-y-3">
                {childTasks.map(task => (
                  <TaskCard key={task.id} task={task} role="PARENT" onUpdate={refresh} />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {showAddChild && (
        <AddChildModal onClose={() => setShowAddChild(false)} onAdded={refresh} />
      )}
    </div>
  );
}
