import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import LiveAchievementTicker from '@/components/LiveAchievementTicker';

/**
 * Dashboard shell layout — responsive split-theme grid.
 * Desktop (md+): dark sidebar left + light main right.
 * Mobile (<md):  full-width main + fixed bottom nav.
 * Spec: frontend.md §1
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen">
      {/* Sidebar — hidden below md, rendered by CSS not JS */}
      <Sidebar />

      {/* Light main content — pb-16 on mobile to clear the fixed bottom nav */}
      <main
        className="flex-1 bg-[#F7F8FA] min-w-0 overflow-y-auto pb-16 md:pb-0 flex flex-col"
        id="main-content"
      >
        {/* ── Live Achievement Ticker — full-bleed dark top bar ────── */}
        {/* Suspense boundary: layout stays interactive while ticker loads */}
        <Suspense
          fallback={
            <div className="w-full h-9 bg-[#0A0A0A] border-b border-white/5 flex items-center px-3">
              <span className="text-[10px] font-black text-[#CEFF00] tracking-[0.2em] uppercase animate-pulse">
                LIVE
              </span>
            </div>
          }
        >
          <LiveAchievementTicker />
        </Suspense>

        {/* Page-specific content */}
        {children}
      </main>

      {/* Mobile bottom navigation — rendered as client component */}
      <MobileBottomNav />
    </div>
  );
}
