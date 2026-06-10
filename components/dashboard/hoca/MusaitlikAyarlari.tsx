"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";

// day_of_week: 0=Pazar … 6=Cumartesi (JS Date.getDay() ile uyumlu)
const DAYS: { dow: number; label: string; short: string }[] = [
  { dow: 1, label: "Pazartesi", short: "Pzt" },
  { dow: 2, label: "Salı",      short: "Sal" },
  { dow: 3, label: "Çarşamba",  short: "Çar" },
  { dow: 4, label: "Perşembe",  short: "Per" },
  { dow: 5, label: "Cuma",      short: "Cum" },
  { dow: 6, label: "Cumartesi", short: "Cmt" },
  { dow: 0, label: "Pazar",     short: "Pzr" },
];

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6..22

type AvailRow = {
  id: string;
  day_of_week: number;
  start_hour: number;
  end_hour: number;
};

type EditState = { start: number; end: number };

export default function MusaitlikAyarlari({ userId }: { userId: string }) {
  const [rows, setRows] = useState<AvailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<number, EditState | null>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [deleting, setDeleting] = useState<Record<number, boolean>>({});

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("teacher_availability")
      .select("id, day_of_week, start_hour, end_hour")
      .eq("hoca_id", userId);
    setRows(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const rowFor = (dow: number) => rows.find((r) => r.day_of_week === dow);

  const startEdit = (dow: number) => {
    const existing = rowFor(dow);
    setEditing((prev) => ({
      ...prev,
      [dow]: existing
        ? { start: existing.start_hour, end: existing.end_hour }
        : { start: 9, end: 17 },
    }));
  };

  const cancelEdit = (dow: number) => {
    setEditing((prev) => ({ ...prev, [dow]: null }));
  };

  const save = async (dow: number) => {
    const state = editing[dow];
    if (!state) return;

    if (state.end <= state.start) {
      toast.error("Bitiş saati başlangıçtan büyük olmalıdır.");
      return;
    }

    setSaving((prev) => ({ ...prev, [dow]: true }));
    try {
      const { error } = await supabase
        .from("teacher_availability")
        .upsert(
          {
            hoca_id:     userId,
            day_of_week: dow,
            start_hour:  state.start,
            end_hour:    state.end,
          },
          { onConflict: "hoca_id,day_of_week" },
        );

      if (error) {
        toast.error("Müsaitlik kaydedilemedi. Lütfen tekrar deneyin.");
        return;
      }

      toast.success("Müsaitlik güncellendi.");
      cancelEdit(dow);
      await fetch();
    } finally {
      setSaving((prev) => ({ ...prev, [dow]: false }));
    }
  };

  const remove = async (dow: number) => {
    const row = rowFor(dow);
    if (!row) return;

    setDeleting((prev) => ({ ...prev, [dow]: true }));
    try {
      const { error } = await supabase
        .from("teacher_availability")
        .delete()
        .eq("id", row.id);

      if (error) {
        toast.error("Müsaitlik kaldırılamadı. Lütfen tekrar deneyin.");
        return;
      }

      toast.success("Müsaitlik kaldırıldı.");
      await fetch();
    } finally {
      setDeleting((prev) => ({ ...prev, [dow]: false }));
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-800">Müsaitlik Takvimi</h2>
        <p className="mt-1 text-xs text-slate-500">
          Haftanın her günü için müsait olduğunuz saat aralığını belirleyin.
          Ayarlanmayan günlerde tüm saatler açık sayılır.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {DAYS.map(({ dow, label, short }) => {
            const row = rowFor(dow);
            const ed = editing[dow];
            const isSaving  = saving[dow]   ?? false;
            const isDeleting = deleting[dow] ?? false;

            return (
              <m.div
                key={dow}
                layout
                transition={{ duration: 0.15 }}
                className="rounded-xl border border-slate-100 overflow-hidden"
              >
                {/* Row header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50">
                  <span className="w-8 text-center text-xs font-black uppercase tracking-wider text-slate-400">
                    {short}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-slate-700">
                    {label}
                  </span>

                  {row && !ed ? (
                    // Configured — show range + edit/delete
                    <>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5">
                        {String(row.start_hour).padStart(2, "0")}:00 – {String(row.end_hour).padStart(2, "0")}:00
                      </span>
                      <button
                        onClick={() => startEdit(dow)}
                        className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors px-1"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => remove(dow)}
                        disabled={isDeleting}
                        className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors px-1 disabled:opacity-40"
                      >
                        {isDeleting ? "…" : "Kaldır"}
                      </button>
                    </>
                  ) : !ed ? (
                    // Not configured
                    <>
                      <span className="text-xs text-slate-400">Tüm saatler açık</span>
                      <button
                        onClick={() => startEdit(dow)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors px-1"
                      >
                        + Pencere Ekle
                      </button>
                    </>
                  ) : null}
                </div>

                {/* Edit form */}
                <AnimatePresence>
                  {ed && (
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <label className="font-medium">Başlangıç</label>
                          <select
                            value={ed.start}
                            onChange={(e) =>
                              setEditing((prev) => ({
                                ...prev,
                                [dow]: { ...ed, start: Number(e.target.value) },
                              }))
                            }
                            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                          >
                            {HOURS.slice(0, -1).map((h) => (
                              <option key={h} value={h}>
                                {String(h).padStart(2, "0")}:00
                              </option>
                            ))}
                          </select>
                        </div>

                        <span className="text-slate-300">–</span>

                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <label className="font-medium">Bitiş</label>
                          <select
                            value={ed.end}
                            onChange={(e) =>
                              setEditing((prev) => ({
                                ...prev,
                                [dow]: { ...ed, end: Number(e.target.value) },
                              }))
                            }
                            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                          >
                            {HOURS.slice(1).map((h) => (
                              <option key={h} value={h} disabled={h <= ed.start}>
                                {String(h).padStart(2, "0")}:00
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            onClick={() => cancelEdit(dow)}
                            disabled={isSaving}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors px-2 py-1.5"
                          >
                            İptal
                          </button>
                          <button
                            onClick={() => save(dow)}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isSaving && (
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            )}
                            Kaydet
                          </button>
                        </div>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </m.div>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-[11px] text-slate-400">
        Saatler yerel saat olarak (0–23 tamsayı) kaydedilir; rezervasyon sistemi aynı değerleri kullanır.
      </p>
    </div>
  );
}
