import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import NavBar from '../../components/NavBar.jsx';
import TaskCard from '../../components/TaskCard.jsx';
import AddChildModal from './AddChildModal.jsx';
import { Avatar } from '../../components/Brand.jsx';
import { BellIcon, PlusIcon } from '../../components/Icons.jsx';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function isThisMonth(d) {
  const now = new Date();
  const dt = new Date(d);
  return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [balances, setBalances] = useState({}); // childId -> { balance, transactions }
  const [showAddChild, setShowAddChild] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [childrenRes, tasksRes] = await Promise.all([
      api.get('/users/children'),
      api.get('/tasks'),
    ]);
    setChildren(childrenRes.data);
    setTasks(tasksRes.data);

    const allowances = await Promise.all(
      childrenRes.data.map(c => api.get(`/allowance/${c.id}`).then(r => [c.id, r.data]).catch(() => [c.id, null]))
    );
    setBalances(Object.fromEntries(allowances));
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-ink-400">Loading…</div>;
  }

  const pendingApprovals = tasks.filter(t => t.status === 'COMPLETED');
  const outstanding = tasks.filter(t => t.status === 'PENDING' || t.status === 'REJECTED');

  // Stats — sum of this-month EARNED transactions, and approved chores.
  let totalPaid = 0;
  for (const a of Object.values(balances)) {
    for (const tx of a?.transactions || []) {
      if (tx.type === 'EARNED' && tx.amount > 0 && isThisMonth(tx.createdAt)) totalPaid += tx.amount;
    }
  }
  const choresApproved = tasks.filter(t => t.status === 'APPROVED').length;

  return (
    <div className="min-h-screen bg-appbg">
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} size={46} />
            <div>
              <div className="text-[13px] text-ink-500">{greeting()},</div>
              <div className="text-[19px] font-extrabold text-ink-900 leading-tight">{user?.name}!</div>
            </div>
          </div>
          <div className="w-[38px] h-[38px] rounded-xl bg-[#F4F6F8] grid place-items-center text-ink-900 relative">
            <BellIcon size={20} />
            {pendingApprovals.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold grid place-items-center">
                {pendingApprovals.length}
              </span>
            )}
          </div>
        </div>

        {/* Your Family */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[15px] font-bold text-ink-900">Your Family</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {children.map(child => (
              <Link
                key={child.id}
                to={`/children/${child.id}`}
                className="border border-line rounded-[14px] py-3 px-2 flex flex-col items-center gap-1 bg-white hover:shadow-md transition"
              >
                <Avatar name={child.name} size={40} />
                <div className="text-[12.5px] font-bold text-ink-900">{child.name}</div>
                <div className="text-[13px] text-money-600 font-extrabold">
                  ${(balances[child.id]?.balance ?? 0).toFixed(2)}
                </div>
                <div className="text-[10px] text-ink-400">Balance</div>
              </Link>
            ))}
            <button
              onClick={() => setShowAddChild(true)}
              className="border-[1.5px] border-dashed border-ink-300 rounded-[14px] flex flex-col items-center justify-center gap-1 text-ink-500 py-3 hover:border-brand hover:text-brand transition min-h-[112px]"
            >
              <PlusIcon size={22} />
              <span className="text-[11.5px] font-semibold">Add Child</span>
            </button>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-2.5">
          <StatTile icon="$" tint="#16A34A" label="Total Allowance Paid" value={`$${totalPaid.toFixed(2)}`} caption="This month" />
          <StatTile icon="✓" tint="#2D7FF9" label="Chores Completed" value={String(choresApproved)} caption="All time" />
        </section>

        {/* Needs approval */}
        {pendingApprovals.length > 0 && (
          <section>
            <h2 className="text-[15px] font-bold text-ink-900 mb-2.5">Needs Approval</h2>
            <div className="space-y-2.5">
              {pendingApprovals.map(task => (
                <TaskCard key={task.id} task={task} role="PARENT" onUpdate={refresh} />
              ))}
            </div>
          </section>
        )}

        {/* Outstanding chores */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[15px] font-bold text-ink-900">Outstanding Chores</h2>
          </div>
          {children.length === 0 ? (
            <div className="card border-dashed p-8 text-center text-ink-400">
              <p>No kids yet. Add one to get started!</p>
              <button onClick={() => setShowAddChild(true)} className="btn-ghost mt-2 mx-auto">
                Add a kid →
              </button>
            </div>
          ) : outstanding.length === 0 ? (
            <div className="card border-dashed p-8 text-center text-ink-400">
              <p>All caught up — no outstanding chores. 🎉</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {outstanding.map(task => (
                <TaskCard key={task.id} task={task} role="PARENT" onUpdate={refresh} />
              ))}
            </div>
          )}
        </section>
      </main>

      {showAddChild && (
        <AddChildModal onClose={() => setShowAddChild(false)} onAdded={refresh} />
      )}
    </div>
  );
}

function StatTile({ icon, tint, label, value, caption }) {
  return (
    <div className="card p-3 flex gap-2.5 items-center">
      <div
        className="w-8 h-8 rounded-[10px] grid place-items-center font-extrabold shrink-0"
        style={{ background: tint + '20', color: tint }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px] text-ink-400 font-semibold truncate">{label}</div>
        <div className="text-[16px] font-extrabold text-ink-900">{value}</div>
        <div className="text-[9.5px] text-ink-400">{caption}</div>
      </div>
    </div>
  );
}
