import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Wordmark, LogoTile } from './Brand.jsx';
import { CalendarIcon, SettingsIcon, PlusIcon, LogoutIcon } from './Icons.jsx';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const linkClass = (to) =>
    `flex items-center gap-1.5 text-[13px] font-semibold transition ${
      pathname === to ? 'text-brand' : 'text-ink-500 hover:text-ink-900'
    }`;

  return (
    <header className="bg-white border-b border-line sticky top-0 z-40">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoTile size={34} />
          <Wordmark size={22} />
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/calendar" className={linkClass('/calendar')}>
            <CalendarIcon size={18} /> Calendar
          </Link>
          {user?.role === 'PARENT' && (
            <Link to="/settings" className={linkClass('/settings')}>
              <SettingsIcon size={18} /> Settings
            </Link>
          )}
          {user?.role === 'PARENT' && (
            <Link to="/tasks/new" className="btn-primary !px-3.5 !py-2 !text-[13px] !rounded-xl">
              <PlusIcon size={16} /> New Task
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="text-ink-400 hover:text-ink-700 transition"
            title="Sign out"
          >
            <LogoutIcon size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
