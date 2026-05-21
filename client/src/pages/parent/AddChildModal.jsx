import { useState } from 'react';
import api from '../../api/client.js';

export default function AddChildModal({ onClose, onAdded }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{4}$/.test(pin)) { setError('PIN must be exactly 4 digits'); return; }
    setLoading(true);
    try {
      await api.post('/users/children', { name, pin });
      onAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add kid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Add a Kid</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Alex"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">4-digit PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Kid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
