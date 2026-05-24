import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCents } from '../lib/money.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_DOT = {
  PENDING: 'bg-amber-500',
  COMPLETED: 'bg-brand',
  APPROVED: 'bg-money-600',
  REJECTED: 'bg-rose-500',
};

function ymdKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function Calendar() {
  const { user } = useAuth();
  const isParent = user?.role === 'PARENT';
  const today = new Date();

  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Build a stable 6-week (42-cell) grid covering the visible month.
  const cells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const leading = new Date(year, month, 1).getDay();
    return Array.from({ length: 42 }, (_, i) => new Date(year, month, 1 - leading + i));
  }, [viewDate]);

  const refresh = useCallback(async () => {
    const start = cells[0];
    const last = cells[cells.length - 1];
    const end = new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 59, 59, 999);
    setLoading(true);
    const r = await api.get('/tasks/calendar', {
      params: { start: start.toISOString(), end: end.toISOString() },
    });
    setEvents(r.data);
    setLoading(false);
  }, [cells]);

  useEffect(() => { refresh(); }, [refresh]);

  const eventsByDay = useMemo(() => {
    const map = {};
    for (const ev of events) {
      const key = ymdKey(new Date(ev.date));
      (map[key] ||= []).push(ev);
    }
    return map;
  }, [events]);

  const goToMonth = (delta) =>
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  const goToToday = () =>
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

  const viewMonth = viewDate.getMonth();

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink-900">
            {MONTHS[viewMonth]} {viewDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToMonth(-1)}
              className="w-9 h-9 rounded-[10px] bg-white border border-line text-ink-500 hover:bg-appbg transition"
              aria-label="Previous month"
            >
              ‹
            </button>
            <button
              onClick={goToToday}
              className="px-3 h-9 rounded-[10px] bg-white border border-line text-sm font-semibold text-ink-500 hover:bg-appbg transition"
            >
              Today
            </button>
            <button
              onClick={() => goToMonth(1)}
              className="w-9 h-9 rounded-[10px] bg-white border border-line text-ink-500 hover:bg-appbg transition"
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-px text-center">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-xs font-bold text-ink-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-line rounded-xl overflow-hidden border border-line">
          {cells.map(cell => {
            const inMonth = cell.getMonth() === viewMonth;
            const isToday = ymdKey(cell) === ymdKey(today);
            const dayEvents = eventsByDay[ymdKey(cell)] || [];
            return (
              <div
                key={ymdKey(cell)}
                className={`min-h-[5.5rem] p-1.5 ${inMonth ? 'bg-white' : 'bg-appbg'}`}
              >
                <div className="flex justify-end">
                  <span
                    className={`text-xs w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-brand text-white font-bold'
                        : inMonth ? 'text-ink-700' : 'text-ink-300'
                    }`}
                  >
                    {cell.getDate()}
                  </span>
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.map(ev => (
                    <div
                      key={ev.id}
                      title={`${ev.title}${ev.projected ? ' (upcoming)' : ''}`}
                      className={`text-[10px] leading-tight px-1 py-0.5 rounded border truncate ${
                        ev.projected
                          ? 'border-dashed border-ink-300 bg-appbg text-ink-400'
                          : 'border-brand-100 bg-brand-50 text-ink-900'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[ev.status] || 'bg-ink-300'}`} />
                        <span className="truncate">{ev.title}</span>
                      </span>
                      {isParent && ev.assignedTo && (
                        <span className="block truncate opacity-70">{ev.assignedTo.name}</span>
                      )}
                      {ev.dollarAmount ? (
                        <span className="block text-money-600 font-bold">{formatCents(ev.dollarAmount)}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-ink-400">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded border border-brand-100 bg-brand-50" /> Scheduled
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded border border-dashed border-ink-300 bg-appbg" /> Upcoming (recurring)
          </span>
          {loading && <span className="ml-auto">Loading…</span>}
        </div>
    </main>
  );
}
