"use client";

import { m } from "framer-motion";
import { useProfile } from "@/lib/hooks/useProfile";
import { XP_PER_LEVEL } from "@/lib/constants";

export { XP_PER_LEVEL };

type Accent = "amber" | "emerald";

const accentMap: Record<
  Accent,
  {
    track: string;
    barFrom: string;
    barTo: string;
    levelText: string;
    label: string;
    ring: string;
  }
> = {
  amber: {
    track: "bg-amber-50",
    barFrom: "from-amber-400",
    barTo: "to-orange-300",
    levelText: "text-amber-700",
    label: "text-amber-700",
    ring: "ring-amber-100",
  },
  emerald: {
    track: "bg-emerald-50",
    barFrom: "from-emerald-400",
    barTo: "to-teal-300",
    levelText: "text-emerald-700",
    label: "text-emerald-700",
    ring: "ring-emerald-100",
  },
};

export default function LevelProgressBar({
  accent = "amber",
  title,
  compact = false,
}: {
  accent?: Accent;
  title?: string;
  compact?: boolean;
}) {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white ${compact ? "p-4" : "p-5"} shadow-sm`}>
        <div className="mb-3 h-4 w-1/3 animate-pulse rounded-full bg-slate-200" />
        <div className="h-3 w-full animate-pulse rounded-full bg-slate-200" />
      </div>
    );
  }

  const safeLevel = Math.max(1, profile?.level || 1);
  const safeXp = Math.max(0, profile?.xp || 0);
  const xpInLevel = safeXp % XP_PER_LEVEL;
  const remaining = XP_PER_LEVEL - xpInLevel;
  const percent = Math.max(0, Math.min(100, (xpInLevel / XP_PER_LEVEL) * 100));
  const colors = accentMap[accent];

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl border border-slate-200 bg-white ${compact ? "p-4" : "p-5"} shadow-sm`}
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {title && <p className="mb-0.5 text-xs font-medium uppercase text-slate-400">{title}</p>}
          <div className="flex items-baseline gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-sm font-bold ring-1 ${colors.ring} ${colors.levelText}`}
            >
              <span aria-hidden>⭐</span>
              <span>Lv {safeLevel}</span>
            </span>
            <span className="text-sm text-slate-500">
              · {safeXp.toLocaleString("tr-TR")} XP
            </span>
          </div>
        </div>
        <div className={`text-right text-xs font-medium ${colors.label}`}>
          <p>Lv {safeLevel + 1}&apos;e</p>
          <p className="text-base font-bold">{remaining.toLocaleString("tr-TR")} XP</p>
        </div>
      </div>

      <div
        className={`relative h-3 w-full overflow-hidden rounded-full ${colors.track}`}
        role="progressbar"
        aria-valuenow={xpInLevel}
        aria-valuemin={0}
        aria-valuemax={XP_PER_LEVEL}
        aria-label={`Seviye ${safeLevel} ilerlemesi`}
      >
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className={`relative h-full overflow-hidden rounded-full bg-gradient-to-r ${colors.barFrom} ${colors.barTo}`}
        >
          <m.span
            aria-hidden
            initial={{ x: "-120%" }}
            animate={{ x: "220%" }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-y-0 left-0 block h-full w-1/3 bg-white/40 blur-md"
          />
        </m.div>
      </div>

      <p className="mt-2 text-[11px] text-slate-400">
        {xpInLevel.toLocaleString("tr-TR")} / {XP_PER_LEVEL.toLocaleString("tr-TR")} XP
      </p>
    </m.div>
  );
}
