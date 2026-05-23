import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client.js';
import NavBar from '../../components/NavBar.jsx';
import TaskCard from '../../components/TaskCard.jsx';
import BalanceDisplay from '../../components/BalanceDisplay.jsx';
import { Avatar } from '../../components/Brand.jsx';
import { ChevronLeftIcon, PlusIcon } from '../../components/Icons.jsx';

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

  if (!child) return <div className="flex items-center justify-center min-h-screen text-ink-400">Loading…</div>;

  const filteredTasks = tasks
    .filter(t => filter === 'active' ? t.status !== 'APPROVED' : t.status === 'APPROVED')
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99));

  return (
    <div className="min-h-screen bg-appbg">
      <NavBar />
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
          <Link to={`/tasks/new?childId=${childId}`} className="btn-primary !px-4 !py-2 !text-[13px] !rounded-xl">
            <PlusIcon size={16} /> New Task
          </Link>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="card border-dashed p-8 text-center text-ink-400">
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
            <h2 className="text-lg font-bold text-ink-900 mb-3">Transaction History</h2>
            <div className="card divide-y divide-line/60">
              {allowance.transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-ink-900">
                      {tx.task?.title || tx.note || (tx.type === 'ADJUSTMENT' ? 'Manual adjustment' : 'Earned')}
                    </p>
                    <p className="text-xs text-ink-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-extrabold ${tx.amount >= 0 ? 'text-money-600' : 'text-rose-500'}`}>
                    {tx.amount >= 0 ? '+' : '−'}${Math.abs(tx.amount).toFixed(2)}
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
