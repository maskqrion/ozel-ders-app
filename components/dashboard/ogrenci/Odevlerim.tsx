"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import type { Assignment } from "@/lib/types";
import ScoreBadge from "@/components/dashboard/shared/ScoreBadge";
import ScoreRing from "@/components/dashboard/shared/ScoreRing";
import { scorePalette } from "@/components/dashboard/shared/scoreColors";

type Props = {
  userId: string;
  odevler: Assignment[];
  refetchOdevler: () => void | Promise<void>;
  onAwardXp?: (amount: number, action: string) => void | Promise<void>;
};

export default function Odevlerim({ userId, odevler, refetchOdevler, onAwardXp }: Props) {
  const [submissionText, setSubmissionText] = useState<Record<string, string>>({});
  const [submissionFile, setSubmissionFile] = useState<Record<string, File | null>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const teslimEt = async (assignmentId: string) => {
    const text = (submissionText[assignmentId] || "").trim();
    const file = submissionFile[assignmentId];

    if (!text && !file) {
      toast.error("Teslim için en az bir açıklama veya dosya ekle.");
      return;
    }

    setSubmitting(assignmentId);
    try {
      let filePath: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop();
        filePath = `submissions/${userId}/${assignmentId}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("kaynaklar").upload(filePath, file);
        if (uploadError) throw uploadError;
      }

      const { error } = await supabase
        .from("assignments")
        .update({
          submission_text: text || null,
          submission_file_path: filePath,
          submitted_at: new Date().toISOString(),
          status: "yapildi",
          rejection_reason: null,
        })
        .eq("id", assignmentId);

      if (error) throw error;

      setSubmissionText((prev) => {
        const next = { ...prev };
        delete next[assignmentId];
        return next;
      });
      setSubmissionFile((prev) => {
        const next = { ...prev };
        delete next[assignmentId];
        return next;
      });

      await refetchOdevler();
      toast.success("Ödeviniz başarıyla teslim edildi.");
      onAwardXp?.(50, "Ödev teslim edildi");
    } catch (err: any) {
      toast.error("Hata: " + err.message);
    } finally {
      setSubmitting(null);
    }
  };

  if (odevler.length === 0) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-lg border border-slate-200 bg-white p-4 text-slate-500"
      >
        Henüz bir ödev tanımlanmadı.
      </motion.p>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {odevler.map((o) => {
          const isCompleted = o.status === "yapildi";
          const isRejected = o.status === "reddedildi";

          return (
            <motion.div
              key={o.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className={`rounded-xl border bg-white p-5 shadow-sm ${
                isRejected ? "border-red-300" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900">{o.title}</h4>
                  {o.description && <p className="mt-1 text-sm text-slate-600">{o.description}</p>}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {isCompleted && o.score != null && <ScoreBadge score={o.score} size="sm" />}
                  <span
                    className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${
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

              {isRejected && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-md border border-red-100 bg-red-50 p-3"
                >
                  <p className="text-sm font-semibold text-red-800">Hocanız ödevinizi kabul etmedi!</p>
                  {o.rejection_reason && (
                    <p className="mt-1 text-sm text-red-700">
                      <span className="font-semibold">Sebep:</span> {o.rejection_reason}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-red-600">
                    Lütfen eksiklerinizi giderip aşağıdan tekrar teslim ediniz.
                  </p>
                </motion.div>
              )}

              {isCompleted ? (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  <AnimatePresence mode="wait" initial={false}>
                    {o.score != null ? (
                      (() => {
                        const p = scorePalette(o.score);
                        return (
                          <motion.div
                            key="scored"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className={`flex items-center gap-4 rounded-xl border bg-white p-4 ${p.border}`}
                          >
                            <ScoreRing score={o.score} size={88} stroke={9} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Hocanın Notu
                              </p>
                              <p className={`mt-1 text-2xl font-extrabold leading-none ${p.text}`}>
                                {o.score} / 100
                              </p>
                              <p className="mt-1 text-xs text-slate-500">{p.label}</p>
                            </div>
                          </motion.div>
                        );
                      })()
                    ) : (
                      <motion.div
                        key="not-scored"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500"
                      >
                        <span aria-hidden>⏳</span>
                        Hocanız ödevinizi henüz değerlendirmedi.
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {o.submitted_at && (
                    <p className="text-xs text-slate-500">
                      Teslim: {new Date(o.submitted_at).toLocaleString("tr-TR")}
                    </p>
                  )}
                  {o.submission_text && (
                    <div className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                      {o.submission_text}
                    </div>
                  )}
                  {o.submission_signed_url && (
                    <a
                      href={o.submission_signed_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition-colors hover:text-sky-700 hover:underline"
                    >
                      Dosyanı görüntüle
                    </a>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  <textarea
                    placeholder="Açıklama (opsiyonel)..."
                    rows={2}
                    value={submissionText[o.id] || ""}
                    onChange={(e) =>
                      setSubmissionText((prev) => ({ ...prev, [o.id]: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                  />
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="file"
                      onChange={(e) =>
                        setSubmissionFile((prev) => ({
                          ...prev,
                          [o.id]: e.target.files?.[0] || null,
                        }))
                      }
                      className="min-w-0 flex-1 text-sm text-slate-500 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                    <button
                      type="button"
                      onClick={() => teslimEt(o.id)}
                      disabled={submitting === o.id}
                      className="whitespace-nowrap rounded-md bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting === o.id ? "Gönderiliyor..." : isRejected ? "Tekrar Teslim Et" : "Teslim Et"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
