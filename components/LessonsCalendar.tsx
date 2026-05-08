"use client";

import { useMemo } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./LessonsCalendar.css";

type Accent = "blue" | "green";

type Lesson = {
  id: string;
  lesson_date: string;
  status: "bekliyor" | "tamamlandi";
};

type Props = {
  dersler: Lesson[];
  accent: Accent;
  value: Date | null;
  onChange: (date: Date | null) => void;
};

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function LessonsCalendar({ dersler, accent, value, onChange }: Props) {
  const byDate = useMemo(() => {
    const map: Record<string, Lesson[]> = {};
    for (const d of dersler) {
      const k = dateKey(new Date(d.lesson_date));
      (map[k] ||= []).push(d);
    }
    return map;
  }, [dersler]);

  return (
    <div className={`lessons-calendar accent-${accent}`}>
      <Calendar
        locale="tr-TR"
        value={value}
        onChange={(v: any) => onChange(v instanceof Date ? v : null)}
        prev2Label={null}
        next2Label={null}
        tileContent={({ date, view }) => {
          if (view !== "month") return null;
          const items = byDate[dateKey(date)];
          if (!items?.length) return null;
          const hasBekliyor = items.some((d) => d.status === "bekliyor");
          const hasTamamlandi = items.some((d) => d.status === "tamamlandi");
          return (
            <div className="lc-dots">
              {hasBekliyor && <span className="lc-dot lc-dot-bekliyor" />}
              {hasTamamlandi && <span className="lc-dot lc-dot-tamamlandi" />}
            </div>
          );
        }}
      />
    </div>
  );
}
