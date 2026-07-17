'use client';

import React, { useTransition } from 'react';
import { logoutAction } from '@/app/actions/auth';
import { LogOut, Loader2 } from 'lucide-react';

export default function SwitchUserButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    if (isPending) return;
    startTransition(async () => {
      localStorage.removeItem('kiosk_session');
      await logoutAction();
    });
  };

  return (
    <button
      id="switch-user-header-btn"
      onClick={handleLogout}
      disabled={isPending}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#EF4444] hover:bg-[#EF4444]/10 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
      aria-label="Switch User / Log Out"
    >
      {isPending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <span className="inline-block transition-transform duration-300 group-hover:rotate-180">🔄</span>
      )}
      <span>Switch User</span>
    </button>
  );
}
