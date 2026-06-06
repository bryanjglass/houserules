import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCalendar } from '../api/queries';
import { formatCents } from '../lib/money';
import type { CalendarEvent } from '../types/models';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const STATUS_DOT: Record<string, string> = {
  PENDING: 'bg-amber-500',
  COMPLETED: 'bg-brand',
  APPROVED: 'bg-money-600',
  REJECTED: 'bg-rose-500',
};

function ymdKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// The Sunday (00:00 local) of the week containing `date`.
function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

// Human label for the visible week, spanning month/year boundaries correctly.
function weekRangeLabel(start: Date, end: Date): string {
  const sM = MONTHS_SHORT[start.getMonth()];
  const eM = MONTHS_SHORT[end.getMonth()];
  const sY = start.getFullYear();
  const eY = end.getFullYear();
  if (sY !== eY) return `${sM} ${start.getDate()}, ${sY} – ${eM} ${end.getDate()}, ${eY}`;
  if (start.getMonth() !== end.getMonth()) return `${sM} ${start.getDate()} – ${eM} ${end.getDate()}, ${eY}`;
  return `${sM} ${start.getDate()} – ${end.getDate()}, ${eY}`;
}

export default function Calendar() {
  const { user } = useAuth();
  const isParent = user?.role === 'PARENT';
  const today = new Date();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));

  // The seven days of the visible week, Sunday → Saturday.
  const cells = useMemo(
    () => Array.from({ length: 7 }, (_, i) =>
      new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)
    ),
    [weekStart]
  );

  // The visible range, keyed so each week's events are cached separately.
  const startISO = cells[0].toISOString();
  const lastCell = cells[cells.length - 1];
  const endISO = new Date(
    lastCell.getFullYear(), lastCell.getMonth(), lastCell.getDate(), 23, 59, 59, 999
  ).toISOString();

  const calendarQuery = useCalendar(startISO, endISO);
  const events: CalendarEvent[] = calendarQuery.data ?? [];
  const loading = calendarQuery.isPending;

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      const key = ymdKey(new Date(ev.date));
      (map[key] ||= []).push(ev);
    }
    return map;
  }, [events]);

  const goToWeek = (delta: number) =>
    setWeekStart(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta * 7));
  const goToToday = () => setWeekStart(startOfWeek(today));

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink-900">
            {weekRangeLabel(cells[0], lastCell)}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToWeek(-1)}
              className="w-9 h-9 rounded-[10px] bg-white border border-line text-ink-500 hover:bg-appbg transition"
              aria-label="Previous week"
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
              onClick={() => goToWeek(1)}
              className="w-9 h-9 rounded-[10px] bg-white border border-line text-ink-500 hover:bg-appbg transition"
              aria-label="Next week"
            >
              ›
            </button>
          </div>
        </div>

        {/* Week day rows */}
        <div className="space-y-2">
          {cells.map(cell => {
            const isToday = ymdKey(cell) === ymdKey(today);
            const dayEvents = eventsByDay[ymdKey(cell)] || [];
            return (
              <div
                key={ymdKey(cell)}
                className="rounded-xl border border-line bg-white overflow-hidden"
              >
                <div className="flex">
                  {/* Date column */}
                  <div
                    className={`w-20 shrink-0 flex flex-col items-center justify-center py-3 border-r border-line ${
                      isToday ? 'bg-brand-50' : 'bg-appbg'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase text-ink-400">
                      {WEEKDAYS[cell.getDay()]}
                    </span>
                    <span
                      className={`mt-0.5 w-8 h-8 flex items-center justify-center rounded-full text-lg ${
                        isToday ? 'bg-brand text-white font-bold' : 'text-ink-900 font-semibold'
                      }`}
                    >
                      {cell.getDate()}
                    </span>
                  </div>
                  {/* Tasks for the day */}
                  <div className="flex-1 p-2 space-y-1 min-h-[3.5rem]">
                    {dayEvents.length === 0 ? (
                      <div className="h-full flex items-center px-1 text-xs text-ink-300">
                        No tasks
                      </div>
                    ) : (
                      dayEvents.map(ev => (
                        <div
                          key={ev.id}
                          title={`${ev.title}${ev.projected ? ' (upcoming)' : ''}`}
                          className={`text-xs leading-tight px-2 py-1 rounded border ${
                            ev.projected
                              ? 'border-dashed border-ink-300 bg-appbg text-ink-400'
                              : 'border-brand-100 bg-brand-50 text-ink-900'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[ev.status] || 'bg-ink-300'}`} />
                            <span className="font-medium">{ev.title}</span>
                            {ev.dollarAmount ? (
                              <span className="ml-auto shrink-0 text-money-600 font-bold">{formatCents(ev.dollarAmount)}</span>
                            ) : null}
                          </span>
                          {isParent && ev.assignedTo && (
                            <span className="block truncate opacity-70 pl-3">{ev.assignedTo.name}</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
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
