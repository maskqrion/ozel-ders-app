"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

export interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

// ── Timeline ───────────────────────────────────────────────────────────────

export function Timeline({ data }: { data: TimelineEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [lineHeight, setLineHeight] = useState(0);

  // Measure the height of the vertical track so the fill knows its target
  useEffect(() => {
    if (lineRef.current) {
      setLineHeight(lineRef.current.getBoundingClientRect().height);
    }
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 15%", "end 60%"],
  });

  // The fill grows from 0 → full line height as the user scrolls through
  const fillHeight = useTransform(scrollYProgress, [0, 1], [0, lineHeight]);
  const fillOpacity = useTransform(scrollYProgress, [0, 0.05], [0, 1]);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ background: "#100904" }}
    >
      {/* ── Vertical rail ─────────────────────────────────────────────── */}
      <div
        ref={lineRef}
        className="absolute left-8 top-0 w-px overflow-hidden"
        style={{
          height: "calc(100% - 2.5rem)",
          marginTop: "0.5rem",
          background: "#40372e",
        }}
        aria-hidden
      >
        {/* Scroll-driven burnt-sienna fill — no gradient, pure #dc5000 */}
        <motion.div
          className="absolute inset-x-0 top-0 w-full origin-top"
          style={{
            height: fillHeight,
            opacity: fillOpacity,
            background: "#dc5000",
          }}
        />
      </div>

      {/* ── Entries ───────────────────────────────────────────────────── */}
      <div className="space-y-0">
        {data.map((entry, idx) => (
          <TimelineRow key={`${entry.title}-${idx}`} entry={entry} idx={idx} />
        ))}
      </div>
    </div>
  );
}

// ── TimelineRow ────────────────────────────────────────────────────────────

function TimelineRow({ entry, idx }: { entry: TimelineEntry; idx: number }) {
  const rowRef = useRef<HTMLDivElement>(null);

  // Entrance animation — fires once when the row scrolls into view
  const { scrollYProgress: rowProgress } = useScroll({
    target: rowRef,
    offset: ["start 90%", "start 55%"],
  });

  const rowOpacity = useTransform(rowProgress, [0, 1], [0, 1]);
  const rowY = useTransform(rowProgress, [0, 1], [18, 0]);

  return (
    <div ref={rowRef} className="relative flex gap-0 pb-16 last:pb-0">
      {/* ── Left column: bullet + title ─────────────────────────────── */}
      <div className="relative flex-shrink-0 w-32 pt-1 pr-6">
        {/* Bullet dot */}
        <div
          className="absolute left-[1.875rem] top-[0.35rem] h-2.5 w-2.5 -translate-x-1/2 rounded-full"
          style={{
            background: "#100904",
            border: "1.5px solid #dc5000",
            zIndex: 1,
          }}
          aria-hidden
        />

        {/* Inner dot — fills in on hover or when past this point */}
        <div
          className="absolute left-[1.875rem] top-[0.35rem] h-2.5 w-2.5 -translate-x-1/2 rounded-full"
          style={{
            background: idx === 0 ? "#dc5000" : "transparent",
          }}
          aria-hidden
        />

        {/* Title — large warm-cream */}
        <motion.p
          style={{ opacity: rowOpacity }}
          className="pl-8 pt-0 leading-none"
        >
          <span
            style={{
              fontFamily:
                "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
              fontSize: "29px",
              fontWeight: 500,
              color: "#ffedd7",
              lineHeight: 1.09,
              display: "block",
            }}
          >
            {entry.title}
          </span>
        </motion.p>
      </div>

      {/* ── Right column: animated content ──────────────────────────── */}
      <motion.div
        className="flex-1 pt-1 min-w-0"
        style={{ opacity: rowOpacity, y: rowY }}
      >
        {entry.content}
      </motion.div>
    </div>
  );
}
