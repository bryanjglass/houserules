import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { TasksIcon, CalendarIcon, WalletIcon, LogoutIcon } from './Icons.jsx';

// Shared kid bottom navigation. Active tab = brand text + bold; inactive = ink-400.
// Outline icons, 22px; 22px bottom padding clears the home indicator.
const TABS = [
  { to: '/', label: 'Chores', Icon: TasksIcon },
  { to: '/calendar', label: 'Calendar', Icon: CalendarIcon },
  { to: '/allowance', label: 'Wallet', Icon: WalletIcon },
];

export default function BottomTabBar() {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-line flex justify-around px-3.5 pt-2.5 pb-[22px] z-40">
        {TABS.map(({ to, label, Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 min-w-[44px] ${
                active ? 'text-brand' : 'text-ink-400'
              } transition`}
            >
              <Icon size={22} />
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-semibold'}`}>{label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 min-w-[44px] text-ink-400 hover:text-rose-500 transition"
        >
          <LogoutIcon size={22} />
          <span className="text-[10px] font-semibold">Log out</span>
        </button>
      </nav>
      <div className="h-[78px]" /> {/* spacer for the fixed bar */}
    </>
  );
}
