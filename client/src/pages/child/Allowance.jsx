import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import BalanceDisplay from '../../components/BalanceDisplay.jsx';

export default function ChildAllowance() {
  const { user } = useAuth();
  const [allowance, setAllowance] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const r = await api.get(`/allowance/${user.id}`);
    setAllowance(r.data);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400 text-xl">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <header className="bg-emerald-600 text-white px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">💰 My Money</h1>
          <Link to="/" className="text-emerald-200 text-sm hover:text-white">← Chores</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {allowance && <BalanceDisplay balance={allowance.balance} />}

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3">History</h2>
          {!allowance || allowance.transactions.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">🪙</p>
              <p>No transactions yet. Complete some chores to earn money!</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 shadow-sm">
              {allowance.transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {tx.task?.title || tx.note || (tx.type === 'ADJUSTMENT' ? 'Adjustment' : 'Earned')}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-bold text-base ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex shadow-lg">
        <Link
          to="/"
          className="flex-1 flex flex-col items-center py-3 text-gray-400 hover:text-indigo-600 transition"
        >
          <span className="text-xl">📋</span>
          <span className="text-xs font-medium mt-0.5">Chores</span>
        </Link>
        <Link
          to="/calendar"
          className="flex-1 flex flex-col items-center py-3 text-gray-400 hover:text-indigo-600 transition"
        >
          <span className="text-xl">📅</span>
          <span className="text-xs font-medium mt-0.5">Calendar</span>
        </Link>
        <Link
          to="/allowance"
          className="flex-1 flex flex-col items-center py-3 text-emerald-600"
        >
          <span className="text-xl">💰</span>
          <span className="text-xs font-medium mt-0.5">My Money</span>
        </Link>
      </nav>
      <div className="h-16" />
    </div>
  );
}
