'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowser } from '@/lib/supabase/client';
import { XP_PER_LEVEL } from './LevelProgressBar';

/* ─── Types ─────────────────────────────────────────────────────────────── */

type LeaderUser = {
  id: string;
  full_name: string | null;
  xp: number | null;
  level: number | null;
  role: string;
};

type Filter = 'hepsi' | 'ogrenci' | 'hoca';

/* ─── Pure helpers ───────────────────────────────────────────────────────── */

function initials(name: string | null, id: string): string {
  if (name?.trim()) {
    return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
  return id.slice(0, 2).toUpperCase();
}

function xpFmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

const AVATAR_PALETTES = [
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-indigo-400 to-blue-600',
];

function palette(id: string): string {
  const n = id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_PALETTES[n % AVATAR_PALETTES.length];
}

/* ─── Podium metadata ────────────────────────────────────────────────────── */

const PODIUM = [
  {
    bg:     'from-amber-400/20  to-amber-600/5',
    border: 'border-amber-400/35',
    glow:   'shadow-[0_0_28px_rgba(251,191,36,.22)]',
    ring:   'ring-amber-400/50',
    label:  'text-amber-300',
    height: 'h-36',
    size:   'h-16 w-16 text-xl',
    crown:  true,
  },
  {
    bg:     'from-slate-300/15  to-slate-500/5',
    border: 'border-slate-300/30',
    glow:   'shadow-[0_0_18px_rgba(148,163,184,.18)]',
    ring:   'ring-slate-300/40',
    label:  'text-slate-300',
    height: 'h-28',
    size:   'h-12 w-12 text-base',
    crown:  false,
  },
  {
    bg:     'from-orange-400/15 to-orange-600/5',
    border: 'border-orange-400/28',
    glow:   'shadow-[0_0_18px_rgba(251,146,60,.16)]',
    ring:   'ring-orange-400/35',
    label:  'text-orange-300',
    height: 'h-24',
    size:   'h-12 w-12 text-base',
    crown:  false,
  },
];

// Visual column order: 2nd | 1st | 3rd
const PODIUM_COLS = [1, 0, 2];

/* ─── Podium card ────────────────────────────────────────────────────────── */

function PodiumCard({
  user, rank, colDelay,
}: {
  user: LeaderUser;
  rank: number;
  colDelay: number;
}) {
  const p   = PODIUM[rank];
  const xp  = user.xp  ?? 0;
  const lv  = user.level ?? 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 56 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: colDelay, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-2"
    >
      {/* Crown */}
      {p.crown ? (
        <motion.span
          aria-label="1. sıra"
          animate={{ opacity: [0.6, 1, 0.6], y: [0, -3, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="text-2xl leading-none"
        >
          👑
        </motion.span>
      ) : (
        <div className="h-8" aria-hidden />
      )}

      {/* Avatar */}
      <div className="relative">
        <div
          className={`flex items-center justify-center rounded-full font-black text-white
            bg-gradient-to-br ${palette(user.id)} ${p.size}
            ring-2 ${p.ring}`}
        >
          {initials(user.full_name, user.id)}
        </div>
        {p.crown && (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: '0 0 20px rgba(251,191,36,.5)' }}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>

      {/* Name */}
      <div className="max-w-[88px] text-center">
        <p className={`truncate font-bold text-white leading-tight ${rank === 0 ? 'text-sm' : 'text-xs'}`}>
          {user.full_name ?? 'Kullanıcı'}
        </p>
        <p className="text-[10px] uppercase tracking-wide text-white/35 mt-0.5">
          {user.role === 'hoca' ? 'Eğitmen' : 'Öğrenci'}
        </p>
      </div>

      {/* XP/Level label */}
      <div className={`text-center ${p.label}`}>
        <p className="text-xs font-black tabular-nums">{xpFmt(xp)} XP</p>
        <p className="text-[10px] font-semibold opacity-70">Lv {lv}</p>
      </div>

      {/* Podium block */}
      <div
        className={`w-20 sm:w-24 rounded-t-xl border ${p.border}
          bg-gradient-to-b ${p.bg} ${p.glow} ${p.height}
          flex items-center justify-center`}
      >
        <span className={`text-3xl font-black tabular-nums ${p.label}`}>{rank + 1}</span>
      </div>
    </motion.div>
  );
}

/* ─── Loading skeleton ───────────────────────────────────────────────────── */

function Skeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-center gap-4 pt-8 pb-2">
        {[28, 36, 24].map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="animate-pulse h-12 w-12 rounded-full bg-white/10" />
            <div className="animate-pulse h-3 w-16 rounded-full bg-white/10" />
            <div
              className="animate-pulse w-20 rounded-t-xl bg-white/8"
              style={{ height: `${h * 4}px` }}
            />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
            <div className="h-4 w-4 rounded-full bg-white/10 shrink-0" />
            <div className="h-8 w-8 rounded-full bg-white/10 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-28 rounded-full bg-white/10" />
              <div className="h-1.5 w-36 rounded-full bg-white/10" />
            </div>
            <div className="h-3 w-16 rounded-full bg-white/10 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Filter tabs ────────────────────────────────────────────────────────── */

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'hepsi',   label: 'Tümü'       },
  { key: 'ogrenci', label: 'Öğrenciler' },
  { key: 'hoca',    label: 'Eğitmenler' },
];

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function LiderlikTablosu() {
  const [users,     setUsers]     = useState<LeaderUser[]>([]);
  const [filter,    setFilter]    = useState<Filter>('hepsi');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Fetch current user ID once
  useEffect(() => {
    createBrowser().auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentId(user.id);
    });
  }, []);

  // Fetch leaderboard whenever filter changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const sb = createBrowser();
        let q = sb
          .from('users')
          .select('id, full_name, xp, level, role')
          .order('xp', { ascending: false, nullsFirst: false })
          .limit(10);

        if (filter !== 'hepsi') q = q.eq('role', filter);

        const { data, error: err } = await q;
        if (err) throw err;
        if (!cancelled) setUsers((data ?? []) as LeaderUser[]);
      } catch {
        if (!cancelled) setError('Liderlik tablosu yüklenemedi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [filter]);

  const top3 = users.slice(0, 3);
  const rest  = users.slice(3);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(160deg, #0f172a 0%, #0c1a2e 55%, #071a14 100%)',
        boxShadow: '0 20px 60px -12px rgba(0,0,0,0.5)',
      }}
    >
      {/* Ambient aurora glow */}
      <motion.div
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,.18) 0%, transparent 68%)',
          filter: 'blur(48px)',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 p-6">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">Liderlik Tablosu</h2>
            <p className="mt-0.5 text-xs text-white/35">En yüksek XP'ye sahip kullanıcılar</p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 rounded-xl bg-white/5 p-1">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  filter === key
                    ? 'bg-emerald-500 text-white shadow-[0_2px_10px_rgba(16,185,129,.4)]'
                    : 'text-white/45 hover:text-white/75'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Skeleton />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-16 text-center text-sm text-white/40"
            >
              {error}
            </motion.div>
          ) : users.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-16 text-center text-sm text-white/40"
            >
              Bu kategoride henüz kullanıcı yok
            </motion.div>
          ) : (
            <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Podium */}
              {top3.length > 0 && (
                <div className="mb-8 flex items-end justify-center gap-2 sm:gap-4 pt-4">
                  {PODIUM_COLS
                    .filter((rankIdx) => rankIdx < top3.length)
                    .map((rankIdx, colPos) => (
                      <PodiumCard
                        key={top3[rankIdx].id}
                        user={top3[rankIdx]}
                        rank={rankIdx}
                        colDelay={colPos * 0.11}
                      />
                    ))}
                </div>
              )}

              {/* Divider */}
              {rest.length > 0 && (
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/8" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/22">
                    Sıralama
                  </span>
                  <div className="h-px flex-1 bg-white/8" />
                </div>
              )}

              {/* Positions 4–10 */}
              <ul className="space-y-1.5">
                {rest.map((user, i) => {
                  const rank   = i + 4;
                  const isSelf = user.id === currentId;
                  const xp     = user.xp ?? 0;
                  const lv     = user.level ?? 1;
                  const xpInLv = xp % XP_PER_LEVEL;
                  const pct    = Math.min(100, Math.round((xpInLv / XP_PER_LEVEL) * 100));

                  return (
                    <motion.li
                      key={user.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.048, duration: 0.26, ease: 'easeOut' }}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors
                        ${isSelf
                          ? 'bg-emerald-500/10 ring-1 ring-emerald-400/45 shadow-[0_0_18px_rgba(16,185,129,.13)]'
                          : 'bg-white/[0.03] hover:bg-white/[0.06]'}`}
                    >
                      {/* Rank */}
                      <span className="w-5 shrink-0 text-center text-xs font-black tabular-nums text-white/28">
                        {rank}
                      </span>

                      {/* Avatar */}
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                          bg-gradient-to-br ${palette(user.id)}
                          text-[11px] font-black text-white`}
                      >
                        {initials(user.full_name, user.id)}
                      </div>

                      {/* Name + mini progress */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className={`truncate text-sm font-bold ${isSelf ? 'text-emerald-300' : 'text-white/75'}`}>
                            {user.full_name ?? 'Kullanıcı'}
                          </p>
                          {isSelf && (
                            <span className="shrink-0 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-400">
                              Sen
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 h-1 w-full max-w-[120px] overflow-hidden rounded-full bg-white/8">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.75, delay: i * 0.048 + 0.18, ease: 'easeOut' }}
                            className={`h-full rounded-full ${isSelf ? 'bg-emerald-400' : 'bg-white/25'}`}
                          />
                        </div>
                      </div>

                      {/* XP + Level */}
                      <div className="shrink-0 text-right">
                        <p className={`text-sm font-black tabular-nums ${isSelf ? 'text-emerald-300' : 'text-white/55'}`}>
                          {xpFmt(xp)} XP
                        </p>
                        <p className="text-[10px] tabular-nums text-white/28">Lv {lv}</p>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
