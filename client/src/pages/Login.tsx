import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Wordmark, LogoTile } from '../components/Brand';
import { StarIcon } from '../components/Icons';
import landscape from '../assets/landscape.png';
import cowMascot from '../assets/cow-mascot.png';

const SKY = 'linear-gradient(180deg, #EAF4FF 0%, #F8FBFF 50%, #FFFFFF 100%)';

type Mode = 'parent' | 'child' | 'register';

export default function Login() {
  const [mode, setMode] = useState<Mode>('parent');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleParentLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ name, email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const isKid = mode === 'child';
  const headline = isKid ? 'Earn, save, achieve!' : 'Raise responsible kids and smart savers.';
  const sub = isKid
    ? 'Every chore you do brings you closer to your goals.'
    : 'The simple way to manage chores and allowance as a family.';

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center px-6 pt-10 pb-44" style={{ background: SKY }}>
      {/* Brand / mascot */}
      <div className="flex flex-col items-center gap-3">
        {isKid ? (
          <img src={cowMascot} alt="MilkMoney cow mascot" className="w-44 max-h-44 object-contain" />
        ) : (
          <LogoTile size={68} />
        )}
        <Wordmark size={isKid ? 28 : 26} />
      </div>

      <h2 className="text-[22px] font-extrabold text-ink-900 text-center mt-5 mb-2 max-w-[260px]" style={{ letterSpacing: '-0.01em', lineHeight: 1.15 }}>
        {headline}
      </h2>
      <p className="text-[13.5px] text-ink-500 text-center max-w-[270px] leading-relaxed">{sub}</p>

      {/* Auth card */}
      <div className="relative z-10 w-full max-w-sm mt-7 bg-white rounded-2xl shadow-lg border border-line p-6">
        {error && (
          <div className="bg-rose-50 text-rose-600 text-sm rounded-[14px] px-3 py-2 mb-4">{error}</div>
        )}

        {mode === 'parent' && (
          <form onSubmit={handleParentLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : 'Log In as Parent'}
            </button>
            <button type="button" onClick={() => { setMode('register'); setError(''); }} className="btn-secondary w-full">
              Create Parent Account
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="label">Your name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="input" placeholder="Mom or Dad" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="input" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating…' : 'Create Account'}
            </button>
            <button type="button" onClick={() => { setMode('parent'); setError(''); }} className="btn-ghost w-full">
              Already have an account? Sign in
            </button>
          </form>
        )}

        {mode === 'child' && <ChildLoginForm />}

        {/* Role switch */}
        {mode !== 'register' && (
          <button
            type="button"
            onClick={() => { setMode(isKid ? 'parent' : 'child'); setError(''); }}
            className="btn-ghost w-full mt-3"
          >
            {isKid ? 'Switch to Parent Login' : 'Switch to Kid Login'}
          </button>
        )}
      </div>

      {/* Pastoral landscape, full-bleed at the bottom */}
      <img
        src={landscape}
        alt=""
        className="absolute bottom-0 left-0 right-0 w-full pointer-events-none select-none z-0"
      />
    </div>
  );
}

type ChildOption = { id: string; name: string };
type Step = 'loading' | 'quick' | 'code' | 'pick';

function ChildLoginForm() {
  const { login, deviceLogin } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('loading');
  const [remembered, setRemembered] = useState<ChildOption[]>([]);
  const [code, setCode] = useState('');
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [pin, setPin] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // On a trusted device, offer one-tap login.
  useEffect(() => {
    api.get('/auth/remembered')
      .then(r => {
        const kids: ChildOption[] = r.data.children || [];
        setRemembered(kids);
        setStep(kids.length > 0 ? 'quick' : 'code');
      })
      .catch(() => setStep('code'));
  }, []);

  const quickLogin = async (childId: string) => {
    setError('');
    setLoading(true);
    try {
      await deviceLogin(childId);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not sign in. Use your code instead.');
      setStep('code');
    } finally {
      setLoading(false);
    }
  };

  const lookupHousehold = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await api.get(`/users/children-public?householdCode=${encodeURIComponent(code.trim())}`);
      setChildren(r.data);
      setStep('pick');
      if (r.data.length === 0) setError('No kids in this household yet.');
    } catch {
      setError('That code did not match. Check with your parent.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedChild) { setError('Pick your name'); return; }
    setLoading(true);
    try {
      await login({ householdCode: code.trim(), childId: selectedChild, pin, rememberDevice: remember });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Wrong PIN');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'loading') {
    return <p className="text-sm text-ink-400 text-center py-4">Loading…</p>;
  }

  if (step === 'quick') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ink-500 text-center">Tap your name to jump in.</p>
        <div className="grid grid-cols-2 gap-2">
          {remembered.map(c => (
            <button
              key={c.id}
              type="button"
              disabled={loading}
              onClick={() => quickLogin(c.id)}
              className="py-4 rounded-[14px] font-bold border-[1.5px] border-brand-100 bg-brand-50 text-brand hover:border-brand active:scale-[0.98] transition disabled:opacity-50"
            >
              {c.name}
            </button>
          ))}
        </div>
        {error && <p className="text-rose-500 text-sm">{error}</p>}
        <button type="button" onClick={() => { setStep('code'); setError(''); }} className="btn-ghost w-full">
          Someone else? Use your house code
        </button>
      </div>
    );
  }

  if (step === 'code') {
    return (
      <form onSubmit={lookupHousehold} className="space-y-4">
        <p className="text-sm text-ink-500 text-center">Enter your house code to find your account.</p>
        <div>
          <label className="label">House code</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            required
            autoCapitalize="characters"
            className="input text-center text-xl tracking-widest font-mono uppercase"
            placeholder="ABC123"
          />
        </div>
        {error && <p className="text-rose-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Looking…' : 'Find My Account'}
        </button>
        {remembered.length > 0 && (
          <button type="button" onClick={() => { setStep('quick'); setError(''); }} className="btn-ghost w-full">
            ← Back to quick login
          </button>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Who are you?</label>
        <div className="grid grid-cols-2 gap-2">
          {children.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedChild(c.id)}
              className={`py-3 rounded-[14px] font-bold text-sm border-[1.5px] transition ${
                selectedChild === c.id
                  ? 'border-brand bg-brand-50 text-brand'
                  : 'border-line text-ink-700 hover:border-brand-100'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Your PIN</label>
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
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          checked={remember}
          onChange={e => setRemember(e.target.checked)}
          className="rounded border-line text-brand focus:ring-brand-50"
        />
        Remember this device (skip the code next time)
      </label>
      {error && <p className="text-rose-500 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Signing in…' : <><StarIcon size={16} /> Let me in!</>}
      </button>
      <button
        type="button"
        onClick={() => { setStep('code'); setChildren([]); setSelectedChild(''); setPin(''); setError(''); }}
        className="btn-ghost w-full"
      >
        ← Back
      </button>
    </form>
  );
}
