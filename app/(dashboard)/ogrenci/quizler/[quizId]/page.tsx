"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import { submitQuizAnswers } from "@/app/actions/quiz-submit";

/* ── Types ────────────────────────────────────────────────── */
interface Question {
  id: string;
  question_text: string;
  options: string[];
  order_index: number;
}

interface QuizMeta {
  id: string;
  title: string;
  description: string | null;
}

/* ── Icons ─────────────────────────────────────────────────── */
type IconProps = { size?: number; strokeWidth?: number; className?: string };
const IconBase = ({
  children,
  size = 24,
  strokeWidth = 1.75,
  className = "",
}: IconProps & { children: React.ReactNode }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const ArrowLeftIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </IconBase>
);
const ArrowRightIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </IconBase>
);
const CheckIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M20 6 9 17l-5-5" />
  </IconBase>
);

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function QuizCozPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizMeta | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchQuiz = useCallback(async () => {
    const [quizRes, questionsRes] = await Promise.all([
      supabase.from("quizzes").select("id, title, description").eq("id", quizId).single(),
      supabase
        .from("quiz_questions")
        .select("id, question_text, options, order_index")
        .eq("quiz_id", quizId)
        .order("order_index"),
    ]);

    if (quizRes.error || !quizRes.data) {
      setNotFound(true);
      return;
    }

    const qs: Question[] = (questionsRes.data ?? []).map((q) => ({
      id: q.id,
      question_text: q.question_text,
      options: q.options as string[],
      order_index: q.order_index,
    }));

    setQuiz(quizRes.data);
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
    setLoading(false);
  }, [quizId]);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        await supabase.auth.signOut();
        return router.push("/login");
      }
      await fetchQuiz();
    };
    init();
  }, [router, fetchQuiz]);

  const selectAnswer = (optionIdx: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = optionIdx;
      return next;
    });
  };

  const handleSubmit = () => {
    if (answers.some((a) => a === null)) {
      toast.error("Tüm soruları yanıtlayın.");
      return;
    }
    startTransition(async () => {
      const result = await submitQuizAnswers(quizId, answers as number[]);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.xpEarned > 0) {
        if (result.xpAwarded) {
          toast.success(`+${result.xpEarned} XP kazandın!`, {
            icon: "✨",
            style: { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", fontWeight: 600 },
          });
        } else {
          toast("Quiz tamamlandı! XP ödülü şu an işlenemiyor.", { icon: "⚠️" });
        }
      }
      router.push(
        `/ogrenci/quizler/${quizId}/sonuc?attemptId=${result.attemptId}`,
      );
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Quiz yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (notFound || !quiz) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-center">
        <p className="text-lg font-semibold text-slate-700">Quiz bulunamadı.</p>
        <Link href="/ogrenci/quizler" className="text-sm text-blue-600 hover:underline">
          Geri Dön
        </Link>
      </div>
    );
  }

  const current = questions[step];
  const answered = answers[step];
  const isLast = step === questions.length - 1;
  const progress = ((step + 1) / questions.length) * 100;
  const answeredCount = answers.filter((a) => a !== null).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans text-slate-800">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <Link
          href="/ogrenci/quizler"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-blue-600"
        >
          <ArrowLeftIcon size={16} strokeWidth={2} />
          <span className="hidden sm:inline">Quizlere Dön</span>
        </Link>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">{quiz.title}</p>
          <p className="text-xs text-slate-400">
            {answeredCount}/{questions.length} yanıtlandı
          </p>
        </div>
        <div className="w-24 text-right text-xs font-medium text-slate-500">
          {step + 1} / {questions.length}
        </div>
      </nav>

      {/* Progress bar */}
      <div className="h-1 w-full bg-slate-100">
        <m.div
          className="h-full bg-blue-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Question */}
        <AnimatePresence mode="wait">
          <m.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step indicator */}
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-500">
              Soru {step + 1}
            </div>

            {/* Question text */}
            <h2 className="mb-8 text-xl font-bold leading-snug text-slate-800">
              {current.question_text}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {current.options.map((option, i) => {
                const isSelected = answered === i;
                return (
                  <button
                    key={i}
                    onClick={() => selectAnswer(i)}
                    className={`w-full rounded-xl border-2 px-5 py-4 text-left text-sm font-medium transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/40"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                          isSelected
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-slate-300 text-slate-400"
                        }`}
                      >
                        {isSelected ? (
                          <CheckIcon size={12} strokeWidth={3} />
                        ) : (
                          String.fromCharCode(65 + i)
                        )}
                      </span>
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          </m.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <ArrowLeftIcon size={15} strokeWidth={2} />
            Önceki
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={isPending || answers.some((a) => a === null)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-500/20 transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <>
                  <CheckIcon size={15} strokeWidth={2.5} />
                  Quizi Tamamla
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => Math.min(questions.length - 1, s + 1))}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-700"
            >
              Sonraki
              <ArrowRightIcon size={15} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Question dots */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2.5 w-2.5 rounded-full transition ${
                i === step
                  ? "bg-blue-500 scale-125"
                  : answers[i] !== null
                    ? "bg-emerald-400"
                    : "bg-slate-200"
              }`}
              aria-label={`Soru ${i + 1}`}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
