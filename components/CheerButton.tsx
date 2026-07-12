'use client';

import React, { useState } from 'react';
import { sendCheer } from '@/app/actions/cheer';

interface CheerButtonProps {
  targetUserId: string;
  targetName: string;
  metricLabel: string;
}

/**
 * CheerButton — Client component rendering an interactive fire button.
 * Fires the sendCheer server action and triggers a temporary custom toast.
 */
export default function CheerButton({ targetUserId, targetName, metricLabel }: CheerButtonProps) {
  const [clicked, setClicked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleCheer = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger active scale animation
    setClicked(true);
    setTimeout(() => setClicked(false), 200);

    try {
      const res = await sendCheer(targetUserId, targetName, metricLabel);
      if (res.success) {
        setToast(res.message);
        setTimeout(() => setToast(null), 2000);
      }
    } catch (err) {
      console.error('[CheerButton] failed to send cheer:', err);
    }
  };

  return (
    <div className="relative flex items-center">
      <button
        onClick={handleCheer}
        className={`w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-sm shadow-[0_2px_5px_rgba(0,0,0,0.02)] hover:bg-slate-100/80 hover:border-slate-300 transition-all duration-150 select-none ${
          clicked ? 'scale-90' : 'active:scale-90'
        }`}
        title={`Cheer ${targetName}`}
        type="button"
      >
        🔥
      </button>

      {/* Lightweight absolute notification/toast overlay */}
      {toast && (
        <div className="fixed bottom-24 right-4 z-50 bg-[#111827] text-[#CEFF00] border border-white/10 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-[0_8px_30px_rgba(0,0,0,0.15)] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200 select-none">
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
