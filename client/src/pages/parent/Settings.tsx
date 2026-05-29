import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/client';
import type { TrustedDevice } from '../../types/models';

// The full IANA list when the browser supports it, else a small fallback. The
// detected zone and UTC are always included so the saved value is selectable.
function timezoneOptions(detected: string): string[] {
  let list: string[] = [];
  try {
    list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone') ?? [];
  } catch { /* not supported */ }
  if (list.length === 0) {
    list = [
      'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
      'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney',
    ];
  }
  const set = new Set(list);
  set.add('UTC');
  set.add(detected);
  return [...set].sort();
}

export default function Settings() {
  const [code, setCode] = useState('');
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [copied, setCopied] = useState(false);

  const detectedTz = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
  }, []);
  const tzOptions = useMemo(() => timezoneOptions(detectedTz), [detectedTz]);
  const [tz, setTz] = useState('');
  const [tzSaving, setTzSaving] = useState(false);
  const [tzSaved, setTzSaved] = useState(false);

  const refresh = useCallback(async () => {
    const [codeRes, devicesRes, tzRes] = await Promise.all([
      api.get('/users/household-code'),
      api.get('/auth/devices'),
      api.get('/users/timezone'),
    ]);
    setCode(codeRes.data.householdCode || '');
    setDevices(devicesRes.data);
    // Treat the UTC default as "unset" and prefill the browser-detected zone.
    const saved = tzRes.data.timezone as string;
    setTz(saved && saved !== 'UTC' ? saved : detectedTz);
    setLoading(false);
  }, [detectedTz]);

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

  const saveTz = async () => {
    setTzSaving(true);
    setTzSaved(false);
    try {
      await api.put('/users/timezone', { timezone: tz });
      setTzSaved(true);
      setTimeout(() => setTzSaved(false), 1500);
    } finally {
      setTzSaving(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm('Remove this trusted device? That device will need the house code and a PIN to sign in again.')) return;
    await api.delete(`/auth/devices/${id}`);
    setDevices(devices.filter(d => d.id !== id));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-ink-400">Loading…</div>;
  }

  return (
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
          <h2 className="text-lg font-bold text-ink-900">Time zone</h2>
          <p className="text-sm text-ink-500">
            Used to decide when recurring chores are due in your house. A daily chore becomes available
            at the start of each day in this zone.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={tz}
              onChange={e => setTz(e.target.value)}
              className="input max-w-xs"
              aria-label="Household time zone"
            >
              {tzOptions.map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
            <button onClick={saveTz} disabled={tzSaving} className="btn-ghost disabled:opacity-50">
              {tzSaving ? 'Saving…' : tzSaved ? 'Saved!' : 'Save'}
            </button>
          </div>
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
  );
}
