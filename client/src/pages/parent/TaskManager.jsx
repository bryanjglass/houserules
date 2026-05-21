import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import NavBar from '../../components/NavBar.jsx';

const RECURRENCE_OPTIONS = [
  { value: 'DAILY', label: 'Every day' },
  { value: 'WEEKLY', label: 'Every week' },
  { value: 'MONTHLY', label: 'Every month' },
];

const WEEKDAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export default function TaskManager() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedChildId = searchParams.get('childId') || '';

  const [children, setChildren] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dollarAmount, setDollarAmount] = useState('');
  const [assignedToId, setAssignedToId] = useState(preselectedChildId);
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState('WEEKLY');
  const [weeklyDays, setWeeklyDays] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/users/children').then(r => {
      setChildren(r.data);
      if (!preselectedChildId && r.data.length === 1) setAssignedToId(r.data[0].id);
    });
  }, [preselectedChildId]);

  const selectRecurrence = (value) => {
    setRecurrence(value);
    if (value !== 'WEEKLY') setWeeklyDays([]);
  };

  const toggleWeekday = (day) => {
    setWeeklyDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!assignedToId) { setError('Select a kid'); return; }
    setLoading(true);
    try {
      await api.post('/tasks', {
        title,
        description: description || undefined,
        dollarAmount: dollarAmount ? parseFloat(dollarAmount) : undefined,
        assignedToId,
        dueDate: dueDate || undefined,
        isRecurring,
        recurrence: isRecurring ? recurrence : undefined,
        weeklyDays: isRecurring && recurrence === 'WEEKLY' && weeklyDays.length ? weeklyDays : undefined,
      });
      navigate(assignedToId ? `/children/${assignedToId}` : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-indigo-500 text-sm hover:text-indigo-700">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">New Task</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task name *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Take out the trash"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              placeholder="Any extra details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to *</label>
            <div className="grid grid-cols-2 gap-2">
              {children.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setAssignedToId(c.id)}
                  className={`py-2.5 rounded-xl font-medium text-sm border-2 transition ${
                    assignedToId === c.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-700 hover:border-indigo-300'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            {children.length === 0 && (
              <p className="text-sm text-gray-400">No kids yet — add one first.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allowance amount (optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.25"
                value={dollarAmount}
                onChange={e => setDollarAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="2.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due date (optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isRecurring}
              onClick={() => setIsRecurring(!isRecurring)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isRecurring ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isRecurring ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm font-medium text-gray-700">Recurring task</span>
          </div>

          {isRecurring && (
            <div className="grid grid-cols-3 gap-2">
              {RECURRENCE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => selectRecurrence(opt.value)}
                  className={`py-2 rounded-lg text-sm font-medium border-2 transition ${
                    recurrence === opt.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-600 hover:border-purple-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {isRecurring && recurrence === 'WEEKLY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">On these days (optional)</label>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekday(day.value)}
                    className={`py-2 rounded-lg text-xs font-medium border-2 transition ${
                      weeklyDays.includes(day.value)
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-600 hover:border-purple-300'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Leave empty to repeat every 7 days.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || children.length === 0}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </main>
    </div>
  );
}
