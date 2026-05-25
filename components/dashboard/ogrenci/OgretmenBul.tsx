"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import HocayiDegerlendirModal from "@/components/dashboard/ogrenci/HocayiDegerlendirModal";
import VideoPlayer from "@/components/dashboard/shared/VideoPlayer";
import RezervasyonMatrisi from "@/components/dashboard/ogrenci/RezervasyonMatrisi";
import { ImagesBadge } from "@/components/ui/images-badge";

/* ============================================================
   TYPES
   ============================================================ */
type Hoca = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  sehir: string | null;
  ilce: string | null;
  ders_fiyati: number | null;
  hakkinda: string | null;
  video_url: string | null;
  portfolio_url: string | null;
  level: number;
  xp: number;
};
type RatingStat = { avg: number; count: number };
type SortId = "top" | "price-a" | "price-d" | "level-d";
type Budget = { id: string; label: string; max?: number; min?: number };
type SubjectId =
  | "all"
  | "matematik"
  | "fizik"
  | "kimya"
  | "ingilizce"
  | "tarih"
  | "sort-top"
  | "sort-level";
type Props = { currentUserId: string };

/* ============================================================
   CONSTANTS
   ============================================================ */
const HOCA_SELECT =
  "id, full_name, avatar_url, sehir, ilce, ders_fiyati, hakkinda, video_url, portfolio_url, level, xp";

const AV_COLORS = [
  { from: "#10b981", to: "#065f46" },
  { from: "#38bdf8", to: "#0369a1" },
  { from: "#a78bfa", to: "#6d28d9" },
  { from: "#fb923c", to: "#c2410c" },
  { from: "#f472b6", to: "#be185d" },
  { from: "#4ade80", to: "#166534" },
];

const BUDGETS: Budget[] = [
  { id: "all", label: "Tüm Bütçeler" },
  { id: "b1", label: "₺0 – 300", max: 300 },
  { id: "b2", label: "₺300 – 500", max: 500, min: 300 },
  { id: "b3", label: "₺500 – 750", max: 750, min: 500 },
  { id: "b4", label: "₺750+", min: 750 },
];

const SORTS: { id: SortId; label: string }[] = [
  { id: "top", label: "En yüksek puan" },
  { id: "price-a", label: "Fiyat: artan" },
  { id: "price-d", label: "Fiyat: azalan" },
  { id: "level-d", label: "En yüksek seviye" },
];

const SUBJECTS: { id: SubjectId; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "matematik", label: "Matematik" },
  { id: "fizik", label: "Fizik" },
  { id: "kimya", label: "Kimya" },
  { id: "ingilizce", label: "İngilizce" },
  { id: "tarih", label: "Tarih" },
  { id: "sort-top", label: "En Yüksek Puanlılar" },
  { id: "sort-level", label: "En Yüksek Seviye" },
];

/* ============================================================
   HELPERS
   ============================================================ */
function avatarColors(id: string) {
  const code = id.charCodeAt(0) + (id.charCodeAt(id.length - 1) || 0);
  return AV_COLORS[code % AV_COLORS.length];
}
function initials(name: string | null): string {
  if (!name) return "H";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "H"
  );
}
function isSafeHttpUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/* ============================================================
   INLINE ICONS
   ============================================================ */
const Ic = ({
  children,
  size = 24,
  sw = 1.75,
  className = "",
}: {
  children: React.ReactNode;
  size?: number;
  sw?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

type IP = { size?: number; sw?: number; className?: string };

const ISearch = ({ size = 24, sw = 1.75, className = "" }: IP) => (
  <Ic size={size} sw={sw} className={className}>
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </Ic>
);
const IX = ({ size = 24, sw = 1.75, className = "" }: IP) => (
  <Ic size={size} sw={sw} className={className}>
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </Ic>
);
const IChevDown = ({ size = 24, sw = 1.75, className = "" }: IP) => (
  <Ic size={size} sw={sw} className={className}><path d="m6 9 6 6 6-6" /></Ic>
);
const ICheck = ({ size = 24, sw = 1.75, className = "" }: IP) => (
  <Ic size={size} sw={sw} className={className}><path d="M20 6 9 17l-5-5" /></Ic>
);
const IBadge = ({ size = 24, sw = 1.75, className = "" }: IP) => (
  <Ic size={size} sw={sw} className={className}>
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
    <path d="m9 12 2 2 4-4" />
  </Ic>
);
const ISparkles = ({ size = 24, sw = 1.75, className = "" }: IP) => (
  <Ic size={size} sw={sw} className={className}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" /><path d="M22 5h-4" /><path d="M4 17v2" /><path d="M5 18H3" />
  </Ic>
);
const IHeart = ({ size = 24, sw = 1.75, className = "" }: IP) => (
  <Ic size={size} sw={sw} className={className}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </Ic>
);
const IPin = ({ size = 24, sw = 1.75, className = "" }: IP) => (
  <Ic size={size} sw={sw} className={className}>
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
    <circle cx="12" cy="10" r="3" />
  </Ic>
);
const IStar = ({ size = 24, sw = 1.75, className = "" }: IP) => (
  <Ic size={size} sw={sw} className={className}>
    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
  </Ic>
);
const IArrow = ({ size = 24, sw = 1.75, className = "" }: IP) => (
  <Ic size={size} sw={sw} className={className}>
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </Ic>
);
const ISliders = ({ size = 24, sw = 1.75, className = "" }: IP) => (
  <Ic size={size} sw={sw} className={className}>
    <line x1="21" x2="14" y1="4" y2="4" /><line x1="10" x2="3" y1="4" y2="4" />
    <line x1="21" x2="12" y1="12" y2="12" /><line x1="8" x2="3" y1="12" y2="12" />
    <line x1="21" x2="16" y1="20" y2="20" /><line x1="12" x2="3" y1="20" y2="20" />
    <line x1="14" x2="14" y1="2" y2="6" /><line x1="8" x2="8" y1="10" y2="14" /><line x1="16" x2="16" y1="18" y2="22" />
  </Ic>
);
const IPlay = ({ size = 24, sw = 1.75, className = "" }: IP) => (
  <Ic size={size} sw={sw} className={className}><polygon points="6 3 20 12 6 21 6 3" /></Ic>
);
const IExtLink = ({ size = 24, sw = 1.75, className = "" }: IP) => (
  <Ic size={size} sw={sw} className={className}>
    <path d="M15 3h6v6" /><path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </Ic>
);
const IEye = ({ size = 24, sw = 1.75, className = "" }: IP) => (
  <Ic size={size} sw={sw} className={className}>
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </Ic>
);

/* ============================================================
   STARS
   ============================================================ */
function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <IStar
          key={i}
          size={size}
          sw={1.5}
          className={
            i < Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "fill-white/[0.08] text-white/[0.08]"
          }
        />
      ))}
    </div>
  );
}

/* ============================================================
   BUDGET DROPDOWN  (dark glass)
   ============================================================ */
function BudgetDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const active = BUDGETS.find((b) => b.id === value);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3.5 h-9 rounded-xl border text-sm font-semibold transition-all duration-200 ${
          open
            ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
            : "border-white/10 bg-white/[0.05] text-white/50 hover:border-white/20 hover:text-white/75"
        }`}
      >
        <ISliders size={13} sw={2} />
        <span className="hidden sm:inline max-w-[90px] truncate">
          {active?.label ?? "Bütçe"}
        </span>
        <IChevDown
          size={13}
          sw={2}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 mt-2 w-44 rounded-2xl border border-white/10 bg-[#0d1f38]/95 backdrop-blur-xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.9)] p-1.5 z-30"
          >
            {BUDGETS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  onChange(b.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  value === b.id
                    ? "bg-emerald-500/15 text-emerald-300 font-semibold"
                    : "text-white/55 hover:bg-white/[0.06] hover:text-white/85"
                }`}
              >
                {b.label}
                {value === b.id && (
                  <ICheck size={13} sw={3} className="text-emerald-400 shrink-0" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   SORT MENU  (dark glass)
   ============================================================ */
function SortMenu({
  value,
  onChange,
}: {
  value: SortId;
  onChange: (v: SortId) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const active = SORTS.find((s) => s.id === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3.5 h-9 rounded-xl border border-white/10 bg-white/[0.04] hover:border-white/20 text-sm font-semibold text-white/50 hover:text-white/75 transition-all duration-200"
      >
        <ISliders size={13} sw={2} />
        <span className="hidden sm:inline">{active?.label}</span>
        <IChevDown
          size={13}
          sw={2}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 mt-2 w-52 rounded-2xl border border-white/10 bg-[#0d1f38]/95 backdrop-blur-xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.9)] p-1.5 z-30"
          >
            {SORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onChange(s.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  value === s.id
                    ? "bg-emerald-500/15 text-emerald-300 font-semibold"
                    : "text-white/55 hover:bg-white/[0.06] hover:text-white/85"
                }`}
              >
                {s.label}
                {value === s.id && (
                  <ICheck size={13} sw={3} className="text-emerald-400 shrink-0" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   SKELETON CARD
   ============================================================ */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.03] p-6 flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-2xl bg-white/[0.08] shrink-0" />
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="h-4 w-28 rounded-full bg-white/[0.08]" />
          <div className="h-3 w-20 rounded-full bg-white/[0.06]" />
          <div className="h-3 w-32 rounded-full bg-white/[0.06]" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full bg-white/[0.06]" />
        <div className="h-3 w-4/5 rounded-full bg-white/[0.05]" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-white/[0.06]" />
        ))}
      </div>
      <div className="h-10 rounded-2xl bg-white/[0.06]" />
      <div className="h-9 rounded-2xl bg-white/[0.04]" />
    </div>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/[0.04] grid place-items-center mb-5">
        <ISearch size={24} sw={1.5} className="text-white/25" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-white/60">
        Bu filtrelerle eşleşen eğitmen bulunamadı.
      </h3>
      <p className="mt-2 text-sm text-white/30 max-w-sm">
        Filtreleri gevşetmeyi dene ya da tümünü temizle. Her gün yeni eğitmenler katılıyor.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 text-sm font-semibold transition-all hover:bg-emerald-500/20 hover:border-emerald-400/50"
      >
        <IX size={14} sw={2.5} />
        Filtreleri temizle
      </button>
    </motion.div>
  );
}

/* ============================================================
   HOCA CARD  (glassmorphism)
   ============================================================ */
function HocaCard({
  h,
  index,
  stat,
  hasReviewed,
  faved,
  onFav,
  onReview,
  onDersTalep,
  onVideoOpen,
}: {
  h: Hoca;
  index: number;
  stat: RatingStat | undefined;
  hasReviewed: boolean;
  faved: boolean;
  onFav: (id: string) => void;
  onReview: (h: Hoca) => void;
  onDersTalep: (h: Hoca) => void;
  onVideoOpen: (h: Hoca) => void;
}) {
  const colors = avatarColors(h.id);
  const isSuperHoca = stat && stat.avg >= 4.8 && stat.count >= 5;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.06, 0.45),
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -6,
        scale: 1.02,
        transition: { type: "spring", stiffness: 320, damping: 22 },
      }}
      className="relative flex flex-col rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl overflow-hidden group"
      style={{
        boxShadow:
          "0 4px 40px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* Hover glow border */}
      <div className="absolute inset-0 rounded-3xl border border-emerald-400/0 group-hover:border-emerald-400/20 transition-colors duration-500 pointer-events-none z-10" />

      {/* Super eğitmen top accent */}
      {isSuperHoca && (
        <div
          className="h-[2px] w-full shrink-0"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.from} 40%, transparent)`,
          }}
        />
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div
              className="h-16 w-16 rounded-2xl grid place-items-center text-[15px] font-black text-white overflow-hidden ring-2 ring-white/10"
              style={
                h.avatar_url
                  ? undefined
                  : {
                      background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                    }
              }
            >
              {h.avatar_url ? (
                <img src={h.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(h.full_name)
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0a1628] bg-emerald-400" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[16px] font-bold tracking-tight text-white truncate">
                    {h.full_name || "İsimsiz Hoca"}
                  </h3>
                  <IBadge size={14} sw={2.4} className="text-sky-400 shrink-0" />
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-white/35">
                  <IPin size={11} sw={2} />
                  {h.sehir || h.ilce
                    ? [h.sehir, h.ilce].filter(Boolean).join(" / ")
                    : "Konum belirtilmemiş"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onFav(h.id)}
                aria-label={faved ? "Favoriden çıkar" : "Favorile"}
                className={`shrink-0 h-8 w-8 grid place-items-center rounded-xl border transition-all duration-200 ${
                  faved
                    ? "bg-rose-500/15 border-rose-400/30 text-rose-400"
                    : "border-white/10 bg-white/[0.04] text-white/25 hover:text-rose-400 hover:border-rose-400/30 hover:bg-rose-500/[0.08]"
                }`}
              >
                <IHeart size={14} sw={2.2} className={faved ? "fill-rose-400" : ""} />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Stars value={stat?.avg ?? 0} />
              {stat ? (
                <>
                  <span className="text-sm font-bold text-amber-400">
                    {stat.avg.toFixed(1)}
                  </span>
                  <span className="text-xs text-white/30">({stat.count})</span>
                </>
              ) : (
                <span className="text-xs text-white/20">Henüz değerlendirme yok</span>
              )}
            </div>
          </div>
        </div>

        {/* Super badge */}
        {isSuperHoca && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
              <ISparkles size={10} sw={2.5} />
              Süper Eğitmen
            </span>
          </div>
        )}

        {/* Bio */}
        <p className="mt-3.5 text-sm text-white/40 leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {h.hakkinda?.trim() || (
            <span className="italic text-white/20">
              Hoca henüz hakkında metni eklememiş.
            </span>
          )}
        </p>

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-3 gap-1.5">
          {[
            { label: "Seviye", value: `Lv ${h.level}` },
            { label: "Puan", value: stat ? stat.avg.toFixed(1) : "—" },
            { label: "XP", value: h.xp.toLocaleString("tr-TR") },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-2.5 text-center"
            >
              <div className="text-[9px] uppercase tracking-widest text-white/25 font-semibold">
                {label}
              </div>
              <div className="mt-0.5 text-sm font-black text-white/75 font-mono">
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Price + Ders talep */}
        <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] uppercase tracking-widest text-white/25 font-semibold">
              Saatlik ücret
            </div>
            <div className="text-lg font-black text-white tracking-tight leading-tight">
              {h.ders_fiyati != null ? (
                <>
                  ₺{h.ders_fiyati.toLocaleString("tr-TR")}
                  <span className="text-xs font-normal text-white/25 ml-1">/ saat</span>
                </>
              ) : (
                <span className="text-sm font-medium text-white/20">Belirtilmemiş</span>
              )}
            </div>
          </div>
          <motion.button
            type="button"
            onClick={() => onDersTalep(h)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="text-white text-sm font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 shrink-0"
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              boxShadow: "0 6px 24px -8px rgba(16,185,129,0.5)",
            }}
          >
            Ders Talep Et
            <IArrow size={13} sw={2.5} />
          </motion.button>
        </div>

        {/* Profili İncele */}
        <a
          href={`/hoca/${h.id}`}
          className="mt-3 flex items-center justify-center gap-2 w-full rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-emerald-400/30 hover:bg-emerald-500/[0.06] py-2.5 text-sm font-semibold text-white/40 hover:text-emerald-300 transition-all duration-200"
        >
          <IEye size={14} sw={2} />
          Profili İncele
        </a>

        {/* Video + Portfolio */}
        {(isSafeHttpUrl(h.video_url) || isSafeHttpUrl(h.portfolio_url)) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isSafeHttpUrl(h.video_url) && (
              <button
                type="button"
                onClick={() => onVideoOpen(h)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/20 bg-sky-400/[0.07] px-3 py-1.5 text-xs font-semibold text-sky-400 hover:border-sky-400/35 hover:bg-sky-400/[0.12] transition-all"
              >
                <IPlay size={11} sw={2.5} />
                Tanıtım Videosu
              </button>
            )}
            {isSafeHttpUrl(h.portfolio_url) && (
              <a
                href={h.portfolio_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:border-emerald-400/35 hover:bg-emerald-400/[0.12] transition-all"
              >
                <IExtLink size={11} sw={2.5} />
                Portfolyo
              </a>
            )}
          </div>
        )}

        {/* Review */}
        <div className="mt-3">
          {hasReviewed ? (
            <div className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-white/25 w-full">
              <ICheck size={11} sw={3} className="text-emerald-500" />
              Bu hocayı değerlendirdiniz
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onReview(h)}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-1.5 text-xs font-semibold text-amber-400 hover:border-amber-400/35 hover:bg-amber-400/[0.12] transition-all"
            >
              <IStar size={11} sw={1.5} className="fill-amber-400 text-amber-400" />
              Hocayı Değerlendir
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function OgretmenBul({ currentUserId }: Props) {
  const [sehir, setSehir] = useState("");
  const [ilce] = useState("");
  const [hocalar, setHocalar] = useState<Hoca[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [ratings, setRatings] = useState<Map<string, RatingStat>>(new Map());
  const [reviewedHocaIds, setReviewedHocaIds] = useState<Set<string>>(new Set());

  const [reviewTarget, setReviewTarget] = useState<Hoca | null>(null);
  const [videoTarget, setVideoTarget] = useState<Hoca | null>(null);
  const [rezervasyonTarget, setRezervasyonTarget] = useState<Hoca | null>(null);

  const [queryText, setQueryText] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortId>("top");
  const [faves, setFaves] = useState<Set<string>>(new Set());
  const [subjectFilter, setSubjectFilter] = useState<SubjectId>("all");

  /* ── Data fetching ────────────────────────────────────────── */
  const fetchRatings = useCallback(
    async (hocaIds: string[]) => {
      if (hocaIds.length === 0) {
        setRatings(new Map());
        setReviewedHocaIds(new Set());
        return;
      }
      const { data, error } = await supabase
        .from("reviews")
        .select("hoca_id, ogrenci_id, rating")
        .in("hoca_id", hocaIds);
      if (error) {
        setRatings(new Map());
        setReviewedHocaIds(new Set());
        return;
      }
      const sums = new Map<string, { sum: number; count: number }>();
      const reviewed = new Set<string>();
      for (const r of (data ?? []) as Array<{
        hoca_id: string;
        ogrenci_id: string;
        rating: number;
      }>) {
        const cur = sums.get(r.hoca_id) ?? { sum: 0, count: 0 };
        cur.sum += r.rating;
        cur.count += 1;
        sums.set(r.hoca_id, cur);
        if (r.ogrenci_id === currentUserId) reviewed.add(r.hoca_id);
      }
      const next = new Map<string, RatingStat>();
      for (const [id, { sum, count }] of sums.entries()) {
        next.set(id, { avg: sum / count, count });
      }
      setRatings(next);
      setReviewedHocaIds(reviewed);
    },
    [currentUserId],
  );

  const fetchHocalar = useCallback(
    async (sehirQ: string, ilceQ: string) => {
      setLoading(true);
      try {
        let q = supabase.from("users").select(HOCA_SELECT).eq("role", "hoca");
        if (sehirQ.trim()) q = q.ilike("sehir", `%${sehirQ.trim()}%`);
        if (ilceQ.trim()) q = q.ilike("ilce", `%${ilceQ.trim()}%`);
        const { data, error } = await q
          .order("level", { ascending: false })
          .order("xp", { ascending: false })
          .limit(60);

        if (error) {
          toast.error("Hocalar yüklenemedi: " + error.message);
          setHocalar([]);
          setRatings(new Map());
          setReviewedHocaIds(new Set());
          return;
        }
        const list = (data as Hoca[]) ?? [];
        setHocalar(list);
        await fetchRatings(list.map((h) => h.id));
      } finally {
        setLoading(false);
        setSearched(true);
      }
    },
    [fetchRatings],
  );

  useEffect(() => {
    fetchHocalar("", "");
  }, [fetchHocalar]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHocalar(sehir, ilce);
  };

  const temizle = () => {
    setSehir("");
    setQueryText("");
    setBudgetFilter("all");
    setSortBy("top");
    setSubjectFilter("all");
    fetchHocalar("", "");
  };

  const handleReviewSaved = useCallback(async () => {
    await fetchRatings(hocalar.map((h) => h.id));
  }, [fetchRatings, hocalar]);

  const onFav = (id: string) => {
    setFaves((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSubjectClick = (id: SubjectId) => {
    setSubjectFilter(id);
    if (id === "sort-top") setSortBy("top");
    else if (id === "sort-level") setSortBy("level-d");
  };

  /* ── Client-side filtering ────────────────────────────────── */
  const filteredHocalar = useMemo(() => {
    let arr = [...hocalar];

    const q = queryText.trim().toLowerCase();
    if (q) {
      arr = arr.filter(
        (h) =>
          (h.full_name || "").toLowerCase().includes(q) ||
          (h.hakkinda || "").toLowerCase().includes(q) ||
          (h.sehir || "").toLowerCase().includes(q),
      );
    }

    if (
      subjectFilter !== "all" &&
      subjectFilter !== "sort-top" &&
      subjectFilter !== "sort-level"
    ) {
      arr = arr.filter((h) =>
        (h.hakkinda || "").toLowerCase().includes(subjectFilter),
      );
    }

    if (budgetFilter !== "all") {
      const b = BUDGETS.find((x) => x.id === budgetFilter);
      if (b) {
        arr = arr.filter((h) => {
          const p = h.ders_fiyati ?? 0;
          if (b.max != null && p > b.max) return false;
          if (b.min != null && p < b.min) return false;
          return true;
        });
      }
    }

    arr.sort((a, b) => {
      switch (sortBy) {
        case "price-a":
          return (a.ders_fiyati ?? 0) - (b.ders_fiyati ?? 0);
        case "price-d":
          return (b.ders_fiyati ?? 0) - (a.ders_fiyati ?? 0);
        case "level-d":
          return b.level - a.level || b.xp - a.xp;
        default: {
          const ra = ratings.get(a.id)?.avg ?? 0;
          const rb = ratings.get(b.id)?.avg ?? 0;
          return rb - ra;
        }
      }
    });

    return arr;
  }, [hocalar, queryText, subjectFilter, budgetFilter, sortBy, ratings]);

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #030711 0%, #0a1628 55%, #071a14 100%)",
      }}
    >
      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ── HERO ── */}
      <div className="relative px-6 pt-10 pb-7">
        {/* Ambient radial glow */}
        <div className="absolute inset-x-0 top-0 h-72 pointer-events-none overflow-hidden">
          <div
            className="absolute left-1/2 top-4 -translate-x-1/2 w-[600px] h-52 rounded-full opacity-[0.18] blur-[90px]"
            style={{ background: "radial-gradient(ellipse, #10b981 0%, transparent 70%)" }}
          />
        </div>

        {/* Badge + Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative text-center max-w-2xl mx-auto"
        >
          <div className="mb-5 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400">
              <ISparkles size={12} sw={2.5} />
              Eğitmen Keşfet
            </div>
            {hocalar.length > 0 && (
              <ImagesBadge
                text={`${hocalar.length}+ aktif eğitmen`}
                images={hocalar
                  .filter((h) => h.avatar_url)
                  .slice(0, 4)
                  .map((h) => h.avatar_url as string)}
              />
            )}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-[1.1]">
            Sana en uygun{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
              }}
            >
              eğitmeni
            </span>{" "}
            bul.
          </h2>
          <p className="mt-3 text-sm text-white/35 max-w-md mx-auto">
            Doğrulanmış eğitmenler arasından uzmanlık alanı veya isme göre saniyeler içinde keşfet.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-7 max-w-2xl mx-auto"
        >
          {/* Glow halo behind input */}
          <div
            className="absolute inset-0 rounded-2xl opacity-0 focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              filter: "blur(28px)",
              background:
                "radial-gradient(ellipse at 50% 120%, rgba(16,185,129,0.28), transparent 70%)",
            }}
          />
          <form
            onSubmit={onSubmit}
            className="relative flex items-center gap-3 rounded-2xl border border-white/[0.1] bg-white/[0.06] backdrop-blur-xl px-5 h-14 focus-within:border-emerald-400/40 focus-within:shadow-[0_0_0_3px_rgba(52,211,153,0.10)] transition-all duration-300"
          >
            <ISearch size={18} sw={2} className="text-white/30 shrink-0" />
            <input
              value={queryText}
              onChange={(e) => {
                setQueryText(e.target.value);
                setSehir(e.target.value);
              }}
              placeholder="İsim, uzmanlık alanı veya şehir ara..."
              className="flex-1 min-w-0 bg-transparent outline-none text-sm text-white placeholder:text-white/25"
            />
            {queryText && (
              <button
                type="button"
                onClick={() => {
                  setQueryText("");
                  setSehir("");
                }}
                className="text-white/25 hover:text-white/55 transition-colors shrink-0"
              >
                <IX size={15} sw={2} />
              </button>
            )}
            <div className="h-6 w-px bg-white/[0.08] shrink-0" />
            <BudgetDropdown value={budgetFilter} onChange={setBudgetFilter} />
          </form>
        </motion.div>

        {/* Subject pill filters */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 flex items-center gap-1.5 flex-wrap justify-center"
        >
          {SUBJECTS.map((s) => {
            const isActive = subjectFilter === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSubjectClick(s.id)}
                className="relative px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150"
              >
                {isActive && (
                  <motion.span
                    layoutId="subject-pill-active"
                    className="absolute inset-0 rounded-full border border-emerald-400/40 bg-emerald-500/15"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span
                  className={`relative transition-colors duration-150 ${
                    isActive
                      ? "text-emerald-300"
                      : "text-white/35 hover:text-white/65"
                  }`}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* Thin divider */}
      <div className="mx-6 h-px bg-white/[0.05]" />

      {/* Results bar */}
      <AnimatePresence>
        {!loading && searched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between gap-3 px-6 py-3.5"
          >
            <div className="text-sm text-white/35">
              <span className="font-black text-white/65">{filteredHocalar.length}</span>{" "}
              eğitmen
              {sehir && (
                <span>
                  {" "}
                  ·{" "}
                  <span className="font-semibold text-white/50">{sehir}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              {faves.size > 0 && (
                <span className="text-xs text-white/30 flex items-center gap-1 border border-white/[0.06] rounded-lg px-2.5 py-1">
                  <IHeart size={11} sw={2} className="text-rose-400" />
                  {faves.size} favori
                </span>
              )}
              <SortMenu value={sortBy} onChange={setSortBy} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card grid */}
      <div className="px-6 pb-8 pt-1">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </motion.div>
          ) : filteredHocalar.length === 0 && searched ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1"
            >
              <EmptyState onClear={temizle} />
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredHocalar.map((h, i) => (
                <HocaCard
                  key={h.id}
                  h={h}
                  index={i}
                  stat={ratings.get(h.id)}
                  hasReviewed={reviewedHocaIds.has(h.id)}
                  faved={faves.has(h.id)}
                  onFav={onFav}
                  onReview={setReviewTarget}
                  onDersTalep={setRezervasyonTarget}
                  onVideoOpen={setVideoTarget}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Modals (unchanged) ── */}
      <HocayiDegerlendirModal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        hocaId={reviewTarget?.id ?? ""}
        hocaAdi={reviewTarget?.full_name || "Hoca"}
        ogrenciId={currentUserId}
        onSaved={handleReviewSaved}
      />
      <VideoPlayer
        open={!!videoTarget}
        onClose={() => setVideoTarget(null)}
        url={videoTarget?.video_url ?? null}
        title={
          videoTarget?.full_name ? `${videoTarget.full_name} — Tanıtım` : undefined
        }
      />
      <RezervasyonMatrisi
        open={!!rezervasyonTarget}
        onClose={() => setRezervasyonTarget(null)}
        hoca={rezervasyonTarget}
        currentUserId={currentUserId}
        rating={
          rezervasyonTarget ? ratings.get(rezervasyonTarget.id) : undefined
        }
      />
    </div>
  );
}
