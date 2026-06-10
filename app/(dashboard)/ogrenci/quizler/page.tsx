"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";

/* ── Types ────────────────────────────────────────────────── */
interface Quiz {
  id: string;
  title: string;
  description: string | null;
  hoca_id: string;
  created_at: string;
  question_count: number;
  attempt: { score: number; total: number; created_at: string } | null;
}

interface RawQuizRow {
  id: string;
  title: string;
  description: string | null;
  hoca_id: string;
  created_at: string;
  quiz_questions: { count: number }[];
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
const BookOpenIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </IconBase>
);
const CheckCircleIcon = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </IconBase>
);
const PlayIcon = (p: IconProps) => (
  <IconBase {...p}>
    <polygon points="6 3 20 12 6 21 6 3" />
  </IconBase>
);
const ClipboardIcon = (p: IconProps) => (
  <IconBase {...p}>
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="m9 14 2 2 4-4" />
  </IconBase>
);

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function QuizlerPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuizzes = useCallback(async (userId: string) => {
    const { data: teacherRows } = await supabase
      .from("teacher_students")
      .select("hoca_id")
      .eq("ogrenci_id", userId);

    const teacherIds = (teacherRows ?? []).map((r) => r.hoca_id);

    if (teacherIds.length === 0) {
      setQuizzes([]);
      return;
    }

    const [quizzesRes, attemptsRes] = await Promise.all([
      supabase
        .from("quizzes")
        .select("id, title, description, hoca_id, created_at, quiz_questions(count)")
        .in("hoca_id", teacherIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("quiz_attempts")
        .select("quiz_id, score, total, created_at")
        .eq("student_id", userId)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const attemptsMap = new Map<
      string,
      { score: number; total: number; created_at: string }
    >();
    for (const a of attemptsRes.data ?? []) {
      if (!attemptsMap.has(a.quiz_id)) {
        attemptsMap.set(a.quiz_id, {
          score: a.score,
          total: a.total,
          created_at: a.created_at,
        });
      }
    }

    const mapped: Quiz[] = ((quizzesRes.data ?? []) as RawQuizRow[]).map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      hoca_id: q.hoca_id,
      created_at: q.created_at,
      question_count: q.quiz_questions[0]?.count ?? 0,
      attempt: attemptsMap.get(q.id) ?? null,
    }));

    setQuizzes(mapped);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) {
          await supabase.auth.signOut();
          return router.push("/login");
        }
        await fetchQuizzes(user.id);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router, fetchQuizzes]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans text-slate-800">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-emerald-100 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/ogrenci"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-emerald-600"
          >
            <ArrowLeftIcon size={16} strokeWidth={2} />
            <span className="hidden sm:inline">Panele Dön</span>
          </Link>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-500">
              <BookOpenIcon size={14} strokeWidth={2.2} className="text-white" />
            </div>
            <span className="font-bold text-blue-600">Quizlerim</span>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
            <ClipboardIcon size={22} strokeWidth={2} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">Quizlerim</h1>
            <p className="text-sm text-slate-500">
              Öğretmenlerinizin hazırladığı quizleri çöz ve XP kazan
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 h-4 w-2/3 rounded-full bg-slate-100" />
                <div className="mb-4 h-3 w-1/2 rounded-full bg-slate-100" />
                <div className="h-9 w-28 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center gap-4 py-20 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <BookOpenIcon size={28} className="text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">Henüz quiz yok</p>
              <p className="mt-1 text-sm text-slate-400">
                Öğretmenleriniz quiz paylaştığında burada görünecek.
              </p>
            </div>
          </m.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence initial={false}>
              {quizzes.map((quiz, idx) => (
                <QuizCard key={quiz.id} quiz={quiz} delay={idx * 0.04} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Quiz Card ──────────────────────────────────────────────── */
function QuizCard({ quiz, delay }: { quiz: Quiz; delay: number }) {
  const pct =
    quiz.attempt && quiz.attempt.total > 0
      ? Math.round((quiz.attempt.score / quiz.attempt.total) * 100)
      : null;

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      {/* Header */}
      <div className="mb-1 flex items-start justify-between gap-2">
        <h2 className="font-semibold text-slate-800 leading-snug">{quiz.title}</h2>
        {quiz.attempt && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
              pct! >= 70
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {pct}%
          </span>
        )}
      </div>

      {quiz.description && (
        <p className="mb-3 line-clamp-2 text-sm text-slate-500">{quiz.description}</p>
      )}

      <div className="mb-4 flex items-center gap-3 text-xs text-slate-400">
        <span>{quiz.question_count} soru</span>
        {quiz.attempt && (
          <>
            <span>·</span>
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircleIcon size={12} strokeWidth={2.5} />
              {quiz.attempt.score}/{quiz.attempt.total} doğru
            </span>
          </>
        )}
      </div>

      {/* Score bar (if attempted) */}
      {quiz.attempt && (
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${
              pct! >= 70 ? "bg-emerald-400" : "bg-amber-400"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className="mt-auto flex gap-2">
        <Link
          href={`/ogrenci/quizler/${quiz.id}`}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-white transition ${
            quiz.attempt
              ? "bg-slate-600 hover:bg-slate-700"
              : "bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20"
          }`}
        >
          <PlayIcon size={14} strokeWidth={2.5} />
          {quiz.attempt ? "Tekrar Çöz" : "Çözmeye Başla"}
        </Link>
      </div>
    </m.div>
  );
}
