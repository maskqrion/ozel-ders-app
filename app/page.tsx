'use client';

import Link from 'next/link';
import { motion, useInView, type Variants } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/* ============================================================
   ICONS (Lucide-derived inline SVGs)
   ============================================================ */
type IconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
};

const IconBase = ({
  children,
  size = 24,
  strokeWidth = 1.75,
  className = '',
}: IconProps & { children: React.ReactNode }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const GraduationCap = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M22 10v6" />
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
  </IconBase>
);
const BadgeCheck = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
    <path d="m9 12 2 2 4-4" />
  </IconBase>
);
const CalendarClock = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h5" />
    <path d="M17.5 17.5 16 16.3V14" />
    <circle cx="16" cy="16" r="6" />
  </IconBase>
);
const TrendingUp = (p: IconProps) => (
  <IconBase {...p}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </IconBase>
);
const ArrowRight = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </IconBase>
);
const Sparkles = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
    <path d="M4 17v2" />
    <path d="M5 18H3" />
  </IconBase>
);
const Star = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
  </IconBase>
);
const SearchIcon = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </IconBase>
);
const UserPlus = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M2 21a8 8 0 0 1 13.292-6" />
    <circle cx="10" cy="8" r="5" />
    <path d="M19 16v6" />
    <path d="M22 19h-6" />
  </IconBase>
);
const Play = (p: IconProps) => (
  <IconBase {...p}>
    <polygon points="6 3 20 12 6 21 6 3" />
  </IconBase>
);
const ShieldCheck = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </IconBase>
);
const Twitter = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </IconBase>
);
const Instagram = (p: IconProps) => (
  <IconBase {...p}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </IconBase>
);
const Linkedin = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </IconBase>
);
const Youtube = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </IconBase>
);
const Check = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M20 6 9 17l-5-5" />
  </IconBase>
);
const ChevronDown = (p: IconProps) => (
  <IconBase {...p}>
    <path d="m6 9 6 6 6-6" />
  </IconBase>
);
const MapPin = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
    <circle cx="12" cy="10" r="3" />
  </IconBase>
);

/* ============================================================
   ANIMATION HELPER
   ============================================================ */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.08,
      ease: [0.22, 0.61, 0.36, 1],
    },
  }),
};

type RevealAs = 'div' | 'section' | 'h1' | 'h2' | 'p' | 'span';

const MOTION_TAGS: Record<RevealAs, React.ComponentType<React.ComponentProps<typeof motion.div>>> =
  {
    div: motion.div,
    section: motion.section,
    h1: motion.h1,
    h2: motion.h2,
    p: motion.p,
    span: motion.span,
  };

function Reveal({
  children,
  delay = 0,
  className = '',
  as = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: RevealAs;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref as React.RefObject<HTMLElement>, {
    once: true,
    margin: '0px 0px -40px 0px',
    amount: 0.12,
  });
  const MotionTag = MOTION_TAGS[as];
  return (
    <MotionTag
      ref={ref as unknown as React.RefObject<HTMLDivElement>}
      custom={delay}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

/* ============================================================
   LOGO
   ============================================================ */
function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'h-10 w-10' : 'h-9 w-9';
  const text = size === 'lg' ? 'text-xl' : 'text-[17px]';
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${dim} rounded-xl grid place-items-center text-white shadow-[0_1px_2px_rgba(15,23,42,.04),0_8px_24px_-12px_rgba(15,23,42,.10)]`}
        style={{ background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)' }}
      >
        <GraduationCap size={20} strokeWidth={2.2} />
      </div>
      <div className="leading-tight">
        <div className={`${text} font-extrabold tracking-tight text-slate-900`}>
          Özel Ders<span className="text-emerald-600">.</span>Pro
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold -mt-0.5">
          Uzmanından eğitim
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   HEADER
   ============================================================ */
function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled
          ? 'bg-white/85 backdrop-blur-md border-b border-slate-200/70'
          : 'bg-white border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#ogretmenler"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Öğretmen Bul
          </a>
          <a
            href="#nasil"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Nasıl Çalışır?
          </a>
          <a
            href="#fiyat"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Fiyatlandırma
          </a>
        </nav>
        <div className="hidden md:flex items-center gap-2.5">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-slate-700 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
          >
            Giriş Yap
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-[0_1px_2px_rgba(15,23,42,.04),0_8px_24px_-12px_rgba(15,23,42,.10)] hover:shadow-lg transition"
            style={{ background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)' }}
          >
            Hemen Başla
          </Link>
        </div>
        <button
          className="md:hidden h-10 w-10 grid place-items-center rounded-lg border border-slate-200"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menü"
        >
          <ChevronDown
            size={18}
            className={`transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-5 py-4 space-y-3">
          <a href="#ogretmenler" className="block text-sm font-medium text-slate-700">
            Öğretmen Bul
          </a>
          <a href="#nasil" className="block text-sm font-medium text-slate-700">
            Nasıl Çalışır?
          </a>
          <a href="#fiyat" className="block text-sm font-medium text-slate-700">
            Fiyatlandırma
          </a>
          <div className="pt-2 flex gap-2">
            <Link
              href="/login"
              className="flex-1 px-4 py-2 text-sm font-semibold text-slate-700 rounded-lg border border-slate-200 text-center"
            >
              Giriş Yap
            </Link>
            <Link
              href="/login"
              className="flex-1 px-4 py-2 text-sm font-semibold text-white rounded-lg text-center"
              style={{ background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)' }}
            >
              Hemen Başla
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* ============================================================
   TEACHER CARD (Hero mock list)
   ============================================================ */
function TeacherCard({
  name,
  subject,
  city,
  rating,
  price,
  tone = 'emerald',
  online,
}: {
  name: string;
  subject: string;
  city: string;
  rating: number;
  price: number;
  tone?: 'emerald' | 'sky';
  online?: boolean;
}) {
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .join('');
  const toneMap = {
    emerald: 'bg-emerald-100 text-emerald-700',
    sky: 'bg-sky-100 text-sky-700',
  };
  return (
    <div className="group flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition">
      <div className="relative">
        <div
          className={`h-11 w-11 rounded-full grid place-items-center font-bold text-sm ${toneMap[tone]}`}
        >
          {initials}
        </div>
        {online && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-slate-900 truncate">{name}</span>
          <BadgeCheck size={13} strokeWidth={2.5} className="text-sky-500 shrink-0" />
        </div>
        <div className="text-xs text-slate-500 truncate flex items-center gap-1.5">
          {subject}
          <span className="text-slate-300">·</span>
          <MapPin size={10} strokeWidth={2.5} />
          {city}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="flex items-center gap-0.5 justify-end text-amber-500">
          <Star size={11} className="fill-amber-400 text-amber-400" />
          <span className="text-[11px] font-bold text-slate-700">{rating.toFixed(1)}</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          <span className="font-bold text-slate-800">{price}₺</span>/saat
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   HERO
   ============================================================ */
function Hero() {
  const [query, setQuery] = useState('');
  const popular = ['Matematik', 'İngilizce', 'Fizik', 'YKS Hazırlık', 'Piyano'];

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          'radial-gradient(60% 60% at 80% 0%, rgba(16,185,129,.08), transparent 60%),' +
          'radial-gradient(50% 50% at 10% 100%, rgba(14,165,233,.08), transparent 60%),' +
          'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      }}
    >
      {/* Grid bg */}
      <div
        className="absolute inset-0 opacity-60 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(15,23,42,.05) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(15,23,42,.05) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-20 md:pt-24 md:pb-28 relative">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Sol */}
          <div className="lg:col-span-7">
            <Reveal>
              <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full pl-1.5 pr-3.5 py-1 shadow-[0_1px_2px_rgba(15,23,42,.04),0_8px_24px_-12px_rgba(15,23,42,.10)]">
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  <Sparkles size={11} strokeWidth={2.5} />
                  Yeni
                </span>
                <span className="text-xs font-medium text-slate-600">
                  4.000+ doğrulanmış eğitmen artık platformda
                </span>
              </div>
            </Reveal>

            <Reveal delay={1} as="h1">
              <h1 className="mt-6 text-[44px] sm:text-6xl lg:text-[68px] leading-[1.02] font-extrabold tracking-tight text-slate-900">
                Hayalinizdeki <br className="hidden sm:block" />
                Eğitimi{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">Uzmanından</span>
                  <span
                    className="absolute left-0 right-0 bottom-1 h-3 bg-emerald-200/70 -z-0 rounded-sm"
                    aria-hidden="true"
                  />
                </span>{' '}
                Alın.
              </h1>
            </Reveal>

            <Reveal delay={2} as="p">
              <p className="mt-6 text-lg text-slate-600 max-w-xl leading-relaxed">
                Türkiye&apos;nin her köşesinden alanında uzman özel ders eğitmenlerini keşfedin.
                Ücretsiz tanışma görüşmesi yapın, ödevlerinizi yönetin ve gelişiminizi tek bir
                platformdan takip edin.
              </p>
            </Reveal>

            <Reveal delay={3}>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/ogrenci"
                  className="group inline-flex items-center justify-center gap-2 px-7 py-4 text-base font-bold text-white rounded-xl shadow-[0_1px_2px_rgba(15,23,42,.04),0_24px_48px_-20px_rgba(15,23,42,.16)] hover:-translate-y-px transition"
                  style={{ background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)' }}
                >
                  Hemen Öğretmen Bul
                  <ArrowRight
                    size={18}
                    strokeWidth={2.5}
                    className="group-hover:translate-x-0.5 transition"
                  />
                </Link>
                <a
                  href="#nasil"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  <Play size={16} strokeWidth={2.5} className="text-emerald-600" />
                  Nasıl Çalışır?
                </a>
              </div>
            </Reveal>

            <Reveal delay={4}>
              <div className="mt-10 flex items-center gap-5">
                <div className="flex -space-x-2">
                  {[
                    'oklch(0.82 0.04 145)',
                    'oklch(0.84 0.05 220)',
                    'oklch(0.86 0.04 60)',
                    'oklch(0.80 0.04 320)',
                  ].map((bg, i) => (
                    <div
                      key={i}
                      className="h-9 w-9 rounded-full border-2 border-white grid place-items-center text-[11px] font-bold text-slate-700"
                      style={{ background: bg }}
                    >
                      {['AY', 'MK', 'ED', 'ZS'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        strokeWidth={1.5}
                        className="fill-amber-400 text-amber-400"
                      />
                    ))}
                    <span className="ml-1.5 text-sm font-semibold text-slate-900">4.9</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    <span className="font-semibold text-slate-700">12.480</span> öğrenci yorumu
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Sağ — mock arama kartı */}
          <div className="lg:col-span-5">
            <Reveal delay={2}>
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, y: -10, rotate: 6 }}
                  animate={{ opacity: 1, y: 0, rotate: 3 }}
                  transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
                  className="absolute -top-6 -right-4 hidden md:block"
                >
                  <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,.04),0_24px_48px_-20px_rgba(15,23,42,.16)] px-4 py-3 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-sky-100 text-sky-600 grid place-items-center">
                        <TrendingUp size={16} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Bu hafta</div>
                        <div className="text-sm font-bold text-slate-900">+18% gelişim</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <div className="bg-white rounded-3xl shadow-[0_1px_2px_rgba(15,23,42,.04),0_24px_48px_-20px_rgba(15,23,42,.16)] border border-slate-100 p-5 sm:p-6">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                    <SearchIcon size={16} className="text-slate-400" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ders, konu veya seviye ara..."
                      className="bg-transparent outline-none text-sm flex-1 placeholder:text-slate-400"
                    />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                      ⌘ K
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {popular.map((p) => (
                      <button
                        key={p}
                        onClick={() => setQuery(p)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border transition ${
                          query === p
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 space-y-2.5">
                    <TeacherCard
                      name="Ayşe Yıldız"
                      subject="Matematik · YKS"
                      city="İstanbul"
                      rating={4.9}
                      price={650}
                      tone="emerald"
                      online
                    />
                    <TeacherCard
                      name="Mert Kaya"
                      subject="Fizik · LGS / 9-12"
                      city="Ankara"
                      rating={4.8}
                      price={550}
                      tone="sky"
                    />
                    <TeacherCard
                      name="Elif Demir"
                      subject="İngilizce · IELTS"
                      city="İzmir"
                      rating={5.0}
                      price={720}
                      tone="emerald"
                      online
                    />
                  </div>

                  <Link
                    href="/ogrenci"
                    className="mt-5 w-full text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl py-3 transition flex items-center justify-center gap-1.5"
                  >
                    Tüm eğitmenleri gör
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </Link>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10, rotate: -6 }}
                  animate={{ opacity: 1, y: 0, rotate: -2 }}
                  transition={{ delay: 0.7, duration: 0.6, ease: 'easeOut' }}
                  className="absolute -bottom-5 -left-4 hidden md:block"
                >
                  <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,.04),0_24px_48px_-20px_rgba(15,23,42,.16)] px-4 py-3 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 grid place-items-center">
                        <BadgeCheck size={16} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Doğrulanmış</div>
                        <div className="text-sm font-bold text-slate-900">4.218 eğitmen</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Marquee */}
      <Reveal>
        <div className="border-y border-slate-200/80 bg-white/60">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 flex items-center gap-6 overflow-hidden">
            <div className="hidden md:block text-xs uppercase tracking-[0.2em] font-bold text-slate-400 shrink-0">
              Güvenle çalıştığımız kurumlar
            </div>
            <div className="flex-1 overflow-hidden relative">
              <motion.div
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 36, ease: 'linear', repeat: Infinity }}
                className="flex items-center gap-12"
                style={{ width: 'max-content' }}
              >
                {[...Array(2)].flatMap((_, j) =>
                  ['BOĞAZİÇİ', 'ODTÜ', 'BİLKENT', 'KOÇ', 'SABANCI', 'İTÜ', 'HACETTEPE', 'EGE'].map(
                    (n) => (
                      <span
                        key={n + j}
                        className="text-slate-400 font-bold tracking-widest text-sm whitespace-nowrap"
                      >
                        {n} ★
                      </span>
                    ),
                  ),
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ============================================================
   FEATURES
   ============================================================ */
type Feature = {
  icon: (p: IconProps) => React.JSX.Element;
  tone: 'emerald' | 'sky';
  title: string;
  desc: string;
  stats: { k: string; v: string }[];
};

function FeatureCard({ icon: Icon, tone, title, desc, stats }: Feature) {
  const toneCfg = {
    emerald: {
      bg: 'bg-emerald-50',
      ring: 'ring-emerald-100',
      text: 'text-emerald-600',
    },
    sky: {
      bg: 'bg-sky-50',
      ring: 'ring-sky-100',
      text: 'text-sky-600',
    },
  }[tone];

  return (
    <div className="group relative h-full bg-white rounded-2xl border border-slate-200/80 p-7 shadow-[0_1px_2px_rgba(15,23,42,.04),0_8px_24px_-12px_rgba(15,23,42,.10)] hover:shadow-[0_1px_2px_rgba(15,23,42,.04),0_24px_48px_-20px_rgba(15,23,42,.16)] hover:-translate-y-1 transition-all duration-300">
      <div className="relative inline-flex">
        <div
          className={`absolute inset-0 ${toneCfg.bg} rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition`}
          aria-hidden="true"
        />
        <div
          className={`relative h-12 w-12 rounded-2xl ${toneCfg.bg} ${toneCfg.text} ring-1 ${toneCfg.ring} grid place-items-center`}
        >
          <Icon size={22} strokeWidth={2} />
        </div>
      </div>
      <h3 className="mt-6 text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
      <p className="mt-2.5 text-slate-600 leading-relaxed">{desc}</p>

      <div className="mt-6 pt-5 border-t border-dashed border-slate-200 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.v}>
            <div className={`text-lg font-extrabold ${toneCfg.text}`}>{s.k}</div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 group-hover:text-slate-900">
        Daha fazla
        <ArrowRight
          size={14}
          strokeWidth={2.5}
          className="group-hover:translate-x-0.5 transition"
        />
      </div>
    </div>
  );
}

function Features() {
  const features: Feature[] = [
    {
      icon: ShieldCheck,
      tone: 'emerald',
      title: 'Doğrulanmış Eğitmenler',
      desc: 'Her eğitmen kimlik, diploma ve referans kontrolünden geçer. Topluluk yorumlarıyla şeffaflık tam.',
      stats: [
        { k: '4.218', v: 'doğrulanmış hoca' },
        { k: '%96', v: 'memnuniyet' },
      ],
    },
    {
      icon: CalendarClock,
      tone: 'sky',
      title: 'Esnek Ders Saatleri',
      desc: 'Online veya yüz yüze, hafta içi veya hafta sonu — ders saatlerinizi takvime sürükle-bırak ile ayarlayın.',
      stats: [
        { k: '7/24', v: 'rezervasyon' },
        { k: '< 2 dk', v: 'planlama' },
      ],
    },
    {
      icon: TrendingUp,
      tone: 'emerald',
      title: 'Gelişim Takibi',
      desc: 'Ödevler, quizler ve seans notları tek panelde. Veliler ve öğrenciler ilerlemeyi gerçek zamanlı görür.',
      stats: [
        { k: '+18%', v: 'haftalık ilerleme' },
        { k: 'XP & Level', v: 'oyunlaştırma' },
      ],
    },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <div className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={12} strokeWidth={2.5} />
              Neden Özel Ders Pro
            </div>
          </Reveal>
          <Reveal delay={1} as="h2">
            <h2 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
              Sadece bir eşleştirme değil,{' '}
              <span className="text-slate-500">tüm bir öğrenme deneyimi.</span>
            </h2>
          </Reveal>
          <Reveal delay={2} as="p">
            <p className="mt-5 text-lg text-slate-600 leading-relaxed">
              Eğitmen bulmaktan ödev teslim etmeye, gelişim raporundan veli iletişimine — özel
              dersin tamamı tek platformda, sürtünmesiz.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i + 1} className="h-full">
              <FeatureCard {...f} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PROOF STRIP
   ============================================================ */
function ProofStrip() {
  const stats = [
    { k: '4.218', v: 'Doğrulanmış eğitmen' },
    { k: '128K+', v: 'Tamamlanan ders' },
    { k: '4.9 / 5', v: 'Ortalama puan' },
    { k: '81', v: 'Türkiye geneli il' },
  ];
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,.04),0_8px_24px_-12px_rgba(15,23,42,.10)] p-8 md:p-10 grid md:grid-cols-4 gap-6 md:gap-2 relative overflow-hidden">
            <div
              className="absolute -top-20 -right-16 h-56 w-56 bg-emerald-100/50 rounded-full blur-3xl"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-24 -left-10 h-56 w-56 bg-sky-100/40 rounded-full blur-3xl"
              aria-hidden="true"
            />
            {stats.map((s) => (
              <div key={s.v} className="relative text-center md:text-left">
                <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                  {s.k}
                </div>
                <div className="mt-1 text-sm text-slate-500">{s.v}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   HOW IT WORKS
   ============================================================ */
type Step = {
  n: string;
  icon: (p: IconProps) => React.JSX.Element;
  title: string;
  desc: string;
  hint: string;
};

function StepCard({ n, icon: Icon, title, desc, hint }: Step) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full bg-sky-200/40 blur-2xl -z-10"
          aria-hidden="true"
        />
        <div className="h-[120px] w-[120px] rounded-full bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,.04),0_8px_24px_-12px_rgba(15,23,42,.10)] grid place-items-center">
          <div className="text-[44px] leading-none font-extrabold bg-gradient-to-b from-sky-400 to-sky-600 bg-clip-text text-transparent tracking-tight">
            {n}
          </div>
        </div>
        <div className="absolute -top-1 -right-1 h-9 w-9 rounded-full bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,.04),0_8px_24px_-12px_rgba(15,23,42,.10)] grid place-items-center text-sky-600">
          <Icon size={16} strokeWidth={2.2} />
        </div>
      </div>

      <h3 className="mt-7 text-2xl font-bold text-slate-900 tracking-tight">{title}</h3>
      <p className="mt-2 text-slate-600 max-w-xs leading-relaxed">{desc}</p>
      <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-full">
        <Check size={11} strokeWidth={3} />
        {hint}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps: Step[] = [
    {
      n: '01',
      icon: UserPlus,
      title: 'Kayıt Ol',
      desc: 'Ücretsiz hesabını dakikalar içinde oluştur. İhtiyacın olan dersi ve hedefini seç.',
      hint: 'Öğrenci veya veli hesabı',
    },
    {
      n: '02',
      icon: SearchIcon,
      title: 'Hocanı Seç',
      desc: 'Şehir, fiyat ve uzmanlığa göre filtrele. Profilini incele, ücretsiz tanışma görüşmesi yap.',
      hint: '4.000+ doğrulanmış eğitmen',
    },
    {
      n: '03',
      icon: GraduationCap,
      title: 'Derse Başla',
      desc: 'Takvimden ders saatini ayarla, ödevleri ve gelişimini tek panelden takip et.',
      hint: 'Online veya yüz yüze',
    },
  ];

  return (
    <section
      id="nasil"
      className="relative py-20 md:py-28 bg-gradient-to-b from-white to-slate-50"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <Reveal>
            <div className="inline-flex items-center gap-2 text-sky-700 bg-sky-50 border border-sky-100 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
              Nasıl çalışır
            </div>
          </Reveal>
          <Reveal delay={1} as="h2">
            <h2 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
              3 adımda <span className="text-sky-500">ilk dersine</span> başla.
            </h2>
          </Reveal>
          <Reveal delay={2} as="p">
            <p className="mt-5 text-lg text-slate-600">
              Karmaşık kayıt formları, gizli ücretler veya uzun bekleme yok. Bugün başvur, bu hafta
              derste ol.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 relative">
          {/* Bağlayıcı çizgi */}
          <div
            className="hidden md:block absolute top-[58px] left-[12%] right-[12%] h-[2px]"
            aria-hidden="true"
            style={{
              backgroundImage: 'linear-gradient(to right, #cbd5e1 50%, transparent 50%)',
              backgroundSize: '12px 2px',
              backgroundRepeat: 'repeat-x',
              backgroundPosition: 'center',
            }}
          />

          <div className="grid md:grid-cols-3 gap-6 md:gap-10 relative">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i + 1}>
                <StepCard {...s} />
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal>
          <div className="mt-16 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-4 text-base font-bold text-white rounded-xl shadow-[0_1px_2px_rgba(15,23,42,.04),0_24px_48px_-20px_rgba(15,23,42,.16)] hover:-translate-y-px transition"
              style={{ background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)' }}
            >
              Şimdi Başla — Ücretsiz
              <ArrowRight size={18} strokeWidth={2.5} />
            </Link>
            <div className="mt-3 text-xs text-slate-500">
              Kredi kartı gerekmez · İlk tanışma görüşmesi ücretsiz
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */
function Footer() {
  const cols = [
    {
      title: 'Ürün',
      links: ['Öğretmen Bul', 'Nasıl Çalışır?', 'Fiyatlandırma', 'Kurumsal Çözümler'],
    },
    { title: 'Eğitmen', links: ['Eğitmen Ol', 'Eğitmen Kılavuzu', 'Hesaplama Aracı', 'Topluluk'] },
    { title: 'Şirket', links: ['Hakkımızda', 'Blog', 'Kariyer', 'Basın'] },
    { title: 'Yardım', links: ['Destek Merkezi', 'Güvenlik', 'KVKK', 'İletişim'] },
  ];
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <Logo size="lg" />
            <p className="mt-5 text-sm text-slate-600 max-w-sm leading-relaxed">
              Türkiye&apos;nin doğrulanmış özel ders platformu. Eğitmenler, öğrenciler ve veliler
              için tek panelde gelişim.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {(
                [
                  { Icon: Twitter, label: 'Twitter' },
                  { Icon: Instagram, label: 'Instagram' },
                  { Icon: Linkedin, label: 'LinkedIn' },
                  { Icon: Youtube, label: 'YouTube' },
                ] as const
              ).map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="h-10 w-10 grid place-items-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition"
                >
                  <Icon size={16} strokeWidth={1.8} />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {cols.map((c) => (
              <div key={c.title}>
                <div className="text-xs uppercase tracking-[0.18em] font-bold text-slate-400">
                  {c.title}
                </div>
                <ul className="mt-4 space-y-3">
                  {c.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-slate-600 hover:text-slate-900 transition">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            © {new Date().getFullYear()} Özel Ders Pro. Tüm hakları saklıdır.
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Tüm sistemler çalışıyor
            </span>
            <a href="#" className="hover:text-slate-700">
              Çerez Tercihleri
            </a>
            <a href="#" className="hover:text-slate-700">
              Kullanım Şartları
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   PAGE
   ============================================================ */
export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <ProofStrip />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
