"use client";

import { m } from "framer-motion";
import { scorePalette } from "./scoreColors";

export default function ScoreBadge({
  score,
  size = "md",
  showLabel = false,
}: {
  score: number;
  size?: "sm" | "md";
  showLabel?: boolean;
}) {
  const p = scorePalette(score);
  const sizeCls = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <m.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`inline-flex items-center gap-1 rounded-full font-bold ${sizeCls} ${p.bg} ${p.text} ring-1 ${p.border}`}
    >
      <span aria-hidden>★</span>
      <span>{score} / 100</span>
      {showLabel && <span className="font-medium opacity-80">· {p.label}</span>}
    </m.span>
  );
}
