"use server";

import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createServer } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";

// ── Şema ─────────────────────────────────────────────────────────────────────

const createReservationSchema = z.object({
  teacherId:  z.string().uuid("Geçersiz hoca kimliği."),
  lessonDate: z.string().datetime("Geçersiz tarih formatı."),
});

// ── Dönüş tipi ───────────────────────────────────────────────────────────────

export type CreateReservationResult =
  | { ok: true; lessonId: string }
  | { ok: false; error: string };

// ── createReservation ─────────────────────────────────────────────────────────
//
// Eski implementasyon üç ayrı adım yapıyordu:
//   1. çakışma SELECT  2. transfer_lesson_payment RPC  3. lessons INSERT
// Adım 2 başarılı olup adım 3 başarısız olursa para çekilmiş ama ders yoktu.
//
// Şimdi tüm adımlar create_reservation SECURITY DEFINER RPC içinde tek
// atomik transaction olarak gerçekleşir — ya hepsi ya hiçbiri garantisi.

export async function createReservation(
  input: unknown,
): Promise<CreateReservationResult> {
  // ── Validasyon ───────────────────────────────────────────────────────────
  const parsed = createReservationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { teacherId, lessonDate } = parsed.data;

  // ── Geçmiş tarih kontrolü ─────────────────────────────────────────────────
  if (new Date(lessonDate) < new Date()) {
    return { ok: false, error: "Geçmiş bir tarihe rezervasyon yapılamaz." };
  }

  // ── Oturum ───────────────────────────────────────────────────────────────
  const supabase = await createServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Oturum bulunamadı. Lütfen tekrar giriş yapın." };
  }

  // ── Fiyatı DB'den çek — client'a güvenilmez ──────────────────────────────
  const { data: teacherRow, error: teacherErr } = await supabase
    .from("users")
    .select("ders_fiyati")
    .eq("id", teacherId)
    .single();

  if (teacherErr || !teacherRow) {
    return { ok: false, error: "Hoca bilgileri alınamadı." };
  }
  if (teacherRow.ders_fiyati === null) {
    return { ok: false, error: "Hocanın ders fiyatı belirlenmemiş." };
  }
  const price = teacherRow.ders_fiyati;

  // ── Atomik RPC ───────────────────────────────────────────────────────────
  // create_reservation içinde: çakışma kontrolü → ödeme → ders kaydı → bildirim
  // Herhangi bir adım başarısız olursa tüm işlem rollback olur.
  const { data: lessonId, error: rpcError } = await supabase.rpc(
    "create_reservation",
    {
      p_hoca_id:     teacherId,
      p_ogrenci_id:  user.id,
      p_lesson_date: lessonDate,
      p_price:       price,
    },
  );

  if (rpcError) {
    const msg = rpcError.message ?? "";

    if (msg.includes("müsait değil")) {
      return { ok: false, error: "Hoca bu saatte müsait değil. Başka bir saat seçin." };
    }
    if (msg.includes("Bu saat dolu")) {
      return { ok: false, error: "Bu saat dolu, başka bir zaman seçin." };
    }
    if (msg.includes("Yetersiz bakiye") || msg.includes("yetersiz")) {
      return { ok: false, error: "Cüzdan bakiyesi yetersiz." };
    }
    if (msg.includes("Yetkisiz")) {
      return { ok: false, error: "Bu işlem için yetkiniz yok." };
    }

    Sentry.captureException(rpcError, {
      extra: {
        action: "createReservation",
        studentId: user.id,
        teacherId,
        price,
        lessonDate,
      },
    });
    return { ok: false, error: "Rezervasyon oluşturulamadı. Lütfen tekrar deneyin." };
  }

  if (!lessonId) {
    return { ok: false, error: "Rezervasyon oluşturulamadı. Lütfen tekrar deneyin." };
  }

  // Web push bildirimleri — hata ana akışı etkilemez
  try {
    const lessonDateFmt = new Date(lessonDate).toLocaleDateString("tr-TR", {
      weekday: "short",
      day:     "numeric",
      month:   "short",
      hour:    "2-digit",
      minute:  "2-digit",
    });
    await Promise.all([
      sendPushToUser(teacherId, {
        title: "Yeni Ders Rezervasyonu",
        body:  `${lessonDateFmt} tarihli ders talep edildi.`,
        icon:  "/icons/icon-192.png",
        url:   "/hoca",
        tag:   `reservation-${lessonId}`,
      }),
      sendPushToUser(user.id, {
        title: "Rezervasyon Onaylandı",
        body:  `${lessonDateFmt} tarihli ders rezervasyonu oluşturuldu.`,
        icon:  "/icons/icon-192.png",
        url:   "/ogrenci",
        tag:   `reservation-${lessonId}`,
      }),
    ]);
  } catch {
    // push hatası rezervasyonu geri almaz
  }

  return { ok: true, lessonId: lessonId as string };
}
