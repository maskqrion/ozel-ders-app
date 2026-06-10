"use server";

import { revalidatePath } from "next/cache";
import { createServer } from "@/lib/supabase/server";
import {
  submitAssignmentSchema,
  validateSubmissionFile,
  sanitizeFileName,
} from "@/lib/validations/assignments";
import { rateLimit } from "@/lib/rate-limit";

/** Kullanıcı başına 10 upload / 3600 saniye (1 saat) */
const UPLOAD_LIMIT = 10;
const UPLOAD_WINDOW_SECS = 3600;

export async function uploadSubmissionFile(
  formData: FormData,
): Promise<{ path?: string; error?: string }> {
  const supabase = await createServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Oturum bulunamadı." };

  // Rate limit: kullanıcı başına 10 upload / saat
  const rl = await rateLimit(`upload:${user.id}`, UPLOAD_LIMIT, UPLOAD_WINDOW_SECS);
  if (!rl.success) {
    return { error: rl.retryAfterMessage };
  }

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Dosya bulunamadı." };

  // Type, size ve path traversal kontrolü
  const fileError = validateSubmissionFile(file);
  if (fileError) return { error: fileError };

  const safeName = `${Date.now()}_${sanitizeFileName(file.name)}`;
  const filePath = `teslimler/${user.id}/${safeName}`;

  const { data, error } = await supabase.storage
    .from("kaynaklar")
    .upload(filePath, file, { contentType: file.type });

  if (error) return { error: "Dosya yüklenemedi. Lütfen tekrar deneyin." };
  return { path: data.path };
}

export async function submitAssignment(
  assignmentId: string,
  submissionText: string | null,
  filePath: string | null,
): Promise<{ error?: string }> {
  const parsed = submitAssignmentSchema.safeParse({ assignmentId, submissionText, filePath });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Oturum bulunamadı." };

  // Teslim öncesi durum kontrolü — tamamlanmış ödevler tekrar teslim edilemez
  const { data: existing } = await supabase
    .from("assignments")
    .select("status")
    .eq("id", parsed.data.assignmentId)
    .single();

  if (existing?.status === "yapildi") {
    return { error: "Bu ödev zaten teslim edilmiş." };
  }

  const { data: updated, error } = await supabase
    .from("assignments")
    .update({
      submission_text: parsed.data.submissionText,
      submission_file_path: parsed.data.filePath,
      submitted_at: new Date().toISOString(),
      status: "yapildi",
      rejection_reason: null,
    })
    .eq("id", parsed.data.assignmentId)
    .in("status", ["verildi", "reddedildi"])
    .select("id");
  if (error) return { error: "Ödev güncellenemedi. Lütfen tekrar deneyin." };
  if (!updated || updated.length === 0) {
    return { error: "Ödev bulunamadı veya bu ödeve erişim yetkiniz yok." };
  }

  revalidatePath("/ogrenci");
  return {};
}

// ── gradeAssignment ───────────────────────────────────────────────────────────
// Hoca öğrencinin teslim ettiği ödevi puanlar (0–100 arası zorunlu).
// score değeri server'da doğrulanır — client'a güvenilmez.

export async function gradeAssignment(
  assignmentId: string,
  score: number,
): Promise<{ error?: string }> {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return { error: "Puan 0 ile 100 arasında olmalıdır." };
  }
  const roundedScore = Math.round(score);

  const supabase = await createServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Oturum bulunamadı." };

  const { data: updated, error } = await supabase
    .from("assignments")
    .update({ status: "yapildi", score: roundedScore, rejection_reason: null })
    .eq("id", assignmentId)
    .eq("status", "yapildi")
    .select("id");

  if (error) return { error: "Puan kaydedilemedi. Lütfen tekrar deneyin." };
  if (!updated || updated.length === 0) {
    return { error: "Ödev bulunamadı veya bu ödeve erişim yetkiniz yok." };
  }

  revalidatePath("/hoca");
  return {};
}

// ── rejectAssignment ──────────────────────────────────────────────────────────
// Hoca teslim edilen ödevi reddeder; sebep zorunlu.

export async function rejectAssignment(
  assignmentId: string,
  rejectionReason: string,
  clearSubmission: boolean,
): Promise<{ error?: string }> {
  const reason = rejectionReason.trim();
  if (!reason) return { error: "Reddetme sebebi boş olamaz." };
  if (reason.length > 500) return { error: "Reddetme sebebi en fazla 500 karakter olabilir." };

  const supabase = await createServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Oturum bulunamadı." };

  type RejectUpdate = {
    status: "reddedildi";
    rejection_reason: string;
    score: null;
    submission_text?: null;
    submission_file_path?: null;
    submitted_at?: null;
  };
  const updates: RejectUpdate = {
    status: "reddedildi",
    rejection_reason: reason,
    score: null,
    ...(clearSubmission
      ? { submission_text: null, submission_file_path: null, submitted_at: null }
      : {}),
  };

  const { data: updated, error } = await supabase
    .from("assignments")
    .update(updates)
    .eq("id", assignmentId)
    .eq("status", "yapildi")
    .select("id");

  if (error) return { error: "Ödev reddedilemedi. Lütfen tekrar deneyin." };
  if (!updated || updated.length === 0) {
    return { error: "Ödev bulunamadı veya bu ödeve erişim yetkiniz yok." };
  }

  revalidatePath("/hoca");
  return {};
}
