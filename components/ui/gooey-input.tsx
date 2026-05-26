"use client";

import { useId, useState } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";

interface GooeyInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  type?: string;
  icon?: React.ReactNode;
}

export function GooeyInput({
  placeholder,
  value,
  onChange,
  className,
  type = "text",
  icon,
}: GooeyInputProps) {
  const [focused, setFocused] = useState(false);
  const uid = useId().replace(/:/g, "");

  return (
    <div className="relative w-full">
      <svg
        className="pointer-events-none absolute"
        style={{ width: 0, height: 0, position: "absolute" }}
        aria-hidden
      >
        <defs>
          <filter id={`goo-${uid}`} colorInterpolationFilters="sRGB" x="-30%" y="-80%" width="160%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Blob layer — gooey filter applied only to decorative shapes, not input text */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ filter: `url(#goo-${uid})` }}
        aria-hidden
      >
        {/* Pill base */}
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-colors duration-300",
            focused ? "bg-blue-100" : "bg-slate-100",
          )}
        />
        {/* Right blob — merges with pill on focus */}
        <m.div
          animate={{ scale: focused ? 1 : 0.05 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="absolute -right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-blue-100"
        />
        {/* Smaller satellite blob */}
        <m.div
          animate={{ scale: focused ? 1 : 0.05, x: focused ? -4 : 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 26, delay: 0.05 }}
          className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-blue-100"
        />
      </div>

      {/* Actual input — z-10 so it sits above the gooey layer */}
      <div className="relative z-10 flex items-center">
        {icon && (
          <span className="absolute left-4 text-slate-400">{icon}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-full border-2 bg-transparent py-3 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400",
            icon ? "pl-10 pr-5" : "px-5",
            focused
              ? "border-blue-400 shadow-[0_0_0_3px_rgba(96,165,250,0.18)]"
              : "border-slate-200",
            className,
          )}
        />
      </div>
    </div>
  );
}
