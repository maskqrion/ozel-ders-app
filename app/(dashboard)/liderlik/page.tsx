"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { XP_PER_LEVEL } from "@/lib/constants";

/* ── Types ──────────────────────────────────────────────────── */
interface LeaderEntry {
  id: string;
  full_name: string | null;
  level: number;
  xp: number;
  avatar_url: string | null;
  role: "hoca" | "ogrenci";
}

/* ── Helpers ─────────────────────────────────────────────────  */
function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function fmtXP(n: number): string {
  return n.toLocaleString("tr-TR");
}

function xpPct(xp: number): number {
  return Math.min(100, ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);
}

/* ── Medal palette ───────────────────────────────────────────── */
const MEDAL = {
  1: {
    emoji: "🥇",
    label: "Altın",
    cardGrad: "bg-gradient-to-b from-amber-50 to-white",
    border: "border-amber-200",
    shadow: "shadow-amber-100",
    badgeGrad: "from-amber-400 to-yellow-300",
    badgeShadow: "shadow-amber-300/50",
    plinthGrad: "from-amber-400 to-yellow-300",
    plinthH: "h-20",
    avatarRing: "ring-2 ring-amber-400 ring-offset-2",
    rankText: "text-amber-600",
    nameSize: "text-base font-bold",
    avatarSize: "h-16 w-16",
    avatarText: "text-base",
    elevated: true,
  },
  2: {
    emoji: "🥈",
    label: "Gümüş",
    cardGrad: "bg-gradient-to-b from-slate-50 to-white",
    border: "border-slate-200",
    shadow: "shadow-slate-100",
    badgeGrad: "from-slate-400 to-slate-300",
    badgeShadow: "shadow-slate-300/50",
    plinthGrad: "from-slate-400 to-slate-300",
    plinthH: "h-14",
    avatarRing: "ring-2 ring-slate-300 ring-offset-2",
    rankText: "text-slate-500",
    nameSize: "text-sm font-bold",
    avatarSize: "h-12 w-12",
    avatarText: "text-sm",
    elevated: false,
  },
  3: {
    emoji: "🥉",
    label: "Bronz",
    cardGrad: "bg-gradient-to-b from-orange-50 to-white",
    border: "border-orange-200",
    shadow: "shadow-orange-100",
    badgeGrad: "from-orange-400 to-amber-300",
    badgeShadow: "shadow-orange-300/50",
    plinthGrad: "from-orange-400 to-amber-300",
    plinthH: "h-10",
    avatarRing: "ring-2 ring-orange-300 ring-offset-2",
    rankText: "text-orange-600",
    nameSize: "text-sm font-bold",
    avatarSize: "h-12 w-12",
    avatarText: "text-sm",
    elevated: false,
  },
} as const;

/* ── Avatar ──────────────────────────────────────────────────── */
const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

function Avatar({
  entry,
  sizeClass,
  textClass,
  ringClass,
  px = 48,
}: {
  entry: LeaderEntry;
  sizeClass: string;
  textClass: string;
  ringClass: string;
  px?: number;
}) {
  const color = AVATAR_COLORS[entry.id.charCodeAt(0) % AVATAR_COLORS.length];
  if (entry.avatar_url) {
    return (
      <Image
        src={entry.avatar_url}
        alt={entry.full_name ?? "Kullanıcı"}
        width={px}
        height={px}
        className={`${sizeClass} rounded-full object-cover ${ringClass}`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} ${color} ${ringClass} flex items-center justify-center rounded-full font-bold ${textClass}`}
    >
      {initials(entry.full_name)}
    </div>
  );
}

/* ── Icons ───────────────────────────────────────────────────── */
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

const TrophyIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </IconBase>
);
const ArrowLeftIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </IconBase>
);
const StarIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path
      fill="currentColor"
      stroke="none"
      d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
    />
  </IconBase>
);
const ZapIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
  </IconBase>
);
const UsersIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </IconBase>
);

/* ── Podium Card ─────────────────────────────────────────────── */
function PodiumCard({
  rank,
  entry,
  delay,
}: {
  rank: 1 | 2 | 3;
  entry: LeaderEntry | undefined;
  delay: number;
}) {
  const medal = MEDAL[rank];

  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col items-center ${rank === 1 ? "z-10" : ""}`}
    >
      {/* Card */}
      <div
        className={`w-full rounded-2xl border ${medal.border} ${medal.cardGrad} shadow-lg ${medal.shadow} p-4 flex flex-col items-center gap-2 ${
          rank === 1 ? "pb-6 pt-5" : "py-4"
        }`}
      >
        {/* Medal emoji */}
        <span className={rank === 1 ? "text-3xl" : "text-2xl"} aria-label={medal.label}>
          {medal.emoji}
        </span>

        {/* Avatar */}
        <Avatar
          entry={entry ?? ({ id: "x", full_name: null, level: 0, xp: 0, avatar_url: null, role: "ogrenci" } as LeaderEntry)}
          sizeClass={medal.avatarSize}
          textClass={medal.avatarText}
          ringClass={entry ? medal.avatarRing : ""}
          px={rank === 1 ? 64 : 48}
        />

        {/* Name */}
        <p className={`text-center text-slate-800 ${medal.nameSize} leading-tight max-w-[110px] truncate`}>
          {entry?.full_name ?? "—"}
        </p>

        {/* Level badge */}
        {entry && (
          <span
            className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${medal.badgeGrad} px-2.5 py-0.5 text-xs font-bold text-white shadow-sm ${medal.badgeShadow}`}
          >
            <StarIcon size={10} className="text-white" />
            Lv {entry.level}
          </span>
        )}

        {/* XP */}
        {entry && (
          <p className={`text-xs font-semibold ${medal.rankText}`}>
            {fmtXP(entry.xp)} XP
          </p>
        )}
      </div>

      {/* Plinth */}
      <div
        className={`w-full rounded-b-xl bg-gradient-to-b ${medal.plinthGrad} ${medal.plinthH} opacity-80`}
      />
    </m.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function LiderlikPage() {
  const router = useRouter();
  const [userId,    setUserId]    = useState<string | null>(null);
  const [userRole,  setUserRole]  = useState<"hoca" | "ogrenci" | null>(null);
  const [entries,   setEntries]   = useState<LeaderEntry[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          await supabase.auth.signOut();
          return router.push("/login");
        }
        setUserId(user.id);

        const { data: roleRow } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        if (roleRow) setUserRole(roleRow.role as "hoca" | "ogrenci");

        const { data } = await supabase
          .from("users")
          .select("id, full_name, level, xp, avatar_url, role")
          .order("xp", { ascending: false })
          .limit(50);

        if (data) setEntries(data as LeaderEntry[]);
      } catch (err: unknown) {
        console.error(err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  const podium = entries.slice(0, 3);
  const rest   = entries.slice(3);
  const currentRank = entries.findIndex((e) => e.id === userId) + 1;

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-amber-50 font-medium text-amber-600">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans text-slate-800">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-100 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href={userRole === "hoca" ? "/hoca" : "/ogrenci"}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-amber-600"
          >
            <ArrowLeftIcon size={16} strokeWidth={2} />
            <span className="hidden sm:inline">Panele Dön</span>
          </Link>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-400">
              <TrophyIcon size={14} strokeWidth={2.2} className="text-white" />
            </div>
            <span className="font-bold text-amber-600">Liderlik Tablosu</span>
          </div>
        </div>
        {currentRank > 0 && (
          <div className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 sm:flex">
            <TrophyIcon size={12} strokeWidth={2.5} />
            Sıranız: #{currentRank}
          </div>
        )}
      </nav>

      {/* ── Hero banner ── */}
      <div
        className="border-b border-amber-100"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, rgba(251,191,36,.12), transparent 70%)," +
            "linear-gradient(180deg, #fffbeb 0%, #f8fafc 100%)",
        }}
      >
        <div className="mx-auto max-w-4xl px-6 py-10 text-center">
          <m.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "backOut" }}
            className="mb-3 text-5xl"
          >
            🏆
          </m.div>
          <m.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-3xl font-extrabold tracking-tight text-slate-900 lg:text-4xl"
          >
            Liderlik Tablosu
          </m.h1>
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-slate-500"
          >
            XP kazanarak sıralamada yüksel — ödev tamamla, quiz çöz, ders al.
          </m.p>

          {/* Stats row */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-4"
          >
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 shadow-sm">
              <UsersIcon size={15} strokeWidth={2} className="text-amber-500" />
              <span className="text-sm font-semibold text-slate-700">{entries.length} katılımcı</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 shadow-sm">
              <ZapIcon size={15} strokeWidth={2} className="text-emerald-500" />
              <span className="text-sm font-semibold text-slate-700">XP bazlı sıralama</span>
            </div>
            {currentRank > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2 shadow-sm">
                <TrophyIcon size={15} strokeWidth={2} className="text-sky-500" />
                <span className="text-sm font-semibold text-slate-700">Sıranız: #{currentRank}</span>
              </div>
            )}
          </m.div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">

        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
              <TrophyIcon size={28} className="text-amber-400" />
            </div>
            <p className="font-semibold text-slate-600">Henüz veri yok</p>
            <p className="text-sm text-slate-400">XP kazanmaya başla, tabloda görün!</p>
          </div>
        ) : (
          <>
            {/* ── Podium ── */}
            {podium.length >= 1 && (
              <section className="mb-12">
                {/* Desktop podium: [2nd, 1st, 3rd] aligned at bottom */}
                <div className="hidden items-end justify-center gap-4 sm:flex">
                  {/* Silver #2 */}
                  <div className="w-40">
                    <PodiumCard rank={2} entry={podium[1]} delay={0.15} />
                  </div>
                  {/* Gold #1 — elevated via negative margin */}
                  <div className="w-44 -mb-2">
                    <PodiumCard rank={1} entry={podium[0]} delay={0} />
                  </div>
                  {/* Bronze #3 */}
                  <div className="w-40">
                    <PodiumCard rank={3} entry={podium[2]} delay={0.25} />
                  </div>
                </div>

                {/* Mobile podium: stacked 1→2→3 */}
                <div className="flex flex-col gap-3 sm:hidden">
                  {([0, 1, 2] as const).map((i) => (
                    <PodiumCard
                      key={i}
                      rank={([1, 2, 3] as const)[i]}
                      entry={podium[i]}
                      delay={i * 0.1}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── List #4+ ── */}
            {rest.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-slate-700">Diğer Sıralamalar</h2>
                  <span className="text-xs text-slate-400">{rest.length} kullanıcı</span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <AnimatePresence initial={false}>
                    {rest.map((entry, i) => {
                      const rank       = i + 4;
                      const isMe       = entry.id === userId;
                      const pct        = xpPct(entry.xp);
                      const roleLabel  = entry.role === "hoca" ? "Öğretmen" : "Öğrenci";
                      const roleCls    = entry.role === "hoca"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-sky-50 text-sky-700";

                      return (
                        <m.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
                          className={`flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 transition ${
                            isMe
                              ? "bg-amber-50 ring-1 ring-inset ring-amber-200"
                              : "hover:bg-slate-50/60"
                          }`}
                        >
                          {/* Rank */}
                          <div className="w-8 shrink-0 text-center text-sm font-bold text-slate-400">
                            {rank}
                          </div>

                          {/* Avatar */}
                          <Avatar
                            entry={entry}
                            sizeClass="h-9 w-9 shrink-0"
                            textClass="text-xs"
                            ringClass={isMe ? "ring-2 ring-amber-400 ring-offset-1" : ""}
                            px={36}
                          />

                          {/* Name + role */}
                          <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`truncate text-sm font-semibold ${isMe ? "text-amber-800" : "text-slate-800"}`}>
                                {entry.full_name ?? "Kullanıcı"}
                              </span>
                              {isMe && (
                                <span className="shrink-0 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                  Siz
                                </span>
                              )}
                            </div>
                            <span className={`inline-flex w-fit rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${roleCls}`}>
                              {roleLabel}
                            </span>
                          </div>

                          {/* Level + XP */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className="flex items-center gap-1">
                              <StarIcon size={11} className="text-amber-400" />
                              <span className="text-xs font-bold text-slate-700">
                                Lv {entry.level}
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {fmtXP(entry.xp)} XP
                            </span>
                          </div>

                          {/* Mini XP bar (desktop only) */}
                          <div className="hidden w-20 shrink-0 md:block">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <m.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: Math.min(i * 0.04, 0.4) + 0.2 }}
                                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300"
                              />
                            </div>
                          </div>
                        </m.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="mt-4 border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-5">
          <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Özel Ders Pro. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-5 text-sm text-slate-400">
              <a href="mailto:destek@ozelderspro.com" className="transition hover:text-slate-700">Yardım</a>
              <a href="/gizlilik" className="transition hover:text-slate-700">Gizlilik</a>
              <a href="/kullanim-kosullari" className="transition hover:text-slate-700">Kullanım Koşulları</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
