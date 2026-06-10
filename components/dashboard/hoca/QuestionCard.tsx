import { m } from "framer-motion";
import { DraftQuestion } from "./quiz.types";

interface QuestionCardProps {
  q: DraftQuestion;
  idx: number;
  totalQuestions: number;
  removeQuestion: (uid: string) => void;
  updateQuestion: (uid: string, patch: Partial<DraftQuestion>) => void;
  updateOption: (uid: string, idx: number, value: string) => void;
}

export function QuestionCard({
  q,
  idx,
  totalQuestions,
  removeQuestion,
  updateQuestion,
  updateOption,
}: QuestionCardProps) {
  return (
    <m.div
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
            disabled={totalQuestions <= 1}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
            aria-label="Soruyu kaldır"
            title={totalQuestions <= 1 ? "En az 1 soru olmalı" : "Soruyu kaldır"}
          >
            ✕
          </button>
        </div>

        <textarea
          rows={2}
          value={q.question_text}
          onChange={(e) => updateQuestion(q.uid, { question_text: e.target.value })}
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
    </m.div>
  );
}
