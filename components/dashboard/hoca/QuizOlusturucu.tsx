"use client";

import { AnimatePresence, m } from "framer-motion";
import { QuizOlusturucuProps } from "./quiz.types";
import { useQuizBuilder } from "./hooks/useQuizBuilder";
import { useAIQuizGenerator } from "./hooks/useAIQuizGenerator";
import { QuestionCard } from "./QuestionCard";
import { AIQuizPanel } from "./AIQuizPanel";

function Spinner() {
  return (
    <m.span
      aria-hidden
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white"
    />
  );
}

export default function QuizOlusturucu(props: QuizOlusturucuProps) {
  const { open, onClose, lessonId, onSaved } = props;
  
  const builder = useQuizBuilder(props);
  
  const aiGen = useAIQuizGenerator(
    lessonId,
    onSaved,
    onClose
  );

  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !builder.saving) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 p-4 backdrop-blur-sm"
        >
          <m.div
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
                disabled={builder.saving}
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
                    value={builder.title}
                    onChange={(e) => builder.setTitle(e.target.value)}
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
                    value={builder.description}
                    onChange={(e) => builder.setDescription(e.target.value)}
                    placeholder="Quiz'in kapsamı hakkında kısa not..."
                    className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700">
                      Sorular ({builder.questions.length})
                    </h3>
                    <span className="text-xs text-slate-400">
                      Her sorunun bir doğru cevabı vardır.
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {builder.questions.map((q, idx) => (
                      <QuestionCard
                        key={q.uid}
                        q={q}
                        idx={idx}
                        totalQuestions={builder.questions.length}
                        removeQuestion={builder.removeQuestion}
                        updateQuestion={builder.updateQuestion}
                        updateOption={builder.updateOption}
                      />
                    ))}
                  </AnimatePresence>

                  <AIQuizPanel
                    {...aiGen}
                    addQuestion={builder.addQuestion}
                  />
                </div>
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={builder.saving}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-60"
              >
                İptal
              </button>
              <m.button
                type="button"
                onClick={builder.handleSave}
                disabled={builder.saving}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-sky-600 disabled:opacity-70"
              >
                {builder.saving && <Spinner />}
                {builder.saving ? "Kaydediliyor..." : "Quiz'i Kaydet"}
              </m.button>
            </footer>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
