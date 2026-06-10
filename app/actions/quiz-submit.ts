"use server";

import { z } from "zod";
import { createServer } from "@/lib/supabase/server";

const submitSchema = z.object({
  quizId:  z.string().uuid("Geçersiz quiz kimliği."),
  answers: z.array(z.number().int().min(0).max(3)),
});

export type QuizSubmitResult =
  | { ok: true; score: number; total: number; attemptId: string; xpEarned: number; xpAwarded: boolean; passed: boolean }
  | { ok: false; error: string };

export async function submitQuizAnswers(
  quizId: string,
  answers: number[],
): Promise<QuizSubmitResult> {
  const parsed = submitSchema.safeParse({ quizId, answers });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  // Erişim kontrolü: quiz'in hocası ile öğrenci arasında teacher_students bağlantısı olmalı
  const { data: quiz, error: quizErr } = await supabase
    .from("quizzes")
    .select("hoca_id")
    .eq("id", parsed.data.quizId)
    .single();

  if (quizErr || !quiz) {
    return { ok: false, error: "Quiz bulunamadı." };
  }

  const { count: accessCount, error: accessErr } = await supabase
    .from("teacher_students")
    .select("ogrenci_id", { count: "exact", head: true })
    .eq("hoca_id", quiz.hoca_id)
    .eq("ogrenci_id", user.id);

  if (accessErr || (accessCount ?? 0) === 0) {
    return { ok: false, error: "Bu quiz'e erişim yetkiniz yok." };
  }

  // XP farming koruması: bu quiz için daha önce tamamlanmış deneme var mı?
  // İlk denemede XP kazanılır; sonraki denemeler sıfır XP ile kaydedilir.
  const { count: priorCount, error: countErr } = await supabase
    .from("quiz_attempts")
    .select("id", { count: "exact", head: true })
    .eq("quiz_id", parsed.data.quizId)
    .eq("student_id", user.id);

  if (countErr) {
    return { ok: false, error: "Quiz geçmişi kontrol edilemedi." };
  }

  const isFirstAttempt = (priorCount ?? 0) === 0;

  const { data: questions, error: qError } = await supabase
    .from("quiz_questions")
    .select("id, correct_index, order_index")
    .eq("quiz_id", parsed.data.quizId)
    .order("order_index");

  if (qError || !questions) {
    return { ok: false, error: "Quiz soruları alınamadı." };
  }

  const total = questions.length;
  let score = 0;
  const answersJson = questions.map((q, i) => {
    const userAnswer = parsed.data.answers[i] ?? -1;
    const correct = userAnswer === q.correct_index;
    if (correct) score++;
    return { question_id: q.id, answer: userAnswer, correct };
  });

  // XP yalnızca ilk başarılı denemede kazanılır
  const xpEarned = isFirstAttempt ? score * 10 : 0;

  const { data: attempt, error: insertError } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id:      parsed.data.quizId,
      student_id:   user.id,
      score,
      total,
      xp_earned:    xpEarned,
      answers_json: answersJson,
    })
    .select("id")
    .single();

  if (insertError || !attempt) {
    return { ok: false, error: "Quiz yanıtları kaydedilemedi." };
  }

  let xpAwarded = false;
  if (xpEarned > 0) {
    const { error: xpErr } = await supabase.rpc("add_user_xp", { amount: xpEarned });
    if (xpErr) {
      console.error("[submitQuizAnswers] add_user_xp failed:", xpErr.message);
    } else {
      xpAwarded = true;
    }
  }

  const passed = score >= Math.ceil(total * 0.6);
  return { ok: true, score, total, attemptId: attempt.id, xpEarned, xpAwarded, passed };
}
