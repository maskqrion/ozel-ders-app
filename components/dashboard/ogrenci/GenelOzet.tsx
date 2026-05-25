"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import type { Assignment, Lesson } from "@/lib/types";
import { XP_PER_LEVEL } from "@/lib/constants";
import { useProfile } from "@/lib/hooks/useProfile";
import { GooeyInput } from "@/components/ui/gooey-input";

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

const Trophy = (p: IconProps) => (
  <Ic size={p.size} className={p.className} sw={p.strokeWidth}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </Ic>
);
const Zap = (p: IconProps) => (
  <Ic size={p.size} className={p.className} sw={p.strokeWidth}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </Ic>
);
const CalendarDays = (p: IconProps) => (
  <Ic size={p.size} className={p.className} sw={p.strokeWidth}>
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
  </Ic>
);
const ClipboardList = (p: IconProps) => (
  <Ic size={p.size} className={p.className} sw={p.strokeWidth}>
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
  </Ic>
);
const CheckCircle = (p: IconProps) => (
  <Ic size={p.size} className={p.className} sw={p.strokeWidth}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </Ic>
);
const Clock = (p: IconProps) => (
  <Ic size={p.size} className={p.className} sw={p.strokeWidth}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </Ic>
);
const XCircle = (p: IconProps) => (
  <Ic size={p.size} className={p.className} sw={p.strokeWidth}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" x2="9" y1="9" y2="15" />
    <line x1="9" x2="15" y1="9" y2="15" />
  </Ic>
);
const Link2 = (p: IconProps) => (
  <Ic size={p.size} className={p.className} sw={p.strokeWidth}>
    <path d="M9 17H7A5 5 0 0 1 7 7h2" />
    <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
    <line x1="8" x2="16" y1="12" y2="12" />
  </Ic>
);
const GraduationCap = (p: IconProps) => (
  <Ic size={p.size} className={p.className} sw={p.strokeWidth}>
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M22 10v6" />
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
  </Ic>
);
const ArrowRight = (p: IconProps) => (
  <Ic size={p.size} className={p.className} sw={p.strokeWidth}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </Ic>
);
const BookOpen = (p: IconProps) => (
  <Ic size={p.size} className={p.className} sw={p.strokeWidth}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </Ic>
);

/* ============================================================
   PROPS
   ============================================================ */
type Props = {
  siradakiDers: Lesson | null;
  odevler: Assignment[];
  refetchDersler: () => void | Promise<void>;
  refetchOdevler: () => void | Promise<void>;
  dersler?: Lesson[];
};

/* ============================================================
   HELPERS — preserved exactly
   ============================================================ */
const parseToken = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const t = url.searchParams.get("token");
    if (t) return t.trim();
  } catch {
    // not a URL — raw token
  }
  return trimmed;
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  if (d.toDateString() === now.toDateString()) return "Bugün";
  if (d.toDateString() === tomorrow.toDateString()) return "Yarın";
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ============================================================
   STATUS CONFIG
   ============================================================ */
type OdevStatus = "verildi" | "yapildi" | "reddedildi";
const STATUS_CFG: Record<
  OdevStatus,
  { label: string; icon: (p: IconProps) => React.ReactElement; cls: string }
> = {
  verildi: {
    label: "Bekliyor",
    icon: (p) => <Clock {...p} />,
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  yapildi: {
    label: "Tamamlandı",
    icon: (p) => <CheckCircle {...p} />,
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  reddedildi: {
    label: "Reddedildi",
    icon: (p) => <XCircle {...p} />,
    cls: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function GenelOzet({
  siradakiDers,
  odevler,
  refetchDersler,
  refetchOdevler,
  dersler = [],
}: Props) {
  const { data: profile } = useProfile();
  const userId = profile?.id ?? "";
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const firstName = profile?.full_name?.split(" ")[0] ?? "Öğrenci";
  /* ── Preserved invite state ── */
  const [inviteLink, setInviteLink] = useState("");
  const [connecting, setConnecting] = useState(false);

  /* ── Preserved invite logic ── */
  const handleAcceptInvite = async () => {
    const token = parseToken(inviteLink);
    if (!token) {
      toast.error("Geçersiz veya kullanılmış davet bağlantısı.");
      return;
    }

    setConnecting(true);
    try {
      const { data: invitation, error: invErr } = await supabase
        .from("invitations")
        .select("id, hoca_id, token, is_used")
        .eq("token", token)
        .eq("is_used", false)
        .maybeSingle();

      if (invErr || !invitation) {
        toast.error("Geçersiz veya kullanılmış davet bağlantısı.");
        return;
      }

      const { error: linkErr } = await supabase
        .from("teacher_students")
        .insert([{ hoca_id: invitation.hoca_id, ogrenci_id: userId }]);
      if (linkErr && linkErr.code !== "23505") throw linkErr;

      const { error: useErr } = await supabase
        .from("invitations")
        .update({ is_used: true })
        .eq("id", invitation.id)
        .eq("is_used", false);
      if (useErr) throw useErr;

      toast.success("Hocanıza başarıyla bağlandınız!");
      setInviteLink("");
      await Promise.all([refetchDersler(), refetchOdevler()]);
    } catch (err: unknown) {
      toast.error(
        "Hata: " + ((err as { message?: string }).message ?? "Davet kabul edilemedi."),
      );
    } finally {
      setConnecting(false);
    }
  };

  /* ── Preserved derived data ── */
  const bekleyenSayisi = odevler.filter(
    (o) => o.status === "verildi" || o.status === "reddedildi",
  ).length;

  /* ── XP calculations ── */
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpPct = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
  const xpRemaining = XP_PER_LEVEL - xpInLevel;

  /* ── Upcoming lessons — dersler from prop, fallback to siradakiDers ── */
  const upcomingDersler = useMemo(() => {
    const now = new Date();
    const fromList = dersler
      .filter((d) => d.status === "bekliyor" && new Date(d.lesson_date) >= now)
      .slice(0, 4);
    // If parent hasn't passed dersler yet but siradakiDers is available, show it
    if (fromList.length === 0 && siradakiDers) return [siradakiDers];
    return fromList;
  }, [dersler, siradakiDers]);

  /* ── Homework display list ── */
  const displayOdevler = useMemo(() => odevler.slice(0, 5), [odevler]);

  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════
          WELCOME CARD  — XP hero, greeting, quick stats
          ═══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative rounded-3xl border border-emerald-100/70 p-6 sm:p-8 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #f0fdf4 0%, #ffffff 55%, #f0f9ff 100%)",
        }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #10b98115 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />

        <div className="relative grid lg:grid-cols-3 gap-6 lg:gap-10 items-center">
          {/* Left — greeting + XP bar */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 bg-white/80 border border-white text-slate-600 font-semibold px-2.5 py-1 rounded-full shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Çevrimiçi
              </span>
              <span className="text-slate-500 capitalize">{today}</span>
            </div>

            <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Merhaba,{" "}
              <span className="italic font-semibold text-emerald-700">
                {firstName}
              </span>{" "}
              👋
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">
              {bekleyenSayisi > 0 ? (
                <>
                  <span className="font-bold text-amber-600">
                    {bekleyenSayisi} ödev
                  </span>{" "}
                  seni bekliyor.{" "}
                </>
              ) : (
                "Tüm ödevlerin tamamlandı, harika! "
              )}
              Bir sonraki seviye için{" "}
              <span className="font-bold text-emerald-700">
                {xpRemaining.toLocaleString("tr-TR")} XP
              </span>{" "}
              daha kazanman gerekiyor.
            </p>

            {/* XP Progress bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="inline-flex items-center gap-1.5 bg-white border border-emerald-200 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full shadow-sm text-[12px]">
                  <Trophy size={12} strokeWidth={2.5} />
                  Level {level}
                </span>
                <div className="text-slate-700 font-semibold">
                  <span className="text-emerald-700 font-extrabold">
                    {xpInLevel.toLocaleString("tr-TR")}
                  </span>
                  <span className="text-slate-400"> / </span>
                  {XP_PER_LEVEL.toLocaleString("tr-TR")} XP
                </div>
              </div>

              <div className="relative h-3 rounded-full bg-white border border-slate-200 overflow-hidden">
                <div className="absolute inset-0 flex pointer-events-none">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 border-r border-slate-100 last:border-r-0"
                    />
                  ))}
                </div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPct}%` }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  className="relative h-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, #38bdf8 0%, #10b981 100%)",
                    boxShadow: "0 0 16px rgba(16,185,129,.35) inset",
                  }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-5 w-5 rounded-full bg-white border-2 border-emerald-500 grid place-items-center shadow-sm">
                    <Zap size={9} strokeWidth={3} className="text-emerald-600" />
                  </div>
                </motion.div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Lv {level}</span>
                <span>%{xpPct} tamamlandı</span>
                <span>Lv {level + 1}</span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="mt-5 flex flex-wrap gap-2.5">
              <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm text-sm">
                <CalendarDays size={14} className="text-sky-500" strokeWidth={2.2} />
                <span className="font-bold text-slate-900">{upcomingDersler.length}</span>
                <span className="text-slate-500">yaklaşan ders</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm text-sm">
                <ClipboardList size={14} className="text-amber-500" strokeWidth={2.2} />
                <span className="font-bold text-slate-900">{bekleyenSayisi}</span>
                <span className="text-slate-500">bekleyen ödev</span>
              </div>
            </div>
          </div>

          {/* Right — level badge (desktop) */}
          <div className="relative hidden lg:flex justify-end">
            <div className="relative">
              <div
                className="absolute inset-0 bg-emerald-300/30 blur-3xl rounded-full"
                aria-hidden
              />
              <div className="relative h-44 w-44 rounded-full bg-white border border-emerald-100 grid place-items-center shadow-lg">
                <div className="h-36 w-36 rounded-full bg-gradient-to-br from-emerald-50 via-white to-sky-50 grid place-items-center border border-white">
                  <div className="text-center">
                    <GraduationCap
                      size={28}
                      strokeWidth={2}
                      className="text-emerald-600 mx-auto"
                    />
                    <div className="mt-1.5 text-[10px] uppercase tracking-[0.18em] font-bold text-slate-400">
                      Seviye
                    </div>
                    <div className="text-4xl font-extrabold text-slate-900 leading-none">
                      {level}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-sky-600">
                      Öğrenci
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-2 -left-3 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm flex items-center gap-1.5">
                <span className="h-6 w-6 rounded-lg bg-sky-100 text-sky-600 grid place-items-center">
                  <Zap size={12} strokeWidth={2.4} />
                </span>
                <div className="text-[10px] leading-tight">
                  <div className="text-slate-500">Toplam</div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {xp.toLocaleString("tr-TR")} XP
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════
          UPCOMING LESSONS  — real dersler data
          ═══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 grid place-items-center">
              <CalendarDays size={18} strokeWidth={2.1} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                Yaklaşan Dersler
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Onaylı ve planlanmış</p>
            </div>
          </div>
          {upcomingDersler.length > 0 && (
            <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-sky-500 text-white text-[11px] font-extrabold">
              {upcomingDersler.length}
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          <AnimatePresence initial={false}>
            {upcomingDersler.length === 0 ? (
              <motion.div
                key="empty-lessons"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-6 py-8 text-center"
              >
                <CalendarDays
                  size={32}
                  className="text-slate-200 mx-auto mb-3"
                  strokeWidth={1.5}
                />
                <p className="text-sm font-semibold text-slate-400">
                  Planlanmış ders bulunamadı
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Hocanıza bağlanarak ders rezervasyonu yapabilirsiniz.
                </p>
              </motion.div>
            ) : (
              upcomingDersler.map((ders, i) => (
                <motion.div
                  key={ders.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: i * 0.04 }}
                  className="px-6 py-4 flex items-center gap-4"
                >
                  {/* Date pill */}
                  <div className="hidden sm:flex flex-col items-center justify-center h-12 w-14 rounded-xl bg-gradient-to-b from-sky-50 to-white border border-sky-100 shrink-0">
                    <div className="text-[9px] uppercase tracking-[0.14em] font-bold text-sky-600">
                      {fmtDate(ders.lesson_date).slice(0, 3)}
                    </div>
                    <div className="text-base font-extrabold text-slate-900 leading-none mt-0.5">
                      {fmtTime(ders.lesson_date)}
                    </div>
                  </div>

                  {/* Teacher avatar */}
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center shrink-0 text-sm font-extrabold">
                    {(ders.users?.email?.[0] ?? "H").toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {ders.users?.email ?? "Hoca"}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 flex items-center gap-2">
                      <CalendarDays size={11} strokeWidth={2.2} className="text-slate-400 shrink-0" />
                      <span>{fmtDate(ders.lesson_date)}</span>
                      <span className="text-slate-300">·</span>
                      <span>{fmtTime(ders.lesson_date)}</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold border rounded-full px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                    Onaylı
                  </span>

                  <button className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 transition shrink-0">
                    Detay
                    <ArrowRight size={12} strokeWidth={2.5} />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer stat */}
        {upcomingDersler.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Toplam{" "}
              <span className="font-bold text-slate-800">{dersler.length}</span>{" "}
              ders geçmişte dahil
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <BookOpen size={11} strokeWidth={2.3} />
              {dersler.filter((d) => d.status === "tamamlandi").length} tamamlandı
            </span>
          </div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════
          HOMEWORK LIST  — real odevler data
          ═══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.14 }}
        className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 grid place-items-center">
              <ClipboardList size={18} strokeWidth={2.1} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                Ödev Durumu
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {bekleyenSayisi > 0
                  ? `${bekleyenSayisi} ödev tamamlanmayı bekliyor`
                  : "Tüm ödevler tamamlandı"}
              </p>
            </div>
          </div>
          {bekleyenSayisi > 0 && (
            <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-amber-500 text-white text-[11px] font-extrabold">
              {bekleyenSayisi}
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          <AnimatePresence initial={false}>
            {displayOdevler.length === 0 ? (
              <motion.div
                key="empty-hw"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-6 py-8 text-center"
              >
                <ClipboardList
                  size={32}
                  className="text-slate-200 mx-auto mb-3"
                  strokeWidth={1.5}
                />
                <p className="text-sm font-semibold text-slate-400">
                  Henüz ödev yok
                </p>
              </motion.div>
            ) : (
              displayOdevler.map((odev, i) => {
                const cfg = STATUS_CFG[odev.status as OdevStatus] ?? STATUS_CFG.verildi;
                const StatusIcon = cfg.icon;
                const teacherEmail = odev.lessons?.users?.email ?? null;

                return (
                  <motion.div
                    key={odev.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: i * 0.04 }}
                    className="px-6 py-4 flex items-center gap-4"
                  >
                    {/* Status icon */}
                    <div
                      className={`h-10 w-10 rounded-xl border grid place-items-center shrink-0 ${cfg.cls}`}
                    >
                      <StatusIcon size={17} strokeWidth={2.1} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {odev.title}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500 flex items-center gap-2 truncate">
                        {teacherEmail && (
                          <span className="truncate">{teacherEmail}</span>
                        )}
                        {odev.lessons?.lesson_date && (
                          <>
                            {teacherEmail && (
                              <span className="text-slate-300 shrink-0">·</span>
                            )}
                            <span className="shrink-0">
                              {fmtDate(odev.lessons.lesson_date)}
                            </span>
                          </>
                        )}
                        {odev.score != null && (
                          <>
                            <span className="text-slate-300 shrink-0">·</span>
                            <span className="font-semibold text-emerald-700 shrink-0">
                              {odev.score} puan
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span
                      className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold border rounded-full px-2.5 py-0.5 shrink-0 ${cfg.cls}`}
                    >
                      {cfg.label}
                    </span>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Summary footer */}
        {odevler.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-700">
                {odevler.filter((o) => o.status === "yapildi").length}
              </span>{" "}
              tamamlandı
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="font-semibold text-slate-700">
                {odevler.filter((o) => o.status === "verildi").length}
              </span>{" "}
              bekliyor
            </span>
            {odevler.filter((o) => o.status === "reddedildi").length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                <span className="font-semibold text-slate-700">
                  {odevler.filter((o) => o.status === "reddedildi").length}
                </span>{" "}
                reddedildi
              </span>
            )}
          </div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════
          INVITE CARD  — preserved Supabase invite logic
          ═══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 grid place-items-center shrink-0">
            <Link2 size={18} strokeWidth={2.1} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Hocaya Bağlan
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Hocanızdan aldığınız davet bağlantısını veya token&#x2019;ı yapıştırın.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); handleAcceptInvite(); }}
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <div className="flex-1">
            <GooeyInput
              value={inviteLink}
              onChange={setInviteLink}
              placeholder="https://.../davet?token=... veya token"
              type="text"
            />
          </div>
          <button
            type="submit"
            disabled={connecting || !inviteLink.trim()}
            className="whitespace-nowrap inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: connecting
                ? "#94a3b8"
                : "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
            }}
          >
            {connecting ? "Bağlanıyor..." : "Bağlan"}
            {!connecting && <ArrowRight size={14} strokeWidth={2.5} />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
