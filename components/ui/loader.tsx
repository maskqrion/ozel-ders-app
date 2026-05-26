"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoaderOneProps {
  className?: string;
  color?: string;
  size?: number;
}

export function LoaderOne({ className, color = "#3b82f6", size = 40 }: LoaderOneProps) {
  return (
    <div
      className={cn("flex items-center justify-center gap-2", className)}
      role="status"
      aria-label="Yükleniyor"
    >
      {[0, 1, 2].map((i) => (
        <m.span
          key={i}
          animate={{ y: [0, -size * 0.35, 0], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            delay: i * 0.12,
            ease: "easeInOut",
          }}
          style={{
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: "50%",
            background: color,
            display: "block",
          }}
        />
      ))}
    </div>
  );
}

interface LoaderRingProps {
  className?: string;
  color?: string;
  size?: number;
}

export function LoaderRing({ className, color = "#3b82f6", size = 36 }: LoaderRingProps) {
  return (
    <m.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `3px solid transparent`,
        borderTopColor: color,
        borderRightColor: color,
      }}
      className={cn("shrink-0", className)}
      role="status"
      aria-label="Yükleniyor"
    />
  );
}
