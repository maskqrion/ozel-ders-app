"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, m } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";

const OdevDurumGrafigi = dynamic(() => import("./OdevDurumGrafigi"), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse rounded-xl bg-slate-50" />,
});
import type { Assignment, UserProfile } from "@/lib/types";
import { XP_PER_LEVEL } from "@/lib/constants";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { useProfile } from "@/lib/hooks/useProfile";
import OgrenciDegerlendirmeleri from "@/components/dashboard/hoca/OgrenciDegerlendirmeleri";

/* ============================================================
   ICON PRIMITIVES  (lucide-react yüklü değil — inline SVG)
   ============================================================ */
type IconProps = { size?: number; className?: string; strokeWidth?: number };
const Ic = ({
  size = 16,
  className = "",
  sw = 2,
  children,
}: {
  size?: number;
  className?: string;
  sw?: number;
  children: React.ReactNode;
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
  >
    {children}
  </svg>
);

const Trophy = ({ size = 16, className = "", strokeWidth = 2 }: IconProps) => (
  <Ic size={size} className={className} sw={strokeWidth}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </Ic>
);
const Zap = ({ size = 16, className = "", strokeWidth = 2 }: IconProps) => (
  <Ic size={size} className={className} sw={strokeWidth}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </Ic>
);
const Sparkles = ({ size = 16, className = "", strokeWidth = 2 }: IconProps) => (
  <Ic size={size} className={className} sw={strokeWidth}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </Ic>
);
const Users = ({ size = 16, className = "", strokeWidth = 2 }: IconProps) => (
  <Ic size={size} className={className} sw={strokeWidth}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Ic>
);
const BookOpen = ({ size = 16, className = "", strokeWidth = 2 }: IconProps) => (
  <Ic size={size} className={className} sw={strokeWidth}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </Ic>
);
const TrendingUp = ({ size = 16, className = "", strokeWidth = 2 }: IconProps) => (
  <Ic size={size} className={className} sw={strokeWidth}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </Ic>
);
const Plus = ({ size = 16, className = "", strokeWidth = 2 }: IconProps) => (
  <Ic size={size} className={className} sw={strokeWidth}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </Ic>
);
const Copy = ({ size = 16, className = "", strokeWidth = 2 }: IconProps) => (
  <Ic size={size} className={className} sw={strokeWidth}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </Ic>
);
const Link2 = ({ size = 16, className = "", strokeWidth = 2 }: IconProps) => (
  <Ic size={size} className={className} sw={strokeWidth}>
    <path d="M9 17H7A5 5 0 0 1 7 7h2" />
    <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
    <line x1="8" x2="16" y1="12" y2="12" />
  </Ic>
);

/* ============================================================
   SPARKLINE
   ============================================================ */
function Sparkline({
  data,
  stroke = "#10b981",
  fill = "rgba(16,185,129,.12)",
}: {
  data: number[];
  stroke?: string;
  fill?: string;
}) {
  if (data.length < 2) return <div className="h-9" />;
  const W = 120,
    H = 36;
  const max = Math.max(...data),
    min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return [x, y] as [number, number];
  });
  const d = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const area = `${d} L ${W} ${H} L 0 ${H} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-9"
      preserveAspectRatio="none"
    >
      <path d={area} fill={fill} />
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={stroke} />
    </svg>
  );
}

/* ============================================================
   STAT CARD
   ============================================================ */
type Tone = "emerald" | "sky" | "amber";
const TONE: Record<Tone, { bg: string; text: string; stroke: string; fill: string }> = {
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    stroke: "#10b981",
    fill: "rgba(16,185,129,.12)",
  },
  sky: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    stroke: "#0ea5e9",
    fill: "rgba(14,165,233,.12)",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    stroke: "#f59e0b",
    fill: "rgba(245,158,11,.14)",
  },
};

const SPOTLIGHT: Record<Tone, { color: string; hoverBorder: string }> = {
  emerald: { color: "rgba(16,185,129,0.08)", hoverBorder: "rgba(16,185,129,0.25)" },
  sky:     { color: "rgba(14,165,233,0.08)", hoverBorder: "rgba(14,165,233,0.25)" },
  amber:   { color: "rgba(245,158,11,0.08)", hoverBorder: "rgba(245,158,11,0.25)" },
};

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  hint,
  data,
  delay = 0,
}: {
  icon: (p: IconProps) => React.ReactElement;
  tone: Tone;
  label: string;
  value: string | number;
  hint?: string;
  data: number[];
  delay?: number;
}) {
  const cfg = TONE[tone];
  const spot = SPOTLIGHT[tone];
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay / 1000 }}
      className="shadow-sm"
    >
      <CardSpotlight
        bg="white"
        color={spot.color}
        borderColor="#e2e8f0"
        hoverBorderColor={spot.hoverBorder}
        className="rounded-3xl p-6 flex flex-col gap-5 h-full"
      >
        <div
          className={`h-11 w-11 rounded-2xl ${cfg.bg} ${cfg.text} grid place-items-center`}
        >
          <Icon size={20} strokeWidth={2.1} />
        </div>

        <div>
          <div className="text-[12px] uppercase tracking-[0.14em] font-bold text-slate-500">
            {label}
          </div>
          <div className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </div>
          {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
        </div>

        <Sparkline data={data} stroke={cfg.stroke} fill={cfg.fill} />
      </CardSpotlight>
    </m.div>
  );
}

/* ============================================================
   PROPS
   ============================================================ */
type Props = {
  ogrenciler: UserProfile[];
  odevler: Assignment[];
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function GenelOzet({ ogrenciler, odevler }: Props) {
  const { data: profile } = useProfile();
  const hocaId = profile?.id ?? "";
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const firstName = profile?.full_name?.split(" ")[0] ?? null;
  /* ── Preserved state ── */
  const [inviteLink, setInviteLink] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  /* ── Preserved data logic ── */
  const ozet = useMemo(() => {
    const bekleyen = odevler.filter((o) => o.status === "verildi").length;
    const tamamlanan = odevler.filter((o) => o.status === "yapildi").length;
    return { toplamOgrenci: ogrenciler.length, bekleyen, tamamlanan };
  }, [ogrenciler, odevler]);

  const odevDurumGrafigi = useMemo(() => {
    const s = { verildi: 0, yapildi: 0, reddedildi: 0 };
    for (const o of odevler) {
      if (o.status === "verildi") s.verildi += 1;
      else if (o.status === "yapildi") s.yapildi += 1;
      else if (o.status === "reddedildi") s.reddedildi += 1;
    }
    return [
      { durum: "Bekliyor", adet: s.verildi, fill: "#f59e0b" },
      { durum: "Yapıldı", adet: s.yapildi, fill: "#10b981" },
      { durum: "Reddedildi", adet: s.reddedildi, fill: "#ef4444" },
    ];
  }, [odevler]);

  /* ── Preserved invite logic ── */
  const davetLinkiUret = async () => {
    setInviteLoading(true);
    try {
      const token =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const { error } = await supabase
        .from("invitations")
        .insert([{ hoca_id: hocaId, token }]);
      if (error) throw error;

      const link = `${window.location.origin}/davet?token=${token}`;
      setInviteLink(link);
      try {
        await navigator.clipboard.writeText(link);
        toast.success("Davet linki panoya kopyalandı.");
      } catch {
        toast.success("Davet linki üretildi.");
      }
    } catch (err: unknown) {
      toast.error(
        "Hata: " +
          ((err as { message?: string }).message ?? "Davet linki üretilemedi."),
      );
    } finally {
      setInviteLoading(false);
    }
  };

  const linkiKopyala = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Link kopyalandı.");
    } catch {
      toast.error("Link kopyalanamadı.");
    }
  };

  /* ── XP calculations ── */
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpRemaining = XP_PER_LEVEL - xpInLevel;
  const xpPct = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  /* ── Sparkline trend data (mock history, real current value) ── */
  const n = ozet.toplamOgrenci;
  const studentSpark = useMemo(
    () => [Math.max(0, n - 4), Math.max(0, n - 3), Math.max(0, n - 2), Math.max(0, n - 1), n],
    [n],
  );
  const b = ozet.bekleyen;
  const pendingSpark = useMemo(
    () => [Math.max(0, b + 2), Math.max(0, b + 1), b + 1, b, b],
    [b],
  );
  const t = ozet.tamamlanan;
  const doneSpark = useMemo(
    () => [Math.max(0, t - 4), Math.max(0, t - 3), Math.max(0, t - 2), Math.max(0, t - 1), t],
    [t],
  );

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════
          LEVEL HERO  — XP / greeting card
          ═══════════════════════════════════════════════════════ */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative rounded-3xl border border-emerald-100/70 p-6 sm:p-8 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #f0f9ff 100%)",
        }}
      >
        {/* Dot-grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #10b98118 1px, transparent 1px)",
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
              {firstName ? (
                <>
                  Tekrar hoş geldin,{" "}
                  <span className="italic font-semibold text-emerald-700">
                    {firstName}
                  </span>
                  .
                </>
              ) : (
                "Tekrar hoş geldiniz."
              )}
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">
              Bir sonraki seviye için{" "}
              <span className="font-bold text-emerald-700">
                {xpRemaining.toLocaleString("tr-TR")} XP
              </span>{" "}
              daha kazanman gerekiyor.
              {ozet.bekleyen > 0 && (
                <>
                  {" · "}
                  <span className="font-bold text-slate-900">
                    {ozet.bekleyen} ödev
                  </span>{" "}
                  değerlendirme bekliyor.
                </>
              )}
            </p>

            {/* XP Progress bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="inline-flex items-center gap-1.5 bg-white border border-emerald-200 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full text-[12px] shadow-sm">
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
                {/* Segment ticks */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 border-r border-slate-100 last:border-r-0"
                    />
                  ))}
                </div>
                <m.div
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
                </m.div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Lv {level}</span>
                <span>%{xpPct} tamamlandı</span>
                <span>Lv {level + 1}</span>
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
                    <Trophy
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
                    <div className="mt-1 text-[11px] font-semibold text-emerald-700">
                      Eğitmen
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating XP chip */}
              <div className="absolute -bottom-2 -left-3 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm flex items-center gap-1.5">
                <span className="h-6 w-6 rounded-lg bg-sky-100 text-sky-600 grid place-items-center">
                  <Sparkles size={12} strokeWidth={2.4} />
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
      </m.div>

      {/* ═══════════════════════════════════════════════════════
          STAT GRID  — real data from ogrenciler / odevler
          ═══════════════════════════════════════════════════════ */}
      <div className="grid sm:grid-cols-3 gap-5">
        <StatCard
          icon={Users}
          tone="emerald"
          label="Aktif Öğrenciler"
          value={ozet.toplamOgrenci}
          hint={
            ozet.toplamOgrenci === 0
              ? "Henüz öğrenci yok"
              : `${ozet.toplamOgrenci} kayıtlı öğrenci`
          }
          data={studentSpark}
          delay={80}
        />
        <StatCard
          icon={BookOpen}
          tone="amber"
          label="Bekleyen Ödevler"
          value={ozet.bekleyen}
          hint={
            ozet.bekleyen > 0
              ? "Değerlendirme bekliyor"
              : "Tüm ödevler tamam"
          }
          data={pendingSpark}
          delay={160}
        />
        <StatCard
          icon={TrendingUp}
          tone="sky"
          label="Tamamlanan Ödevler"
          value={ozet.tamamlanan}
          hint={`Toplam ${ozet.bekleyen + ozet.tamamlanan} ödev`}
          data={doneSpark}
          delay={240}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════
          DAVET KARTI  — preserved Supabase invite logic
          ═══════════════════════════════════════════════════════ */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-700 grid place-items-center shrink-0">
              <Link2 size={20} strokeWidth={2.1} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Öğrenci Daveti
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 max-w-md">
                Davet linki üretin ve öğrencinize gönderin. Yalnızca daveti
                kabul edenler panelinizde görünür.
              </p>
            </div>
          </div>
          <button
            onClick={davetLinkiUret}
            disabled={inviteLoading}
            className="whitespace-nowrap shrink-0 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-60 shadow-sm"
            style={{
              background: inviteLoading
                ? "#94a3b8"
                : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
            {inviteLoading ? "Üretiliyor..." : "Davet Linki Üret"}
          </button>
        </div>

        <AnimatePresence>
          {inviteLink && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 flex flex-col gap-2 overflow-hidden sm:flex-row"
            >
              <input
                type="text"
                readOnly
                value={inviteLink}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={linkiKopyala}
                className="whitespace-nowrap inline-flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
              >
                <Copy size={14} />
                Kopyala
              </button>
            </m.div>
          )}
        </AnimatePresence>
      </m.div>

      {/* ═══════════════════════════════════════════════════════
          TWO-COLUMN  — Ödev grafiği  +  Değerlendirmeler
          ═══════════════════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Ödev Durum Grafiği — recharts BarChart preserved */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.38 }}
          className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-extrabold tracking-tight text-slate-900 mb-0.5">
            Ödev Dağılımı
          </h3>
          <p className="text-xs text-slate-500 mb-5">Durum bazlı özet</p>
          <div className="w-full h-[300px] min-h-[300px] overflow-hidden">
            <OdevDurumGrafigi data={odevDurumGrafigi} />
          </div>
        </m.div>

        {/* Öğrenci Değerlendirmeleri — preserved component */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.44 }}
          className="lg:col-span-3"
        >
          <OgrenciDegerlendirmeleri hocaId={hocaId} />
        </m.div>
      </div>
    </div>
  );
}
