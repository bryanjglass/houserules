import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import BalanceDisplay from '../../components/BalanceDisplay.jsx';
import Thumb from '../../components/Thumb.jsx';
import SavingsGoalCard from '../../components/SavingsGoalCard.jsx';
import { formatCents } from '../../lib/money.js';

const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function ChildAllowance() {
  const { user } = useAuth();
  const [allowance, setAllowance] = useState(null);
  const [goal, setGoal] = useState(null);
  const [cashingIn, setCashingIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [allowanceRes, goalRes] = await Promise.all([
      api.get(`/allowance/${user.id}`),
      api.get(`/goals/${user.id}`).catch(() => null),
    ]);
    setAllowance(allowanceRes.data);
    setGoal(goalRes?.data?.goal ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCashIn = async () => {
    if (!goal) return;
    setCashingIn(true);
    try {
      await api.post(`/goals/${goal.id}/request-cash-in`);
      await refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not request cash-in');
    } finally {
      setCashingIn(false);
    }
  };

  const transactions = allowance?.transactions || [];

  // Days in the current month that have an earning, for the calendar highlights.
  const today = new Date();
  const earnedDays = useMemo(() => {
    const set = new Set();
    for (const tx of transactions) {
      const d = new Date(tx.createdAt);
      if (tx.amount > 0 && d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()) {
        set.add(d.getDate());
      }
    }
    return set;
  }, [transactions]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-ink-400 text-xl">Loading…</div>;
  }

  const year = today.getFullYear();
  const month = today.getMonth();
  const leading = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: leading + daysInMonth }, (_, i) =>
    i < leading ? null : i - leading + 1
  );

  return (
    <>
      {/* Teal wallet header — full bleed */}
      <BalanceDisplay balance={allowance?.balance ?? 0} rounded={false} />

      <main className="max-w-lg mx-auto px-5 pt-4">
        {/* Month calendar with earning highlights */}
        <div className="flex items-center justify-between">
          <div className="text-[14px] font-extrabold">{MONTHS[month]} {year}</div>
        </div>
        <div className="grid grid-cols-7 mt-2 text-[9.5px] text-ink-400 font-bold text-center">
          {DOW.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 mt-1 gap-0.5 text-[11px] text-center font-semibold">
          {cells.map((d, i) => {
            if (d == null) return <div key={`x${i}`} />;
            const isToday = d === today.getDate();
            const earned = earnedDays.has(d);
            return (
              <div
                key={d}
                className="aspect-square grid place-items-center rounded-full relative"
                style={{
                  color: isToday ? '#fff' : '#0F172A',
                  background: isToday ? '#2D7FF9' : earned ? '#DCFCE7' : 'transparent',
                }}
              >
                <span>{d}</span>
                {earned && !isToday && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-money-600" />
                )}
              </div>
            );
          })}
        </div>

        {/* Recent earnings / activity */}
        <h2 className="mt-4 text-[14px] font-extrabold">Recent Earnings</h2>
        {transactions.length === 0 ? (
          <div className="card border-dashed p-8 text-center text-ink-400 mt-2">
            <p>No transactions yet. Complete some chores to earn money!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 mt-2">
            {transactions.map(tx => (
              <div key={tx.id} className="card p-2.5 flex items-center gap-2.5">
                <Thumb size={34} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold truncate">
                    {tx.task?.title
                      || (tx.goal?.title ? `Cashed in: ${tx.goal.title}` : null)
                      || tx.note
                      || (tx.type === 'ADJUSTMENT' ? 'Adjustment' : 'Earned')}
                  </div>
                  <div className="text-[10.5px] text-ink-400">
                    {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className={`text-[13.5px] font-extrabold ${tx.amount >= 0 ? 'text-money-600' : 'text-rose-500'}`}>
                  {tx.amount >= 0 ? '+' : '−'}{formatCents(Math.abs(tx.amount))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Savings Goal — DESIGN §5 Screen 6 */}
        {goal && (
          <>
            <h2 className="mt-4 mb-2 text-[14px] font-extrabold">Savings Goal</h2>
            <SavingsGoalCard goal={goal} onCashIn={handleCashIn} busy={cashingIn} />
          </>
        )}
      </main>
    </>
  );
}
