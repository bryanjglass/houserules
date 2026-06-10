import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCalendar } from '../api/queries';
import { formatCents } from '../lib/money';
import type { CalendarEvent } from '../types/models';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_DOT: Record<string, string> = {
  PENDING: 'bg-amber-500',
  COMPLETED: 'bg-brand',
  APPROVED: 'bg-money-600',
};

// Local date -> household-style day key "YYYY-MM-DD" (matches server event dates).
function ymdKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

// Sunday of the week containing `date`, at local midnight.
function startOfWeek(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
}

// "Jun 7 – 13, 2026"; spans months as "Jun 28 – Jul 4, 2026" and years as
// "Dec 28, 2025 – Jan 3, 2027".
function formatWeekRange(start: Date, end: Date): string {
  if (start.getFullYear() !== end.getFullYear()) {
    return `${MONTHS[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()} – ${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  }
  if (start.getMonth() !== end.getMonth()) {
    return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
}

export default function Calendar() {
  const { user } = useAuth();
  const isParent = user?.role === 'PARENT';
  const today = new Date();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));

  const days = useMemo(
    () =>
      Array.from(
        { length: 7 },
        (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i),
      ),
    [weekStart],
  );

  // The visible range as day keys, keyed so each week's events are cached
  // separately.
  const startDay = ymdKey(days[0]);
  const endDay = ymdKey(days[6]);

  const calendarQuery = useCalendar(startDay, endDay);
  const events: CalendarEvent[] = calendarQuery.data ?? [];
  const loading = calendarQuery.isPending;

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      // ev.date is already a day key — group by exact string match.
      (map[ev.date] ||= []).push(ev);
    }
    return map;
  }, [events]);

  const goToWeek = (delta: number) =>
    setWeekStart(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta * 7));
  const goToToday = () => setWeekStart(startOfWeek(new Date()));

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink-900">
            {formatWeekRange(days[0], days[6])}
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

        {/* Week agenda */}
        <div className="space-y-2">
          {days.map(day => {
            const isToday = ymdKey(day) === ymdKey(today);
            const dayEvents = eventsByDay[ymdKey(day)] || [];
            return (
              <section
                key={ymdKey(day)}
                className="bg-white border border-line rounded-xl p-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                      isToday ? 'bg-brand text-white' : 'text-ink-700'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <span className={`text-sm font-bold ${isToday ? 'text-ink-900' : 'text-ink-500'}`}>
                    {WEEKDAYS[day.getDay()]}
                  </span>
                </div>
                {dayEvents.length === 0 ? (
                  <p className="mt-2 pl-9 text-xs text-ink-300">No tasks</p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {dayEvents.map(ev => (
                      <div
                        key={ev.id}
                        title={`${ev.title}${ev.projected ? ' (upcoming)' : ''}`}
                        className={`text-xs leading-tight px-2 py-1.5 rounded-lg border ${
                          ev.projected
                            ? 'border-dashed border-ink-300 bg-appbg text-ink-400'
                            : 'border-brand-100 bg-brand-50 text-ink-900'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[ev.status] || 'bg-ink-300'}`} />
                          <span className="truncate font-semibold">{ev.title}</span>
                          {ev.rewardCents ? (
                            <span className="ml-auto text-money-600 font-bold shrink-0">{formatCents(ev.rewardCents)}</span>
                          ) : null}
                        </span>
                        {isParent && ev.child && (
                          <span className="block truncate opacity-70 pl-3.5">{ev.child.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
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
