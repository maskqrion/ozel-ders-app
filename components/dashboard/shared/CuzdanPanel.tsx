'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { createBrowser } from '@/lib/supabase/client';

/* ─── Types ─────────────────────────────────────────────────────────────── */

type Wallet = {
  id: string;
  balance: number;
  currency: string;
  updated_at: string;
};

type TxType   = 'bakiye_yukleme' | 'dersten_kazanc' | 'ders_odeme' | 'iade';
type TxStatus = 'beklemede' | 'tamamlandi' | 'basarisiz';

type WalletTransaction = {
  id: string;
  wallet_id: string;
  amount: number;
  type: TxType;
  status: TxStatus;
  description: string | null;
  created_at: string;
};

type ChartDatum = { gun: string; gelir: number; gider: number };

/* ─── Static metadata ───────────────────────────────────────────────────── */

const TX_META: Record<TxType, { label: string; badge: string; sign: '+' | '-'; emoji: string }> = {
  bakiye_yukleme: { label: 'Bakiye Yükleme', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', sign: '+', emoji: '💳' },
  dersten_kazanc: { label: 'Ders Kazancı',   badge: 'bg-teal-50    text-teal-700    ring-1 ring-teal-200',    sign: '+', emoji: '📚' },
  ders_odeme:     { label: 'Ders Ödemesi',   badge: 'bg-rose-50    text-rose-700    ring-1 ring-rose-200',    sign: '-', emoji: '🎓' },
  iade:           { label: 'İade',           badge: 'bg-sky-50     text-sky-700     ring-1 ring-sky-200',     sign: '+', emoji: '↩️' },
};

const STATUS_META: Record<TxStatus, { label: string; dot: string }> = {
  tamamlandi: { label: 'Tamamlandı', dot: 'bg-emerald-400' },
  beklemede:  { label: 'Beklemede',  dot: 'bg-amber-400'   },
  basarisiz:  { label: 'Başarısız',  dot: 'bg-rose-400'    },
};

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function buildChartData(txs: WalletTransaction[]): ChartDatum[] {
  const byDay: Record<string, { gelir: number; gider: number }> = {};

  txs.forEach((tx) => {
    if (tx.status !== 'tamamlandi') return;
    const day = tx.created_at.slice(0, 10);
    if (!byDay[day]) byDay[day] = { gelir: 0, gider: 0 };
    if (tx.type === 'ders_odeme') {
      byDay[day].gider += tx.amount;
    } else {
      byDay[day].gelir += tx.amount;
    }
  });

  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([day, vals]) => ({
      gun: new Date(`${day}T00:00:00`).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
      ...vals,
    }));
}

function fmt(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ─── Animated balance counter ──────────────────────────────────────────── */

function AnimatedBalance({ value, currency }: { value: number; currency: string }) {
  const motionVal = useMotionValue(0);
  const display   = useTransform(motionVal, (v) => fmt(v));

  useEffect(() => {
    const ctrl = animate(motionVal, value, { duration: 1.5, ease: [0.22, 1, 0.36, 1] });
    return () => ctrl.stop();
  }, [value, motionVal]);

  const symbol = currency === 'TRY' ? '₺' : currency;

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xl font-semibold text-white/50">{symbol}</span>
      <motion.span className="text-5xl font-black tracking-tight text-white tabular-nums leading-none">
        {display}
      </motion.span>
    </div>
  );
}

/* ─── Custom recharts tooltip ───────────────────────────────────────────── */

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-white/95 backdrop-blur px-3.5 py-2.5 shadow-xl text-sm">
      <p className="font-bold text-slate-700 mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className={`font-semibold ${p.name === 'gelir' ? 'text-emerald-600' : 'text-rose-500'}`}>
          {p.name === 'gelir' ? 'Gelir' : 'Gider'}: ₺{fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

/* ─── Loading skeleton ──────────────────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="animate-pulse h-52 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300" />
      <div className="animate-pulse h-60 rounded-2xl bg-slate-100" />
      <div className="rounded-2xl border border-slate-100 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-50">
            <div className="animate-pulse h-10 w-10 rounded-xl bg-slate-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="animate-pulse h-3 w-32 rounded-full bg-slate-100" />
              <div className="animate-pulse h-2.5 w-48 rounded-full bg-slate-100" />
            </div>
            <div className="animate-pulse h-4 w-20 rounded-full bg-slate-100 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────── */

export default function CuzdanPanel() {
  const [wallet,       setWallet]       = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const sb = createBrowser();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) { setError('Oturum bulunamadı.'); return; }

        const [wRes, txRes] = await Promise.all([
          sb.from('wallets').select('*').eq('id', user.id).single(),
          sb.from('wallet_transactions')
            .select('*')
            .eq('wallet_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50),
        ]);

        if (wRes.error || !wRes.data) { setError('Cüzdan bulunamadı.'); return; }
        if (txRes.error)              { setError('İşlem geçmişi yüklenemedi.'); return; }

        setWallet(wRes.data);
        setTransactions(txRes.data ?? []);
      } catch {
        setError('Beklenmeyen bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (error || !wallet) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-10 text-center">
        <p className="text-rose-600 font-semibold">{error ?? 'Cüzdan yüklenemedi.'}</p>
      </div>
    );
  }

  const chartData  = buildChartData(transactions);
  const recentTxs  = transactions.slice(0, 10);
  const totalGelir = transactions.reduce((s, t) => TX_META[t.type].sign === '+' ? s + t.amount : s, 0);
  const totalGider = transactions.reduce((s, t) => TX_META[t.type].sign === '-' ? s + t.amount : s, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* ── Bakiye Kartı ──────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-7 select-none"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #064e3b 55%, #0c2a45 100%)',
          boxShadow: '0 20px 60px -12px rgba(6,78,59,0.35), 0 4px 16px -4px rgba(0,0,0,0.4)',
        }}
      >
        {/* Aurora blobs */}
        <motion.div
          className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,.38) 0%, transparent 68%)', filter: 'blur(36px)' }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-14 -left-14 h-52 w-52 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,.22) 0%, transparent 68%)', filter: 'blur(28px)' }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />
        {/* Mesh grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top row */}
        <div className="relative z-10 flex items-start justify-between mb-7">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/40 font-bold mb-3">
              Mevcut Bakiye
            </p>
            <AnimatedBalance value={wallet.balance} currency={wallet.currency} />
          </div>
          <div className="flex flex-col items-end gap-2.5">
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1.5 backdrop-blur border border-white/10">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-white/75 tracking-wide">Aktif</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 flex items-center gap-6 mb-6">
          <div>
            <p className="text-[10px] text-white/35 uppercase tracking-wider mb-0.5">Toplam Gelir</p>
            <p className="text-sm font-bold text-emerald-400">+₺{fmt(totalGelir)}</p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <p className="text-[10px] text-white/35 uppercase tracking-wider mb-0.5">Toplam Gider</p>
            <p className="text-sm font-bold text-rose-400">-₺{fmt(totalGider)}</p>
          </div>
        </div>

        {/* Bottom row */}
        <div className="relative z-10 flex items-center justify-between">
          <p className="font-mono text-[11px] text-white/30">
            {new Date(wallet.updated_at).toLocaleDateString('tr-TR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => toast.success('Bakiye yükleme yakında aktif olacak! 🚀', {
              style: { borderRadius: '12px', background: '#0f172a', color: '#fff' },
            })}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-400"
            style={{ boxShadow: '0 4px 20px rgba(16,185,129,.45)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Bakiye Yükle
          </motion.button>
        </div>
      </div>

      {/* ── Trend Grafiği ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">Gelir & Gider Trendi</h3>
            <p className="mt-0.5 text-xs text-slate-400">Son 30 günlük hareketler</p>
          </div>
          <div className="flex items-center gap-4 text-[12px] font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="h-2.5 w-2.5 rounded bg-emerald-400" /> Gelir
            </span>
            <span className="flex items-center gap-1.5 text-rose-500">
              <span className="h-2.5 w-2.5 rounded bg-rose-400" /> Gider
            </span>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
            Henüz işlem verisi bulunmuyor
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="cuzGradGelir" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="cuzGradGider" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.14} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="gun"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `₺${(v / 1000).toFixed(1)}k` : `₺${v}`
                }
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone" dataKey="gelir" stroke="#10b981" strokeWidth={2.5}
                fill="url(#cuzGradGelir)" dot={false}
                activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
              />
              <Area
                type="monotone" dataKey="gider" stroke="#f43f5e" strokeWidth={2.5}
                fill="url(#cuzGradGider)" dot={false}
                activeDot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── İşlem Geçmişi ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-[15px] font-bold text-slate-900">İşlem Geçmişi</h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
            Son {recentTxs.length} işlem
          </span>
        </div>

        {recentTxs.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-400">
            Henüz işlem bulunmuyor
          </div>
        ) : (
          <AnimatePresence>
            <ul className="divide-y divide-slate-50">
              {recentTxs.map((tx, i) => {
                const meta   = TX_META[tx.type];
                const status = STATUS_META[tx.status];
                const isGelir = meta.sign === '+';

                return (
                  <motion.li
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.045, duration: 0.24, ease: 'easeOut' }}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/60"
                  >
                    {/* Icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg
                        ${isGelir ? 'bg-emerald-50' : 'bg-rose-50'}`}
                    >
                      {meta.emoji}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none ${meta.badge}`}>
                          {meta.label}
                        </span>
                        {tx.status !== 'tamamlandi' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-400">
                        {tx.description ?? '—'} ·{' '}
                        {new Date(tx.created_at).toLocaleDateString('tr-TR', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>

                    {/* Amount */}
                    <span
                      className={`shrink-0 text-right font-bold tabular-nums
                        ${isGelir ? 'text-emerald-600' : 'text-rose-500'}`}
                    >
                      {meta.sign}₺{fmt(tx.amount)}
                    </span>
                  </motion.li>
                );
              })}
            </ul>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
