"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import LessonsCalendar from "@/components/LessonsCalendar";
import { supabase } from "@/lib/supabase";
import type { Lesson, UserProfile } from "@/lib/types";

type Props = {
  hocaId: string;
  dersler: Lesson[];
  ogrenciler: UserProfile[];
  refetchDersler: () => void | Promise<void>;
  onAwardXp?: (amount: number, action: string) => void | Promise<void>;
};

export default function DersTakvimi({
  hocaId,
  dersler,
  ogrenciler,
  refetchDersler,
  onAwardXp,
}: Props) {
  const [secilenOgrenci, setSecilenOgrenci] = useState("");
  const [dersTarihi, setDersTarihi] = useState("");
  const [dersLoading, setDersLoading] = useState(false);
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

  const dersPlanla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secilenOgrenci || !dersTarihi) {
      toast.error("Öğrenci ve tarih seçin.");
      return;
    }
    setDersLoading(true);
    const { error } = await supabase
      .from("lessons")
      .insert([{ hoca_id: hocaId, ogrenci_id: secilenOgrenci, lesson_date: dersTarihi, status: "bekliyor" }]);
    setDersLoading(false);
    if (error) {
      toast.error("Hata: " + error.message);
      return;
    }
    toast.success("Ders planlandı.");
    setSecilenOgrenci("");
    setDersTarihi("");
    await refetchDersler();
    onAwardXp?.(20, "Yeni ders planlandı");
  };

  const dersiTamamla = async (dersId: string) => {
    const { error } = await supabase.from("lessons").update({ status: "tamamlandi" }).eq("id", dersId);
    if (error) toast.error("Hata: " + error.message);
    else await refetchDersler();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="mb-4 text-base font-semibold text-slate-800">Yeni Ders Planla</h2>
        <form onSubmit={dersPlanla} className="space-y-3">
          <select
            value={secilenOgrenci}
            onChange={(e) => setSecilenOgrenci(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Öğrenci Seçin</option>
            {ogrenciler.map((o) => (
              <option key={o.id} value={o.id}>
                {o.full_name || o.email}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={dersTarihi}
            onChange={(e) => setDersTarihi(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={dersLoading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {dersLoading ? "Planlanıyor..." : "Dersi Planla"}
          </button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2"
      >
        <h2 className="mb-4 text-base font-semibold text-slate-800">Ders Takvimi</h2>
        <LessonsCalendar dersler={dersler} accent="blue" value={selectedDate} onChange={setSelectedDate} />

        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-3 text-xs font-medium text-slate-500">
            {selectedDate
              ? selectedDate.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })
              : "Bir gün seç"}
          </p>
          <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {seciliGunDersleri.length === 0 && selectedDate && (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-slate-400"
                >
                  Planlı ders yok.
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
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{d.users?.email}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {new Date(d.lesson_date).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`whitespace-nowrap rounded px-2 py-1 text-[10px] font-bold uppercase ${
                        d.status === "bekliyor"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {d.status}
                    </span>
                    {d.status === "bekliyor" && (
                      <button
                        onClick={() => dersiTamamla(d.id)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        title="Dersi Tamamla"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
