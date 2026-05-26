"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";

/* ============================================================
   INLINE ICONS
   ============================================================ */
const Ic = ({
  children,
  size = 16,
  sw = 2,
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

const IChevLeft  = (p: IP) => <Ic {...p}><path d="m15 18-6-6 6-6" /></Ic>;
const IChevRight = (p: IP) => <Ic {...p}><path d="m9 18 6-6-6-6" /></Ic>;
const ICalendar  = (p: IP) => <Ic {...p}><rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></Ic>;
const ICheck     = (p: IP) => <Ic {...p}><polyline points="20 6 9 17 4 12" /></Ic>;
const IX         = (p: IP) => <Ic {...p}><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></Ic>;
const ISun       = (p: IP) => <Ic {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></Ic>;
const ISunrise   = (p: IP) => <Ic {...p}><path d="M12 2v4" /><path d="m4.93 10.93 2.83 2.83" /><path d="M2 18h20" /><path d="M6 18a6 6 0 0 1 12 0" /><path d="m19.07 10.93-2.83 2.83" /></Ic>;
const IMoon      = (p: IP) => <Ic {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Ic>;
const IStar      = (p: IP) => <Ic {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Ic>;
const IPin       = (p: IP) => <Ic {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Ic>;
const IBadge     = (p: IP) => <Ic {...p}><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="m9 12 2 2 4-4" /></Ic>;
const IShield    = (p: IP) => <Ic {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></Ic>;
const IWallet    = (p: IP) => <Ic {...p}><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></Ic>;
const IArrow     = (p: IP) => <Ic {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Ic>;
const IAlertTri  = (p: IP) => <Ic {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></Ic>;
const IVideo     = (p: IP) => <Ic {...p}><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" /></Ic>;
const IClock     = (p: IP) => <Ic {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Ic>;
const IHeart     = (p: IP) => <Ic {...p}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></Ic>;
const ICreditCard = (p: IP) => <Ic {...p}><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></Ic>;

/* ============================================================
   CONSTANTS
   ============================================================ */
const DAY_TR   = ["Pzr", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"] as const;
const MONTH_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"] as const;
const MONTH_LONG = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"] as const;

const TIMES = [
  "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
] as const;
type TimeSlot = (typeof TIMES)[number];

const AV_COLORS = [
  { from: "#10b981", to: "#065f46" },
  { from: "#38bdf8", to: "#0369a1" },
  { from: "#a78bfa", to: "#6d28d9" },
  { from: "#fb923c", to: "#c2410c" },
  { from: "#f472b6", to: "#be185d" },
  { from: "#4ade80", to: "#166534" },
];

/* ============================================================
   TYPES
   ============================================================ */
type SelectedSlot = { k: string; date: Date; time: TimeSlot };

export type HocaBilgi = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  sehir: string | null;
  ders_fiyati: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  hoca: HocaBilgi | null;
  currentUserId: string;
  rating?: { avg: number; count: number };
};

/* ============================================================
   HELPERS
   ============================================================ */
function slotKey(date: Date, time: string): string {
  return `${date.toISOString().slice(0, 10)}_${time}`;
}
function fmtLong(d: Date): string {
  return `${DAY_TR[d.getDay()]}, ${d.getDate()} ${MONTH_LONG[d.getMonth()]}`;
}
function avatarColors(id: string) {
  const code = id.charCodeAt(0) + (id.charCodeAt(id.length - 1) || 0);
  return AV_COLORS[code % AV_COLORS.length];
}
function initials(name: string | null): string {
  if (!name) return "H";
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "H";
}
function groupFor(t: string): "morning" | "afternoon" | "evening" {
  const h = parseInt(t, 10);
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

/* ============================================================
   DAY STRIP  (dark glass)
   ============================================================ */
function DayStrip({
  days,
  selectedDayIdx,
  setSelectedDayIdx,
  dayAvailableCounts,
  prevWeek,
  nextWeek,
  weekStart,
}: {
  days: Date[];
  selectedDayIdx: number;
  setSelectedDayIdx: (i: number) => void;
  dayAvailableCounts: number[];
  prevWeek: () => void;
  nextWeek: () => void;
  weekStart: Date;
}) {
  const monthLabel = `${MONTH_LONG[weekStart.getMonth()]} ${weekStart.getFullYear()}`;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <ICalendar size={14} sw={2} className="text-emerald-400" />
          <span className="text-sm font-bold text-white/70 capitalize">{monthLabel}</span>
          <span className="text-xs text-white/25 hidden md:inline">· Önümüzdeki 14 gün</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevWeek}
            className="h-8 w-8 grid place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/40 hover:text-white/75 hover:border-white/20 transition-all"
            aria-label="Önceki hafta"
          >
            <IChevLeft size={13} sw={2.5} />
          </button>
          <button
            onClick={nextWeek}
            className="h-8 w-8 grid place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/40 hover:text-white/75 hover:border-white/20 transition-all"
            aria-label="Sonraki hafta"
          >
            <IChevRight size={13} sw={2.5} />
          </button>
        </div>
      </div>

      {/* Scrollable day tabs */}
      <div className="relative">
        <div
          className="flex gap-2 overflow-x-auto pb-1 snap-x"
          style={{ scrollbarWidth: "none" }}
        >
          {days.map((d, i) => {
            const active = i === selectedDayIdx;
            const isToday = d.toDateString() === new Date().toDateString();
            const avail = dayAvailableCounts[i] ?? 0;
            return (
              <m.button
                key={i}
                onClick={() => setSelectedDayIdx(i)}
                whileTap={{ scale: 0.95 }}
                className={`snap-start shrink-0 w-[80px] rounded-2xl border p-3 text-left transition-all duration-200 relative overflow-hidden ${
                  active
                    ? "border-emerald-400/40 bg-emerald-500/[0.08]"
                    : "border-white/[0.07] bg-white/[0.03] hover:border-white/[0.14] hover:bg-white/[0.05]"
                }`}
              >
                {active && (
                  <m.div
                    layoutId="day-active-bg"
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background:
                        "radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.12), transparent 70%)",
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div className="relative">
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`text-[10px] uppercase tracking-widest font-bold ${
                        active ? "text-emerald-400" : "text-white/35"
                      }`}
                    >
                      {DAY_TR[d.getDay()]}
                    </span>
                    {isToday && (
                      <span className="text-[8px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1 py-px rounded-full">
                        Bugün
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-2xl font-black leading-none ${
                      active ? "text-white" : "text-white/60"
                    }`}
                  >
                    {d.getDate()}
                  </div>
                  <div className="mt-0.5 text-[10px] text-white/30 font-medium">
                    {MONTH_TR[d.getMonth()]}
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-white/[0.06] flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-400/80">{avail}</span>
                  </div>
                </div>
              </m.button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0a1628] to-transparent" />
      </div>
    </div>
  );
}

/* ============================================================
   TIME PILL  (dark glass + hover glow)
   ============================================================ */
function TimePill({
  time,
  booked,
  onClick,
}: {
  time: string;
  booked: boolean;
  onClick?: () => void;
}) {
  if (booked) {
    return (
      <div className="h-10 min-w-[76px] px-4 rounded-xl border border-white/[0.05] bg-white/[0.02] text-white/20 text-sm font-semibold inline-flex items-center justify-center opacity-40 select-none cursor-not-allowed">
        {time}
      </div>
    );
  }

  return (
    <m.button
      onClick={onClick}
      whileHover={{
        scale: 1.05,
        boxShadow:
          "0 0 20px rgba(52,211,153,0.22), 0 0 0 1px rgba(52,211,153,0.35)",
        transition: { type: "spring", stiffness: 380, damping: 22 },
      }}
      whileTap={{ scale: 0.95 }}
      className="h-10 min-w-[76px] px-4 rounded-xl border border-emerald-500/[0.22] bg-emerald-500/[0.07] text-emerald-300 text-sm font-semibold inline-flex items-center justify-center cursor-pointer select-none transition-colors hover:bg-emerald-500/[0.12]"
    >
      {time}
    </m.button>
  );
}

/* ============================================================
   TIME GROUP SECTION
   ============================================================ */
function TimeGroup({
  label,
  icon: Icon,
  slots,
  bookedKeys,
  onPick,
}: {
  label: string;
  icon: (p: IP) => React.ReactElement;
  slots: TimeSlot[];
  bookedKeys: Set<string>;
  onPick: (time: TimeSlot) => void;
}) {
  const day = new Date(); // placeholder — key resolution done outside
  void day;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="h-6 w-6 rounded-lg grid place-items-center bg-white/[0.06] border border-white/[0.06] text-white/40">
          <Icon size={12} sw={2} />
        </span>
        <span className="text-[10px] uppercase tracking-widest font-bold text-white/35">
          {label}
        </span>
        <span className="text-[10px] text-white/20">· {slots.length} saat</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {slots.map((t) => (
          <TimePill
            key={t}
            time={t}
            booked={bookedKeys.has(t)}
            onClick={() => !bookedKeys.has(t) && onPick(t)}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   CONFIRMATION MODAL  (inner glassmorphism modal)
   ============================================================ */
function ConfirmModal({
  slot,
  hoca,
  walletBalance,
  walletLoading,
  booking,
  onCancel,
  onConfirm,
}: {
  slot: SelectedSlot;
  hoca: HocaBilgi;
  walletBalance: number | null;
  walletLoading: boolean;
  booking: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const price = hoca.ders_fiyati ?? 0;
  const hasBalance = walletBalance !== null && walletBalance >= price;
  const lowBalance = !walletLoading && walletBalance !== null && !hasBalance && price > 0;

  return (
    <>
      {/* Confirmation backdrop — z-[55] blurs the outer modal */}
      <m.div
        key="confirm-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[55] backdrop-blur-md"
        style={{ background: "rgba(3,7,17,0.65)" }}
        onClick={onCancel}
      />

      {/* Confirmation panel */}
      <m.div
        key="confirm-panel"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 12 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="fixed inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-sm top-1/2 -translate-y-1/2 z-[60] rounded-3xl border border-white/[0.1] overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0d1f38 0%, #0a1628 60%, #071a14 100%)",
          boxShadow:
            "0 24px 80px -12px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top emerald line */}
        <div
          className="h-[2px]"
          style={{
            background: "linear-gradient(90deg, transparent, #10b981 40%, transparent)",
          }}
        />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2.5 py-1 mb-2">
                <ICalendar size={10} sw={2.5} />
                Ders Onayı
              </div>
              <h3 className="text-lg font-black tracking-tight text-white leading-tight">
                Rezervasyonu onayla
              </h3>
            </div>
            <button
              onClick={onCancel}
              className="h-8 w-8 grid place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/30 hover:text-white/70 hover:border-white/20 transition-all shrink-0 mt-0.5"
            >
              <IX size={13} sw={2.5} />
            </button>
          </div>

          {/* Slot info card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 mb-4 space-y-3">
            {/* Date / time */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <ICalendar size={13} sw={2} />
                <span>Tarih</span>
              </div>
              <span className="text-sm font-bold text-white/85">
                {fmtLong(slot.date)}
              </span>
            </div>
            <div className="h-px bg-white/[0.05]" />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <IClock size={13} sw={2} />
                <span>Saat</span>
              </div>
              <span className="text-sm font-black text-white tabular-nums">
                {slot.time} – {String(parseInt(slot.time) + 1).padStart(2, "0")}:00
              </span>
            </div>
            <div className="h-px bg-white/[0.05]" />
            {/* Price */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <ICreditCard size={13} sw={2} />
                <span>Ücret</span>
              </div>
              <span className="text-lg font-black text-white tabular-nums leading-none">
                {price > 0 ? (
                  <>₺{price.toLocaleString("tr-TR")}<span className="text-xs font-normal text-white/30 ml-1">/ saat</span></>
                ) : (
                  <span className="text-sm text-white/30">Belirtilmemiş</span>
                )}
              </span>
            </div>
            <div className="h-px bg-white/[0.05]" />
            {/* Wallet balance */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <IWallet size={13} sw={2} />
                <span>Cüzdan Bakiyesi</span>
              </div>
              {walletLoading ? (
                <div className="h-4 w-16 rounded bg-white/[0.08] animate-pulse" />
              ) : walletBalance !== null ? (
                <span
                  className={`text-sm font-black tabular-nums ${
                    hasBalance || price === 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  ₺{walletBalance.toLocaleString("tr-TR")}
                </span>
              ) : (
                <span className="text-xs text-white/25">—</span>
              )}
            </div>
          </div>

          {/* Insufficient balance warning */}
          <AnimatePresence>
            {lowBalance && (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.08] p-3.5 flex items-start gap-2.5">
                  <IAlertTri size={14} sw={2} className="text-rose-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-rose-300">
                      Yetersiz bakiye
                    </p>
                    <p className="text-[11px] text-rose-400/70 mt-0.5">
                      Bu dersi rezerve etmek için{" "}
                      <span className="font-black text-rose-300 tabular-nums">
                        ₺{(price - (walletBalance ?? 0)).toLocaleString("tr-TR")}
                      </span>{" "}
                      daha gerekiyor.
                    </p>
                  </div>
                </div>
              </m.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {lowBalance ? (
              <a
                href="/ogrenci/cuzdan"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 text-rose-300 text-sm font-bold transition-all hover:bg-rose-500/20 hover:border-rose-400/50"
              >
                <IWallet size={15} sw={2} />
                Bakiye Yükle
                <IArrow size={13} sw={2.5} />
              </a>
            ) : (
              <m.button
                onClick={onConfirm}
                disabled={booking}
                whileHover={!booking ? { scale: 1.02 } : undefined}
                whileTap={!booking ? { scale: 0.97 } : undefined}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-white text-sm font-bold disabled:opacity-50 transition-all"
                style={{
                  background: booking
                    ? "rgba(255,255,255,0.1)"
                    : "linear-gradient(135deg, #10b981, #059669)",
                  boxShadow: booking
                    ? "none"
                    : "0 8px 32px -8px rgba(16,185,129,0.55)",
                }}
              >
                {booking ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <ICheck size={15} sw={2.5} />
                    Dersi Onayla
                  </>
                )}
              </m.button>
            )}
            <button
              onClick={onCancel}
              disabled={booking}
              className="py-2.5 text-sm font-semibold text-white/35 hover:text-white/60 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      </m.div>
    </>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function RezervasyonMatrisi({
  open,
  onClose,
  hoca,
  currentUserId,
  rating,
}: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [pendingSlot, setPendingSlot] = useState<SelectedSlot | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  /* ── Build 14-day window ── */
  const days = useMemo(() => {
    const start = new Date(today);
    start.setDate(today.getDate() + weekOffset * 7);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [today, weekOffset]);

  /* ── Fetch booked slots ── */
  const fetchBookedSlots = useCallback(async () => {
    if (!hoca) return;
    setSlotsLoading(true);
    try {
      const from = days[0].toISOString();
      const to = new Date(days[days.length - 1]);
      to.setHours(23, 59, 59, 999);
      const { data } = await supabase
        .from("lessons")
        .select("lesson_date")
        .eq("hoca_id", hoca.id)
        .gte("lesson_date", from)
        .lte("lesson_date", to.toISOString());

      const keys = new Set<string>();
      for (const row of (data ?? []) as { lesson_date: string }[]) {
        const dt = new Date(row.lesson_date);
        const dateKey = dt.toISOString().slice(0, 10);
        const timeKey = `${String(dt.getHours()).padStart(2, "0")}:00`;
        keys.add(`${dateKey}_${timeKey}`);
      }
      setBookedSlots(keys);
    } finally {
      setSlotsLoading(false);
    }
  }, [hoca, days]);

  /* ── Fetch wallet balance ── */
  const fetchWallet = useCallback(async () => {
    setWalletLoading(true);
    try {
      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("id", currentUserId)
        .single();
      setWalletBalance(data?.balance ?? null);
    } finally {
      setWalletLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (open) {
      setSelectedDayIdx(0);
      setPendingSlot(null);
      fetchBookedSlots();
      fetchWallet();
    }
  }, [open, fetchBookedSlots, fetchWallet]);

  useEffect(() => {
    setSelectedDayIdx(0);
  }, [weekOffset]);

  /* ── Body scroll lock ── */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* ── ESC handler ── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (pendingSlot) setPendingSlot(null);
        else onClose();
      }
    };
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, pendingSlot, onClose]);

  /* ── Day available counts ── */
  const dayAvailableCounts = useMemo(
    () => days.map((d) => TIMES.filter((t) => !bookedSlots.has(slotKey(d, t))).length),
    [days, bookedSlots],
  );

  /* ── Slot pick → open confirmation ── */
  const onSlotPick = useCallback((time: TimeSlot) => {
    const activeDay = days[selectedDayIdx];
    const k = slotKey(activeDay, time);
    setPendingSlot({ k, date: new Date(activeDay), time });
  }, [days, selectedDayIdx]);

  /* ── Build booked keys for active day ── */
  const activeDay = days[selectedDayIdx];
  const activeDayBookedKeys = useMemo(() => {
    const dateStr = activeDay.toISOString().slice(0, 10);
    const keys = new Set<string>();
    for (const t of TIMES) {
      if (bookedSlots.has(`${dateStr}_${t}`)) keys.add(t);
    }
    return keys;
  }, [activeDay, bookedSlots]);

  /* ── Time groups ── */
  const timeGroups = useMemo(() => ({
    morning: TIMES.filter((t) => groupFor(t) === "morning"),
    afternoon: TIMES.filter((t) => groupFor(t) === "afternoon"),
    evening: TIMES.filter((t) => groupFor(t) === "evening"),
  }), []);

  /* ── Confirm booking ── */
  const confirmBooking = async () => {
    if (!pendingSlot || !hoca) return;
    setBooking(true);
    try {
      const price = hoca.ders_fiyati ?? 0;

      if (price > 0) {
        const { error: rpcErr } = await supabase.rpc("transfer_lesson_payment", {
          p_ogrenci_id: currentUserId,
          p_hoca_id: hoca.id,
          p_tutar: price,
        });
        if (rpcErr) throw rpcErr;
      }

      const [hh, mm] = pendingSlot.time.split(":").map(Number);
      const dt = new Date(pendingSlot.date);
      dt.setHours(hh, mm, 0, 0);
      const { error: lessonErr } = await supabase.from("lessons").insert({
        hoca_id: hoca.id,
        ogrenci_id: currentUserId,
        lesson_date: dt.toISOString(),
        status: "bekliyor",
      });
      if (lessonErr) throw lessonErr;

      toast.success("Ders rezervasyonu oluşturuldu!", { duration: 4000 });
      setPendingSlot(null);
      onClose();
    } catch (err: unknown) {
      toast.error(
        "Rezervasyon başarısız: " + ((err as { message?: string }).message ?? ""),
      );
    } finally {
      setBooking(false);
    }
  };

  const colors = hoca ? avatarColors(hoca.id) : AV_COLORS[0];

  /* ── Render ── */
  return (
    <AnimatePresence>
      {open && hoca && (
        <>
          {/* Main backdrop */}
          <m.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(3,7,17,0.75)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />

          {/* Main panel */}
          <m.div
            key="panel"
            initial={{ opacity: 0, y: 48, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 top-[3vh] sm:inset-x-4 sm:top-[3vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-3xl z-50 flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden border border-white/[0.08]"
            style={{
              background: "linear-gradient(160deg, #0d1f38 0%, #0a1628 55%, #071a14 100%)",
              boxShadow: "0 32px 96px -12px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grain overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              }}
            />

            {/* Ambient glow top */}
            <div
              className="absolute inset-x-0 top-0 h-48 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% -30%, rgba(16,185,129,0.12), transparent 70%)",
              }}
            />

            {/* ── Header ── */}
            <div className="relative flex-none border-b border-white/[0.07] px-5 sm:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                <div
                  className="h-11 w-11 rounded-2xl grid place-items-center text-sm font-black text-white overflow-hidden ring-2 ring-white/10 shrink-0"
                  style={
                    hoca.avatar_url
                      ? undefined
                      : { background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }
                  }
                >
                  {hoca.avatar_url ? (
                    <img src={hoca.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(hoca.full_name)
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-white truncate">
                      {hoca.full_name || "Hoca"}
                    </span>
                    <IBadge size={14} sw={2.4} className="text-sky-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/35 mt-0.5">
                    {hoca.sehir && (
                      <span className="inline-flex items-center gap-1">
                        <IPin size={10} sw={2} />
                        {hoca.sehir}
                      </span>
                    )}
                    {rating && (
                      <span className="inline-flex items-center gap-1">
                        <IStar size={10} className="fill-amber-400 text-amber-400" sw={1.5} />
                        <span className="font-bold text-white/60">{rating.avg.toFixed(1)}</span>
                        <span className="text-white/25">({rating.count})</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-emerald-400/60">
                      <IVideo size={10} sw={2} />
                      Online
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-3">
                {(hoca.ders_fiyati ?? 0) > 0 && (
                  <div className="hidden sm:block text-right">
                    <div className="text-[9px] uppercase tracking-widest font-bold text-white/25">
                      Saatlik
                    </div>
                    <div className="text-xl font-black text-white tabular-nums leading-none">
                      ₺{(hoca.ders_fiyati ?? 0).toLocaleString("tr-TR")}
                    </div>
                  </div>
                )}
                <button
                  onClick={onClose}
                  aria-label="Kapat"
                  className="h-9 w-9 grid place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/35 hover:text-white/75 hover:border-white/20 transition-all"
                >
                  <IX size={15} sw={2.2} />
                </button>
              </div>
            </div>

            {/* ── Scrollable body ── */}
            <div className="relative flex-1 overflow-y-auto">
              <div className="px-5 sm:px-6 py-6 space-y-6">

                {/* Heading */}
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3 py-1 mb-3">
                    <ICalendar size={10} sw={2.5} />
                    Ders Rezervasyonu
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-[1.1]">
                    Sana uyan saati{" "}
                    <span
                      className="text-transparent bg-clip-text"
                      style={{ backgroundImage: "linear-gradient(135deg, #34d399, #10b981)" }}
                    >
                      seç
                    </span>
                    , gerisini biz halledelim.
                  </h2>
                  <p className="mt-1.5 text-sm text-white/35 max-w-md">
                    Müsait saate tıkla, bakiyeni kontrol et ve anında onayla.
                  </p>
                </div>

                {/* Calendar card */}
                <div
                  className="rounded-3xl border border-white/[0.07] p-5 sm:p-6"
                  style={{ background: "rgba(255,255,255,0.025)" }}
                >
                  <DayStrip
                    days={days}
                    selectedDayIdx={selectedDayIdx}
                    setSelectedDayIdx={setSelectedDayIdx}
                    dayAvailableCounts={dayAvailableCounts}
                    prevWeek={() => setWeekOffset((w) => Math.max(0, w - 1))}
                    nextWeek={() => setWeekOffset((w) => w + 1)}
                    weekStart={days[0]}
                  />

                  {/* Date label */}
                  <div className="my-5 flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/[0.05]" />
                    <div className="text-xs text-white/30 font-semibold capitalize">
                      {fmtLong(activeDay)}
                      <span className="text-white/20 font-normal ml-1">
                        · {dayAvailableCounts[selectedDayIdx]} müsait saat
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-white/[0.05]" />
                  </div>

                  {/* Time slots */}
                  {slotsLoading ? (
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-10 w-20 rounded-xl bg-white/[0.06] animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(
                        [
                          { id: "morning",   label: "Sabah",          icon: ISunrise },
                          { id: "afternoon", label: "Öğleden Sonra",  icon: ISun },
                          { id: "evening",   label: "Akşam",          icon: IMoon },
                        ] as const
                      ).map((g) => (
                        <TimeGroup
                          key={g.id}
                          label={g.label}
                          icon={g.icon}
                          slots={timeGroups[g.id]}
                          bookedKeys={activeDayBookedKeys}
                          onPick={onSlotPick}
                        />
                      ))}
                    </div>
                  )}

                  {/* Legend */}
                  <div className="mt-6 pt-5 border-t border-white/[0.05] flex flex-wrap items-center gap-x-5 gap-y-2">
                    <div className="flex items-center gap-2 text-xs text-white/25">
                      <IShield size={12} sw={2} className="text-emerald-500/60" />
                      Güvenli & şifreli işlem
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/25 ml-auto">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-5 rounded-full border border-emerald-500/30 bg-emerald-500/[0.1]" />
                        Müsait
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-5 rounded-full bg-white/[0.06]" />
                        Dolu
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trust cards */}
                <div className="grid sm:grid-cols-3 gap-2.5">
                  {(
                    [
                      { icon: IBadge, title: "Doğrulanmış eğitmen", sub: "Kimlik & diploma kontrolü", color: "emerald" },
                      { icon: IHeart, title: "Risksiz dene",        sub: "Beğenmezsen ücretsiz iptal", color: "rose" },
                      { icon: IClock, title: "Esnek iptal",         sub: "24 saat öncesine kadar",    color: "sky" },
                    ] as const
                  ).map((b) => (
                    <div
                      key={b.title}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 flex items-center gap-3"
                    >
                      <div
                        className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${
                          b.color === "emerald"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : b.color === "sky"
                              ? "bg-sky-500/10 text-sky-400"
                              : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        <b.icon size={16} sw={2} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white/70">{b.title}</div>
                        <div className="text-[11px] text-white/30">{b.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </m.div>

          {/* ── Confirmation modal (inner) ── */}
          <AnimatePresence>
            {pendingSlot && (
              <ConfirmModal
                key="confirm"
                slot={pendingSlot}
                hoca={hoca}
                walletBalance={walletBalance}
                walletLoading={walletLoading}
                booking={booking}
                onCancel={() => setPendingSlot(null)}
                onConfirm={confirmBooking}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
