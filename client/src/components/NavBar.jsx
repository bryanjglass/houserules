import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-indigo-600 text-white shadow-md">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
          🏠 House Rules
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/calendar"
            className="text-white/90 text-sm font-medium hover:text-white transition"
          >
            📅 Calendar
          </Link>
          {user?.role === 'PARENT' && (
            <Link
              to="/tasks/new"
              className="bg-white text-indigo-600 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition"
            >
              + New Task
            </Link>
          )}
          <span className="text-sm opacity-80">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm opacity-70 hover:opacity-100 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
