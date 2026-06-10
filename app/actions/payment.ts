"use server";

import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import { createServer, createServiceRoleServer } from "@/lib/supabase/server";
import { initiate3DSPayment, getIyzicoConfig } from "@/lib/iyzico";
import { processPaymentSchema, type ProcessPaymentInput } from "@/lib/validations/payment";

export type PaymentCard = ProcessPaymentInput["paymentCard"];

// ── initiate3DSecureDeposit ────────────────────────────────────────────────────
//
// Adım 1 / 2: 3DS akışını başlat.
//   1. Kart bilgilerini doğrula
//   2. payment_intents tablosuna kayıt oluştur
//   3. iyzico /payment/3dsecure/initialize çağır
//   4. HTML içeriğini (bankanın 3DS sayfasını) döndür → client iframe'e koyar
//   5. Kullanıcı bankada doğrular → iyzico /api/payment/3ds-callback'e POST atar
//
// Not: Gerçek para hareketi step 2'de (callback) gerçekleşir.

export type Initiate3DSResult =
  | { ok: true;  htmlContent: string; conversationId: string }
  | { ok: false; error: string };

export async function initiate3DSecureDeposit(
  amount: number,
  paymentCard: PaymentCard,
): Promise<Initiate3DSResult> {
  const parsed = processPaymentSchema.safeParse({ amount, paymentCard });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  if (!process.env.IYZICO_API_KEY) {
    return { ok: false, error: "Ödeme sistemi yapılandırılmamış. Lütfen yöneticiyle iletişime geçin." };
  }

  const supabase = await createServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Oturum bulunamadı." };

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, sehir, identity_number")
    .eq("id", user.id)
    .single();

  if (!profile?.identity_number) {
    return { ok: false, error: "Ödeme yapabilmek için profil sayfasından TC kimlik numaranızı eklemelisiniz." };
  }

  const parts   = (profile?.full_name ?? "").split(" ").filter(Boolean);
  const name    = parts[0]           ?? "Kullanıcı";
  const surname = parts.slice(1).join(" ") || "Kullanıcı";

  const hdrs = await headers();
  const ip   = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

  const appUrl         = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const conversationId = `cv3d_${user.id}_${Date.now()}`;
  const callbackUrl    = `${appUrl}/api/payment/3ds-callback`;

  // payment_intents kaydı — service role ile (RLS bypass)
  const serviceSupabase = createServiceRoleServer();
  const { error: intentErr } = await serviceSupabase
    .from("payment_intents")
    .insert({
      user_id:         user.id,
      amount:          parsed.data.amount,
      conversation_id: conversationId,
      status:          "pending",
    });

  if (intentErr) {
    Sentry.captureException(intentErr, { extra: { action: "initiate3DSecureDeposit", step: "intent_insert" } });
    return { ok: false, error: "Ödeme başlatılamadı." };
  }

  try {
    const config = getIyzicoConfig();
    const result = await initiate3DSPayment(config, {
      conversationId,
      price:       parsed.data.amount.toFixed(2),
      paidPrice:   parsed.data.amount.toFixed(2),
      callbackUrl,
      paymentCard: {
        cardHolderName: parsed.data.paymentCard.cardHolderName,
        cardNumber:     parsed.data.paymentCard.cardNumber,
        expireYear:     parsed.data.paymentCard.expireYear,
        expireMonth:    parsed.data.paymentCard.expireMonth,
        cvc:            parsed.data.paymentCard.cvc,
      },
      buyer: {
        id:                  user.id,
        name,
        surname,
        email:               user.email ?? "",
        identityNumber:      profile.identity_number,
        registrationAddress: profile?.sehir ?? "Türkiye",
        ip,
        city:    profile?.sehir ?? "Istanbul",
        country: "Turkey",
      },
      billingAddress: {
        contactName: profile?.full_name ?? "Kullanıcı",
        city:        profile?.sehir ?? "Istanbul",
        country:     "Turkey",
        address:     profile?.sehir ?? "Türkiye",
      },
      basketItems: [
        {
          id:        `bakiye_${Date.now()}`,
          name:      "Bakiye Yükleme",
          category1: "Eğitim",
          itemType:  "VIRTUAL",
          price:     parsed.data.amount.toFixed(2),
        },
      ],
    });

    if (result.status !== "success" || !result.threeDSHtmlContent) {
      await serviceSupabase
        .from("payment_intents")
        .update({ status: "failed", error_message: result.errorMessage ?? "3DS init failed" })
        .eq("conversation_id", conversationId);

      return {
        ok:    false,
        error: result.errorMessage ?? "3D Secure başlatılamadı. Lütfen tekrar deneyin.",
      };
    }

    return {
      ok:             true,
      htmlContent:    result.threeDSHtmlContent,
      conversationId: result.conversationId ?? conversationId,
    };

  } catch (err) {
    Sentry.captureException(err, {
      extra: { action: "initiate3DSecureDeposit", step: "iyzico_3ds_init", userId: user.id },
    });

    await serviceSupabase
      .from("payment_intents")
      .update({ status: "failed", error_message: "Unexpected error" })
      .eq("conversation_id", conversationId);

    return { ok: false, error: "Ödeme sistemi şu anda ulaşılamıyor. Lütfen tekrar deneyin." };
  }
}
