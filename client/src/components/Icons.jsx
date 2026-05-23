// Outline icon set — 2px stroke, currentColor. Matches the MilkMoney design spec.
// Every icon accepts { size, className, ...rest } and inherits color from `currentColor`.

const base = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

export const HomeIcon = ({ size = 22, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" />
  </svg>
);

export const TasksIcon = ({ size = 22, ...p }) => (
  <svg {...base(size)} {...p}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="m8 12 3 3 5-6" />
  </svg>
);

export const CalendarIcon = ({ size = 22, ...p }) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

export const WalletIcon = ({ size = 22, ...p }) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="6" width="18" height="13" rx="3" />
    <path d="M3 10h18M16 14h2" />
  </svg>
);

export const MoreIcon = ({ size = 22, ...p }) => (
  <svg {...{ ...base(size), strokeWidth: 0 }} fill="currentColor" {...p}>
    <circle cx="6" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="18" cy="12" r="1.6" />
  </svg>
);

export const BellIcon = ({ size = 22, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export const ChevronLeftIcon = ({ size = 22, ...p }) => (
  <svg {...{ ...base(size), strokeWidth: 2.2 }} {...p}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const PlusIcon = ({ size = 22, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const SettingsIcon = ({ size = 22, ...p }) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
);

export const StarIcon = ({ size = 16, filled = true, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinejoin="round" {...p}>
    <path d="m12 2 2.9 6.9 7.1.6-5.4 4.7 1.7 7-6.3-3.8L5.7 21l1.7-7L2 9.5l7.1-.6L12 2Z" />
  </svg>
);

export const LogoutIcon = ({ size = 18, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5M21 12H9" />
  </svg>
);
