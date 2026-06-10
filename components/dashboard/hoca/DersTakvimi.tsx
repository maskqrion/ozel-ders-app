"use client";

import { useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { AnimatePresence, m } from "framer-motion";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/lib/hooks/useProfile";
import { useLessons } from "@/lib/hooks/useLessons";
import { completeLessonAction, createTeacherLessonAction } from "@/app/actions/lessons";
import VideoGorüsme from "@/components/VideoGorüsme";
import type { UserProfile } from "@/lib/types";

const LessonsCalendar = dynamic(() => import("@/components/LessonsCalendar"), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

type Props = {
  ogrenciler: UserProfile[];
  onAwardXp?: (amount: number, action: string) => void | Promise<void>;
};

export default function DersTakvimi({ ogrenciler, onAwardXp }: Props) {
  const { data: profile } = useProfile();
  const { data: lessons = [], isLoading } = useLessons(profile?.id, profile?.role);
  const queryClient = useQueryClient();

  const [secilenOgrenci, setSecilenOgrenci] = useState("");
  const [dersTarihi, setDersTarihi] = useState("");
  const [dersLoading, setDersLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [pendingLessonId, setPendingLessonId] = useState<string | null>(null);
  const [videoLessonId, setVideoLessonId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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

  const dersPlanla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secilenOgrenci || !dersTarihi) {
      toast.error("Öğrenci ve tarih seçin.");
      return;
    }
    setDersLoading(true);
    const result = await createTeacherLessonAction(secilenOgrenci, new Date(dersTarihi).toISOString());
    setDersLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Ders planlandı.");
    setSecilenOgrenci("");
    setDersTarihi("");
    queryClient.invalidateQueries({ queryKey: ["lessons"] });
    onAwardXp?.(20, "Yeni ders planlandı");
  };

  const dersiTamamla = (dersId: string) => {
    setPendingLessonId(dersId);
    startTransition(async () => {
      try {
        const result = await completeLessonAction(dersId);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Ders tamamlandı, ödeme aktarıldı.");
        queryClient.invalidateQueries({ queryKey: ["lessons"] });
      } catch {
        toast.error("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
      } finally {
        setPendingLessonId(null);
      }
    });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <m.div
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
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2"
      >
        <h2 className="mb-4 text-base font-semibold text-slate-800">Ders Takvimi</h2>
        <LessonsCalendar dersler={lessons} accent="blue" value={selectedDate} onChange={setSelectedDate} />

        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-3 text-xs font-medium text-slate-500">
            {selectedDate
              ? selectedDate.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })
              : "Bir gün seç"}
          </p>
          <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {seciliGunDersleri.length === 0 && selectedDate && (
                <m.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-slate-400"
                >
                  Planlı ders yok.
                </m.p>
              )}
              {seciliGunDersleri.map((d) => {
                const isVideo = videoLessonId === d.id;
                const now     = Date.now();
                const start   = new Date(d.lesson_date).getTime();
                const canJoin = now >= start - 15 * 60 * 1000 && now <= start + 90 * 60 * 1000;
                return (
                <m.div
                  key={d.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-lg border border-slate-100 bg-slate-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{d.users?.full_name || d.users?.email}</p>
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
                      {d.status === "bekliyor" && d.meeting_room_id && (
                        <button
                          onClick={() => setVideoLessonId(isVideo ? null : d.id)}
                          className={`rounded px-2 py-1 text-[10px] font-bold transition ${
                            isVideo
                              ? "bg-red-50 text-red-500 hover:bg-red-100"
                              : canJoin
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-slate-100 text-slate-400"
                          }`}
                          title={canJoin ? "Görüşmeye Katıl" : "Ders saatine 15 dk kala aktif olur"}
                        >
                          {isVideo ? "Kapat" : "🎥 Derse Gir"}
                        </button>
                      )}
                      {d.status === "bekliyor" && (
                        <button
                          onClick={() => dersiTamamla(d.id)}
                          disabled={pendingLessonId === d.id}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                          title="Dersi Tamamla"
                        >
                          {pendingLessonId === d.id ? (
                            <span
                              aria-hidden
                              className="block h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin"
                            />
                          ) : (
                            "✓"
                          )}
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
                            isHost={true}
                            onClose={() => setVideoLessonId(null)}
                          />
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                </m.div>
              );})}
            </AnimatePresence>
          </div>
        </div>
      </m.div>
    </div>
  );
}
