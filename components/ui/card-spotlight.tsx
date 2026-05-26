"use client";

import { useRef, useState } from "react";
import {
  m,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from "framer-motion";
import { cn } from "@/lib/utils";

// ── CardSpotlight ──────────────────────────────────────────────────────────
//
// Mouse position is tracked relative to the card and fed into a
// radial-gradient that follows the cursor, creating a warm burnt-sienna
// spotlight effect on the dark studio-black surface.
//

interface CardSpotlightProps {
  children: React.ReactNode;
  className?: string;
  radius?: number;
  color?: string;
  /** Card background color — defaults to dark studio-black */
  bg?: string;
  /** Resting border color */
  borderColor?: string;
  /** Hover border color */
  hoverBorderColor?: string;
}

export function CardSpotlight({
  children,
  className,
  radius = 340,
  color = "rgba(220, 80, 0, 0.13)",
  bg = "#100904",
  borderColor = "#40372e",
  hoverBorderColor = "rgba(220,80,0,0.22)",
}: CardSpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Raw mouse position
  const rawX = useMotionValue(-400);
  const rawY = useMotionValue(-400);

  // Smooth spring so the gradient follows with a slight lag
  const mouseX = useSpring(rawX, { stiffness: 500, damping: 50 });
  const mouseY = useSpring(rawY, { stiffness: 500, damping: 50 });

  // Radial gradient that chases the cursor
  const background = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, ${color}, transparent 80%)`;

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const { left, top } = ref.current.getBoundingClientRect();
    rawX.set(e.clientX - left);
    rawY.set(e.clientY - top);
  }

  function onMouseEnter() {
    setIsHovering(true);
  }

  function onMouseLeave() {
    setIsHovering(false);
    // Drift the glow off-screen
    rawX.set(-400);
    rawY.set(-400);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn("group relative overflow-hidden rounded-card", className)}
      style={{
        background: bg,
        border: `1px solid ${isHovering ? hoverBorderColor : borderColor}`,
        transition: "border-color 0.25s ease",
      }}
    >
      {/* Spotlight layer — sits above bg, below content */}
      <m.div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background }}
        aria-hidden
      />

      {/* Grain texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.018]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "180px 180px",
        }}
        aria-hidden
      />

      {/* Hairline top rim — glows on hover */}
      <m.div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px"
        animate={{
          opacity: isHovering ? 1 : 0,
          background: "linear-gradient(90deg, transparent 10%, rgba(220,80,0,0.45) 50%, transparent 90%)",
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
