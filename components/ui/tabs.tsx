"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

export type Tab = {
  title: string;
  value: string;
  content?: React.ReactNode;
};

interface TabsProps {
  tabs: Tab[];
  containerClassName?: string;
  activeTabClassName?: string;
  tabClassName?: string;
  contentClassName?: string;
}

// ── Tabs ───────────────────────────────────────────────────────────────────

export function Tabs({
  tabs,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName,
}: TabsProps) {
  const [active, setActive] = useState<Tab>(tabs[0]);
  const [hovering, setHovering] = useState(false);

  return (
    <div className={cn("w-full", containerClassName)}>
      {/* Tab strip */}
      <div
        className="relative flex items-center gap-1 mb-0 px-1 pt-1"
        style={{ borderBottom: "1px solid #40372e" }}
      >
        {tabs.map((tab) => {
          const isActive = active.value === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActive(tab)}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              className={cn(
                "relative px-4 pb-2.5 pt-2 text-sm transition-colors duration-200 outline-none",
                tabClassName
              )}
              style={{
                fontFamily:
                  "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
                fontSize: "14px",
                fontWeight: 400,
                color: isActive ? "#ffedd7" : "#6c5f51",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              {/* Active bottom hairline — burnt-sienna, 1px */}
              {isActive && (
                <motion.span
                  layoutId="active-tab-indicator"
                  className="absolute bottom-0 inset-x-0 h-px"
                  style={{ background: "#dc5000" }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              {/* Active pill background (dark-cork) */}
              {isActive && (
                <motion.span
                  layoutId="active-tab-bg"
                  className={cn(
                    "absolute inset-0 rounded-t-[8px]",
                    activeTabClassName
                  )}
                  style={{ background: "rgba(56,36,22,0.55)" }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <span className="relative z-10">{tab.title}</span>
            </button>
          );
        })}
      </div>

      {/* Content area — stacked 3-D reveal */}
      <FadeInDiv
        tabs={tabs}
        active={active}
        hovering={hovering}
        className={contentClassName}
      />
    </div>
  );
}

// ── FadeInDiv — stacked perspective panels ─────────────────────────────────

function FadeInDiv({
  tabs,
  active,
  hovering,
  className,
}: {
  tabs: Tab[];
  active: Tab;
  hovering: boolean;
  className?: string;
}) {
  const isActive = (tab: Tab) => tab.value === active.value;

  return (
    <div className={cn("relative w-full", className)} style={{ minHeight: "280px" }}>
      {tabs.map((tab, idx) => {
        /* Only render the active tab and up to 2 peeking tabs behind it */
        const activeIdx = tabs.findIndex((t) => t.value === active.value);
        const offset = idx - activeIdx;
        if (offset < 0 || offset > 2) return null;

        return (
          <motion.div
            key={tab.value}
            style={{
              position: "absolute",
              inset: 0,
              transformOrigin: "top center",
              background: "#100904",
              borderRadius: "0 0 12px 12px",
              border: "1px solid rgba(255,237,215,0.06)",
              borderTop: "none",
              overflow: "hidden",
              zIndex: tabs.length - offset,
            }}
            animate={{
              opacity: isActive(tab) ? 1 : offset === 1 ? 0.5 : 0.25,
              scale: isActive(tab) ? 1 : 1 - offset * 0.04,
              y: isActive(tab) ? 0 : offset * 22,
              rotateX: isActive(tab) ? 0 : offset * -3,
              filter: isActive(tab) ? "none" : "blur(0px)",
            }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          >
            {tab.content}
          </motion.div>
        );
      })}
    </div>
  );
}
