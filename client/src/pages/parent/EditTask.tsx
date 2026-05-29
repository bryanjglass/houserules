import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { Avatar } from '../../components/Brand';
import { ChevronLeftIcon, CalendarIcon } from '../../components/Icons';
import { dollarsToCents, formatCents } from '../../lib/money';
import type { Recurrence } from '../../types/domain';
import type { Child, TaskView } from '../../types/models';

const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: 'DAILY', label: 'Every day' },
  { value: 'WEEKLY', label: 'Every week' },
  { value: 'MONTHLY', label: 'Every month' },
];

const WEEKDAYS = [
  { value: 0, label: 'Sun' }, { value: 1, label: 'Mon' }, { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' }, { value: 4, label: 'Thu' }, { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

// Cents (over the wire) -> a plain dollar string for the number input.
function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '';
  return String(cents / 100);
}

// ISO timestamp -> yyyy-MM-dd for a <input type="date">.
function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

export default function EditTask() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [task, setTask] = useState<TaskView | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dollarAmount, setDollarAmount] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [isUpForGrabs, setIsUpForGrabs] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<Recurrence>('WEEKLY');
  const [weeklyDays, setWeeklyDays] = useState<number[]>([]);
  const [catchUp, setCatchUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.get(`/tasks/${id}`), api.get('/users/children')])
      .then(([taskRes, childrenRes]) => {
        const t: TaskView = taskRes.data;
        setTask(t);
        setChildren(childrenRes.data);
        setTitle(t.title);
        setDescription(t.description ?? '');
        setDollarAmount(t.isPerUnit ? centsToInput(t.unitReward) : centsToInput(t.dollarAmount));
        setAssignedToId(t.assignedToId ?? '');
        setIsUpForGrabs(t.isUpForGrabs);
        setDueDate(isoToDateInput(t.dueDate));
        setIsRecurring(t.isRecurring);
        setRecurrence((t.recurrence as Recurrence) ?? 'WEEKLY');
        setWeeklyDays(
          t.weeklyDays ? t.weeklyDays.split(',').map(Number).filter(n => Number.isInteger(n)) : []
        );
        setCatchUp(Boolean(t.catchUp));
      })
      .catch(() => setNotFound(true));
  }, [id]);

  const selectRecurrence = (value: Recurrence) => {
    setRecurrence(value);
    if (value !== 'WEEKLY') setWeeklyDays([]);
  };

  const toggleWeekday = (day: number) => {
    setWeeklyDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b));
  };

  // Assignee and recurrence are locked once the chore is awaiting approval or is
  // a per-unit chore — reassigning or re-cadencing mid-completion is out of scope.
  const isPerUnit = !!task?.isPerUnit;
  const assigneeLocked = isPerUnit || task?.status === 'COMPLETED';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Enter a title'); return; }
    setLoading(true);
    try {
      // Per-unit reward (unitReward) is read-only here; only the editable fields go up.
      await api.put(`/tasks/${id}`, {
        title,
        description: description || null,
        ...(isPerUnit ? {} : { dollarAmount: dollarAmount ? dollarsToCents(dollarAmount) : null }),
        ...(assigneeLocked ? {} : { assignedToId: isUpForGrabs ? undefined : assignedToId || undefined, isUpForGrabs }),
        dueDate: dueDate || null,
        ...(isPerUnit ? {} : {
          isRecurring,
          recurrence: isRecurring ? recurrence : null,
          weeklyDays: isRecurring && recurrence === 'WEEKLY' ? weeklyDays : [],
          catchUp: isRecurring && !isUpForGrabs && assignedToId ? catchUp : false,
        }),
      });
      navigate(-1);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  if (notFound) {
    return (
      <div className="max-w-lg mx-auto px-5 pt-10 text-center">
        <p className="text-ink-500">This task could not be found.</p>
        <button onClick={() => navigate(-1)} className="text-brand font-bold mt-3">Go back</button>
      </div>
    );
  }

  if (!task) {
    return <div className="max-w-lg mx-auto px-5 pt-10 text-center text-ink-400">Loading…</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-5 pt-3 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between py-2">
          <button type="button" onClick={() => navigate(-1)} className="text-ink-900" aria-label="Back">
            <ChevronLeftIcon size={22} />
          </button>
          <div className="text-[16px] font-extrabold">Edit Task</div>
          <button type="submit" disabled={loading} className="text-[14px] font-bold text-brand disabled:opacity-50">
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>

        {error && <div className="bg-rose-50 text-rose-600 text-sm rounded-[14px] px-3 py-2 mb-3">{error}</div>}

        <div className="space-y-3.5 mt-2">
          {/* Task Title */}
          <div>
            <label className="label">Task Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="input" placeholder="Feed the dog" />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description <span className="text-ink-400 font-medium">(optional)</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="input resize-none" placeholder="Any extra details…" />
          </div>

          {/* Reward + Due Date */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="label">{isPerUnit ? 'Reward per item' : 'Reward'}</label>
              {isPerUnit ? (
                <div className="flex items-center gap-2 border-[1.5px] border-line rounded-[14px] px-3 py-2.5 bg-appbg">
                  <span className="w-[22px] h-[22px] rounded-full bg-money-50 text-money-700 grid place-items-center font-extrabold text-[12px] shrink-0">$</span>
                  <span className="text-[14.5px] font-bold text-ink-500">{formatCents(task.unitReward)}/item</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 border-[1.5px] border-line rounded-[14px] px-3 py-2.5 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-50 transition">
                  <span className="w-[22px] h-[22px] rounded-full bg-money-50 text-money-700 grid place-items-center font-extrabold text-[12px] shrink-0">$</span>
                  <input
                    type="number" min="0" step="0.25" value={dollarAmount}
                    onChange={e => setDollarAmount(e.target.value)}
                    className="w-full outline-none text-[14.5px] font-bold text-ink-900 placeholder:text-ink-400 placeholder:font-normal"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="label">Due Date</label>
              <div className="flex items-center gap-2 border-[1.5px] border-line rounded-[14px] px-3 py-2.5 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-50 transition">
                <CalendarIcon size={16} className="text-brand shrink-0" />
                <input
                  type="date" value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full outline-none text-[13px] font-semibold text-ink-900 bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Per-unit chores can't be re-cadenced or reassigned here. */}
          {isPerUnit && (
            <p className="text-[11.5px] text-ink-400">Per-item reward and assignment can't be changed after creation.</p>
          )}

          {/* Up for grabs — only meaningful when the chore has no assignee yet */}
          {!isPerUnit && !assigneeLocked && (
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                role="switch"
                aria-checked={isUpForGrabs}
                onClick={() => setIsUpForGrabs(!isUpForGrabs)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isUpForGrabs ? 'bg-violet-600' : 'bg-ink-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isUpForGrabs ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <div>
                <span className="text-[13px] font-bold text-ink-700">Up for grabs</span>
                <p className="text-[11px] text-ink-400">Any kid can claim it — first to grab wins.</p>
              </div>
            </div>
          )}

          {/* Assign To */}
          {!isPerUnit && !isUpForGrabs && (
            <div>
              <label className="label">Assign To</label>
              {assigneeLocked ? (
                <p className="text-[13px] font-semibold text-ink-500">
                  {task.assignedTo?.name ?? 'Assigned'} <span className="text-ink-400 font-medium">(can't reassign while awaiting approval)</span>
                </p>
              ) : children.length === 0 ? (
                <p className="text-sm text-ink-400">No kids yet — add one first.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {children.map(c => {
                    const on = assignedToId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setAssignedToId(c.id)}
                        className={`flex items-center gap-2 rounded-[14px] p-2.5 border-[1.5px] transition ${
                          on ? 'border-brand bg-brand-50' : 'border-line hover:border-brand-100'
                        }`}
                      >
                        <Avatar name={c.name} size={28} />
                        <span className="text-[12.5px] font-bold text-ink-900 truncate">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Recurring */}
          {!isPerUnit && (
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                role="switch"
                aria-checked={isRecurring}
                onClick={() => setIsRecurring(!isRecurring)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isRecurring ? 'bg-brand' : 'bg-ink-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isRecurring ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-[13px] font-bold text-ink-700">Recurring task</span>
            </div>
          )}

          {!isPerUnit && isRecurring && (
            <div className="grid grid-cols-3 gap-2">
              {RECURRENCE_OPTIONS.map(opt => {
                const on = recurrence === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => selectRecurrence(opt.value)}
                    className={`py-2 rounded-[14px] text-[12px] font-bold border-[1.5px] transition ${
                      on ? 'border-brand bg-brand-50 text-brand' : 'border-line text-ink-700 hover:border-brand-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {!isPerUnit && isRecurring && recurrence === 'WEEKLY' && (
            <div>
              <label className="label">On these days <span className="text-ink-400 font-medium">(optional)</span></label>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map(day => {
                  const on = weeklyDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWeekday(day.value)}
                      className={`py-2 rounded-[10px] text-[11px] font-bold border-[1.5px] transition ${
                        on ? 'border-brand bg-brand-50 text-brand' : 'border-line text-ink-700 hover:border-brand-100'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-ink-400 mt-1">Leave empty to repeat every 7 days.</p>
            </div>
          )}

          {/* Catch-up — only for a recurring chore assigned to a specific kid.
              Missed days pile up as separate tasks the kid can clear anytime. */}
          {!isPerUnit && isRecurring && !isUpForGrabs && assignedToId && (
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                role="switch"
                aria-checked={catchUp}
                onClick={() => setCatchUp(!catchUp)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${catchUp ? 'bg-brand' : 'bg-ink-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${catchUp ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <div>
                <span className="text-[13px] font-bold text-ink-700">Let missed days stack up</span>
                <p className="text-[11px] text-ink-400">Each skipped day becomes its own task to catch up on — no waiting for approval.</p>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
    </form>
  );
}
