"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LessonsCalendar from "@/components/LessonsCalendar";
import type { Lesson } from "@/lib/types";

type Props = {
  dersler: Lesson[];
};

export default function DersTakvimi({ dersler }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const seciliGunDersleri = useMemo(() => {
    if (!selectedDate) return [];
    return dersler.filter((d) => {
      const dd = new Date(d.lesson_date);
      return (
        dd.getFullYear() === selectedDate.getFullYear() &&
        dd.getMonth() === selectedDate.getMonth() &&
        dd.getDate() === selectedDate.getDate()
      );
    });
  }, [dersler, selectedDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <LessonsCalendar dersler={dersler} accent="green" value={selectedDate} onChange={setSelectedDate} />

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase text-slate-500">
          {selectedDate
            ? selectedDate.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })
            : "Bir gün seç"}
        </p>
        <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {seciliGunDersleri.length === 0 && selectedDate && (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-slate-400"
              >
                Bu gün için ders yok.
              </motion.p>
            )}
            {seciliGunDersleri.map((d) => (
              <motion.div
                key={d.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 p-3"
              >
                <div className="min-w-0 text-sm">
                  <p className="truncate font-medium text-slate-800">{d.users?.email}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(d.lesson_date).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span
                  className={`whitespace-nowrap rounded px-2 py-1 text-[10px] font-bold uppercase ${
                    d.status === "bekliyor"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {d.status}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
