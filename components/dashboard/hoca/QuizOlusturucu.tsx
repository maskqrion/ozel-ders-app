"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";

type DraftQuestion = {
  uid: string;
  question_text: string;
  options: [string, string, string, string];
  correct_index: number;
};

function newQuestion(): DraftQuestion {
  const uid =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    uid,
    question_text: "",
    options: ["", "", "", ""],
    correct_index: 0,
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  defaultTitle?: string;
  onSaved: (quizId: string) => void | Promise<void>;
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

export default function QuizOlusturucu({ open, onClose, defaultTitle, onSaved }: Props) {
  const [title, setTitle] = useState<string>(defaultTitle ?? "");
  const [description, setDescription] = useState<string>("");
  const [questions, setQuestions] = useState<DraftQuestion[]>(() => [newQuestion()]);
  const [saving, setSaving] = useState(false);

  // Modal her açıldığında formu sıfırla (defaultTitle ile seed).
  useEffect(() => {
    if (open) {
      setTitle(defaultTitle ?? "");
      setDescription("");
      setQuestions([newQuestion()]);
      setSaving(false);
    }
    // defaultTitle bilinçli olarak deps dışı: sadece "open=true" transition'unda seed olsun
    // ki kullanıcı yazarken üst componentin prop değişimi formu sıfırlamasın.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ESC ile kapat
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, saving]);

  const addQuestion = () => setQuestions((qs) => [...qs, newQuestion()]);
  const removeQuestion = (uid: string) =>
    setQuestions((qs) => (qs.length <= 1 ? qs : qs.filter((q) => q.uid !== uid)));
  const updateQuestion = (uid: string, patch: Partial<DraftQuestion>) =>
    setQuestions((qs) => qs.map((q) => (q.uid === uid ? { ...q, ...patch } : q)));
  const updateOption = (uid: string, idx: number, value: string) =>
    setQuestions((qs) =>
      qs.map((q) =>
        q.uid === uid
          ? {
              ...q,
              options: q.options.map((o, i) => (i === idx ? value : o)) as DraftQuestion["options"],
            }
          : q,
      ),
    );

  const validate = (): string | null => {
    if (!title.trim()) return "Quiz başlığı zorunludur.";
    if (questions.length === 0) return "En az bir soru eklemelisiniz.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) return `Soru ${i + 1}: soru metni boş olamaz.`;
      for (let j = 0; j < 4; j++) {
        if (!q.options[j].trim()) return `Soru ${i + 1}: ${"ABCD"[j]} şıkkı boş olamaz.`;
      }
      if (q.correct_index < 0 || q.correct_index > 3)
        return `Soru ${i + 1}: doğru cevap seçilmedi.`;
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("create_quiz_with_questions", {
        p_title: title.trim(),
        p_description: description.trim() || null,
        p_questions: questions.map((q, i) => ({
          question_text: q.question_text.trim(),
          options: q.options.map((o) => o.trim()),
          correct_index: q.correct_index,
          order_index: i,
        })),
      });
      if (error) throw error;
      await onSaved(data as string);
      onClose();
    } catch (err: any) {
      toast.error("Quiz kaydedilemedi: " + (err?.message ?? "Bilinmeyen hata"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quiz-modal-title"
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-sky-50 px-6 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                  Yeni Quiz
                </p>
                <h2 id="quiz-modal-title" className="text-lg font-semibold text-slate-800">
                  Quiz Oluşturucu
                </h2>
              </div>
              <button
                onClick={onClose}
                disabled={saving}
                aria-label="Kapat"
                className="rounded-full bg-white p-2 text-slate-500 shadow-sm ring-1 ring-slate-100 transition hover:bg-slate-50 disabled:opacity-50"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Quiz Başlığı
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="örn. 5. Hafta Pekiştirme Sınavı"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Açıklama (opsiyonel)
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Quiz'in kapsamı hakkında kısa not..."
                    className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700">
                      Sorular ({questions.length})
                    </h3>
                    <span className="text-xs text-slate-400">
                      Her sorunun bir doğru cevabı vardır.
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {questions.map((q, idx) => (
                      <motion.div
                        key={q.uid}
                        layout
                        initial={{ opacity: 0, y: 16, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                              Soru {idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeQuestion(q.uid)}
                              disabled={questions.length <= 1}
                              className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                              aria-label="Soruyu kaldır"
                              title={questions.length <= 1 ? "En az 1 soru olmalı" : "Soruyu kaldır"}
                            >
                              ✕
                            </button>
                          </div>

                          <textarea
                            rows={2}
                            value={q.question_text}
                            onChange={(e) =>
                              updateQuestion(q.uid, { question_text: e.target.value })
                            }
                            placeholder="Soru metni..."
                            className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 transition focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/15"
                          />

                          <div className="mt-3 space-y-2">
                            {q.options.map((opt, oi) => {
                              const letter = "ABCD"[oi];
                              const isCorrect = q.correct_index === oi;
                              return (
                                <label
                                  key={oi}
                                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition ${
                                    isCorrect
                                      ? "border-emerald-300 bg-emerald-50"
                                      : "border-slate-200 bg-white hover:bg-slate-50"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`correct-${q.uid}`}
                                    checked={isCorrect}
                                    onChange={() => updateQuestion(q.uid, { correct_index: oi })}
                                    className="accent-emerald-500"
                                  />
                                  <span
                                    className={`w-4 text-sm font-bold ${
                                      isCorrect ? "text-emerald-700" : "text-slate-400"
                                    }`}
                                  >
                                    {letter}
                                  </span>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => updateOption(q.uid, oi, e.target.value)}
                                    placeholder={`${letter} şıkkı`}
                                    className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                                  />
                                  {isCorrect && (
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                                      Doğru
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <motion.button
                    type="button"
                    onClick={addQuestion}
                    whileTap={{ scale: 0.98 }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <span aria-hidden>＋</span>
                    Yeni Soru Ekle
                  </motion.button>
                </div>
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-60"
              >
                İptal
              </button>
              <motion.button
                type="button"
                onClick={handleSave}
                disabled={saving}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-sky-600 disabled:opacity-70"
              >
                {saving && <Spinner />}
                {saving ? "Kaydediliyor..." : "Quiz'i Kaydet"}
              </motion.button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
