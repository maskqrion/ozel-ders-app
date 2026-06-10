"use server";

import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createServer } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

/** Kullanıcı başına 5 AI quiz / 3600 saniye (1 saat) — Anthropic maliyeti */
const AI_QUIZ_LIMIT = 5;
const AI_QUIZ_WINDOW_SECS = 3600;

export type AiQuestion = {
  question_text: string;
  options: [string, string, string, string];
  correct_index: number;
};

const schema = z.object({
  lessonId: z.string().uuid("Geçersiz ders kimliği.").optional(),
  topic: z
    .string()
    .min(3, "Konu en az 3 karakter olmalıdır.")
    .max(200, "Konu en fazla 200 karakter olabilir."),
  questionCount: z
    .number()
    .int()
    .min(3, "En az 3 soru seçin.")
    .max(20, "En fazla 20 soru üretilebilir."),
  difficulty: z.enum(["kolay", "orta", "zor"]),
});

export type AiQuizInput = z.infer<typeof schema>;

export type AiQuizResult =
  | { ok: true; quizId: string; questions: AiQuestion[] }
  | { ok: false; error: string };

const DIFFICULTY_LABEL: Record<string, string> = {
  kolay: "kolay (temel bilgi ve hatırlama)",
  orta: "orta (kavrayış ve uygulama)",
  zor: "zor (analiz, sentez ve değerlendirme)",
};

export async function generateAIQuiz(input: AiQuizInput): Promise<AiQuizResult> {
  /* 1. Validate */
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { lessonId, topic, questionCount, difficulty } = parsed.data;

  /* 2. API key guard */
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "AI quiz şu an kullanılamıyor. Sistem yöneticisi ile iletişime geçin.",
    };
  }

  /* 3. Auth */
  const supabase = await createServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  /* 4. Rate limit — Anthropic API maliyeti koruması */
  const rl = await rateLimit(`ai-quiz:${user.id}`, AI_QUIZ_LIMIT, AI_QUIZ_WINDOW_SECS);
  if (!rl.success) {
    return { ok: false, error: rl.retryAfterMessage };
  }
  let questions: AiQuestion[];
  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: "Sen Türkçe eğitim içeriği üreten bir asistansın. Yalnızca geçerli JSON döndür, başka açıklama ekleme.",
      messages: [
        {
          role: "user",
          content: `"${topic}" konusunda ${questionCount} adet ${DIFFICULTY_LABEL[difficulty]} zorluk seviyesinde çoktan seçmeli Türkçe soru oluştur.

Yanıtı SADECE aşağıdaki JSON dizisi formatında ver, başka hiçbir metin ekleme:
[
  {
    "question_text": "Soru metni?",
    "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
    "correct_index": 0
  }
]

Kurallar:
- Her soruda tam olarak 4 şık olmalı
- correct_index değeri 0-3 arasında olmalı (0=A, 1=B, 2=C, 3=D)
- Tüm soru ve şıklar Türkçe olmalı`,
        },
      ],
    });

    const content0 = message.content[0];
    const text = content0?.type === "text" ? content0.text : "";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Yanıtta JSON bulunamadı.");

    const raw: unknown[] = JSON.parse(match[0]);
    if (!Array.isArray(raw)) throw new Error("JSON dizi formatında değil.");

    questions = raw
      .map((q) => {
        if (typeof q !== "object" || q === null) return null;
        const item = q as Record<string, unknown>;
        const questionText = String(item.question_text ?? "").trim();
        const rawOptions = Array.isArray(item.options) ? item.options : [];
        const opts = rawOptions.slice(0, 4).map((o) =>
          typeof o === "string" ? o.trim() : "",
        );
        const correctIndex = Math.max(0, Math.min(3, Number(item.correct_index ?? 0)));
        if (!questionText || opts.length < 4 || opts.some((o) => !o)) return null;
        return {
          question_text: questionText,
          options: opts as [string, string, string, string],
          correct_index: correctIndex,
        };
      })
      .filter((q): q is AiQuestion => q !== null);

    if (questions.length === 0) throw new Error("Geçerli soru üretilemedi.");
  } catch (err: unknown) {
    console.error("[generateAIQuiz]", err instanceof Error ? err.message : err);
    return { ok: false, error: "Sorular üretilemedi. Lütfen tekrar deneyin." };
  }

  /* 5. Atomik quiz + soru oluşturma (tek transaction) */
  const { data: quizId, error: rpcErr } = await supabase.rpc("create_quiz_with_questions", {
    p_title: topic,
    p_description: "",
    p_questions: questions.map((q, i) => ({
      question_text: q.question_text,
      options: q.options,
      correct_index: q.correct_index,
      order_index: i,
    })),
  });

  if (rpcErr || !quizId) {
    return { ok: false, error: "Quiz veritabanına kaydedilemedi." };
  }

  /* 6. Ekstra alanları güncelle (is_ai_generated, lesson_id) */
  const { error: updateErr } = await supabase
    .from("quizzes")
    .update({
      is_ai_generated: true,
      ...(lessonId ? { lesson_id: lessonId } : {}),
    })
    .eq("id", quizId);

  if (updateErr) {
    Sentry.captureException(updateErr, {
      extra: { action: "generateAIQuiz", step: "metadata_update", quizId },
    });
    await supabase.from("quizzes").delete().eq("id", quizId);
    return { ok: false, error: "Quiz kaydedilemedi. Lütfen tekrar deneyin." };
  }

  return { ok: true, quizId, questions };
}
