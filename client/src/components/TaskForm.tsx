import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTask, useUpdateTask } from '../api/mutations';
import { Avatar } from './Brand';
import { ChevronLeftIcon, CalendarIcon } from './Icons';
import { dollarsToCents, formatCents } from '../lib/money';
import type { Recurrence } from '../types/domain';
import type { Child, TaskView } from '../types/models';

// Per DESIGN.md §"Screen 3 — Create / Assign Task": title input, reward + due
// date row, and switch-style toggles (on = bg-brand/bg-violet-600, off =
// bg-ink-300) for up-for-grabs / recurring / catch-up. This component is the
// single source for both the create and edit screens — a structural extraction
// of the two previously-duplicated forms, using the existing tokens only.

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

interface TaskFormProps {
  mode: 'create' | 'edit';
  children: Child[];
  // Edit mode: the task being edited (initializes the fields).
  initial?: TaskView;
  // Create mode: preselected assignee (e.g. from ?childId=).
  defaultChildId?: string;
  // Optional override for navigation after a successful submit. When omitted,
  // the form navigates on its own (to the child/home on create, back on edit).
  onSubmitted?: () => void;
}

export default function TaskForm({ mode, children, initial, defaultChildId = '', onSubmitted }: TaskFormProps) {
  const navigate = useNavigate();
  const editing = mode === 'edit';

  // Per-unit is chosen at create time and fixed thereafter; in edit mode it is
  // read from the task and its reward/assignment are no longer changeable.
  const [isPerUnit, setIsPerUnit] = useState(editing ? !!initial?.isPerUnit : false);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [dollarAmount, setDollarAmount] = useState(
    editing
      ? centsToInput(initial?.isPerUnit ? initial?.unitReward : initial?.dollarAmount)
      : ''
  );
  const [assignedToId, setAssignedToId] = useState(
    editing
      ? initial?.assignedToId ?? ''
      : defaultChildId || (children.length === 1 ? children[0].id : '')
  );
  const [isUpForGrabs, setIsUpForGrabs] = useState(editing ? !!initial?.isUpForGrabs : false);
  const [dueDate, setDueDate] = useState(editing ? isoToDateInput(initial?.dueDate) : '');
  const [isRecurring, setIsRecurring] = useState(editing ? !!initial?.isRecurring : false);
  const [recurrence, setRecurrence] = useState<Recurrence>((initial?.recurrence as Recurrence) ?? 'WEEKLY');
  const [weeklyDays, setWeeklyDays] = useState<number[]>(
    initial?.weeklyDays ? initial.weeklyDays.split(',').map(Number).filter(n => Number.isInteger(n)) : []
  );
  const [catchUp, setCatchUp] = useState(editing ? !!initial?.catchUp : false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  // Assignee/up-for-grabs are locked once the chore is per-unit or awaiting
  // approval — reassigning mid-completion is out of scope (edit mode only).
  const assigneeLocked = editing && (isPerUnit || initial?.status === 'COMPLETED');

  const selectRecurrence = (value: Recurrence) => {
    setRecurrence(value);
    if (value !== 'WEEKLY') setWeeklyDays([]);
  };

  const toggleWeekday = (day: number) => {
    setWeeklyDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b));
  };

  const done = () => {
    if (onSubmitted) return onSubmitted();
    if (editing) return navigate(-1);
    navigate(!isUpForGrabs && assignedToId ? `/children/${assignedToId}` : '/');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Enter a title'); return; }
    if (isPerUnit && !dollarAmount) { setError('Enter a per-item reward'); return; }
    if (!editing && !isPerUnit && !isUpForGrabs && !assignedToId) { setError('Select a kid'); return; }
    setLoading(true);
    try {
      if (editing) {
        // Only the editable fields go up; per-unit reward and locked assignment stay put.
        await updateTask.mutateAsync({
          id: initial!.id,
          body: {
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
          },
        });
      } else if (isPerUnit) {
        await createTask.mutateAsync({
          title,
          description: description || undefined,
          isPerUnit: true,
          unitReward: dollarsToCents(dollarAmount),
          dueDate: dueDate || undefined,
        });
      } else {
        await createTask.mutateAsync({
          title,
          description: description || undefined,
          dollarAmount: dollarAmount ? dollarsToCents(dollarAmount) : undefined,
          assignedToId: isUpForGrabs ? undefined : assignedToId,
          isUpForGrabs,
          dueDate: dueDate || undefined,
          isRecurring,
          recurrence: isRecurring ? recurrence : undefined,
          weeklyDays: isRecurring && recurrence === 'WEEKLY' && weeklyDays.length ? weeklyDays : undefined,
          catchUp: isRecurring && !isUpForGrabs && assignedToId ? catchUp : undefined,
        });
      }
      done();
    } catch (err: any) {
      setError(err.response?.data?.error || (editing ? 'Failed to save changes' : 'Failed to create task'));
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || (!editing && children.length === 0);

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-5 pt-3 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between py-2">
          <button type="button" onClick={() => navigate(-1)} className="text-ink-900" aria-label="Back">
            <ChevronLeftIcon size={22} />
          </button>
          <div className="text-[16px] font-extrabold">{editing ? 'Edit Task' : 'Create New Task'}</div>
          <button type="submit" disabled={disabled} className="text-[14px] font-bold text-brand disabled:opacity-50">
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
              {editing && isPerUnit ? (
                <div className="flex items-center gap-2 border-[1.5px] border-line rounded-[14px] px-3 py-2.5 bg-appbg">
                  <span className="w-[22px] h-[22px] rounded-full bg-money-50 text-money-700 grid place-items-center font-extrabold text-[12px] shrink-0">$</span>
                  <span className="text-[14.5px] font-bold text-ink-500">{formatCents(initial?.unitReward)}/item</span>
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
              <label className="label">{isRecurring ? 'Starts on' : 'Due Date'} <span className="text-ink-400 font-medium">(optional)</span></label>
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

          {/* Pay per item — create only; an open, unlimited, shared chore any kid logs against. */}
          {!editing && (
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                role="switch"
                aria-checked={isPerUnit}
                onClick={() => {
                  const next = !isPerUnit;
                  setIsPerUnit(next);
                  if (next) { setIsUpForGrabs(false); setIsRecurring(false); }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPerUnit ? 'bg-violet-600' : 'bg-ink-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPerUnit ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <div>
                <span className="text-[13px] font-bold text-ink-700">Pay per item</span>
                <p className="text-[11px] text-ink-400">Any kid logs how many they did — paid per item, no limit.</p>
              </div>
            </div>
          )}

          {/* Per-unit chores can't be re-cadenced or reassigned in edit mode. */}
          {editing && isPerUnit && (
            <p className="text-[11.5px] text-ink-400">Per-item reward and assignment can't be changed after creation.</p>
          )}

          {/* Up for grabs — any kid can claim it, first come first served */}
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

          {/* Assign To — hidden when the chore is up for grabs or pay-per-item */}
          {!isPerUnit && !isUpForGrabs && (
            <div>
              <label className="label">Assign To</label>
              {assigneeLocked ? (
                <p className="text-[13px] font-semibold text-ink-500">
                  {initial?.assignedTo?.name ?? 'Assigned'} <span className="text-ink-400 font-medium">(can't reassign while awaiting approval)</span>
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

          {/* Recurring — not applicable to pay-per-item chores (inherently repeatable) */}
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

          <button type="submit" disabled={disabled} className="btn-primary w-full mt-2">
            {loading ? (editing ? 'Saving…' : 'Creating…') : editing ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
    </form>
  );
}
