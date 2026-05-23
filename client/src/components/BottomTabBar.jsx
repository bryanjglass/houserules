import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { HomeIcon, TasksIcon, CalendarIcon, WalletIcon, SettingsIcon } from './Icons.jsx';

// Shared bottom navigation for both roles. Active tab = brand text + bold;
// inactive = ink-400. Outline icons, 22px; navigation-only (logout lives in TopBar).
// AppShell renders the matching spacer that clears this fixed bar.
const PARENT_TABS = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/calendar', label: 'Calendar', Icon: CalendarIcon },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
];

const CHILD_TABS = [
  { to: '/', label: 'Chores', Icon: TasksIcon },
  { to: '/calendar', label: 'Calendar', Icon: CalendarIcon },
  { to: '/allowance', label: 'Wallet', Icon: WalletIcon },
];

export default function BottomTabBar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const tabs = user?.role === 'PARENT' ? PARENT_TABS : CHILD_TABS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-line flex justify-around px-3.5 pt-2.5 pb-[22px] z-40">
      {tabs.map(({ to, label, Icon }) => {
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
    </nav>
  );
}
