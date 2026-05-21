import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client.js';
import NavBar from '../../components/NavBar.jsx';
import TaskCard from '../../components/TaskCard.jsx';
import BalanceDisplay from '../../components/BalanceDisplay.jsx';

const STATUS_ORDER = { COMPLETED: 0, PENDING: 1, REJECTED: 2, APPROVED: 3 };

export default function ChildDetail() {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allowance, setAllowance] = useState(null);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [filter, setFilter] = useState('active');

  const refresh = useCallback(async () => {
    const [childrenRes, tasksRes, allowanceRes] = await Promise.all([
      api.get('/users/children'),
      api.get('/tasks'),
      api.get(`/allowance/${childId}`),
    ]);
    const found = childrenRes.data.find(c => c.id === childId);
    setChild(found);
    setTasks(tasksRes.data.filter(t => t.assignedToId === childId));
    setAllowance(allowanceRes.data);
  }, [childId]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleAdjust = async (e) => {
    e.preventDefault();
    setAdjustLoading(true);
    try {
      await api.post(`/allowance/${childId}/adjust`, {
        amount: parseFloat(adjustAmount),
        note: adjustNote || undefined,
      });
      setAdjustAmount('');
      setAdjustNote('');
      setShowAdjust(false);
      refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    } finally {
      setAdjustLoading(false);
    }
  };

  if (!child) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;

  const filteredTasks = tasks
    .filter(t => filter === 'active' ? t.status !== 'APPROVED' : t.status === 'APPROVED')
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99));

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-indigo-500 text-sm hover:text-indigo-700">← Back</Link>
          <h1 className="text-2xl font-bold text-gray-900">{child.name}</h1>
        </div>

        {allowance && (
          <div>
            <BalanceDisplay balance={allowance.balance} />
            <button
              onClick={() => setShowAdjust(!showAdjust)}
              className="mt-2 text-sm text-indigo-600 font-medium hover:text-indigo-800"
            >
              {showAdjust ? 'Cancel' : 'Adjust balance manually'}
            </button>
            {showAdjust && (
              <form onSubmit={handleAdjust} className="bg-white rounded-xl border border-gray-100 p-4 mt-2 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Amount (use − for debit)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={adjustAmount}
                      onChange={e => setAdjustAmount(e.target.value)}
                      required
                      placeholder="5.00"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
                    <input
                      type="text"
                      value={adjustNote}
                      onChange={e => setAdjustNote(e.target.value)}
                      placeholder="Birthday bonus"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="w-full bg-indigo-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {adjustLoading ? 'Saving...' : 'Save Adjustment'}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Tasks</h2>
          <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium">
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1.5 rounded-md transition ${filter === 'active' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('done')}
              className={`px-3 py-1.5 rounded-md transition ${filter === 'done' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
            >
              Done
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link
            to={`/tasks/new?childId=${childId}`}
            className="text-sm bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            + New Task
          </Link>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
            <p className="text-3xl mb-2">✅</p>
            <p>{filter === 'active' ? 'No active tasks.' : 'No completed tasks yet.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => (
              <TaskCard key={task.id} task={task} role="PARENT" onUpdate={refresh} />
            ))}
          </div>
        )}

        {allowance && allowance.transactions.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">Transaction History</h2>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {allowance.transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {tx.task?.title || tx.note || (tx.type === 'ADJUSTMENT' ? 'Manual adjustment' : 'Earned')}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.amount >= 0 ? '+' : ''}${tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
