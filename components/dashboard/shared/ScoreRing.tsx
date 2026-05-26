"use client";

import { m } from "framer-motion";
import { scorePalette } from "./scoreColors";

export default function ScoreRing({
  score,
  size = 88,
  stroke = 8,
}: {
  score: number;
  size?: number;
  stroke?: number;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const p = scorePalette(clamped);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Puan: ${clamped} / 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={p.trackStroke}
          strokeWidth={stroke}
          fill="none"
        />
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={p.ringStroke}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <m.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className={`text-xl font-extrabold leading-none ${p.text}`}
        >
          {clamped}
        </m.span>
        <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-400">
          /100
        </span>
      </div>
    </div>
  );
}
