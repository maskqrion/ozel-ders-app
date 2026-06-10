"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { m } from "framer-motion";
import toast from "react-hot-toast";
import { createInvitation } from "@/app/actions/invitations";
import type { Assignment, UserProfile } from "@/lib/types";
import { XP_PER_LEVEL } from "@/lib/constants";
import { useProfile } from "@/lib/hooks/useProfile";
import OgrenciDegerlendirmeleri from "@/components/dashboard/hoca/OgrenciDegerlendirmeleri";

const OdevDurumGrafigi = dynamic(() => import("./OdevDurumGrafigi"), {
  ssr: false,
  loading: () => <div className="h-[240px] animate-pulse rounded-xl bg-slate-100" />,
});

/* ── Inline SVG icons ─────────────────────────────────────────────── */
type IP = { size?: number; className?: string; strokeWidth?: number };
const Ic = ({ size = 16, className = "", sw = 2, children }: { size?: number; className?: string; sw?: number; children: React.ReactNode }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children}
  </svg>
);
const Trophy     = ({ size = 16, className = "", strokeWidth = 2 }: IP) => <Ic size={size} className={className} sw={strokeWidth}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></Ic>;
const Zap        = ({ size = 16, className = "", strokeWidth = 2 }: IP) => <Ic size={size} className={className} sw={strokeWidth}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Ic>;
const Sparkles   = ({ size = 16, className = "", strokeWidth = 2 }: IP) => <Ic size={size} className={className} sw={strokeWidth}><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></Ic>;
const Users      = ({ size = 16, className = "", strokeWidth = 2 }: IP) => <Ic size={size} className={className} sw={strokeWidth}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ic>;
const BookOpen   = ({ size = 16, className = "", strokeWidth = 2 }: IP) => <Ic size={size} className={className} sw={strokeWidth}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></Ic>;
const TrendingUp = ({ size = 16, className = "", strokeWidth = 2 }: IP) => <Ic size={size} className={className} sw={strokeWidth}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></Ic>;
const Link2      = ({ size = 16, className = "", strokeWidth = 2 }: IP) => <Ic size={size} className={className} sw={strokeWidth}><path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="11" y1="12" x2="13" y2="12"/></Ic>;
const Copy       = ({ size = 16, className = "", strokeWidth = 2 }: IP) => <Ic size={size} className={className} sw={strokeWidth}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></Ic>;

/* ── Stat card ───────────────────────────────────────────────────── */
type Tone = "emerald" | "sky" | "amber";
const TONE_CLS: Record<Tone, { icon: string; value: string; border: string }> = {
  emerald: { icon: "bg-emerald-50 text-emerald-600", value: "text-emerald-700", border: "border-emerald-100" },
  sky:     { icon: "bg-sky-50 text-sky-600",         value: "text-sky-700",     border: "border-sky-100"     },
  amber:   { icon: "bg-amber-50 text-amber-600",     value: "text-amber-700",   border: "border-amber-100"   },
};

function StatCard({
  icon: Icon, tone, label, value, hint, delay = 0, className = "",
}: {
  icon: (p: IP) => React.ReactElement;
  tone: Tone; label: string; value: string | number; hint?: string;
  delay?: number; className?: string;
}) {
  const cls = TONE_CLS[tone];
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: delay / 1000 }}
      className={`rounded-2xl border bg-white p-5 ${cls.border} ${className}`}
    >
      <div className={`h-10 w-10 rounded-xl ${cls.icon} grid place-items-center mb-3`}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">{label}</div>
      <div className={`mt-1 text-3xl font-extrabold tracking-tight ${cls.value}`}>{value}</div>
      {hint && <div className="mt-1.5 text-xs text-slate-500">{hint}</div>}
    </m.div>
  );
}

/* ── Props ───────────────────────────────────────────────────────── */
type Props = { ogrenciler: UserProfile[]; odevler: Assignment[]; hocaId: string };

/* ── Component ───────────────────────────────────────────────────── */
export default function GenelOzet({ ogrenciler, odevler, hocaId }: Props) {
  const { data: profile } = useProfile();
  const level     = profile?.level ?? 1;
  const xp        = profile?.xp ?? 0;
  const firstName = profile?.full_name?.split(" ")[0] ?? null;

  /* Davet state */
  const [inviteLink,    setInviteLink]    = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const generateLink = async () => {
    setInviteLoading(true);
    try {
      const result = await createInvitation();
      if (!result.ok) { toast.error(result.error); return; }
      const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      setInviteLink(`${base}/davet?token=${result.token}`);
    } finally {
      setInviteLoading(false);
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    toast.success("Davet linki kopyalandı!");
  };

  /* Stats */
  const ozet = useMemo(() => ({
    toplamOgrenci: ogrenciler.length,
    bekleyen:      odevler.filter(o => o.status === "verildi").length,
    tamamlanan:    odevler.filter(o => o.status === "yapildi").length,
  }), [ogrenciler, odevler]);

  const odevGrafigi = useMemo(() => {
    const s = { verildi: 0, yapildi: 0, reddedildi: 0 };
    for (const o of odevler) {
      if      (o.status === "verildi")    s.verildi++;
      else if (o.status === "yapildi")    s.yapildi++;
      else if (o.status === "reddedildi") s.reddedildi++;
    }
    return [
      { durum: "Bekliyor",   adet: s.verildi,    fill: "#f59e0b" },
      { durum: "Yapıldı",    adet: s.yapildi,    fill: "#10b981" },
      { durum: "Reddedildi", adet: s.reddedildi, fill: "#ef4444" },
    ];
  }, [odevler]);

  /* XP */
  const xpInLevel   = xp % XP_PER_LEVEL;
  const xpRemaining = XP_PER_LEVEL - xpInLevel;
  const xpPct       = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
  const today       = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

      {/* ── Hero card (dark) ─────────────────── lg:col-span-8 */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="lg:col-span-8 relative rounded-2xl overflow-hidden p-6 sm:p-8 text-white"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0c2340 100%)" }}
      >
        {/* dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          aria-hidden
        />

        <div className="relative flex flex-col gap-5">
          {/* Online badge + date */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs bg-white/10 border border-white/20 text-white/80 font-semibold px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Çevrimiçi
            </span>
            <span className="text-xs text-white/40 capitalize">{today}</span>
          </div>

          {/* Greeting */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
              {firstName
                ? <>Tekrar hoş geldin, <span className="text-emerald-400">{firstName}</span>.</>
                : "Tekrar hoş geldiniz."}
            </h1>
            <p className="mt-1.5 text-sm text-white/55 leading-relaxed">
              Bir sonraki seviye için{" "}
              <span className="text-emerald-400 font-bold">{xpRemaining.toLocaleString("tr-TR")} XP</span> daha gerekiyor.
              {ozet.bekleyen > 0 && (
                <> · <span className="text-amber-400 font-bold">{ozet.bekleyen} ödev</span> değerlendirme bekliyor.</>
              )}
            </p>
          </div>

          {/* XP progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 font-bold px-2.5 py-1 rounded-full">
                <Trophy size={11} strokeWidth={2.5} className="text-amber-400" />
                Level {level}
              </span>
              <span className="text-white/50 font-semibold">
                <span className="text-emerald-400 font-extrabold">{xpInLevel.toLocaleString("tr-TR")}</span>
                {" / "}{XP_PER_LEVEL.toLocaleString("tr-TR")} XP
              </span>
            </div>
            <div className="relative h-2.5 rounded-full bg-white/10 overflow-hidden">
              <m.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="relative h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #38bdf8 0%, #10b981 100%)" }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-4 w-4 rounded-full bg-white/20 border border-white/30 grid place-items-center">
                  <Zap size={8} strokeWidth={3} className="text-emerald-300" />
                </div>
              </m.div>
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-white/35 font-semibold">
              <span>Lv {level}</span>
              <span>%{xpPct} tamamlandı</span>
              <span>Lv {level + 1}</span>
            </div>
          </div>
        </div>

        {/* Floating XP chip */}
        <div className="absolute top-6 right-6 hidden sm:flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2 backdrop-blur-sm">
          <Sparkles size={13} strokeWidth={2} className="text-sky-400" />
          <div className="text-xs leading-tight">
            <div className="text-white/40">Toplam XP</div>
            <div className="font-extrabold text-white">{xp.toLocaleString("tr-TR")}</div>
          </div>
        </div>
      </m.div>

      {/* ── Davet card ───────────────────────── lg:col-span-4 */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
        className="lg:col-span-4 rounded-2xl border border-blue-100 bg-white p-6 flex flex-col gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full">
            <Link2 size={11} strokeWidth={2.5} />
            Öğrenci Davet Et
          </div>
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            Davet linki tek kullanımlık ve 7 gün geçerlidir.
          </p>
        </div>

        {!inviteLink ? (
          <button
            onClick={generateLink}
            disabled={inviteLoading}
            className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {inviteLoading
              ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              : <Link2 size={15} strokeWidth={2.5} />}
            Davet Linki Oluştur
          </button>
        ) : (
          <div className="mt-auto space-y-2">
            <input
              readOnly
              value={inviteLink}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-600 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
              >
                <Copy size={13} strokeWidth={2.5} /> Kopyala
              </button>
              <button
                onClick={() => { setInviteLink(null); generateLink(); }}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Yeni Link
              </button>
            </div>
          </div>
        )}
      </m.div>

      {/* ── Stat cards ──────────────── 3 × lg:col-span-4 */}
      <StatCard
        icon={Users} tone="emerald" label="Aktif Öğrenciler" value={ozet.toplamOgrenci}
        hint={ozet.toplamOgrenci === 0 ? "Henüz öğrenci yok" : `${ozet.toplamOgrenci} kayıtlı öğrenci`}
        delay={80} className="lg:col-span-4"
      />
      <StatCard
        icon={BookOpen} tone="amber" label="Bekleyen Ödevler" value={ozet.bekleyen}
        hint={ozet.bekleyen > 0 ? "Değerlendirme bekliyor" : "Tüm ödevler tamam"}
        delay={160} className="lg:col-span-4"
      />
      <StatCard
        icon={TrendingUp} tone="sky" label="Tamamlanan Ödevler" value={ozet.tamamlanan}
        hint={`Toplam ${ozet.bekleyen + ozet.tamamlanan} ödev`}
        delay={240} className="lg:col-span-4"
      />

      {/* ── Chart ────────────────────────────── lg:col-span-5 */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.38 }}
        className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <h3 className="text-base font-extrabold text-slate-900 mb-0.5">Ödev Dağılımı</h3>
        <p className="text-xs text-slate-500 mb-4">Durum bazlı özet</p>
        <div className="w-full h-[240px]">
          <OdevDurumGrafigi data={odevGrafigi} />
        </div>
      </m.div>

      {/* ── Reviews ──────────────────────────── lg:col-span-7 */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.44 }}
        className="lg:col-span-7"
      >
        <OgrenciDegerlendirmeleri hocaId={hocaId} />
      </m.div>
    </div>
  );
}
