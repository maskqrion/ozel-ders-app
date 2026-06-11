'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { m, useInView } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TopTutor = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  hakkinda: string | null;
  xp: number | null;
  level: number | null;
  sehir: string | null;
};

export type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  ogrenci_name: string | null;
};

type Props = {
  hocaCount: number;
  lessonCount: number;
  topTutors: TopTutor[];
  reviews: ReviewItem[];
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('tr-TR');
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function useAnimatedNumber(target: number, duration = 900): number {
  const [value, setValue] = useState(target);
  const prevRef = useRef(target);
  useEffect(() => {
    const from = prevRef.current;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setValue(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else prevRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

type SvgProps = { className?: string };

function IcoSearch({ className = '' }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>
  );
}
function IcoStar({ className = '', filled = true }: SvgProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="m12 3 2.7 5.6 6 .9-4.4 4.3 1 6.1L12 17l-5.3 2.9 1-6.1L3.3 9.5l6-.9L12 3Z" /></svg>
  );
}
function IcoBolt({ className = '' }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></svg>
  );
}
function IcoCheck({ className = '' }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4 10-10" /></svg>
  );
}
function IcoArrow({ className = '' }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
  );
}
function IcoShield({ className = '' }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 3 5 6v6c0 4.4 3 7.8 7 9 4-1.2 7-4.6 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" strokeLinecap="round" /></svg>
  );
}
function IcoMenu({ className = '' }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
  );
}
function IcoLogo({ className = '' }: SvgProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true"><rect x="2" y="2" width="28" height="28" rx="8" fill="currentColor" /><path d="M10 21V11h5.2c3 0 4.8 1.9 4.8 5s-1.8 5-4.8 5H10Zm3-2.5h1.9c1.4 0 2.3-.9 2.3-2.5s-.9-2.5-2.3-2.5H13v5Z" fill="#fff" /><circle cx="23.5" cy="11.5" r="1.5" fill="#34d399" /></svg>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const PALETTES: [string, string, string][] = [
  ['#1e3a8a', '#3b82f6', '#fef3c7'],
  ['#0f766e', '#14b8a6', '#fde68a'],
  ['#7c2d12', '#f97316', '#fef3c7'],
  ['#312e81', '#6366f1', '#a7f3d0'],
  ['#064e3b', '#10b981', '#fef3c7'],
  ['#1e293b', '#475569', '#fbbf24'],
  ['#0c4a6e', '#0ea5e9', '#fde68a'],
];

function Avatar({ name, size = 56, ring = 'ring-white/80' }: { name: string; size?: number; ring?: string }) {
  const h = hashString(name);
  const [bg, mid] = PALETTES[h % PALETTES.length];
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden ring-2 ${ring}`}
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${bg}, ${mid})` }}
      aria-label={name}
    >
      <span className="relative font-semibold text-white" style={{ fontSize: size * 0.36, letterSpacing: '-0.02em' }}>
        {initials}
      </span>
    </div>
  );
}

// ─── Reveal ───────────────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px', amount: 0.1 });
  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.65, delay: delay / 1000, ease: [0.22, 0.61, 0.36, 1] }}
      className={className}
    >
      {children}
    </m.div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ scrolled }: { scrolled: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <header
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'rgba(8,17,42,0.82)' : 'rgba(8,17,42,0)',
        backdropFilter: scrolled ? 'blur(14px) saturate(140%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8 h-16 md:h-[72px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 text-white">
          <IcoLogo className="w-8 h-8 text-blue-700" />
          <span className="text-[18px] font-semibold tracking-tight">Özel Ders Pro</span>
          <span className="hidden md:inline-block ml-2 text-[11px] text-emerald-300/90 px-2 py-0.5 rounded-full border border-emerald-400/20 bg-emerald-400/5">beta</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-[14.5px] text-slate-200/85">
          {[['Öğretmen Bul', '#ogretmenler'], ['Nasıl Çalışır', '#nasil'], ['Yorumlar', '#yorumlar']].map(([label, href]) => (
            <a key={label} href={href} className="px-3.5 py-2 rounded-md hover:text-white hover:bg-white/5 transition-colors">{label}</a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-white bg-orange-500 hover:bg-orange-400 px-4 py-2.5 rounded-md transition-colors shadow-[0_6px_18px_-8px_rgba(249,115,22,0.6)]"
          >
            Giriş Yap
            <IcoArrow className="w-4 h-4" />
          </Link>
          <button className="md:hidden text-white p-2 -mr-2" onClick={() => setOpen((v) => !v)} aria-label="Menü">
            <IcoMenu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/5 bg-blue-950/95 backdrop-blur px-5 py-3 space-y-1">
          {[['Öğretmen Bul', '#ogretmenler'], ['Nasıl Çalışır', '#nasil'], ['Yorumlar', '#yorumlar']].map(([label, href]) => (
            <a key={label} href={href} onClick={() => setOpen(false)} className="block px-3 py-2.5 text-[15px] text-blue-50 rounded-md hover:bg-white/5">{label}</a>
          ))}
        </div>
      )}
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroGrid() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 opacity-[0.16]"
      style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
        maskImage: 'radial-gradient(ellipse 75% 65% at 50% 40%, #000 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 40%, #000 40%, transparent 100%)',
      }}
    />
  );
}

function Hero({ hocaCount }: { hocaCount: number }) {

  return (
    <section className="relative isolate overflow-hidden text-white">
      <div className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #1e3a8a 0%, #0b1226 55%, #050816 100%)' }} />
      <div aria-hidden className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] -z-10 opacity-50 blur-3xl" style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.45), transparent 60%)' }} />
      <div aria-hidden className="absolute top-20 right-[-10%] w-[480px] h-[480px] -z-10 opacity-40 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.35), transparent 60%)' }} />
      <HeroGrid />

      <div className="mx-auto max-w-7xl px-5 md:px-8 pt-32 md:pt-40 pb-20 md:pb-28">
        <Reveal>
          <div className="inline-flex items-center gap-2 text-[12.5px] text-slate-200/85 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <strong className="font-semibold text-emerald-300 tabular-nums mx-1">{hocaCount}</strong> doğrulanmış öğretmen platformumuzda
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="mt-6 text-[clamp(40px,6.4vw,84px)] leading-[1.02] font-semibold tracking-[-0.03em] max-w-5xl">
            Doğru öğretmen,{' '}
            <span className="inline-block italic font-normal text-slate-200/95">doğru anda</span>
            <span className="text-orange-400">.</span>
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mt-6 max-w-2xl text-[17px] md:text-[19px] leading-[1.55] text-slate-300/90">
            Türkiye&apos;nin dört bir yanından uzman özel ders öğretmenleriyle dakikalar içinde tanış. Programını yönet, ödevlerini takip et, ilerlemeni gör — hepsi tek yerde.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 text-[15px] font-medium text-white bg-orange-500 hover:bg-orange-400 pl-5 pr-4 py-3.5 rounded-lg transition-all shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_10px_30px_-12px_rgba(249,115,22,0.7)]"
            >
              Hemen Başla
              <span className="inline-flex w-7 h-7 -mr-1 items-center justify-center rounded-md bg-white/15 group-hover:bg-white/25 transition-colors">
                <IcoArrow className="w-4 h-4" />
              </span>
            </Link>
            <a href="#ogretmenler" className="inline-flex items-center gap-2 text-[15px] font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3.5 rounded-lg transition-colors">
              <IcoSearch className="w-4 h-4 opacity-80" />
              Öğretmen Bul
            </a>
            <span className="text-[13px] text-slate-400/90 ml-1">İlk 30 dk ücretsiz tanışma görüşmesi</span>
          </div>
        </Reveal>

        <Reveal delay={340}>
          <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px] text-slate-300/80">
            <div className="flex items-center gap-2"><IcoShield className="w-4 h-4 text-emerald-400" />KVKK uyumlu, güvenli ödeme</div>
            <div className="flex items-center gap-2"><IcoCheck className="w-4 h-4 text-emerald-400" />Tüm öğretmenler doğrulanmış</div>
            <div className="flex items-center gap-2"><IcoCheck className="w-4 h-4 text-emerald-400" />Memnun kalmazsan iade</div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── LiveStats ────────────────────────────────────────────────────────────────

type StatDef = { key: string; label: string; format: 'n' | 'f' };

const STAT_DEFS: StatDef[] = [
  { key: 'hocalar', label: 'Doğrulanmış eğitmen', format: 'n' },
  { key: 'dersler', label: 'Tamamlanan ders', format: 'n' },
  { key: 'puan', label: 'Ortalama ders puanı', format: 'f' },
];

function StatItem({ def, value }: { def: StatDef; value: number }) {
  const animated = useAnimatedNumber(value, 800);
  const display = def.format === 'f' ? animated.toFixed(2) : formatNumber(animated);
  return (
    <div className="relative flex flex-col gap-1.5 px-6 py-7 md:py-9">
      <div className="text-[44px] md:text-[56px] leading-[1] font-semibold tracking-[-0.03em] text-emerald-600 tabular-nums">{display}</div>
      <div className="text-[14px] text-blue-900/75">{def.label}</div>
    </div>
  );
}

function LiveStats({ hocaCount, lessonCount }: { hocaCount: number; lessonCount: number }) {
  const vals = {
    hocalar: hocaCount,
    dersler: lessonCount,
    puan: 4.86,
  };

  return (
    <section className="bg-blue-50/60 border-y border-blue-100">
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-4 md:py-6">
        <Reveal>
          <div className="mb-2 px-1">
            <div className="text-[12.5px] text-blue-900/75">Toplam platform istatistikleri</div>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div className="grid grid-cols-2 lg:grid-cols-4 bg-white rounded-2xl border border-blue-100 divide-x divide-y lg:divide-y-0 divide-blue-100 overflow-hidden">
            {STAT_DEFS.map((def) => (
              <StatItem key={def.key} def={def} value={vals[def.key as keyof typeof vals]} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── TopTutors ────────────────────────────────────────────────────────────────

function TutorCard({ tutor, idx }: { tutor: TopTutor; idx: number }) {
  const name = tutor.full_name ?? 'Eğitmen';
  const xp = tutor.xp ?? 0;
  const xpPct = Math.round((xp % 1500) / 15);

  return (
    <Reveal delay={idx * 70}>
      <article className="group relative bg-white rounded-2xl border border-blue-100 p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_50px_-25px_rgba(30,58,138,0.25)] hover:border-blue-200 h-full">
        {idx === 0 && (
          <div className="absolute -top-2.5 left-5 inline-flex items-center gap-1 text-[11px] font-medium text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
            <IcoBolt className="w-3 h-3 text-orange-500" />
            Haftanın 1.&apos;si
          </div>
        )}

        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            {tutor.avatar_url ? (
              <img src={tutor.avatar_url} alt={name} className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-50" />
            ) : (
              <Avatar name={name} size={56} ring="ring-blue-50" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-semibold text-blue-950 truncate tracking-tight">{name}</h3>
            <div className="text-[13.5px] text-blue-800 font-medium truncate">
              {tutor.hakkinda ? tutor.hakkinda.slice(0, 40) + (tutor.hakkinda.length > 40 ? '…' : '') : 'Özel ders eğitmeni'}
            </div>
            <div className="text-[12.5px] text-blue-900/55 mt-0.5">{tutor.sehir ?? 'Türkiye'} · Online</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-1">
            <IcoBolt className="w-3.5 h-3.5 text-emerald-500" />
            {xp.toLocaleString('tr-TR')} XP
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-md px-2 py-1">
            Seviye {tutor.level ?? 1}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[11.5px] text-blue-900/55 mb-1.5">
            <span>Seviye ilerleyişi</span>
            <span className="tabular-nums text-blue-900/75">{xpPct}%</span>
          </div>
          <div className="h-1.5 bg-blue-50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${xpPct}%` }} />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between pt-4 border-t border-blue-100">
          <div className="text-[13px] text-blue-900/60">Profili incele</div>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-2 rounded-md transition-colors">
            Ders Al <IcoArrow className="w-3.5 h-3.5" />
          </Link>
        </div>
      </article>
    </Reveal>
  );
}

function TopTutors({ tutors }: { tutors: TopTutor[] }) {
  return (
    <section id="ogretmenler" className="py-20 md:py-28 bg-blue-50/30 border-b border-blue-100">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
          <div>
            <Reveal>
              <div className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-blue-900/65 font-medium mb-3">
                <span className="w-6 h-px bg-blue-900/30" />
                Haftanın Öğretmenleri
              </div>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="text-[34px] md:text-[44px] leading-[1.05] font-semibold tracking-[-0.025em] text-blue-950 max-w-2xl">
                Öğrencilerin en çok tercih ettiği{' '}
                <em className="not-italic font-normal text-blue-800">uzman öğretmenler</em>
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-3 text-[15.5px] text-blue-900/70 max-w-xl">
                XP ve tamamlanan ders sayısına göre haftalık olarak güncellenir.
              </p>
            </Reveal>
          </div>
          <Reveal delay={200}>
            <Link href="/login" className="inline-flex items-center gap-2 text-[14px] font-medium text-blue-900 hover:text-blue-700 shrink-0">
              Tüm öğretmenleri gör <IcoArrow className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>

        {tutors.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tutors.map((t, i) => <TutorCard key={t.id} tutor={t} idx={i} />)}
          </div>
        ) : (
          <Reveal>
            <div className="text-center py-16 text-blue-900/50">
              Henüz kayıtlı eğitmen bulunmuyor. <Link href="/login" className="text-blue-600 underline">İlk eğitmen siz olun!</Link>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

function Stars({ filled = 5 }: { filled?: number }) {
  return (
    <div className="inline-flex gap-0.5 text-emerald-500" aria-label={`${filled} yıldız`}>
      {Array.from({ length: 5 }).map((_, i) => <IcoStar key={i} className="w-4 h-4" filled={i < filled} />)}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'Az önce';
  if (h < 24) return `${h} saat önce`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} gün önce`;
  return `${Math.floor(d / 7)} hafta önce`;
}

function ReviewCard({ review, idx }: { review: ReviewItem; idx: number }) {
  const accent = idx === 4; // 5th card gets accent style
  return (
    <Reveal delay={(idx % 3) * 70}>
      <figure
        className={`relative break-inside-avoid mb-5 rounded-2xl border p-5 md:p-6 transition-colors ${
          accent ? 'bg-blue-900 border-blue-800 text-white' : 'bg-white border-blue-100'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <Stars filled={review.rating} />
          <span className={`text-[11.5px] font-mono ${accent ? 'text-blue-200/80' : 'text-blue-900/50'}`}>
            {timeAgo(review.created_at)}
          </span>
        </div>

        {review.comment ? (
          <blockquote className={`text-[15.5px] leading-[1.55] tracking-[-0.005em] ${accent ? 'text-blue-50' : 'text-blue-950'}`}>
            {review.comment}
          </blockquote>
        ) : (
          <p className={`text-[14px] italic ${accent ? 'text-blue-200/70' : 'text-blue-900/40'}`}>
            Yorum bırakılmadı.
          </p>
        )}

        <figcaption className="mt-5 flex items-center gap-3">
          <Avatar name={review.ogrenci_name ?? 'Öğrenci'} size={36} ring={accent ? 'ring-blue-800' : 'ring-blue-50'} />
          <div className="min-w-0">
            <div className={`text-[13.5px] font-semibold ${accent ? 'text-white' : 'text-blue-950'}`}>
              {review.ogrenci_name ?? 'Anonim Öğrenci'}
            </div>
            <div className={`text-[12px] ${accent ? 'text-blue-200/85' : 'text-blue-900/60'}`}>
              Doğrulanmış öğrenci
            </div>
          </div>
        </figcaption>
      </figure>
    </Reveal>
  );
}

function Reviews({ reviews }: { reviews: ReviewItem[] }) {
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2)
    : '4.86';

  return (
    <section id="yorumlar" className="py-20 md:py-28 bg-blue-50/50">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
          <div className="max-w-2xl">
            <Reveal>
              <div className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-blue-900/65 font-medium mb-3">
                <span className="w-6 h-px bg-blue-900/30" />
                Gerçek öğrenci yorumları
              </div>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="text-[34px] md:text-[44px] leading-[1.05] font-semibold tracking-[-0.025em] text-blue-950">
                Sadece bir ders değil,{' '}
                <em className="not-italic font-normal text-blue-800">bir gelişim</em> hikayesi.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={120}>
            <div className="flex items-center gap-2 text-[13px] text-blue-900/75">
              <Stars filled={5} />
              <span className="font-semibold text-blue-950 tabular-nums">{avgRating}</span>
              <span className="text-blue-900/55">/ 5</span>
            </div>
          </Reveal>
        </div>

        {reviews.length > 0 ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-5">
            {reviews.map((r, i) => <ReviewCard key={r.id} review={r} idx={i} />)}
          </div>
        ) : (
          <Reveal>
            <div className="text-center py-16 text-blue-900/50">
              İlk yorumu siz yazın! <Link href="/login" className="text-blue-600 underline">Giriş yapın</Link>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

// ─── FinalCTA ─────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-blue-950" />
      <div className="absolute inset-0 -z-10 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.6) 1px, transparent 1.4px)', backgroundSize: '22px 22px' }} />
      <div aria-hidden className="absolute -top-32 left-1/3 w-[700px] h-[400px] -z-10 opacity-40 blur-3xl" style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.4), transparent 60%)' }} />

      <div className="mx-auto max-w-5xl px-5 md:px-8 py-24 md:py-32 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-emerald-300/90 font-medium mb-5">
            <span className="w-6 h-px bg-emerald-300/40" />İlk dersin bizden
          </div>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="text-[44px] md:text-[60px] leading-[1.04] font-semibold tracking-[-0.03em] text-white">
            Bugün başla, <em className="not-italic font-normal text-emerald-300">yarın</em> farkı gör.
          </h2>
        </Reveal>
        <Reveal delay={140}>
          <p className="mt-5 text-[16.5px] md:text-[18px] text-slate-300 max-w-xl mx-auto leading-[1.55]">
            30 dakikalık ücretsiz tanışma görüşmesi. Beğenmezsen ödemen yok.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 text-[15px] font-medium text-white bg-orange-500 hover:bg-orange-400 pl-5 pr-4 py-3.5 rounded-lg transition-all shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_10px_30px_-12px_rgba(249,115,22,0.7)]"
            >
              Ücretsiz Hesap Oluştur
              <span className="inline-flex w-7 h-7 -mr-1 items-center justify-center rounded-md bg-white/15 group-hover:bg-white/25 transition-colors">
                <IcoArrow className="w-4 h-4" />
              </span>
            </Link>
            <a href="#ogretmenler" className="inline-flex items-center gap-2 text-[15px] font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3.5 rounded-lg">
              Öğretmen Bul
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const cols: { title: string; items: { label: string; href: string }[] }[] = [
    { title: 'Ürün', items: [
      { label: 'Öğretmen Bul', href: '#ogretmenler' },
      { label: 'Nasıl Çalışır?', href: '#' },
      { label: 'Fiyatlandırma', href: '#' },
      { label: 'Mobil Uygulama', href: '#' },
    ]},
    { title: 'Şirket', items: [
      { label: 'Hakkımızda', href: '#' },
      { label: 'Kariyer', href: '#' },
      { label: 'Basın', href: '#' },
      { label: 'İletişim', href: 'mailto:destek@ozelderspro.com' },
    ]},
    { title: 'Yardım', items: [
      { label: 'Yardım Merkezi', href: '/yardim' },
      { label: 'Destek Talebi', href: '/destek' },
      { label: 'Güvenlik · KVKK', href: '/kvkk' },
      { label: 'Sıkça Sorulanlar', href: '/yardim' },
    ]},
  ];

  return (
    <footer className="bg-blue-950 text-blue-100/70 border-t border-blue-900/50">
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-14">
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 text-white">
              <IcoLogo className="w-8 h-8 text-blue-700" />
              <span className="text-[18px] font-semibold tracking-tight">Özel Ders Pro</span>
            </Link>
            <p className="mt-4 text-[14px] leading-[1.55] max-w-sm">
              Türkiye&apos;nin özel ders platformu. Doğrulanmış öğretmenler, şeffaf fiyatlar, güvenli ödeme.
            </p>
            <div className="mt-5 flex items-center gap-2 text-[12px] text-emerald-300/90">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Tüm sistemler çalışıyor
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <div className="text-[13px] text-white font-semibold mb-3">{col.title}</div>
              <ul className="space-y-2 text-[13.5px]">
                {col.items.map((item) => (
                  <li key={item.label}><a href={item.href} className="hover:text-white transition-colors">{item.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-blue-900/50 flex flex-col md:flex-row gap-4 md:items-center md:justify-between text-[12.5px]">
          <div>© {new Date().getFullYear()} Özel Ders Pro. Tüm hakları saklıdır.</div>
          <div className="flex items-center gap-5">
            <a href="/kullanim-kosullari" className="hover:text-white">Kullanım Koşulları</a>
            <a href="/gizlilik" className="hover:text-white">Gizlilik</a>
            <a href="/kvkk" className="hover:text-white">KVKK</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function LandingPage({ hocaCount, lessonCount, topTutors, reviews }: Props) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="font-sans antialiased text-blue-950 bg-white">
      <Navbar scrolled={scrolled} />
      <main>
        <Hero hocaCount={hocaCount} />
        <LiveStats hocaCount={hocaCount} lessonCount={lessonCount} />
        <TopTutors tutors={topTutors} />
        <Reviews reviews={reviews} />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
