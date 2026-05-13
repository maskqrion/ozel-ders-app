"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Size = "sm" | "md" | "lg";

const SIZE_PX: Record<Size, number> = { sm: 14, md: 18, lg: 28 };

function StarSvg({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="fill-current"
      aria-hidden
    >
      <path d="M12 2.5l2.95 5.97 6.59.96-4.77 4.65 1.13 6.57L12 17.55l-5.9 3.1 1.13-6.57L2.46 9.43l6.59-.96L12 2.5z" />
    </svg>
  );
}

function StarTrack({ size, colorClass }: { size: number; colorClass: string }) {
  return (
    <div className={`flex gap-0.5 ${colorClass}`} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <StarSvg key={i} size={size} />
      ))}
    </div>
  );
}

type Props = {
  value: number; // 0-5 (readonly: kesirli; interactive: tam sayı)
  onChange?: (v: number) => void;
  size?: Size;
  showValue?: boolean;
  ariaLabel?: string;
};

export default function StarRating({
  value,
  onChange,
  size = "md",
  showValue = false,
  ariaLabel,
}: Props) {
  const isInteractive = typeof onChange === "function";
  const px = SIZE_PX[size];
  const safeValue = Math.max(0, Math.min(5, value));

  if (!isInteractive) {
    const percent = (safeValue / 5) * 100;
    return (
      <div
        className="inline-flex items-center gap-2"
        role="img"
        aria-label={ariaLabel ?? `Puan: ${safeValue.toFixed(1)} / 5`}
      >
        <div className="relative inline-flex">
          <StarTrack size={px} colorClass="text-slate-200" />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${percent}%` }}
          >
            <StarTrack size={px} colorClass="text-amber-400" />
          </div>
        </div>
        {showValue && (
          <span className="text-sm font-semibold text-slate-700">
            {safeValue.toFixed(1)}
          </span>
        )}
      </div>
    );
  }

  return <InteractiveStars value={safeValue} onChange={onChange!} px={px} ariaLabel={ariaLabel} />;
}

function InteractiveStars({
  value,
  onChange,
  px,
  ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  px: number;
  ariaLabel?: string;
}) {
  const [hover, setHover] = useState<number>(0);
  const display = hover || value;

  return (
    <div
      className="inline-flex items-center gap-1.5"
      role="radiogroup"
      aria-label={ariaLabel ?? "Puan seçimi"}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const isFilled = n <= display;
        return (
          <motion.button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(n)}
            whileHover={{ scale: 1.18 }}
            whileTap={{ scale: 0.92 }}
            animate={{ scale: isFilled ? 1.05 : 1 }}
            transition={{ type: "spring", stiffness: 360, damping: 20 }}
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} yıldız`}
            className={`rounded transition-colors ${
              isFilled ? "text-amber-400" : "text-slate-200 hover:text-amber-200"
            } focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300`}
          >
            <StarSvg size={px} />
          </motion.button>
        );
      })}
    </div>
  );
}
