"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import type { Assignment, Lesson } from "@/lib/types";
import ScoreBadge from "@/components/dashboard/shared/ScoreBadge";
import { scorePalette } from "@/components/dashboard/shared/scoreColors";

type Props = {
  dersler: Lesson[];
  odevler: Assignment[];
  refetchOdevler: () => void | Promise<void>;
  onAwardXp?: (amount: number, action: string) => void | Promise<void>;
};

function Spinner() {
  return (
    <motion.span
      aria-hidden
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white"
    />
  );
}

export default function OdevYonetimi({ dersler, odevler, refetchOdevler, onAwardXp }: Props) {
  const [secilenDersId, setSecilenDersId] = useState("");
  const [odevBaslik, setOdevBaslik] = useState("");
  const [odevAciklama, setOdevAciklama] = useState("");
  const [odevLoading, setOdevLoading] = useState(false);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [gradingId, setGradingId] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState<number>(80);
  const [gradeSaving, setGradeSaving] = useState(false);

  const openGrading = (o: Assignment) => {
    setRejectingId(null);
    setRejectionReason("");
    setGradingId(o.id);
    setScoreInput(o.score ?? 80);
  };

  const openReject = (id: string) => {
    setGradingId(null);
    setRejectingId(id);
  };

  const odevVer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secilenDersId || !odevBaslik) {
      toast.error("Ders ve başlık seçmek zorunludur.");
      return;
    }
    setOdevLoading(true);
    const { error } = await supabase
      .from("assignments")
      .insert([{ lesson_id: secilenDersId, title: odevBaslik, description: odevAciklama, status: "verildi" }]);
    setOdevLoading(false);
    if (error) {
      toast.error("Hata: " + error.message);
      return;
    }
    toast.success("Ödev verildi.");
    setSecilenDersId("");
    setOdevBaslik("");
    setOdevAciklama("");
    await refetchOdevler();
    onAwardXp?.(20, "Yeni ödev verildi");
  };

  const odeviReddet = async (odevId: string, filePath: string | null) => {
    if (!rejectionReason.trim()) {
      toast.error("Lütfen reddetme sebebini yazın.");
      return;
    }
    try {
      if (filePath) {
        const { error: storageError } = await supabase.storage.from("kaynaklar").remove([filePath]);
        if (storageError) console.error("Dosya silinemedi:", storageError);
      }
      const { error: dbError } = await supabase
        .from("assignments")
        .update({
          status: "reddedildi",
          rejection_reason: rejectionReason,
          submission_text: null,
          submission_file_path: null,
          submitted_at: null,
        })
        .eq("id", odevId);
      if (dbError) throw dbError;

      toast.success("Ödev reddedildi.");
      setRejectingId(null);
      setRejectionReason("");
      await refetchOdevler();
    } catch (err: any) {
      toast.error("Hata: " + err.message);
    }
  };

  const odeviPuanla = async (odevId: string) => {
    const n = Number(scoreInput);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      toast.error("Puan 0 ile 100 arasında olmalı.");
      return;
    }
    setGradeSaving(true);
    try {
      const { error } = await supabase
        .from("assignments")
        .update({ score: Math.round(n) })
        .eq("id", odevId);
      if (error) throw error;
      toast.success(`Puan kaydedildi: ${Math.round(n)} / 100`);
      setGradingId(null);
      await refetchOdevler();
    } catch (err: any) {
      toast.error("Hata: " + err.message);
    } finally {
      setGradeSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="mb-4 text-base font-semibold text-slate-800">Ödev Ver</h2>
        <form onSubmit={odevVer} className="space-y-3">
          <select
            value={secilenDersId}
            onChange={(e) => setSecilenDersId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">Hangi Ders İçin?</option>
            {dersler
              .filter((d) => d.status === "bekliyor")
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.users?.email} - {new Date(d.lesson_date).toLocaleDateString()}
                </option>
              ))}
          </select>
          <input
            type="text"
            placeholder="Ödev Başlığı"
            value={odevBaslik}
            onChange={(e) => setOdevBaslik(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          />
          <textarea
            placeholder="Açıklama"
            rows={3}
            value={odevAciklama}
            onChange={(e) => setOdevAciklama(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={odevLoading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {odevLoading ? "Gönderiliyor..." : "Ödevi Gönder"}
          </button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2"
      >
        <h2 className="mb-4 text-base font-semibold text-slate-800">Verilen Ödevler</h2>
        <div className="max-h-[600px] space-y-3 overflow-y-auto pr-2">
          {odevler.length === 0 && <p className="text-sm text-slate-400">Ödev bulunamadı.</p>}
          <AnimatePresence initial={false}>
            {odevler.map((o) => {
              const isCompleted = o.status === "yapildi";
              const isRejected = o.status === "reddedildi";
              const isGrading = gradingId === o.id;
              const isRejectingThis = rejectingId === o.id;
              const palette = scorePalette(scoreInput);

              return (
                <motion.div
                  key={o.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-lg border p-3 ${
                    isCompleted
                      ? "border-emerald-100 bg-emerald-50/50"
                      : isRejected
                      ? "border-red-100 bg-red-50/50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{o.title}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{o.lessons?.users?.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {isCompleted && o.score != null && <ScoreBadge score={o.score} size="sm" />}
                      <span
                        className={`whitespace-nowrap rounded px-2 py-1 text-[10px] font-bold uppercase ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : isRejected
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isCompleted ? "Teslim Edildi" : isRejected ? "Reddedildi" : "Bekliyor"}
                      </span>
                    </div>
                  </div>

                  {isRejected && o.rejection_reason && (
                    <div className="mt-2 rounded bg-red-100/50 p-2 text-xs text-red-700">
                      <span className="font-semibold">Sebep:</span> {o.rejection_reason}
                    </div>
                  )}

                  {isCompleted && (
                    <div className="mt-2 space-y-2 border-t border-emerald-100 pt-2">
                      {o.submitted_at && (
                        <p className="text-[10px] text-slate-500">
                          {new Date(o.submitted_at).toLocaleString("tr-TR")}
                        </p>
                      )}
                      {o.submission_text && (
                        <p className="rounded border border-slate-100 bg-white p-2 text-xs text-slate-700">
                          {o.submission_text}
                        </p>
                      )}

                      <div className="mt-2 flex flex-col gap-2">
                        {o.submission_signed_url && (
                          <a
                            href={o.submission_signed_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block text-xs font-medium text-blue-600 hover:underline"
                          >
                            Teslim dosyasını aç
                          </a>
                        )}

                        <AnimatePresence mode="wait" initial={false}>
                          {isGrading ? (
                            <motion.div
                              key="grade-form"
                              initial={{ opacity: 0, y: -6, height: 0 }}
                              animate={{ opacity: 1, y: 0, height: "auto" }}
                              exit={{ opacity: 0, y: -6, height: 0 }}
                              transition={{ duration: 0.25, ease: "easeOut" }}
                              className="mt-2 overflow-hidden"
                            >
                              <div className={`rounded-lg border bg-white p-3 ${palette.border}`}>
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Ödevi Puanla
                                  </span>
                                  <motion.span
                                    key={Math.round(scoreInput)}
                                    initial={{ scale: 0.85, opacity: 0.6 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.18 }}
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${palette.bg} ${palette.text}`}
                                  >
                                    ★ {Math.round(scoreInput)} / 100
                                  </motion.span>
                                </div>

                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={scoreInput}
                                  onChange={(e) => setScoreInput(Number(e.target.value))}
                                  className={`w-full cursor-pointer ${palette.sliderAccent}`}
                                />

                                <div className="mt-2 flex items-center gap-2">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={scoreInput}
                                    onChange={(e) => {
                                      const v = Number(e.target.value);
                                      if (Number.isFinite(v)) setScoreInput(Math.max(0, Math.min(100, v)));
                                    }}
                                    className="w-20 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-center text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                                  />
                                  <span className="text-xs text-slate-400">/ 100 · {palette.label}</span>
                                </div>

                                <div className="mt-3 flex gap-2">
                                  <motion.button
                                    onClick={() => odeviPuanla(o.id)}
                                    disabled={gradeSaving}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-70"
                                  >
                                    {gradeSaving && <Spinner />}
                                    {gradeSaving ? "Kaydediliyor..." : "Puanı Kaydet"}
                                  </motion.button>
                                  <button
                                    onClick={() => setGradingId(null)}
                                    className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                                  >
                                    İptal
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ) : isRejectingThis ? (
                            <motion.div
                              key="reject-form"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-2 space-y-2 overflow-hidden rounded border border-slate-200 bg-white p-2"
                            >
                              <textarea
                                className="w-full rounded border border-slate-200 p-2 text-xs outline-none focus:border-red-500"
                                placeholder="Öğrenciye reddetme sebebini yazın..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => odeviReddet(o.id, o.submission_file_path)}
                                  className="flex-1 rounded bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
                                >
                                  Geri Gönder
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingId(null);
                                    setRejectionReason("");
                                  }}
                                  className="rounded bg-slate-100 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-200"
                                >
                                  İptal
                                </button>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="action-triggers"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="mt-1 flex items-center gap-3"
                            >
                              <button
                                onClick={() => openGrading(o)}
                                className="text-xs font-medium text-emerald-700 transition-colors hover:text-emerald-800"
                              >
                                {o.score != null ? "Puanı Düzenle" : "Puanla"}
                              </button>
                              <span className="text-slate-200">·</span>
                              <button
                                onClick={() => openReject(o.id)}
                                className="text-xs text-slate-500 transition-colors hover:text-red-600"
                              >
                                Reddet
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
