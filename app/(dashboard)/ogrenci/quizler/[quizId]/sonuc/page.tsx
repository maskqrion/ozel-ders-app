"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";

/* ── Types ────────────────────────────────────────────────── */
interface AnswerRow {
  question_id: string;
  answer: number;
  correct: boolean;
}

interface AttemptDetail {
  score: number;
  total: number;
  xp_earned: number;
  answers_json: AnswerRow[];
  quiz: {
    id: string;
    title: string;
  };
}

interface QuestionDetail {
  id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  order_index: number;
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

const CheckCircleIcon = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </IconBase>
);
const XCircleIcon = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </IconBase>
);
const TrophyIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </IconBase>
);
const ArrowLeftIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </IconBase>
);
const RepeatIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="m17 2 4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="m7 22-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </IconBase>
);
const StarIcon = (p: IconProps) => (
  <IconBase {...p}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </IconBase>
);

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function SonucPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");

  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [questions, setQuestions] = useState<QuestionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayedXp, setDisplayedXp] = useState(0);
  const [xpVisible, setXpVisible] = useState(false);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

      if (!attemptId) {
        router.push(`/ogrenci/quizler/${quizId}`);
        return;
      }

      const [attemptRes, questionsRes] = await Promise.all([
        supabase
          .from("quiz_attempts")
          .select("score, total, xp_earned, answers_json, quiz:quizzes(id, title)")
          .eq("id", attemptId)
          .eq("student_id", user.id)
          .single(),
        supabase
          .from("quiz_questions")
          .select("id, question_text, options, correct_index, order_index")
          .eq("quiz_id", quizId)
          .order("order_index"),
      ]);

      if (attemptRes.error || !attemptRes.data) {
        router.push(`/ogrenci/quizler/${quizId}`);
        return;
      }

      const raw = attemptRes.data as unknown as {
        score: number;
        total: number;
        xp_earned: number | null;
        answers_json: AnswerRow[];
        quiz: { id: string; title: string } | { id: string; title: string }[] | null;
      };
      const resolvedQuiz = Array.isArray(raw.quiz) ? raw.quiz[0] : raw.quiz;
      if (!resolvedQuiz) {
        router.push(`/ogrenci/quizler`);
        return;
      }
      setAttempt({
        score: raw.score,
        total: raw.total,
        xp_earned: raw.xp_earned ?? raw.score * 10,
        answers_json: raw.answers_json as AnswerRow[],
        quiz: resolvedQuiz,
      });
      setQuestions(
        (questionsRes.data ?? []).map((q) => ({
          id: q.id,
          question_text: q.question_text,
          options: q.options as string[],
          correct_index: q.correct_index,
          order_index: q.order_index,
        })),
      );
      setLoading(false);
    };
    init();
  }, [router, quizId, attemptId]);

  /* ── XP count-up animation ── */
  // XP kazanılmadıysa rozeti render sırasında görünür yap
  // (effect içinde senkron setState cascading render yaratıyordu).
  const [prevAttempt, setPrevAttempt] = useState<AttemptDetail | null | undefined>(undefined);
  if (prevAttempt !== attempt) {
    setPrevAttempt(attempt);
    if (!attempt || attempt.xp_earned === 0) {
      setXpVisible(true);
    }
  }

  useEffect(() => {
    if (!attempt || attempt.xp_earned === 0) return;
    const target = attempt.xp_earned;
    const steps = 40;
    const stepMs = 20;
    let current = 0;
    const increment = target / steps;

    const delay = setTimeout(() => {
      setXpVisible(true);
      countRef.current = setInterval(() => {
        current += increment;
        if (current >= target) {
          setDisplayedXp(target);
          if (countRef.current) clearInterval(countRef.current);
        } else {
          setDisplayedXp(Math.round(current));
        }
      }, stepMs);
    }, 400);

    return () => {
      clearTimeout(delay);
      if (countRef.current) clearInterval(countRef.current);
    };
  }, [attempt]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (!attempt) return null;

  const pct = attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0;
  const isPerfect = attempt.score === attempt.total;
  const isGood = pct >= 70;
  const passed = pct >= 60;

  const answerMap = new Map<string, AnswerRow>();
  for (const a of attempt.answers_json) {
    answerMap.set(a.question_id, a);
  }

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
        <span className="font-semibold text-slate-700">Quiz Sonucu</span>
        <div className="w-24" />
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Score hero */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          {/* Gradient header */}
          <div
            className={`px-6 py-8 text-center ${
              isPerfect
                ? "bg-gradient-to-br from-amber-400 to-orange-500"
                : isGood
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                  : "bg-gradient-to-br from-blue-400 to-blue-600"
            }`}
          >
            <div className="mb-3 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <TrophyIcon size={32} strokeWidth={1.75} className="text-white" />
              </div>
            </div>
            <p className="text-5xl font-extrabold text-white">{pct}%</p>
            <p className="mt-1 text-white/80">
              {attempt.score} / {attempt.total} doğru
            </p>
            {isPerfect && (
              <p className="mt-2 flex items-center justify-center gap-1 text-sm font-bold text-white">
                <StarIcon size={14} strokeWidth={2.5} className="fill-white" />
                Mükemmel!
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
            <div className="flex flex-col items-center py-4">
              <span className="text-xl font-bold text-emerald-600">{attempt.score}</span>
              <span className="text-xs text-slate-400">Doğru</span>
            </div>
            <div className="flex flex-col items-center py-4">
              <span className="text-xl font-bold text-rose-500">
                {attempt.total - attempt.score}
              </span>
              <span className="text-xs text-slate-400">Yanlış</span>
            </div>
            <div className="flex flex-col items-center py-4">
              <span className="text-xl font-bold text-amber-500 tabular-nums">
                +{displayedXp}
              </span>
              <span className="text-xs text-slate-400">XP</span>
            </div>
          </div>
        </m.div>

        {/* ── Animated XP + Passed/Failed card ── */}
        <AnimatePresence>
          {xpVisible && (
            <m.div
              key="xp-card"
              initial={{ opacity: 0, y: 20, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={`mb-6 overflow-hidden rounded-2xl border ${
                passed
                  ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50"
                  : "border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50"
              }`}
            >
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${passed ? "text-emerald-600" : "text-rose-500"}`}>
                    Kazanılan XP
                  </p>
                  <m.p
                    key={displayedXp}
                    className={`mt-0.5 text-4xl font-black tabular-nums ${passed ? "text-emerald-600" : "text-rose-500"}`}
                  >
                    +{displayedXp}
                  </m.p>
                  <p className="mt-1 text-xs text-slate-400">
                    Her doğru cevap 10 XP
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-xl px-4 py-2 text-sm font-black tracking-wide ${
                      passed
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                        : "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                    }`}
                  >
                    {passed ? "GEÇTİ ✓" : "KALMADI"}
                  </span>
                  <span className="text-xs text-slate-400">
                    Geçme eşiği: %60
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-slate-100">
                <m.div
                  className={`h-full rounded-full ${passed ? "bg-emerald-500" : "bg-rose-400"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                />
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Question review */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <h2 className="mb-4 font-semibold text-slate-700">Soru Analizi</h2>
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const ans = answerMap.get(q.id);
              const userAnswer = ans?.answer ?? -1;
              const isCorrect = ans?.correct ?? false;

              return (
                <div
                  key={q.id}
                  className={`rounded-xl border p-4 ${
                    isCorrect
                      ? "border-emerald-100 bg-emerald-50"
                      : "border-rose-100 bg-rose-50"
                  }`}
                >
                  {/* Question header */}
                  <div className="mb-3 flex items-start gap-2">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        isCorrect ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircleIcon size={12} strokeWidth={2.5} className="text-white" />
                      ) : (
                        <XCircleIcon size={12} strokeWidth={2.5} className="text-white" />
                      )}
                    </span>
                    <p className="text-sm font-medium text-slate-800">
                      <span className="text-slate-400">S{idx + 1}: </span>
                      {q.question_text}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-1.5 pl-7">
                    {q.options.map((opt, i) => {
                      const isUserChoice = i === userAnswer;
                      const isCorrectChoice = i === q.correct_index;
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${
                            isCorrectChoice
                              ? "bg-emerald-100 text-emerald-800 font-medium"
                              : isUserChoice && !isCorrectChoice
                                ? "bg-rose-100 text-rose-700 line-through"
                                : "text-slate-500"
                          }`}
                        >
                          <span className="font-bold">{String.fromCharCode(65 + i)}.</span>
                          {opt}
                          {isCorrectChoice && (
                            <CheckCircleIcon
                              size={12}
                              strokeWidth={2.5}
                              className="ml-auto shrink-0 text-emerald-600"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </m.div>

        {/* Actions */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-8 flex gap-3"
        >
          <Link
            href="/ogrenci/quizler"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeftIcon size={15} strokeWidth={2} />
            Quiz Listesi
          </Link>
          <Link
            href={`/ogrenci/quizler/${quizId}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-700"
          >
            <RepeatIcon size={14} strokeWidth={2} />
            Tekrar Çöz
          </Link>
        </m.div>
      </main>
    </div>
  );
}
