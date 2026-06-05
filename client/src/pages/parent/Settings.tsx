import { useState, useEffect, useMemo } from 'react';
import { useHouseholdCode, useDevices, useTimezone } from '../../api/queries';
import { useRotateHouseholdCode, useSaveTimezone, useRevokeDevice } from '../../api/mutations';
import Loading from '../../components/Loading';

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
  const codeQuery = useHouseholdCode();
  const devicesQuery = useDevices();
  const tzQuery = useTimezone();
  const rotateCode = useRotateHouseholdCode();
  const saveTimezone = useSaveTimezone();
  const revokeDevice = useRevokeDevice();

  const [copied, setCopied] = useState(false);
  const [tzSaved, setTzSaved] = useState(false);

  const detectedTz = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
  }, []);
  const tzOptions = useMemo(() => timezoneOptions(detectedTz), [detectedTz]);

  // Local editable zone, seeded from the saved value once it loads. Treat the
  // UTC default as "unset" and prefill the browser-detected zone.
  const [tz, setTz] = useState('');
  useEffect(() => {
    const saved = tzQuery.data;
    if (saved === undefined) return;
    setTz(saved && saved !== 'UTC' ? saved : detectedTz);
  }, [tzQuery.data, detectedTz]);

  const code = codeQuery.data ?? '';
  const devices = devicesQuery.data ?? [];

  const rotate = async () => {
    if (!confirm('Make a new house code? Kids will need the new code to sign in on a device they haven’t used before.')) return;
    await rotateCode.mutateAsync();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  const saveTz = async () => {
    setTzSaved(false);
    await saveTimezone.mutateAsync(tz);
    setTzSaved(true);
    setTimeout(() => setTzSaved(false), 1500);
  };

  const revoke = async (id: string) => {
    if (!confirm('Remove this trusted device? That device will need the house code and a PIN to sign in again.')) return;
    await revokeDevice.mutateAsync(id);
  };

  if (codeQuery.isPending || devicesQuery.isPending || tzQuery.isPending) {
    return <Loading />;
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
            disabled={rotateCode.isPending}
            className="text-sm text-rose-600 font-semibold hover:text-rose-500 transition disabled:opacity-50"
          >
            {rotateCode.isPending ? 'Generating…' : 'Generate a new code'}
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
            <button onClick={saveTz} disabled={saveTimezone.isPending} className="btn-ghost disabled:opacity-50">
              {saveTimezone.isPending ? 'Saving…' : tzSaved ? 'Saved!' : 'Save'}
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
