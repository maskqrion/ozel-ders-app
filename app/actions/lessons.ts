"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import { createServer, createServiceRoleServer } from "@/lib/supabase/server";

// ── Şema ─────────────────────────────────────────────────────────────────────

const completeLessonSchema = z.object({
  lessonId: z.string().uuid("Geçersiz ders kimliği."),
});

// ── Dönüş tipi ───────────────────────────────────────────────────────────────

export type CompleteLessonResult =
  | { ok: true }
  | { ok: false; error: string };

// ── completeLessonAction ──────────────────────────────────────────────────────
//
// Hoca bir dersi tamamladığında çağrılır.
// Tüm iş mantığı (status güncelleme + ödeme transferi + öğrenci XP ödülü)
// hoca_complete_lesson() SECURITY DEFINER RPC içinde tek bir atomik
// transaction olarak gerçekleşir → ya hepsi ya hiçbiri garantisi.
//
// Not: transfer_lesson_payment() fonksiyonu auth.uid() = ogrenci_id kontrolü
// yaptığından hoca tarafından çağrılamaz. Bu nedenle hoca_complete_lesson()
// kullanılmaktadır (bkz. 20260528_complete_lesson_rpc.sql).

export async function completeLessonAction(
  lessonId: string,
): Promise<CompleteLessonResult> {
  // ── Validasyon ───────────────────────────────────────────────────────────
  const parsed = completeLessonSchema.safeParse({ lessonId });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  // ── Oturum ───────────────────────────────────────────────────────────────
  const supabase = await createServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  // ── RPC çağrısı ──────────────────────────────────────────────────────────
  // hoca_complete_lesson tek transaction içinde:
  //   1. lessons.status → 'tamamlandi'
  //   2. Ücretli ders ise öğrenci → hoca cüzdan transferi
  //   3. Öğrenciye +50 XP ödülü

  const { error: rpcError } = await supabase.rpc("hoca_complete_lesson", {
    p_lesson_id: parsed.data.lessonId,
  });

  if (rpcError) {
    const msg = rpcError.message ?? "";

    if (msg.includes("Yetkisiz")) {
      return { ok: false, error: "Bu dersi tamamlama yetkiniz yok." };
    }
    if (msg.includes("zaten tamamlandı")) {
      return { ok: false, error: "Bu ders zaten tamamlandı." };
    }
    if (msg.includes("yetersiz")) {
      return {
        ok: false,
        error: "Öğrencinin bakiyesi dersi karşılamak için yetersiz.",
      };
    }
    if (msg.includes("bulunamadı")) {
      return { ok: false, error: "Ders veya cüzdan kaydı bulunamadı." };
    }

    return {
      ok: false,
      error: "Ders tamamlanamadı. Lütfen tekrar deneyin.",
    };
  }

  return { ok: true };
}

// ── cancelLessonAction ────────────────────────────────────────────────────────

export type CancelLessonResult =
  | { ok: true; refunded: boolean }
  | { ok: false; error: string };

export async function cancelLessonAction(
  lessonId: string,
): Promise<CancelLessonResult> {
  const parsed = completeLessonSchema.safeParse({ lessonId });
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

  const { data: lesson, error: fetchErr } = await supabase
    .from("lessons")
    .select("id, hoca_id, ogrenci_id, status, payment_status, price")
    .eq("id", parsed.data.lessonId)
    .single();

  if (fetchErr || !lesson) {
    return { ok: false, error: "Ders bulunamadı." };
  }
  if (lesson.hoca_id !== user.id && lesson.ogrenci_id !== user.id) {
    return { ok: false, error: "Bu dersi iptal etme yetkiniz yok." };
  }
  if (lesson.status === "tamamlandi") {
    return { ok: false, error: "Tamamlanmış bir ders iptal edilemez." };
  }
  if (lesson.status === "iptal") {
    return { ok: false, error: "Bu ders zaten iptal edilmiş." };
  }

  const serviceSupabase = createServiceRoleServer();

  // Koşullu güncelleme: yalnızca status hâlâ "bekliyor" ise iptal et.
  // Eş zamanlı iki istek aynı dersi iptal etmeye çalışırsa yalnızca biri başarılı olur.
  const { data: cancelledRow, error: updateErr } = await serviceSupabase
    .from("lessons")
    .update({ status: "iptal", payment_status: "refunded" })
    .eq("id", lesson.id)
    .eq("status", "bekliyor")
    .select("id");

  if (updateErr) {
    return { ok: false, error: "Ders iptal edilemedi. Lütfen tekrar deneyin." };
  }
  if (!cancelledRow || cancelledRow.length === 0) {
    return { ok: false, error: "Bu ders zaten iptal edilmiş veya tamamlanmış." };
  }

  // Ödeme iadesi: atomik RPC ile hoca→öğrenci transfer
  // - 'odendi'       : anlık ödeme modeli — refund_lesson_payment ile hocadan iade
  // - 'held_in_escrow': escrow modeli — deposit_wallet ile öğrenciye geri yaz
  // - 'odenmedi'     : para yok, iade gerekmez
  let refunded = false;
  if ((lesson.price ?? 0) > 0 && lesson.ogrenci_id) {
    if (lesson.payment_status === "odendi") {
      const { error: refundErr } = await serviceSupabase.rpc("refund_lesson_payment", {
        p_lesson_id: lesson.id,
        p_caller_id: user.id,
      });
      if (!refundErr) refunded = true;
    } else if (lesson.payment_status === "held_in_escrow") {
      const { error: refundErr } = await serviceSupabase.rpc("deposit_wallet", {
        p_user_id:     lesson.ogrenci_id,
        p_amount:      Number(lesson.price),
        p_description: "Ders iptali iadesi",
      });
      if (!refundErr) refunded = true;
    }
  }

  return { ok: true, refunded };
}

// ── createTeacherLessonAction ─────────────────────────────────────────────────
//
// Hoca tarafından başlatılan ders planlaması.
// Öğrenci rezervasyonundan farklı: ücret tahsil edilmez, hoca planlar.
// Doğrulama: çakışma kontrolü + bağlı öğrenci kontrolü + meeting_room_id.

const createTeacherLessonSchema = z.object({
  ogrenciId:  z.string().uuid("Geçersiz öğrenci kimliği."),
  lessonDate: z.string().datetime("Geçersiz tarih formatı."),
});

export type CreateTeacherLessonResult =
  | { ok: true; lessonId: string }
  | { ok: false; error: string };

export async function createTeacherLessonAction(
  ogrenciId: string,
  lessonDate: string,
): Promise<CreateTeacherLessonResult> {
  const parsed = createTeacherLessonSchema.safeParse({ ogrenciId, lessonDate });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  if (new Date(parsed.data.lessonDate) < new Date()) {
    return { ok: false, error: "Geçmiş bir tarihe ders planlanamaz." };
  }

  const supabase = await createServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Oturum bulunamadı." };

  // Rol kontrolü
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "hoca") {
    return { ok: false, error: "Bu işlem yalnızca hocalar tarafından yapılabilir." };
  }

  // Öğrencinin bu hocaya bağlı olduğunu doğrula
  const { data: link } = await supabase
    .from("teacher_students")
    .select("ogrenci_id")
    .eq("hoca_id", user.id)
    .eq("ogrenci_id", parsed.data.ogrenciId)
    .maybeSingle();
  if (!link) {
    return { ok: false, error: "Bu öğrenci size bağlı değil." };
  }

  // Tam saat başına normalize et
  const slotStart = new Date(parsed.data.lessonDate);
  slotStart.setMinutes(0, 0, 0);
  const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

  // Çakışma kontrolü
  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("hoca_id", user.id)
    .gte("lesson_date", slotStart.toISOString())
    .lt("lesson_date", slotEnd.toISOString())
    .neq("status", "iptal");

  if ((count ?? 0) > 0) {
    return { ok: false, error: "Bu saatte zaten bir dersiniz var." };
  }

  // Müsaitlik kontrolü: teacher_availability satırı varsa saat aralığı içinde olmalı
  const dayOfWeek = slotStart.getDay();
  const hour = slotStart.getHours();
  const { data: availRows } = await supabase
    .from("teacher_availability")
    .select("start_hour, end_hour")
    .eq("hoca_id", user.id)
    .eq("day_of_week", dayOfWeek);

  if (availRows && availRows.length > 0) {
    const avail = availRows[0] as { start_hour: number; end_hour: number };
    if (hour < avail.start_hour || hour >= avail.end_hour) {
      return { ok: false, error: "Seçilen saat müsaitlik takviminizin dışında." };
    }
  }

  const meetingRoomId = "ders-" + randomUUID().replace(/-/g, "");

  const serviceSupabase = createServiceRoleServer();
  const { data: inserted, error: insertErr } = await serviceSupabase
    .from("lessons")
    .insert({
      hoca_id:         user.id,
      ogrenci_id:      parsed.data.ogrenciId,
      lesson_date:     slotStart.toISOString(),
      status:          "bekliyor",
      payment_status:  "odenmedi",
      price:           0,
      meeting_room_id: meetingRoomId,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return { ok: false, error: "Ders oluşturulamadı. Lütfen tekrar deneyin." };
  }

  return { ok: true, lessonId: inserted.id };
}
