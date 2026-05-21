import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

export default function Login() {
  const [mode, setMode] = useState('parent'); // 'parent' | 'child' | 'register'
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // For child login: fetch list of children by parent email
  const fetchChildren = async () => {
    if (!parentEmail) return;
    try {
      const r = await api.get(`/auth/children-list?parentEmail=${encodeURIComponent(parentEmail)}`);
      setChildren(r.data);
    } catch {
      setChildren([]);
    }
  };

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

  const handleChildLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedChild) { setError('Select your name'); return; }
    setLoading(true);
    try {
      await login({ childId: selectedChild, pin });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Wrong PIN');
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

          {mode === 'child' && (
            <ChildLoginForm onLogin={login} navigate={navigate} />
          )}
        </div>
      </div>
    </div>
  );
}

function ChildLoginForm({ onLogin, navigate }) {
  const [children, setChildren] = useState([]);
  const [parentEmail, setParentEmail] = useState('');
  const [selectedChild, setSelectedChild] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [looked, setLooked] = useState(false);

  const lookupParent = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await api.get(`/users/children-public?parentEmail=${encodeURIComponent(parentEmail)}`);
      setChildren(r.data);
      setLooked(true);
      if (r.data.length === 0) setError('No kids found for that email.');
    } catch {
      setError('Parent account not found.');
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
      await onLogin({ childId: selectedChild, pin });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Wrong PIN');
    } finally {
      setLoading(false);
    }
  };

  if (!looked) {
    return (
      <form onSubmit={lookupParent} className="space-y-4">
        <p className="text-sm text-gray-500 text-center">Enter your parent's email to find your account.</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parent's email</label>
          <input
            type="email"
            value={parentEmail}
            onChange={e => setParentEmail(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="mom@example.com"
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
        onClick={() => { setLooked(false); setChildren([]); setSelectedChild(''); setPin(''); }}
        className="w-full text-sm text-gray-400 hover:text-gray-600"
      >
        ← Back
      </button>
    </form>
  );
}
