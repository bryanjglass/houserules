import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateChore, useUpdateChore } from '../api/mutations';
import { Avatar } from './Brand';
import { ChevronLeftIcon, CalendarIcon } from './Icons';
import { dollarsToCents } from '../lib/money';
import type { ChoreKind, Recurrence } from '../types/domain';
import type { Child, ChoreView } from '../types/models';

// Per DESIGN.md §"Screen 3 — Create / Assign Task": title input, reward + due
// date row, and switch-style toggles (on = bg-brand/bg-violet-600, off =
// bg-ink-300) for up-for-grabs / recurring / catch-up. This component is the
// single source for both the create and edit screens. The toggles choose the
// chore's kind at create time; kind is immutable afterwards.

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

interface ChoreFormProps {
  mode: 'create' | 'edit';
  children: Child[];
  // Edit mode: the chore being edited (initializes the fields).
  initial?: ChoreView;
  // Create mode: preselected assignee (e.g. from ?childId=).
  defaultChildId?: string;
  // Optional override for navigation after a successful submit. When omitted,
  // the form navigates on its own (to the child/home on create, back on edit).
  onSubmitted?: () => void;
}

export default function ChoreForm({ mode, children, initial, defaultChildId = '', onSubmitted }: ChoreFormProps) {
  const navigate = useNavigate();
  const editing = mode === 'edit';

  // Kind is chosen via the toggles at create time and fixed thereafter.
  const [isPerUnit, setIsPerUnit] = useState(editing ? initial?.kind === 'PER_UNIT' : false);
  const [isUpForGrabs, setIsUpForGrabs] = useState(editing ? initial?.kind === 'OPEN' : false);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [dollarAmount, setDollarAmount] = useState(
    editing
      ? centsToInput(initial?.kind === 'PER_UNIT' ? initial?.unitRewardCents : initial?.rewardCents)
      : ''
  );
  const [assigneeId, setAssigneeId] = useState(
    editing
      ? initial?.assigneeId ?? ''
      : defaultChildId || (children.length === 1 ? children[0].id : '')
  );
  // startDay is already a "YYYY-MM-DD" key — exactly what <input type="date"> wants.
  const [startDay, setStartDay] = useState(editing ? initial?.startDay ?? '' : '');
  const [isRecurring, setIsRecurring] = useState(editing ? !!initial?.recurrence : false);
  const [recurrence, setRecurrence] = useState<Recurrence>(initial?.recurrence ?? 'WEEKLY');
  const [weeklyDays, setWeeklyDays] = useState<number[]>(
    initial?.weeklyDays ? initial.weeklyDays.split(',').map(Number).filter(n => Number.isInteger(n)) : []
  );
  const [catchUp, setCatchUp] = useState(editing ? initial?.missedPolicy === 'BACKFILL_14D' : false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const createChore = useCreateChore();
  const updateChore = useUpdateChore();

  const kind: ChoreKind = isPerUnit ? 'PER_UNIT' : isUpForGrabs ? 'OPEN' : 'ASSIGNED';

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
    navigate(kind === 'ASSIGNED' && assigneeId ? `/children/${assigneeId}` : '/');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Enter a title'); return; }
    if (kind === 'PER_UNIT' && !dollarAmount) { setError('Enter a per-item reward'); return; }
    if (kind === 'ASSIGNED' && !assigneeId) { setError('Select a kid'); return; }
    setLoading(true);
    const cents = dollarAmount ? dollarsToCents(dollarAmount) : null;
    const recurrenceFields = kind === 'PER_UNIT'
      ? { recurrence: null, weeklyDays: [] }
      : {
          recurrence: isRecurring ? recurrence : null,
          weeklyDays: isRecurring && recurrence === 'WEEKLY' ? weeklyDays : [],
          missedPolicy:
            kind === 'ASSIGNED' && isRecurring && catchUp ? 'BACKFILL_14D' : 'CURRENT_ONLY',
        };
    try {
      if (editing) {
        await updateChore.mutateAsync({
          id: initial!.id,
          body: {
            title,
            description: description || null,
            ...(kind === 'PER_UNIT' ? { unitRewardCents: cents } : { rewardCents: cents }),
            ...(kind === 'ASSIGNED' && assigneeId ? { assigneeId } : {}),
            startDay: startDay || null,
            ...recurrenceFields,
          },
        });
      } else {
        await createChore.mutateAsync({
          title,
          description: description || undefined,
          kind,
          ...(kind === 'PER_UNIT' ? { unitRewardCents: cents } : { rewardCents: cents }),
          ...(kind === 'ASSIGNED' ? { assigneeId } : {}),
          startDay: startDay || undefined,
          ...recurrenceFields,
        });
      }
      done();
    } catch (err: any) {
      setError(err.response?.data?.error || (editing ? 'Failed to save changes' : 'Failed to create chore'));
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
            <textarea value={description ?? ''} onChange={e => setDescription(e.target.value)} rows={2} className="input resize-none" placeholder="Any extra details…" />
          </div>

          {/* Reward + Due Date */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="label">{kind === 'PER_UNIT' ? 'Reward per item' : 'Reward'}</label>
              <div className="flex items-center gap-2 border-[1.5px] border-line rounded-[14px] px-3 py-2.5 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-50 transition">
                <span className="w-[22px] h-[22px] rounded-full bg-money-50 text-money-700 grid place-items-center font-extrabold text-[12px] shrink-0">$</span>
                <input
                  type="number" min="0" step="0.25" value={dollarAmount}
                  onChange={e => setDollarAmount(e.target.value)}
                  className="w-full outline-none text-[14.5px] font-bold text-ink-900 placeholder:text-ink-400 placeholder:font-normal"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="label">{isRecurring ? 'Starts on' : 'Due Date'} <span className="text-ink-400 font-medium">(optional)</span></label>
              <div className="flex items-center gap-2 border-[1.5px] border-line rounded-[14px] px-3 py-2.5 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-50 transition">
                <CalendarIcon size={16} className="text-brand shrink-0" />
                <input
                  type="date" value={startDay}
                  onChange={e => setStartDay(e.target.value)}
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

          {/* Kind is fixed after creation; say so instead of showing dead toggles. */}
          {editing && kind !== 'ASSIGNED' && (
            <p className="text-[11.5px] text-ink-400">
              {kind === 'PER_UNIT'
                ? 'This is a pay-per-item chore — that can’t be changed after creation.'
                : 'This is an up-for-grabs chore — that can’t be changed after creation.'}
            </p>
          )}

          {/* Up for grabs — any kid can claim it, first come first served */}
          {!editing && !isPerUnit && (
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

          {/* Assign To — only for assigned chores */}
          {kind === 'ASSIGNED' && (
            <div>
              <label className="label">Assign To</label>
              {children.length === 0 ? (
                <p className="text-sm text-ink-400">No kids yet — add one first.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {children.map(c => {
                    const on = assigneeId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setAssigneeId(c.id)}
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
          {kind !== 'PER_UNIT' && (
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

          {kind !== 'PER_UNIT' && isRecurring && (
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

          {kind !== 'PER_UNIT' && isRecurring && recurrence === 'WEEKLY' && (
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

          {/* Catch-up (BACKFILL_14D) — only for a recurring chore assigned to a
              specific kid. Missed days surface as separate items to clear anytime. */}
          {kind === 'ASSIGNED' && isRecurring && (
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
