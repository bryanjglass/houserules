import { useState } from 'react';
import type { FormEvent } from 'react';
import api from '../../api/client';

export default function AddChildModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{4}$/.test(pin)) { setError('PIN must be exactly 4 digits'); return; }
    setLoading(true);
    try {
      await api.post('/users/children', { name, pin });
      onAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add kid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-lg">
        <h2 className="text-xl font-extrabold mb-4 text-ink-900">Add a Kid</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="input" placeholder="Alex" />
          </div>
          <div>
            <label className="label">4-digit PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value)}
              required
              className="input text-center text-2xl tracking-widest"
              placeholder="••••"
            />
          </div>
          {error && <p className="text-rose-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-line text-ink-700 font-bold py-2.5 rounded-[14px] hover:bg-appbg transition"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 !py-2.5">
              {loading ? 'Adding…' : 'Add Kid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
