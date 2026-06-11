"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { AnimatePresence, m } from "framer-motion";
import { useProfile } from "@/lib/hooks/useProfile";
import { useLessons } from "@/lib/hooks/useLessons";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { cancelLessonAction } from "@/app/actions/lessons";
import VideoGorüsme from "@/components/VideoGorüsme";

const LessonsCalendar = dynamic(() => import("@/components/LessonsCalendar"), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

export default function DersTakvimi() {
  const { data: profile } = useProfile();
  const { data: lessons = [], isLoading } = useLessons(profile?.id, profile?.role);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [videoLessonId, setVideoLessonId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // "Derse katıl" penceresi için dakikada bir tazelenen saat.
  // Render içinde Date.now() çağrısı React kurallarına aykırıydı (impure);
  // buton durumu artık re-render beklemeden dakikada bir güncellenir.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const handleCancel = async (lessonId: string) => {
    if (!confirm("Bu dersi iptal etmek istediğinizden emin misiniz?")) return;
    setCancellingId(lessonId);
    try {
      const result = await cancelLessonAction(lessonId);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success(result.refunded ? "Ders iptal edildi, ödeme iade edildi." : "Ders iptal edildi.");
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    } finally {
      setCancellingId(null);
    }
  };

  const seciliGunDersleri = useMemo(() => {
    if (!selectedDate) return [];
    return lessons.filter((d) => {
      const dd = new Date(d.lesson_date);
      return (
        dd.getFullYear() === selectedDate.getFullYear() &&
        dd.getMonth() === selectedDate.getMonth() &&
        dd.getDate() === selectedDate.getDate()
      );
    });
  }, [lessons, selectedDate]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <LessonsCalendar dersler={lessons} accent="green" value={selectedDate} onChange={setSelectedDate} />

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase text-slate-500">
          {selectedDate
            ? selectedDate.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })
            : "Bir gün seç"}
        </p>
        <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {seciliGunDersleri.length === 0 && selectedDate && (
              <m.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-slate-400"
              >
                Bu gün için ders yok.
              </m.p>
            )}
            {seciliGunDersleri.map((d) => {
              const status    = d.status as string;
              const isVideo   = videoLessonId === d.id;
              const start     = new Date(d.lesson_date).getTime();
              const canJoin   = now >= start - 15 * 60 * 1000 && now <= start + 90 * 60 * 1000;
              return (
                <m.div
                  key={d.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-md border border-slate-100 bg-slate-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3">
                    <div className="min-w-0 text-sm">
                      <p className="truncate font-medium text-slate-800">{d.hoca?.full_name || d.hoca?.email}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(d.lesson_date).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`whitespace-nowrap rounded px-2 py-1 text-[10px] font-bold uppercase ${
                          status === "iptal"
                            ? "bg-red-50 text-red-500"
                            : status === "tamamlandi"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {status === "iptal" ? "İptal" : status === "tamamlandi" ? "Tamamlandı" : status}
                      </span>
                      {status === "bekliyor" && d.meeting_room_id && (
                        <button
                          onClick={() => setVideoLessonId(isVideo ? null : d.id)}
                          className={`rounded px-2 py-1 text-[10px] font-bold transition ${
                            isVideo
                              ? "bg-red-50 text-red-500 hover:bg-red-100"
                              : canJoin
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {isVideo ? "Kapat" : "🎥 Derse Gir"}
                        </button>
                      )}
                      {status !== "tamamlandi" && status !== "iptal" && (
                        <button
                          onClick={() => handleCancel(d.id)}
                          disabled={cancellingId === d.id}
                          className="rounded px-2 py-1 text-[10px] font-bold text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        >
                          {cancellingId === d.id ? "..." : "İptal"}
                        </button>
                      )}
                    </div>
                  </div>
                  <AnimatePresence>
                    {isVideo && d.meeting_room_id && profile && (
                      <m.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-t border-slate-100"
                      >
                        <div className="p-2">
                          <VideoGorüsme
                            lessonId={d.id}
                            meetingRoomId={d.meeting_room_id}
                            lessonDate={d.lesson_date}
                            userName={profile.full_name ?? profile.email}
                            isHost={false}
                            onClose={() => setVideoLessonId(null)}
                          />
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                </m.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </m.div>
  );
}
