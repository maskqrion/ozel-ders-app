"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";

export type TabDef = {
  id: string;
  label: string;
  icon?: string;
  content: ReactNode;
};

type Accent = "blue" | "green";

const accentClasses: Record<Accent, { active: string; bar: string }> = {
  blue: {
    active: "text-blue-700",
    bar: "bg-blue-500",
  },
  green: {
    active: "text-emerald-700",
    bar: "bg-emerald-500",
  },
};

export default function Tabs({
  tabs,
  accent = "blue",
  initialId,
}: {
  tabs: TabDef[];
  accent?: Accent;
  initialId?: string;
}) {
  const [activeId, setActiveId] = useState<string>(initialId ?? tabs[0]?.id);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const a = accentClasses[accent];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Panel sekmeleri"
        className="relative mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm"
      >
        {tabs.map((t) => {
          const isActive = t.id === active.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(t.id)}
              className={`relative flex-1 min-w-[110px] whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive ? a.active : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId={`tab-active-bg-${accent}`}
                  className="absolute inset-0 rounded-lg bg-slate-50"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {t.icon && <span aria-hidden>{t.icon}</span>}
                <span>{t.label}</span>
              </span>
              {isActive && (
                <motion.span
                  layoutId={`tab-active-bar-${accent}`}
                  className={`absolute bottom-0 left-3 right-3 h-[3px] rounded-full ${a.bar}`}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {active.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
