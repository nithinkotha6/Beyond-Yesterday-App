'use client';

import React, { useState, useEffect } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { fetchGangRoster, GangProfile } from '@/app/actions/gang';
import UserAvatar from '@/components/UserAvatar';

// Roster memory cache to avoid flicker on tab switching
let cachedRosterData: {
  groupName: string;
  roster: GangProfile[];
} | null = null;

export default function GangPage() {
  const [roster, setRoster] = useState<GangProfile[]>(() => cachedRosterData?.roster || []);
  const [groupName, setGroupName] = useState<string>(() => cachedRosterData?.groupName || 'Texas Buds');
  const [loading, setLoading] = useState<boolean>(() => cachedRosterData === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetchGangRoster();
        if (!active) return;
        if (res.success) {
          setRoster(res.roster);
          setGroupName(res.groupName);
          setError(null);
          cachedRosterData = {
            groupName: res.groupName,
            roster: res.roster,
          };
        } else {
          setError(res.error || 'Failed to load gang roster.');
        }
      } catch (err) {
        if (active) {
          setError('Failed to fetch roster data.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-god-canvas min-h-screen">
        <Loader2 className="w-8 h-8 text-god-orange animate-spin" />
        <p className="mt-2 text-xs font-bold text-god-blue uppercase tracking-wider">Loading Gang Roster...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 flex-1 flex flex-col bg-god-canvas min-w-0 overflow-y-auto">
      {/* ── Group Roster Header ──────────────────────────────────────── */}
      <header className="mb-6">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-god-black leading-none flex items-center gap-3">
          <Users className="text-god-orange w-10 h-10 stroke-[2.5]" />
          Gang
        </h1>
        <p className="mt-2 text-[11px] font-bold tracking-[0.18em] text-god-blue uppercase">
          {groupName} Roster · {roster.length} Member{roster.length !== 1 ? 's' : ''}
        </p>
        <svg width="250" height="14" viewBox="0 0 250 14" fill="none" aria-hidden="true" className="mt-1">
          <path d="M2 10 C35 3, 80 13, 125 7 S190 2, 248 6" stroke="#CE5100" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        </svg>
      </header>

      {error && (
        <div className="bg-god-red/10 border border-god-red/35 text-god-red px-4 py-3 rounded-xl text-xs font-bold mb-4">
          {error}
        </div>
      )}

      {/* ── User Roster Grid ─────────────────────────────────────────── */}
      {roster.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {roster.map((profile: GangProfile, index) => {
            return (
              <div
                key={profile.id}
                className="bg-god-black rounded-[24px] border border-god-blue shadow-[0_8px_30px_rgba(0,0,0,0.3)] p-5 flex flex-col items-center text-center transition-[transform,box-shadow] duration-200 ease-out hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:-translate-y-1 animate-in fade-in zoom-in-95 duration-300"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Large Centered Reusable UserAvatar */}
                <div className="mb-4 relative">
                  <UserAvatar
                    user={profile}
                    size="3xl"
                    className="shadow-inner"
                    priority={index < 4}
                  />
                  <div className="absolute -bottom-1.5 -right-1.5 bg-god-black border-2 border-god-blue text-[10px] font-black text-god-orange rounded-full w-6 h-6 flex items-center justify-center shadow tabular-nums">
                    {profile.current_level}
                  </div>
                </div>

                {/* Name Details */}
                <div className="flex flex-col w-full min-w-0">
                  <h3 className="font-extrabold text-sm text-slate-100 truncate w-full">
                    {profile.nickname || profile.full_name}
                  </h3>
                  <p className="text-[10px] font-bold text-god-silver uppercase tracking-wider mt-0.5 truncate w-full">
                    {profile.full_name || 'Club Member'}
                  </p>
                </div>

                {/* XP and Level badging */}
                <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap w-full">
                  <span className="bg-god-orange/10 border border-god-orange/20 text-god-orange text-[10px] font-extrabold px-3 py-1 rounded-full tracking-wide tabular-nums">
                    Lvl {profile.current_level}
                  </span>
                  <span className="bg-slate-900 border border-god-blue/30 text-god-silver text-[10px] font-bold px-3 py-1 rounded-full tabular-nums tracking-tight">
                    {profile.total_xp.toLocaleString()} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-god-black rounded-[24px] border border-god-blue shadow-[0_2px_10px_rgba(0,0,0,0.2)] p-12 text-center flex flex-col items-center justify-center gap-2">
          <Users size={32} className="text-god-silver" />
          <p className="text-sm font-bold text-slate-100">Your gang has no athletes yet.</p>
          <p className="text-xs text-god-silver">Use your group invite code during signup to add members!</p>
        </div>
      )}
    </div>
  );
}
