import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

export default function Login() {
  const [mode, setMode] = useState('parent'); // 'parent' | 'child' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleParentLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ name, email, password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏠</div>
          <h1 className="text-3xl font-bold text-indigo-700">House Rules</h1>
          <p className="text-gray-500 mt-1">Chores & Allowance</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Mode toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-5 text-sm font-medium">
            <button
              onClick={() => setMode('parent')}
              className={`flex-1 py-2 rounded-md transition ${mode === 'parent' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
            >
              Parent
            </button>
            <button
              onClick={() => setMode('child')}
              className={`flex-1 py-2 rounded-md transition ${mode === 'child' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
            >
              Kid
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>
          )}

          {mode === 'parent' && (
            <form onSubmit={handleParentLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <p className="text-center text-sm text-gray-500">
                New here?{' '}
                <button type="button" onClick={() => setMode('register')} className="text-indigo-600 font-medium">
                  Create account
                </button>
              </p>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Mom or Dad"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <button type="button" onClick={() => setMode('parent')} className="text-indigo-600 font-medium">
                  Sign in
                </button>
              </p>
            </form>
          )}

          {mode === 'child' && <ChildLoginForm />}
        </div>
      </div>
    </div>
  );
}

function ChildLoginForm() {
  const { login, deviceLogin } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('loading'); // 'loading' | 'quick' | 'code' | 'pick'
  const [remembered, setRemembered] = useState([]);
  const [code, setCode] = useState('');
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [pin, setPin] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // On a trusted device, offer one-tap login.
  useEffect(() => {
    api.get('/auth/remembered')
      .then(r => {
        const kids = r.data.children || [];
        setRemembered(kids);
        setStep(kids.length > 0 ? 'quick' : 'code');
      })
      .catch(() => setStep('code'));
  }, []);

  const quickLogin = async (childId) => {
    setError('');
    setLoading(true);
    try {
      await deviceLogin(childId);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not sign in. Use your code instead.');
      setStep('code');
    } finally {
      setLoading(false);
    }
  };

  const lookupHousehold = async (e) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedChild) { setError('Pick your name'); return; }
    setLoading(true);
    try {
      await login({ householdCode: code.trim(), childId: selectedChild, pin, rememberDevice: remember });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Wrong PIN');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'loading') {
    return <p className="text-sm text-gray-400 text-center py-4">Loading...</p>;
  }

  if (step === 'quick') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 text-center">Tap your name to jump in.</p>
        <div className="grid grid-cols-2 gap-2">
          {remembered.map(c => (
            <button
              key={c.id}
              type="button"
              disabled={loading}
              onClick={() => quickLogin(c.id)}
              className="py-4 rounded-xl font-semibold border-2 border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-400 active:scale-95 transition disabled:opacity-50"
            >
              {c.name}
            </button>
          ))}
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="button"
          onClick={() => { setStep('code'); setError(''); }}
          className="w-full text-sm text-gray-400 hover:text-gray-600"
        >
          Someone else? Use your house code
        </button>
      </div>
    );
  }

  if (step === 'code') {
    return (
      <form onSubmit={lookupHousehold} className="space-y-4">
        <p className="text-sm text-gray-500 text-center">Enter your house code to find your account.</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">House code</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            required
            autoCapitalize="characters"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-center text-xl tracking-widest font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="ABC123"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
        >
          {loading ? 'Looking...' : 'Find My Account'}
        </button>
        {remembered.length > 0 && (
          <button
            type="button"
            onClick={() => { setStep('quick'); setError(''); }}
            className="w-full text-sm text-gray-400 hover:text-gray-600"
          >
            ← Back to quick login
          </button>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Who are you?</label>
        <div className="grid grid-cols-2 gap-2">
          {children.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedChild(c.id)}
              className={`py-3 rounded-xl font-semibold text-sm border-2 transition ${
                selectedChild === c.id
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-700 hover:border-indigo-300'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your PIN</label>
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
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={remember}
          onChange={e => setRemember(e.target.checked)}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-300"
        />
        Remember this device (skip the code next time)
      </label>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Let me in! 🚀'}
      </button>
      <button
        type="button"
        onClick={() => { setStep('code'); setChildren([]); setSelectedChild(''); setPin(''); setError(''); }}
        className="w-full text-sm text-gray-400 hover:text-gray-600"
      >
        ← Back
      </button>
    </form>
  );
}
