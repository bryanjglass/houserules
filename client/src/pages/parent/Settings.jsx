import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client.js';
import NavBar from '../../components/NavBar.jsx';

export default function Settings() {
  const [code, setCode] = useState('');
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const [codeRes, devicesRes] = await Promise.all([
      api.get('/users/household-code'),
      api.get('/auth/devices'),
    ]);
    setCode(codeRes.data.householdCode || '');
    setDevices(devicesRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const rotate = async () => {
    if (!confirm('Make a new house code? Kids will need the new code to sign in on a device they haven’t used before.')) return;
    setRotating(true);
    try {
      const r = await api.post('/users/household-code/rotate');
      setCode(r.data.householdCode);
    } finally {
      setRotating(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  const revoke = async (id) => {
    if (!confirm('Remove this trusted device? That device will need the house code and a PIN to sign in again.')) return;
    await api.delete(`/auth/devices/${id}`);
    setDevices(devices.filter(d => d.id !== id));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-ink-400">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-appbg">
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-extrabold text-ink-900">Login & Security</h1>

        <section className="card shadow-sm p-5 space-y-3">
          <h2 className="text-lg font-bold text-ink-900">House code</h2>
          <p className="text-sm text-ink-500">
            Your kids enter this code to find their account on a new device. Share it only with your family.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold tracking-widest bg-[#F4F6F8] rounded-[14px] px-4 py-2">{code}</span>
            <button onClick={copy} className="btn-ghost">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button
            onClick={rotate}
            disabled={rotating}
            className="text-sm text-rose-600 font-semibold hover:text-rose-500 transition disabled:opacity-50"
          >
            {rotating ? 'Generating…' : 'Generate a new code'}
          </button>
        </section>

        <section className="card shadow-sm p-5 space-y-3">
          <h2 className="text-lg font-bold text-ink-900">Trusted devices</h2>
          <p className="text-sm text-ink-500">
            Devices where a kid chose “remember this device” can sign in with one tap. Remove any you don’t recognize.
          </p>
          {devices.length === 0 ? (
            <p className="text-sm text-ink-400">No trusted devices yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {devices.map(d => (
                <li key={d.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-bold text-ink-900">
                      {d.children.map(c => c.name).join(', ') || 'Unknown'}
                    </p>
                    <p className="text-xs text-ink-400">
                      Last used {new Date(d.lastUsedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => revoke(d.id)}
                    className="text-sm text-rose-600 font-semibold hover:text-rose-500 transition"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
