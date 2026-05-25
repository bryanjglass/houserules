import type { ReactNode } from 'react';
import TopBar from './TopBar';
import BottomTabBar from './BottomTabBar';

// Shared layout for all authenticated pages: a consistent top bar and bottom
// tab bar wrapping the page content. Owns the full-height page background and
// the spacer that clears the fixed bottom bar, so pages render content only.
// `bg` lets each role keep its own backdrop (parent: appbg, child: white).
export default function AppShell({ children, bg = 'bg-appbg' }: { children: ReactNode; bg?: string }) {
  return (
    <div className={`min-h-screen ${bg}`}>
      <TopBar />
      {children}
      <div className="h-[78px]" /> {/* clears the fixed bottom bar */}
      <BottomTabBar />
    </div>
  );
}
