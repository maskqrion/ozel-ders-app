"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import HocayiDegerlendirModal from "@/components/dashboard/ogrenci/HocayiDegerlendirModal";
import VideoPlayer from "@/components/dashboard/shared/VideoPlayer";
import RezervasyonMatrisi from "@/components/dashboard/ogrenci/RezervasyonMatrisi";

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

type Props = { currentUserId: string };

/* ============================================================
   CONSTANTS
   ============================================================ */
const HOCA_SELECT =
  "id, full_name, avatar_url, sehir, ilce, ders_fiyati, hakkinda, video_url, portfolio_url, level, xp";

const AV_PALETTE = [
  "oklch(0.84 0.05 220)",
  "oklch(0.86 0.05 150)",
  "oklch(0.88 0.04 60)",
  "oklch(0.86 0.05 320)",
  "oklch(0.88 0.05 80)",
  "oklch(0.85 0.05 200)",
];

const BUDGETS: Budget[] = [
  { id: "all", label: "Tümü" },
  { id: "b1", label: "₺0 – 300", max: 300 },
  { id: "b2", label: "₺300 – 500", max: 500 },
  { id: "b3", label: "₺500 – 750", max: 750 },
  { id: "b4", label: "₺750+", min: 750 },
];

const SORTS: { id: SortId; label: string }[] = [
  { id: "top", label: "En yüksek puan" },
  { id: "price-a", label: "Fiyat: artan" },
  { id: "price-d", label: "Fiyat: azalan" },
  { id: "level-d", label: "En yüksek seviye" },
];

/* ============================================================
   HELPERS
   ============================================================ */
function avatarBg(id: string): string {
  const code = id.charCodeAt(0) + (id.charCodeAt(id.length - 1) || 0);
  return AV_PALETTE[code % AV_PALETTE.length];
}

function initials(name: string | null): string {
  if (!name) return "H";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "H";
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
type IconProps = { size?: number; strokeWidth?: number; className?: string };

const IconBase = ({
  children,
  size = 24,
  strokeWidth = 1.75,
  className = "",
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

const Search = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </IconBase>
);
const X = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </IconBase>
);
const ChevronDown = (p: IconProps) => (
  <IconBase {...p}><path d="m6 9 6 6 6-6" /></IconBase>
);
const Check = (p: IconProps) => (
  <IconBase {...p}><path d="M20 6 9 17l-5-5" /></IconBase>
);
const BadgeCheck = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
    <path d="m9 12 2 2 4-4" />
  </IconBase>
);
const Sparkles = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" /><path d="M22 5h-4" />
    <path d="M4 17v2" /><path d="M5 18H3" />
  </IconBase>
);
const Heart = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </IconBase>
);
const MapPin = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
    <circle cx="12" cy="10" r="3" />
  </IconBase>
);
const Star = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
  </IconBase>
);
const ArrowRight = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </IconBase>
);
const SlidersHorizontal = (p: IconProps) => (
  <IconBase {...p}>
    <line x1="21" x2="14" y1="4" y2="4" />
    <line x1="10" x2="3" y1="4" y2="4" />
    <line x1="21" x2="12" y1="12" y2="12" />
    <line x1="8" x2="3" y1="12" y2="12" />
    <line x1="21" x2="16" y1="20" y2="20" />
    <line x1="12" x2="3" y1="20" y2="20" />
    <line x1="14" x2="14" y1="2" y2="6" />
    <line x1="8" x2="8" y1="10" y2="14" />
    <line x1="16" x2="16" y1="18" y2="22" />
  </IconBase>
);
const Play = (p: IconProps) => (
  <IconBase {...p}><polygon points="6 3 20 12 6 21 6 3" /></IconBase>
);
const ExternalLink = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </IconBase>
);

/* ============================================================
   STARS
   ============================================================ */
function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.5}
          className={
            i < Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200"
          }
        />
      ))}
    </div>
  );
}

/* ============================================================
   FILTER SELECT (custom dropdown)
   ============================================================ */
type DropdownOpt = { id: string; label: string } | string;

function FilterSelect({
  icon: Icon,
  label,
  value,
  options,
  onChange,
  valueLabel,
}: {
  icon: (p: IconProps) => React.JSX.Element;
  label: string;
  value: string;
  options: DropdownOpt[];
  onChange: (v: string) => void;
  valueLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative flex-1 min-w-[140px]" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 h-12 rounded-2xl border bg-white transition text-left ${
          open
            ? "border-emerald-300 ring-4 ring-emerald-100"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <Icon size={17} className="text-slate-400 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-400 -mb-0.5">
            {label}
          </div>
          <div className="text-sm font-semibold text-slate-800 truncate">
            {valueLabel ?? value}
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-20 left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-[0_8px_32px_-8px_rgba(15,23,42,.14)] p-1.5 max-h-72 overflow-auto"
          >
            {options.map((opt) => {
              const id = typeof opt === "string" ? opt : opt.id;
              const lbl = typeof opt === "string" ? opt : opt.label;
              const active = value === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => { onChange(id); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition ${
                    active
                      ? "bg-emerald-50 text-emerald-800 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{lbl}</span>
                  {active && <Check size={14} strokeWidth={3} className="text-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   SORT MENU
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
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const active = SORTS.find((s) => s.id === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3.5 h-10 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-sm font-semibold text-slate-700 transition"
      >
        <SlidersHorizontal size={14} className="text-slate-400" />
        {active?.label}
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-[0_8px_32px_-8px_rgba(15,23,42,.14)] p-1.5 z-20"
          >
            {SORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { onChange(s.id); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition ${
                  value === s.id
                    ? "bg-emerald-50 text-emerald-800 font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {s.label}
                {value === s.id && (
                  <Check size={14} strokeWidth={3} className="text-emerald-600" />
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
    <div className="animate-pulse rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-2xl bg-slate-100 shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-32 rounded bg-slate-100" />
          <div className="h-3 w-24 rounded bg-slate-100" />
          <div className="h-3 w-28 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="mt-4 h-px bg-slate-100" />
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="h-8 w-20 rounded bg-slate-100" />
        <div className="h-9 w-28 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm"
    >
      <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 grid place-items-center">
        <Search size={22} strokeWidth={2.2} />
      </div>
      <h3 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900">
        Bu filtrelerle eşleşen hoca bulunamadı.
      </h3>
      <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto">
        Filtreleri biraz gevşetmeyi dene veya tümünü temizle. Her gün yeni eğitmenler katılıyor.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-xl shadow-[0_8px_24px_-8px_rgba(16,185,129,.5)] transition hover:-translate-y-px"
        style={{ background: "linear-gradient(180deg, #10b981 0%, #059669 100%)" }}
      >
        <X size={14} strokeWidth={2.5} />
        Filtreleri temizle
      </button>
    </motion.div>
  );
}

/* ============================================================
   HOCA CARD
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
  const bg = h.avatar_url ? undefined : avatarBg(h.id);
  const isSuperHoca = stat && stat.avg >= 4.8 && stat.count >= 5;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.05, 0.4), ease: "easeOut" }}
      whileHover={{ y: -4, boxShadow: "0 20px 48px -12px rgba(15,23,42,.12)" }}
      className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col"
    >
      {/* Top: avatar + fav */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div
            className="h-16 w-16 rounded-2xl grid place-items-center text-base font-extrabold text-slate-700 ring-4 ring-white overflow-hidden"
            style={{ background: bg }}
          >
            {h.avatar_url ? (
              <img src={h.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(h.full_name)
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[17px] font-bold tracking-tight text-slate-900 truncate">
                  {h.full_name || "İsimsiz Hoca"}
                </h3>
                <BadgeCheck size={15} strokeWidth={2.4} className="text-sky-500 shrink-0" />
              </div>
              <div className="mt-0.5 text-xs text-slate-500 truncate flex items-center gap-1">
                <MapPin size={11} strokeWidth={2.2} className="text-slate-400 shrink-0" />
                {h.sehir || h.ilce
                  ? [h.sehir, h.ilce].filter(Boolean).join(" / ")
                  : "Konum belirtilmemiş"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onFav(h.id)}
              aria-label={faved ? "Favoriden çıkar" : "Favorile"}
              className={`shrink-0 h-9 w-9 grid place-items-center rounded-xl border transition ${
                faved
                  ? "bg-rose-50 border-rose-200 text-rose-500"
                  : "bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200"
              }`}
            >
              <Heart
                size={16}
                strokeWidth={2.2}
                className={faved ? "fill-rose-500" : ""}
              />
            </button>
          </div>

          {/* Rating */}
          <div className="mt-2.5 flex items-center gap-2">
            <Stars value={stat?.avg ?? 0} />
            {stat ? (
              <>
                <span className="text-sm font-bold text-slate-900">{stat.avg.toFixed(1)}</span>
                <span className="text-xs text-slate-500">({stat.count})</span>
              </>
            ) : (
              <span className="text-xs text-slate-400">Henüz değerlendirme yok</span>
            )}
          </div>
        </div>
      </div>

      {/* Süper Hoca badge */}
      {isSuperHoca && (
        <div className="mt-3.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <Sparkles size={11} strokeWidth={2.5} />
            Süper Hoca
          </span>
        </div>
      )}

      {/* Hakkında */}
      <p className="mt-3.5 text-sm text-slate-600 leading-relaxed line-clamp-2 min-h-[2.5rem]">
        {h.hakkinda?.trim() || (
          <span className="text-slate-400 italic">
            Hoca henüz hakkında metni eklememiş.
          </span>
        )}
      </p>

      {/* Meta row */}
      <div className="mt-4 grid grid-cols-3 gap-1.5 text-[11px]">
        <div className="bg-slate-50 rounded-xl px-2 py-2 text-center">
          <div className="text-slate-500 uppercase tracking-wider font-semibold">Seviye</div>
          <div className="mt-0.5 text-sm font-bold text-slate-900">Lv {h.level}</div>
        </div>
        <div className="bg-slate-50 rounded-xl px-2 py-2 text-center">
          <div className="text-slate-500 uppercase tracking-wider font-semibold">Puan</div>
          <div className="mt-0.5 text-sm font-bold text-slate-900">
            {stat ? stat.avg.toFixed(1) : "—"}
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl px-2 py-2 text-center">
          <div className="text-slate-500 uppercase tracking-wider font-semibold">XP</div>
          <div className="mt-0.5 text-sm font-bold text-slate-900">
            {h.xp.toLocaleString("tr-TR")}
          </div>
        </div>
      </div>

      {/* Price + CTA */}
      <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-400">
            Saatlik ücret
          </div>
          <div className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
            {h.ders_fiyati != null ? (
              <>
                ₺{h.ders_fiyati.toLocaleString("tr-TR")}
                <span className="text-xs font-normal text-slate-500 ml-1">/ saat</span>
              </>
            ) : (
              <span className="text-sm font-medium text-slate-400">Belirtilmemiş</span>
            )}
          </div>
        </div>
        <motion.button
          type="button"
          onClick={() => onDersTalep(h)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-[0_6px_20px_-6px_rgba(16,185,129,.5)] inline-flex items-center gap-1.5 transition hover:-translate-y-px"
          style={{ background: "linear-gradient(180deg, #10b981 0%, #059669 100%)" }}
        >
          Ders Talep Et
          <ArrowRight size={14} strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Video + Portfolio buttons */}
      {(isSafeHttpUrl(h.video_url) || isSafeHttpUrl(h.portfolio_url)) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {isSafeHttpUrl(h.video_url) && (
            <motion.button
              type="button"
              onClick={() => onVideoOpen(h)}
              whileHover={{ scale: 1.04, boxShadow: "0 0 0 4px rgba(56,189,248,.18)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm transition hover:bg-sky-100"
            >
              <Play size={12} strokeWidth={2.5} />
              Tanıtım Videosu
            </motion.button>
          )}
          {isSafeHttpUrl(h.portfolio_url) && (
            <motion.a
              href={h.portfolio_url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04, boxShadow: "0 0 0 4px rgba(16,185,129,.18)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
            >
              <ExternalLink size={12} strokeWidth={2.5} />
              Portfolyo
            </motion.a>
          )}
        </div>
      )}

      {/* Review button */}
      <div className="mt-3">
        {hasReviewed ? (
          <div className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 w-full">
            <Check size={12} strokeWidth={3} className="text-emerald-500" />
            Bu hocayı değerlendirdiniz
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onReview(h)}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
          >
            <Star size={12} className="fill-amber-400 text-amber-400" />
            Hocayı Değerlendir
          </button>
        )}
      </div>
    </motion.article>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function OgretmenBul({ currentUserId }: Props) {
  /* ── Existing Supabase state (unchanged) ─────────────────── */
  const [sehir, setSehir] = useState("");
  const [ilce, setIlce] = useState("");
  const [hocalar, setHocalar] = useState<Hoca[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [ratings, setRatings] = useState<Map<string, RatingStat>>(new Map());
  const [reviewedHocaIds, setReviewedHocaIds] = useState<Set<string>>(new Set());

  const [reviewTarget, setReviewTarget] = useState<Hoca | null>(null);
  const [videoTarget, setVideoTarget] = useState<Hoca | null>(null);
  const [rezervasyonTarget, setRezervasyonTarget] = useState<Hoca | null>(null);

  /* ── New UI-only state ───────────────────────────────────── */
  const [queryText, setQueryText] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortId>("top");
  const [faves, setFaves] = useState<Set<string>>(new Set());

  /* ── Existing callbacks (unchanged) ─────────────────────── */
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

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchHocalar("", "");
  }, [fetchHocalar]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHocalar(sehir, ilce);
  };

  const temizle = () => {
    setSehir("");
    setIlce("");
    setQueryText("");
    setBudgetFilter("all");
    setSortBy("top");
    fetchHocalar("", "");
  };


  const handleReviewSaved = useCallback(async () => {
    await fetchRatings(hocalar.map((h) => h.id));
  }, [fetchRatings, hocalar]);

  const onFav = (id: string) => {
    setFaves((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  /* ── Client-side filtering & sorting (on top of Supabase results) ── */
  const filteredHocalar = useMemo(() => {
    let arr = [...hocalar];

    // Name / bio text search
    const q = queryText.trim().toLowerCase();
    if (q) {
      arr = arr.filter(
        (h) =>
          (h.full_name || "").toLowerCase().includes(q) ||
          (h.hakkinda || "").toLowerCase().includes(q) ||
          (h.sehir || "").toLowerCase().includes(q),
      );
    }

    // Budget filter
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

    // Sort
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
  }, [hocalar, queryText, budgetFilter, sortBy, ratings]);

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="space-y-5">
      {/* ── Page heading ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm"
        style={{
          backgroundImage:
            "radial-gradient(60% 80% at 90% 0%, rgba(16,185,129,.07), transparent 60%)," +
            "radial-gradient(40% 60% at 5% 100%, rgba(14,165,233,.06), transparent 65%)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={12} strokeWidth={2.5} />
              Eğitmen Keşfet
            </div>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Sana en uygun{" "}
              <span className="italic font-semibold text-emerald-700">eğitmeni</span> bul.
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 max-w-lg">
              Doğrulanmış eğitmenler arasından bütçe ve şehir filtreleriyle saniyeler içinde
              keşfet.
            </p>
          </div>
          {faves.size > 0 && (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
              <Heart size={14} strokeWidth={2.4} className="text-rose-500" />
              <span className="text-slate-700">{faves.size} favori</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Filter bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.06 }}
        className="bg-white border border-slate-200 rounded-3xl p-3 sm:p-4 shadow-sm"
      >
        <form onSubmit={onSubmit}>
          <div className="flex flex-col lg:flex-row gap-2.5">
            {/* Text search */}
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl px-4 h-12 flex-[1.5] min-w-0 focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-100 transition">
              <Search size={17} className="text-slate-400 shrink-0" />
              <input
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Hoca adı, konum veya konu ara..."
                className="bg-transparent outline-none text-sm flex-1 placeholder:text-slate-400 text-slate-900 min-w-0"
              />
              {queryText && (
                <button
                  type="button"
                  onClick={() => setQueryText("")}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* City input */}
            <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl px-4 h-12 flex-1 min-w-[140px] hover:border-slate-300 focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-100 transition">
              <MapPin size={17} className="text-slate-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-400 -mb-0.5">
                  Şehir
                </div>
                <input
                  value={sehir}
                  onChange={(e) => setSehir(e.target.value)}
                  placeholder="örn. İstanbul"
                  className="bg-transparent outline-none text-sm w-full placeholder:text-slate-400 text-slate-800"
                />
              </div>
            </div>

            {/* Budget dropdown */}
            <FilterSelect
              icon={SlidersHorizontal}
              label="Bütçe"
              value={budgetFilter}
              options={BUDGETS}
              onChange={setBudgetFilter}
              valueLabel={BUDGETS.find((b) => b.id === budgetFilter)?.label}
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="h-12 px-6 text-white text-sm font-bold rounded-2xl shadow-[0_8px_24px_-8px_rgba(16,185,129,.4)] inline-flex items-center justify-center gap-2 transition hover:-translate-y-px hover:shadow-[0_12px_28px_-8px_rgba(16,185,129,.5)] disabled:opacity-60 disabled:translate-y-0"
              style={{ background: "linear-gradient(180deg, #10b981 0%, #059669 100%)" }}
            >
              <Search size={16} strokeWidth={2.5} />
              {loading ? "Aranıyor..." : "Eğitmen Bul"}
            </button>
          </div>

          {/* Active filters summary */}
          {(sehir || queryText || budgetFilter !== "all") && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-400">
                Aktif:
              </span>
              {queryText && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  &ldquo;{queryText}&rdquo;
                  <button type="button" onClick={() => setQueryText("")}>
                    <X size={11} />
                  </button>
                </span>
              )}
              {sehir && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <MapPin size={11} />
                  {sehir}
                  <button type="button" onClick={() => { setSehir(""); fetchHocalar("", ilce); }}>
                    <X size={11} />
                  </button>
                </span>
              )}
              {budgetFilter !== "all" && (
                <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <SlidersHorizontal size={11} />
                  {BUDGETS.find((b) => b.id === budgetFilter)?.label}
                  <button type="button" onClick={() => setBudgetFilter("all")}>
                    <X size={11} />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={temizle}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 ml-auto transition"
              >
                <X size={12} />
                Tümünü temizle
              </button>
            </div>
          )}
        </form>
      </motion.div>

      {/* ── Results header ── */}
      {searched && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between gap-3"
        >
          <div className="text-sm text-slate-600">
            <span className="font-extrabold text-slate-900">{filteredHocalar.length}</span> sonuç
            {sehir && (
              <>
                {" "}
                ·{" "}
                <span className="font-semibold">{sehir}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs uppercase tracking-wider font-bold text-slate-400">
              Sırala
            </span>
            <SortMenu value={sortBy} onChange={setSortBy} />
          </div>
        </motion.div>
      )}

      {/* ── Grid ── */}
      <div className="min-h-[200px]">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
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
            <EmptyState key="empty" onClear={temizle} />
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

      {/* ── Modals (existing) ── */}
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
        title={videoTarget?.full_name ? `${videoTarget.full_name} — Tanıtım` : undefined}
      />

      <RezervasyonMatrisi
        open={!!rezervasyonTarget}
        onClose={() => setRezervasyonTarget(null)}
        hoca={rezervasyonTarget}
        currentUserId={currentUserId}
        rating={rezervasyonTarget ? ratings.get(rezervasyonTarget.id) : undefined}
      />
    </div>
  );
}
