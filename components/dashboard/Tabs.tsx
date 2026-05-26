"use client";

import { AnimatePresence, m } from "framer-motion";
import { useState, useTransition, type ReactNode } from "react";

export type TabDef = {
  id: string;
  label: string;
  icon?: string;
  content: ReactNode;
};

type Accent = "blue" | "green";

const accentClasses: Record<Accent, { active: string; indicator: string }> = {
  blue: { active: "text-blue-700", indicator: "bg-blue-50 shadow-sm" },
  green: { active: "text-emerald-700", indicator: "bg-emerald-50 shadow-sm" },
};

export default function Tabs({
  tabs,
  accent = "blue",
  defaultTab,
}: {
  tabs: TabDef[];
  accent?: Accent;
  defaultTab?: string;
}) {
  const [activeId, setActiveId] = useState<string>(defaultTab ?? tabs[0]?.id);
  const [isPending, startTransition] = useTransition();
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const a = accentClasses[accent];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Panel sekmeleri"
        className="relative mb-6 flex gap-1 overflow-x-auto scrollbar-hide rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm"
      >
        {tabs.map((t) => {
          const isActive = t.id === active.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => startTransition(() => setActiveId(t.id))}
              className={`relative flex-1 min-w-[110px] whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive ? a.active : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {isActive && (
                <m.span
                  layoutId="activeTabIndicator"
                  className={`absolute inset-0 rounded-lg ${a.indicator}`}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {t.icon && <span aria-hidden>{t.icon}</span>}
                <span>{t.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <m.div
          key={active.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isPending ? 0.6 : 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {active.content}
        </m.div>
      </AnimatePresence>
    </div>
  );
}
