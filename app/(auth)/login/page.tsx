'use client';

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/utils/errorHandler";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { useRouter } from "next/navigation";

type Role = "ogrenci" | "hoca";


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
const TrendingUp = (p: IconProps) => (
  <IconBase {...p}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </IconBase>
);
const ArrowLeft = (p: IconProps) => (
  <IconBase {...p}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
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
    <path d="M20 3v4" /><path d="M22 5h-4" />
    <path d="M4 17v2" /><path d="M5 18H3" />
  </IconBase>
);
const Check = (p: IconProps) => (
  <IconBase {...p}><path d="M20 6 9 17l-5-5" /></IconBase>
);
const Star = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
  </IconBase>
);
const Quote = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
  </IconBase>
);
const User = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="8" r="5" />
    <path d="M20 21a8 8 0 0 0-16 0" />
  </IconBase>
);
const Mail = (p: IconProps) => (
  <IconBase {...p}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </IconBase>
);
const Lock = (p: IconProps) => (
  <IconBase {...p}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </IconBase>
);
const Eye = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </IconBase>
);
const EyeOff = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
    <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
    <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
    <path d="m2 2 20 20" />
  </IconBase>
);
const ShieldCheck = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </IconBase>
);

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/* ============================================================
   LOGO
   ============================================================ */
function AuthLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="h-9 w-9 rounded-xl grid place-items-center text-white shadow-[0_8px_24px_-12px_rgba(16,185,129,.5)]"
        style={{ background: "linear-gradient(180deg, #10b981 0%, #059669 100%)" }}
      >
        <GraduationCap size={20} strokeWidth={2.2} />
      </div>
      <div className="leading-tight">
        <div className="text-[17px] font-extrabold tracking-tight text-slate-900">
          Özel Ders<span className="text-emerald-600">.</span>Pro
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold -mt-0.5">
          Uzmanından eğitim
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FLOATING BADGE (framer-motion float)
   ============================================================ */
function FloatingBadge({
  delay = 0,
  rotate = 4,
  children,
  className = "",
}: {
  delay?: number;
  rotate?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={`absolute ${className}`}
      style={{ rotate }}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_8px_32px_-8px_rgba(15,23,42,.14)] px-4 py-3 border border-white/80">
        {children}
      </div>
    </motion.div>
  );
}

/* ============================================================
   AURORA ARKA PLAN
   ============================================================ */
function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Blob 1 – Emerald, sağ-üst */}
      <motion.div
        style={{
          position: "absolute",
          width: "72%",
          height: "72%",
          top: "-18%",
          right: "-8%",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(16,185,129,0.26) 0%, rgba(16,185,129,0.10) 42%, transparent 70%)",
          filter: "blur(40px)",
        }}
        animate={{ x: [0, 28, -18, 0], y: [0, -22, 14, 0], scale: [1, 1.10, 0.97, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Blob 2 – Sky, sol-alt */}
      <motion.div
        style={{
          position: "absolute",
          width: "62%",
          height: "62%",
          bottom: "-12%",
          left: "-14%",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(14,165,233,0.20) 0%, rgba(14,165,233,0.07) 42%, transparent 70%)",
          filter: "blur(36px)",
        }}
        animate={{ x: [0, -22, 16, 0], y: [0, 18, -10, 0], scale: [1, 1.07, 0.95, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
      {/* Blob 3 – Violet, merkez */}
      <motion.div
        style={{
          position: "absolute",
          width: "48%",
          height: "48%",
          top: "32%",
          left: "24%",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(139,92,246,0.13) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)",
          filter: "blur(32px)",
        }}
        animate={{ x: [0, 18, -14, 0], y: [0, -16, 20, 0], scale: [1, 1.14, 0.93, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 9 }}
      />
    </div>
  );
}

/* ============================================================
   LEFT PANEL
   ============================================================ */
function LeftPanel({ isLogin }: { isLogin: boolean }) {
  const bullets = [
    "Doğrulanmış 4.000+ eğitmen",
    "İlk tanışma görüşmesi ücretsiz",
    "Ödev & gelişim takibi tek panelde",
  ];

  return (
    <div
      className="relative h-full overflow-hidden flex flex-col"
      style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #f8fafc 50%, #f0f9ff 100%)" }}
    >
      {/* Aurora animasyonlu gradyan blob'lar */}
      <AuroraBackground />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,.04) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(15,23,42,.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />

      {/* Floating badges */}
      <FloatingBadge delay={0} rotate={4} className="top-24 right-10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center">
            <BadgeCheck size={18} strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Doğrulanmış</div>
            <div className="text-sm font-bold text-slate-900">4.218 eğitmen</div>
          </div>
        </div>
      </FloatingBadge>

      <FloatingBadge delay={1.2} rotate={-3} className="bottom-28 right-16">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-sky-100 text-sky-600 grid place-items-center">
            <TrendingUp size={18} strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Bu hafta</div>
            <div className="text-sm font-bold text-slate-900">+18% gelişim</div>
          </div>
        </div>
      </FloatingBadge>

      <FloatingBadge delay={0.6} rotate={-6} className="top-1/2 -translate-y-1/2 left-8 hidden xl:block">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {(["oklch(0.84 0.05 220)", "oklch(0.82 0.04 145)", "oklch(0.86 0.04 60)"] as const).map(
              (bg, i) => (
                <div
                  key={i}
                  className="h-7 w-7 rounded-full border-2 border-white grid place-items-center text-[10px] font-bold text-slate-700"
                  style={{ background: bg }}
                >
                  {["MK", "AY", "ED"][i]}
                </div>
              )
            )}
          </div>
          <div className="text-xs">
            <div className="font-bold text-slate-900">12.480 öğrenci</div>
            <div className="text-slate-500">bu hafta katıldı</div>
          </div>
        </div>
      </FloatingBadge>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-10 lg:p-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition w-fit"
        >
          <ArrowLeft size={16} strokeWidth={2.4} />
          Ana sayfaya dön
        </Link>

        <div className="flex-1 flex flex-col justify-center max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login-left" : "signup-left"}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-white/60 rounded-full pl-1.5 pr-3.5 py-1 w-fit shadow-[0_4px_16px_-4px_rgba(15,23,42,.08)]">
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  <Sparkles size={11} strokeWidth={2.5} />
                  {isLogin ? "Tekrar Hoş Geldin" : "Topluluğa Katıl"}
                </span>
                <span className="text-xs font-medium text-slate-600">
                  Türkiye&apos;nin doğrulanmış özel ders platformu
                </span>
              </div>

              <h1 className="mt-6 text-5xl lg:text-[58px] leading-[1.02] font-extrabold tracking-tight text-slate-900">
                {isLogin ? (
                  <>
                    Hoş geldin,
                    <br />
                    <span className="italic font-semibold text-emerald-700">öğrenmeye</span>
                    <span className="text-slate-900"> devam.</span>
                  </>
                ) : (
                  <>
                    Hayalindeki
                    <br />
                    <span className="italic font-semibold text-sky-700">eğitimi</span>
                    <span className="text-slate-900"> bul.</span>
                  </>
                )}
              </h1>

              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-md">
                {isLogin
                  ? "Hocan, ödevlerin, takvimin ve gelişim raporun seni bekliyor. Kaldığın yerden devam et."
                  : "Birkaç dakika içinde profilini oluştur, sana en uygun hocayı seç ve bu hafta ilk dersine başla."}
              </p>
            </motion.div>
          </AnimatePresence>

          <ul className="mt-8 space-y-3">
            {bullets.map((b, i) => (
              <motion.li
                key={b}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.3 }}
                className="flex items-center gap-3 text-slate-700"
              >
                <span className="h-6 w-6 rounded-full bg-white/90 border border-emerald-100 grid place-items-center text-emerald-600 shadow-sm shrink-0">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className="text-sm font-medium">{b}</span>
              </motion.li>
            ))}
          </ul>

          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="mt-10 bg-white/85 backdrop-blur-sm border border-white/70 rounded-2xl p-5 shadow-[0_4px_24px_-8px_rgba(15,23,42,.10)] max-w-md"
          >
            <Quote size={20} className="text-emerald-500" />
            <p className="mt-2 text-sm text-slate-700 leading-relaxed">
              &ldquo;İki ayda Matematik netim ikiye katlandı. Hocamla ders dışında bile mesajlaşabilmek
              en büyük artı. Özel Ders Pro olmasa bu mümkün değildi.&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-full grid place-items-center text-[11px] font-bold text-slate-700 shrink-0"
                style={{ background: "oklch(0.84 0.05 220)" }}
              >
                ZS
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900">Zeynep S.</div>
                <div className="text-xs text-slate-500">YKS 2025 Adayı · İstanbul</div>
              </div>
              <div className="ml-auto flex items-center gap-0.5 shrink-0">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="text-xs text-slate-400">
          © {new Date().getFullYear()} Özel Ders Pro · Türkiye
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FIELD
   ============================================================ */
type FieldProps = {
  label: string;
  id: string;
  icon?: (p: IconProps) => React.JSX.Element;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  registration?: Record<string, unknown>;
  placeholder?: string;
  error?: string;
  hint?: string;
  autoComplete?: string;
  required?: boolean;
  right?: React.ReactNode;
};

function Field({
  label,
  id,
  icon: Icon,
  type = "text",
  value,
  onChange,
  registration,
  placeholder,
  error,
  hint,
  autoComplete,
  required,
  right,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-semibold text-slate-700 mb-1.5">
        {label}
      </label>
      <div
        className={`flex items-center gap-2.5 bg-white border rounded-xl px-3.5 py-3 transition-[border-color,box-shadow] duration-200 ${
          error
            ? "border-rose-300 shadow-[0_0_0_3px_rgba(239,68,68,.10)]"
            : "border-slate-200 hover:border-slate-300 focus-within:border-emerald-400 focus-within:shadow-[0_0_0_3px_rgba(16,185,129,.12),0_0_20px_rgba(16,185,129,.16)]"
        }`}
      >
        {Icon && <Icon size={17} className="text-slate-400 shrink-0" />}
        <input
          {...(registration as React.InputHTMLAttributes<HTMLInputElement>)}
          id={id}
          type={type}
          {...(!registration && { value, onChange })}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="bg-transparent outline-none text-sm flex-1 placeholder:text-slate-400 text-slate-900 min-w-0"
        />
        {right}
      </div>
      {error ? (
        <p className="mt-1 text-red-500 text-sm">{error}</p>
      ) : hint ? (
        <div className="mt-1.5 text-[12px] text-slate-500">{hint}</div>
      ) : null}
    </div>
  );
}

/* ============================================================
   TABS
   ============================================================ */
function Tabs({
  isLogin,
  onSwitch,
}: {
  isLogin: boolean;
  onSwitch: (login: boolean) => void;
}) {
  return (
    <div className="relative inline-flex p-1 bg-slate-100 rounded-xl">
      <motion.div
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm"
        animate={{ left: isLogin ? 4 : "calc(50%)" }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        aria-hidden="true"
      />
      {[
        { id: true, label: "Giriş Yap" },
        { id: false, label: "Kayıt Ol" },
      ].map((t) => (
        <button
          key={String(t.id)}
          type="button"
          onClick={() => onSwitch(t.id)}
          className={`relative z-10 px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${
            isLogin === t.id ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   PAGE
   ============================================================ */
export default function LoginPage() {
  /* --- form --- */
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  /* --- existing auth state --- */
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<Role>("ogrenci");

  /* --- new UI state --- */
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState("");
  const [accept, setAccept] = useState(false);
  const [remember, setRemember] = useState(true);

  const router = useRouter();

  const switchMode = (next: boolean) => {
    setIsLogin(next);
  };

  /* --- Supabase auth logic --- */
  const handleAuth = async ({ email, password }: LoginFormValues) => {
    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (userError) throw userError;

        toast.success("Giriş başarılı, yönlendiriliyorsunuz...");

        if (userData.role === "hoca") {
          router.push("/hoca");
        } else {
          router.push("/ogrenci");
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: role,
              full_name: name.trim() || null,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          toast.success("Kayıt başarılı! Şimdi giriş yapabilirsin.");
          setIsLogin(true);
          reset();
          setName("");
        }
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  const canSubmit = isLogin ? !isSubmitting : !!name.trim() && accept && !isSubmitting;

  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Logo: only on lg (left panel handles mobile) */}
      <div className="hidden lg:block absolute top-6 left-8 z-20">
        <AuthLogo />
      </div>

      <div className="min-h-screen grid lg:grid-cols-2">
        {/* LEFT PANEL — desktop only */}
        <div className="hidden lg:block">
          <LeftPanel isLogin={isLogin} />
        </div>

        {/* RIGHT PANEL — form */}
        <div className="relative bg-white flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 lg:px-10 pt-6">
            <div className="lg:hidden">
              <AuthLogo />
            </div>
            <div className="ml-auto text-xs text-slate-500">
              {isLogin ? "Hesabın yok mu?" : "Zaten hesabın var mı?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(!isLogin)}
                className="font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                {isLogin ? "Kayıt ol" : "Giriş yap"}
              </button>
            </div>
          </div>

          {/* Form area */}
          <div className="flex-1 flex items-center justify-center px-6 lg:px-10 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? "login-form" : "signup-form"}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full max-w-md"
              >
                {/* Tabs */}
                <Tabs isLogin={isLogin} onSwitch={switchMode} />

                {/* Heading */}
                <div className="mt-7">
                  <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                    {isLogin ? "Hesabına giriş yap" : "Yeni hesap oluştur"}
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-500">
                    {isLogin
                      ? "E-posta ve şifrenle devam et."
                      : "Birkaç saniye sürer — kredi kartı istenmez."}
                  </p>
                </div>

                {/* Google */}
                <button
                  type="button"
                  className="mt-7 w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition"
                  onClick={() => toast("Google ile giriş yakında aktif olacak.", { icon: "🔜" })}
                >
                  <GoogleIcon size={18} />
                  Google ile {isLogin ? "giriş yap" : "devam et"}
                </button>

                {/* Divider */}
                <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] font-bold text-slate-400">
                  <span className="flex-1 h-px bg-slate-200" />
                  veya e-posta ile
                  <span className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(handleAuth)} className="space-y-4">
                  {/* Name — signup only */}
                  {!isLogin && (
                    <Field
                      id="name"
                      label="Ad Soyad"
                      icon={User}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ayşe Yıldız"
                      autoComplete="name"
                      required
                    />
                  )}

                  <Field
                    id="email"
                    label="E-posta"
                    icon={Mail}
                    type="email"
                    registration={register("email")}
                    placeholder="seninadin@email.com"
                    autoComplete="email"
                    error={errors.email?.message}
                  />

                  <Field
                    id="password"
                    label={isLogin ? "Şifre" : "Şifre oluştur"}
                    icon={Lock}
                    type={showPw ? "text" : "password"}
                    registration={register("password")}
                    placeholder={isLogin ? "••••••••" : "En az 6 karakter"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    error={errors.password?.message}
                    right={
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        aria-label={showPw ? "Şifreyi gizle" : "Şifreyi göster"}
                        className="text-slate-400 hover:text-slate-600 shrink-0 transition-colors"
                      >
                        {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    }
                  />

                  {/* Role selector — signup */}
                  {!isLogin && (
                    <div>
                      <span className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                        Hesap türü
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            { id: "ogrenci" as Role, label: "Öğrenci / Veli", tone: "emerald" },
                            { id: "hoca" as Role, label: "Eğitmen", tone: "sky" },
                          ] as const
                        ).map((r) => {
                          const active = role === r.id;
                          const activeClass =
                            r.tone === "emerald"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                              : "border-sky-300 bg-sky-50 text-sky-800";
                          const dotActive =
                            r.tone === "emerald"
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-sky-500 bg-sky-500";
                          return (
                            <button
                              type="button"
                              key={r.id}
                              onClick={() => setRole(r.id)}
                              className={`flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl border text-sm font-semibold transition ${
                                active
                                  ? activeClass
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <span>{r.label}</span>
                              <span
                                className={`h-4 w-4 rounded-full border-2 grid place-items-center transition ${
                                  active ? dotActive : "border-slate-300"
                                }`}
                              >
                                {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Remember / Forgot / Accept */}
                  {isLogin ? (
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="peer sr-only"
                        />
                        <span className="h-4 w-4 rounded-md border border-slate-300 bg-white grid place-items-center peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition">
                          {remember && <Check size={11} strokeWidth={3} className="text-white" />}
                        </span>
                        <span className="text-sm text-slate-600">Beni hatırla</span>
                      </label>
                      <Link
                        href="/sifremi-unuttum"
                        className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                      >
                        Şifremi unuttum
                      </Link>
                    </div>
                  ) : (
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={accept}
                        onChange={(e) => setAccept(e.target.checked)}
                        className="peer sr-only"
                      />
                      <span className="h-4 w-4 mt-0.5 rounded-md border border-slate-300 bg-white grid place-items-center peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition shrink-0">
                        {accept && <Check size={11} strokeWidth={3} className="text-white" />}
                      </span>
                      <span className="text-[13px] text-slate-600 leading-relaxed">
                        <a href="#" className="font-semibold text-slate-800 hover:underline">
                          Kullanım Şartları
                        </a>{" "}
                        ve{" "}
                        <a href="#" className="font-semibold text-slate-800 hover:underline">
                          Gizlilik Politikası
                        </a>
                        &apos;nı okudum, kabul ediyorum.
                      </span>
                    </label>
                  )}

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={!canSubmit}
                    whileTap={canSubmit ? { scale: 0.98 } : {}}
                    className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-base font-bold text-white rounded-xl transition ${
                      canSubmit
                        ? "shadow-[0_8px_24px_-8px_rgba(16,185,129,.5)] hover:-translate-y-px hover:shadow-[0_12px_28px_-8px_rgba(16,185,129,.55)]"
                        : "cursor-not-allowed opacity-60"
                    }`}
                    style={
                      canSubmit
                        ? { background: "linear-gradient(180deg, #10b981 0%, #059669 100%)" }
                        : { background: "#cbd5e1", color: "#94a3b8" }
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <motion.span
                          aria-hidden
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                        />
                        {isLogin ? "Giriş Yapılıyor..." : "Hesap Oluşturuluyor..."}
                      </>
                    ) : (
                      <>
                        {isLogin ? "Giriş Yap" : "Hesap Oluştur"}
                        <ArrowRight size={16} strokeWidth={2.5} />
                      </>
                    )}
                  </motion.button>

                  {/* SSL footnote */}
                  <div className="text-center text-xs text-slate-400 pt-1">
                    <ShieldCheck size={12} strokeWidth={2.5} className="inline -mt-0.5 mr-1 text-emerald-500" />
                    256-bit SSL ile şifrelenmiş bağlantı
                  </div>
                </form>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
