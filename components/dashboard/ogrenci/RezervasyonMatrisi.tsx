"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

/* ============================================================
   ICON PRIMITIVES  (lucide-react yüklü değil — inline SVG)
   ============================================================ */
type IconProps = { size?: number; className?: string; strokeWidth?: number };
const Ic = ({
  size = 16,
  className = "",
  sw = 2,
  children,
}: { size?: number; className?: string; sw?: number; children: React.ReactNode }) => (
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
  >
    {children}
  </svg>
);

const ChevronLeft = (p: IconProps) => <Ic size={p.size} className={p.className} sw={p.strokeWidth}><path d="m15 18-6-6 6-6" /></Ic>;
const ChevronRight = (p: IconProps) => <Ic size={p.size} className={p.className} sw={p.strokeWidth}><path d="m9 18 6-6-6-6" /></Ic>;
const CalendarIcon = (p: IconProps) => <Ic size={p.size} className={p.className} sw={p.strokeWidth}><rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></Ic>;
const Check = (p: IconProps) => <Ic size={p.size} className={p.className} sw={p.strokeWidth}><polyline points="20 6 9 17 4 12" /></Ic>;
const XIcon = (p: IconProps) => <Ic size={p.size} className={p.className} sw={p.strokeWidth}><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></Ic>;
const Sunrise = (p: IconProps) => <Ic size={p.size} className={p.className} sw={p.strokeWidth}><path d="M12 2v4" /><path d="m4.93 10.93 2.83 2.83" /><path d="M2 18h20" /><path d="M6 18a6 6 0 0 1 12 0" /><path d="m19.07 10.93-2.83 2.83" /></Ic>;
const SunIcon = (p: IconProps) => <Ic size={p.size} className={p.className} sw={p.strokeWidth}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></Ic>;
const Moon = (p: IconProps) => <Ic size={p.size} className={p.className} sw={p.strokeWidth}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Ic>;
const Star = (p: IconProps) => <Ic size={p.size} className={p.className} sw={p.strokeWidth}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Ic>;
const MapPin = (p: IconProps) => <Ic size={p.size} className={p.className} sw={p.strokeWidth}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Ic>;
const Video = (p: IconProps) => <Ic size={p.size} className={p.className} sw={p.strokeWidth}><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" /></Ic>;
const BadgeCheck = (p: IconProps) => <Ic size={p.size} className={p.className} sw={p.strokeWidth}><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="m9 12 2 2 4-4" /></Ic>;
const ShieldCheck = (p: IconProps) => <Ic size={p.size} className={p.className} sw={p.strokeWidth}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></Ic>;
const Heart = (p: IconProps) => <Ic size={p.size} className={p.className} sw={p.strokeWidth}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></Ic>;
const CreditCard = (p: IconProps) => <Ic size={p.size} className={p.className} sw={p.strokeWidth}><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></Ic>;
const ArrowRight = (p: IconProps) => <Ic size={p.size} className={p.className} sw={p.strokeWidth}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Ic>;
const CalendarClock = (p: IconProps) => <Ic size={p.size} className={p.className} sw={p.strokeWidth}><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" /><path d="M16 2v4M8 2v4M3 10h5" /><path d="M17.5 17.5 16 16.3V14" /><circle cx="16" cy="16" r="6" /></Ic>;

/* ============================================================
   CONSTANTS
   ============================================================ */
const DAY_TR = ["Pzr", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"] as const;
const MONTH_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"] as const;
const MONTH_TR_LONG = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"] as const;

const TIMES = [
  "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
] as const;
type TimeSlot = (typeof TIMES)[number];

const AV_PALETTE = [
  "oklch(0.84 0.05 220)",
  "oklch(0.86 0.05 150)",
  "oklch(0.88 0.04 60)",
  "oklch(0.86 0.05 320)",
  "oklch(0.88 0.05 80)",
  "oklch(0.85 0.05 200)",
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
function fmtShort(d: Date): string {
  return `${DAY_TR[d.getDay()]}, ${d.getDate()} ${MONTH_TR[d.getMonth()]}`;
}
function avatarBg(id: string): string {
  const code = id.charCodeAt(0) + (id.charCodeAt(id.length - 1) || 0);
  return AV_PALETTE[code % AV_PALETTE.length];
}
function initials(name: string | null): string {
  if (!name) return "H";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "H";
}
function groupFor(t: string): "morning" | "afternoon" | "evening" {
  const h = parseInt(t, 10);
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

/* ============================================================
   DAY STRIP
   ============================================================ */
function DayStrip({
  days,
  selectedDayIdx,
  setSelectedDayIdx,
  daySelectedCounts,
  dayAvailableCounts,
  weekStart,
  prevWeek,
  nextWeek,
}: {
  days: Date[];
  selectedDayIdx: number;
  setSelectedDayIdx: (i: number) => void;
  daySelectedCounts: number[];
  dayAvailableCounts: number[];
  weekStart: Date;
  prevWeek: () => void;
  nextWeek: () => void;
}) {
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const el = strip.querySelector(`[data-day-idx="${selectedDayIdx}"]`) as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedDayIdx]);

  const monthLabel = `${MONTH_TR_LONG[weekStart.getMonth()]} ${weekStart.getFullYear()}`;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <CalendarIcon size={16} className="text-emerald-600" />
          <div className="text-sm font-bold tracking-tight text-slate-900 capitalize">
            {monthLabel}
          </div>
          <span className="text-xs text-slate-400 hidden md:inline">· Önümüzdeki 14 gün</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 mr-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-5 rounded-full bg-emerald-50 border border-emerald-200" />
              Müsait
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-5 rounded-full bg-sky-500" />
              Seçili
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-5 rounded-full bg-slate-100 border border-slate-200" />
              Dolu
            </span>
          </div>
          <button
            onClick={prevWeek}
            className="h-9 w-9 grid place-items-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 transition"
            aria-label="Önceki hafta"
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
          </button>
          <button
            onClick={nextWeek}
            className="h-9 w-9 grid place-items-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 transition"
            aria-label="Sonraki hafta"
          >
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Days scroller */}
      <div className="relative">
        <div
          ref={stripRef}
          className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {days.map((d, i) => {
            const active = i === selectedDayIdx;
            const isToday = d.toDateString() === new Date().toDateString();
            const selCount = daySelectedCounts[i] ?? 0;
            const availCount = dayAvailableCounts[i] ?? 0;
            return (
              <button
                key={i}
                data-day-idx={i}
                onClick={() => setSelectedDayIdx(i)}
                className={`snap-start shrink-0 w-[88px] sm:w-[96px] rounded-2xl border transition text-left p-3 relative ${
                  active
                    ? "bg-white border-emerald-300 ring-4 ring-emerald-100 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] uppercase tracking-[0.14em] font-bold ${
                      active ? "text-emerald-700" : "text-slate-500"
                    }`}
                  >
                    {DAY_TR[d.getDay()]}
                  </span>
                  {isToday && (
                    <span className="text-[9px] font-bold bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full">
                      Bugün
                    </span>
                  )}
                </div>
                <div
                  className={`mt-1 text-2xl font-extrabold tracking-tight leading-none ${
                    active ? "text-slate-900" : "text-slate-800"
                  }`}
                >
                  {d.getDate()}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-slate-500">
                  {MONTH_TR[d.getMonth()]}
                </div>
                <div className="mt-2 pt-2 border-t border-dashed border-slate-200 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {availCount}
                  </span>
                  {selCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-sky-500 text-white">
                      {selCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-white to-transparent" />
      </div>
    </div>
  );
}

/* ============================================================
   TIME PILL
   ============================================================ */
type PillState = "available" | "selected" | "booked";

function TimePill({
  time,
  state,
  onClick,
}: {
  time: string;
  state: PillState;
  onClick?: () => void;
}) {
  const base =
    "relative h-11 min-w-[82px] px-4 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-1.5 transition select-none";
  let cls = "";
  if (state === "booked") {
    cls =
      "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60";
  } else if (state === "selected") {
    cls =
      "bg-sky-500 text-white border border-sky-600 hover:bg-sky-600 shadow-sm";
  } else {
    cls =
      "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:-translate-y-0.5 shadow-sm cursor-pointer";
  }
  return (
    <motion.button
      whileTap={state !== "booked" ? { scale: 0.95 } : undefined}
      onClick={state === "booked" ? undefined : onClick}
      disabled={state === "booked"}
      className={`${base} ${cls}`}
    >
      {state === "selected" && <Check size={13} strokeWidth={3} />}
      <span>{time}</span>
    </motion.button>
  );
}

/* ============================================================
   GROUP HEADER
   ============================================================ */
function GroupHeader({
  icon: Icon,
  label,
  count,
  tone = "slate",
}: {
  icon: (p: IconProps) => React.ReactElement;
  label: string;
  count: number;
  tone?: "sky" | "amber" | "slate";
}) {
  const iconCls =
    tone === "sky"
      ? "bg-sky-50 text-sky-600"
      : tone === "amber"
        ? "bg-amber-50 text-amber-600"
        : "bg-emerald-50 text-emerald-700";
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`h-7 w-7 rounded-lg grid place-items-center ${iconCls}`}>
        <Icon size={14} strokeWidth={2.2} />
      </span>
      <span className="text-xs uppercase tracking-[0.16em] font-bold text-slate-700">
        {label}
      </span>
      <span className="text-[11px] text-slate-400">· {count} saat</span>
    </div>
  );
}

/* ============================================================
   TIME MATRIX
   ============================================================ */
function TimeMatrix({
  day,
  selectedKeys,
  bookedKeys,
  toggle,
}: {
  day: Date;
  selectedKeys: Set<string>;
  bookedKeys: Set<string>;
  toggle: (k: string, date: Date, time: TimeSlot) => void;
}) {
  type Group = { time: TimeSlot; state: PillState; k: string }[];
  const groups: Record<"morning" | "afternoon" | "evening", Group> = {
    morning: [],
    afternoon: [],
    evening: [],
  };

  for (const t of TIMES) {
    const k = slotKey(day, t);
    const booked = bookedKeys.has(k);
    const sel = selectedKeys.has(k);
    const state: PillState = booked ? "booked" : sel ? "selected" : "available";
    groups[groupFor(t)].push({ time: t, state, k });
  }

  return (
    <div className="space-y-7">
      {(
        [
          { id: "morning", label: "Sabah", icon: Sunrise, tone: "amber" },
          { id: "afternoon", label: "Öğleden sonra", icon: SunIcon, tone: "sky" },
          { id: "evening", label: "Akşam", icon: Moon, tone: "slate" },
        ] as const
      ).map((g) => (
        <div key={g.id}>
          <GroupHeader
            icon={g.id === "morning" ? Sunrise : g.id === "afternoon" ? SunIcon : Moon}
            label={g.label}
            count={groups[g.id].length}
            tone={g.tone}
          />
          <div className="flex flex-wrap gap-2">
            {groups[g.id].map((p) => (
              <TimePill
                key={p.k}
                time={p.time}
                state={p.state}
                onClick={() => toggle(p.k, day, p.time)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
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
  /* ── Calendar state ── */
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selected, setSelected] = useState<Map<string, SelectedSlot>>(new Map());
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [slotsLoading, setSlotsLoading] = useState(false);
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

  /* ── Fetch real booked slots from Supabase ── */
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

  /* ── Re-fetch when window opens or week shifts ── */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setSelected(new Map());
      setSelectedDayIdx(0);
      fetchBookedSlots();
    }
  }, [open, fetchBookedSlots]);

  useEffect(() => {
    setSelectedDayIdx(0);
  }, [weekOffset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* ── Lock body scroll while modal is open ── */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* ── ESC closes modal ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  /* ── Day counts ── */
  const dayAvailableCounts = useMemo(
    () =>
      days.map(
        (d) =>
          TIMES.filter((t) => !bookedSlots.has(slotKey(d, t))).length,
      ),
    [days, bookedSlots],
  );

  const daySelectedCounts = useMemo(() => {
    const counts = new Array(days.length).fill(0);
    for (const s of selected.values()) {
      const idx = days.findIndex(
        (d) => d.toDateString() === s.date.toDateString(),
      );
      if (idx >= 0) counts[idx] += 1;
    }
    return counts;
  }, [selected, days]);

  /* ── Toggle a slot ── */
  const toggle = useCallback(
    (k: string, date: Date, time: TimeSlot) => {
      setSelected((prev) => {
        const next = new Map(prev);
        if (next.has(k)) next.delete(k);
        else next.set(k, { k, date: new Date(date), time });
        return next;
      });
    },
    [],
  );

  const onRemove = (k: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      next.delete(k);
      return next;
    });
  };

  const clear = () => setSelected(new Map());

  /* ── Sorted selected list ── */
  const selectedList = useMemo(
    () =>
      [...selected.values()].sort((a, b) =>
        a.date.getTime() !== b.date.getTime()
          ? a.date.getTime() - b.date.getTime()
          : a.time.localeCompare(b.time),
      ),
    [selected],
  );

  /* ── Pricing ── */
  const pricePerHour = hoca?.ders_fiyati ?? 0;
  const subtotal = selectedList.length * pricePerHour;

  /* ── Confirm reservation — inserts into lessons table ── */
  const rezervasyonuOnayla = async () => {
    if (selectedList.length === 0 || !hoca) return;
    setBooking(true);
    try {
      const rows = selectedList.map((s) => {
        const [hh, mm] = s.time.split(":").map(Number);
        const dt = new Date(s.date);
        dt.setHours(hh, mm, 0, 0);
        return {
          hoca_id: hoca.id,
          ogrenci_id: currentUserId,
          lesson_date: dt.toISOString(),
          status: "bekliyor" as const,
        };
      });

      const { error } = await supabase.from("lessons").insert(rows);
      if (error) throw error;

      toast.success(
        `${selectedList.length} ders rezervasyonu başarıyla oluşturuldu! 🎉`,
        { duration: 4000 },
      );
      onClose();
    } catch (err: unknown) {
      toast.error(
        "Rezervasyon oluşturulamadı: " +
          ((err as { message?: string }).message ?? ""),
      );
    } finally {
      setBooking(false);
    }
  };

  const activeDay = days[selectedDayIdx];
  const selectedKeys = useMemo(() => new Set(selected.keys()), [selected]);

  /* ── Render ── */
  return (
    <AnimatePresence>
      {open && hoca && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 top-[4vh] sm:inset-x-4 sm:top-[4vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-4xl z-50 flex flex-col bg-slate-50 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Modal header ── */}
            <div className="flex-none bg-white border-b border-slate-200 px-5 sm:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="h-11 w-11 rounded-2xl grid place-items-center text-sm font-extrabold text-slate-700 ring-2 ring-white overflow-hidden shrink-0"
                  style={{
                    background: hoca.avatar_url ? undefined : avatarBg(hoca.id),
                  }}
                >
                  {hoca.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={hoca.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials(hoca.full_name)
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-extrabold text-slate-900 truncate">
                      {hoca.full_name || "Hoca"}
                    </span>
                    <BadgeCheck size={15} strokeWidth={2.4} className="text-sky-500 shrink-0" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    {hoca.sehir && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} strokeWidth={2.2} />
                        {hoca.sehir}
                      </span>
                    )}
                    {rating && (
                      <span className="inline-flex items-center gap-1">
                        <Star
                          size={11}
                          className="fill-amber-400 text-amber-400"
                          strokeWidth={1.5}
                        />
                        <span className="font-bold text-slate-700">
                          {rating.avg.toFixed(1)}
                        </span>
                        <span className="text-slate-400">({rating.count})</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <Video size={11} strokeWidth={2.2} className="text-emerald-600" />
                      Online
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                {pricePerHour > 0 && (
                  <div className="hidden sm:block text-right">
                    <div className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-400">
                      Saatlik
                    </div>
                    <div className="text-xl font-extrabold text-slate-900 leading-none">
                      ₺{pricePerHour.toLocaleString("tr-TR")}
                    </div>
                  </div>
                )}
                <button
                  onClick={onClose}
                  aria-label="Kapat"
                  className="h-9 w-9 grid place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 transition"
                >
                  <XIcon size={16} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 sm:px-6 py-6 space-y-7 pb-4">
                {/* Title */}
                <div>
                  <div className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
                    <CalendarIcon size={12} strokeWidth={2.5} />
                    Ders Rezervasyonu
                  </div>
                  <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Sana uyan saatleri{" "}
                    <span className="italic font-semibold text-sky-600">seç</span>,
                    gerisini bize bırak.
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-600 max-w-xl">
                    Birden fazla saat seçebilirsin — toplam tutar otomatik
                    hesaplanır.
                  </p>
                </div>

                {/* Calendar + Matrix card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
                  <DayStrip
                    days={days}
                    selectedDayIdx={selectedDayIdx}
                    setSelectedDayIdx={setSelectedDayIdx}
                    daySelectedCounts={daySelectedCounts}
                    dayAvailableCounts={dayAvailableCounts}
                    weekStart={days[0]}
                    prevWeek={() => setWeekOffset((w) => Math.max(0, w - 1))}
                    nextWeek={() => setWeekOffset((w) => w + 1)}
                  />

                  {/* Divider */}
                  <div className="my-6 flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-100" />
                    <div className="text-sm">
                      <span className="text-slate-500">Müsait saatler · </span>
                      <span className="font-extrabold text-slate-900 capitalize">
                        {DAY_TR[activeDay.getDay()]},{" "}
                        {activeDay.getDate()}{" "}
                        {MONTH_TR_LONG[activeDay.getMonth()]}
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  {/* Slots or loading */}
                  {slotsLoading ? (
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-11 w-20 rounded-xl bg-slate-100 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : (
                    <TimeMatrix
                      day={activeDay}
                      selectedKeys={selectedKeys}
                      bookedKeys={bookedSlots}
                      toggle={toggle}
                    />
                  )}

                  {/* Footnote */}
                  <div className="mt-7 pt-5 border-t border-dashed border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <ShieldCheck
                        size={13}
                        strokeWidth={2.4}
                        className="text-emerald-500"
                      />
                      Tüm rezervasyonlar güvenli şifreleme ile işlenir
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">Bugün için</span>
                      <span className="font-extrabold text-slate-900">
                        {dayAvailableCounts[selectedDayIdx]}
                      </span>
                      <span className="text-slate-500">müsait saat</span>
                    </div>
                  </div>
                </div>

                {/* Trust strip */}
                <div className="grid sm:grid-cols-3 gap-3">
                  {(
                    [
                      {
                        icon: BadgeCheck,
                        tone: "emerald",
                        title: "Doğrulanmış eğitmen",
                        sub: "Kimlik & diploma kontrolü",
                      },
                      {
                        icon: Heart,
                        tone: "rose",
                        title: "Risksiz dene",
                        sub: "Beğenmezsen iptal — ücretsiz",
                      },
                      {
                        icon: CalendarClock,
                        tone: "sky",
                        title: "Esnek iptal",
                        sub: "24 saat öncesine kadar ücretsiz",
                      },
                    ] as const
                  ).map((b) => {
                    const Icon =
                      b.title === "Doğrulanmış eğitmen"
                        ? BadgeCheck
                        : b.title === "Risksiz dene"
                          ? Heart
                          : CalendarClock;
                    const iconCls =
                      b.tone === "emerald"
                        ? "bg-emerald-50 text-emerald-700"
                        : b.tone === "sky"
                          ? "bg-sky-50 text-sky-700"
                          : "bg-rose-50 text-rose-600";
                    return (
                      <div
                        key={b.title}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3"
                      >
                        <div
                          className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${iconCls}`}
                        >
                          <Icon size={18} strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900">
                            {b.title}
                          </div>
                          <div className="text-xs text-slate-500">{b.sub}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Sticky summary bar ── */}
            <AnimatePresence>
              {selectedList.length > 0 && (
                <motion.div
                  key="summary"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex-none overflow-hidden"
                >
                  <div className="border-t border-slate-200 bg-white">
                    {/* Chips row */}
                    <div className="px-5 sm:px-6 pt-3 pb-2 flex items-center gap-2 overflow-x-auto"
                      style={{ scrollbarWidth: "none" }}>
                      {selectedList.map((s) => (
                        <div
                          key={s.k}
                          className="shrink-0 bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-1 py-1.5 flex items-center gap-2"
                        >
                          <div className="text-left leading-tight">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                              {fmtShort(s.date)}
                            </div>
                            <div className="text-sm font-extrabold text-slate-900">
                              {s.time}
                            </div>
                          </div>
                          <button
                            onClick={() => onRemove(s.k)}
                            aria-label="Kaldır"
                            className="h-7 w-7 grid place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                          >
                            <XIcon size={12} strokeWidth={2.5} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Bottom row: price + confirm */}
                    <div
                      className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                      style={{
                        background:
                          "linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f0fdf4 100%)",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-500">
                            Toplam
                          </span>
                          <span className="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
                            ₺{subtotal.toLocaleString("tr-TR")}
                          </span>
                          <span className="text-xs text-slate-500">
                            {selectedList.length} ders × ₺{pricePerHour.toLocaleString("tr-TR")}
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          Ödeme bilgileri sonraki adımda · İptal 24 saat öncesine kadar ücretsiz
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={clear}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl hover:bg-slate-100 transition"
                        >
                          Temizle
                        </button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={rezervasyonuOnayla}
                          disabled={booking}
                          className="inline-flex items-center gap-2 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-sm disabled:opacity-60 transition"
                          style={{
                            background: booking
                              ? "#94a3b8"
                              : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          }}
                        >
                          <CreditCard size={16} strokeWidth={2.4} />
                          {booking ? "İşleniyor..." : "Rezervasyonu Onayla"}
                          {!booking && <ArrowRight size={15} strokeWidth={2.5} />}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
