// POST /api/payment/3ds-callback
// iyzico, banka 3DS doğrulaması tamamlandıktan sonra bu endpoint'e POST atar.
// Form-encoded payload: conversationId, mdStatus (1=başarılı, diğerleri=başarısız),
//                       paymentId, conversationData, mdErrorMessage vb.

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createServiceRoleServer } from "@/lib/supabase/server";
import { complete3DSPayment, getIyzicoConfig } from "@/lib/iyzico";

export async function POST(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // iyzico application/x-www-form-urlencoded gönderir
  let formData: URLSearchParams;
  try {
    const text = await req.text();
    formData = new URLSearchParams(text);
  } catch {
    return NextResponse.redirect(`${appUrl}/ogrenci/cuzdan?error=callback_parse`);
  }

  const conversationId = formData.get("conversationId") ?? "";
  const mdStatus       = formData.get("mdStatus")       ?? "0";
  const paymentId      = formData.get("paymentId")      ?? "";

  if (!conversationId) {
    return NextResponse.redirect(`${appUrl}/ogrenci/cuzdan?error=missing_conversation`);
  }

  if (!paymentId) {
    return NextResponse.redirect(`${appUrl}/ogrenci/cuzdan?error=missing_payment`);
  }

  const supabase = createServiceRoleServer();

  // Niyeti bul
  const { data: intent, error: intentErr } = await supabase
    .from("payment_intents")
    .select("id, user_id, amount, status")
    .eq("conversation_id", conversationId)
    .single();

  if (intentErr || !intent) {
    return NextResponse.redirect(`${appUrl}/ogrenci/cuzdan?error=intent_not_found`);
  }

  // Tekrar çalıştırmayı önle (idempotent)
  if (intent.status !== "pending") {
    const success = intent.status === "completed";
    return NextResponse.redirect(
      `${appUrl}/ogrenci/cuzdan?${success ? "success=1" : "error=already_processed"}`,
    );
  }

  // mdStatus !== "1" → banka doğrulaması başarısız
  if (mdStatus !== "1") {
    await supabase
      .from("payment_intents")
      .update({
        status:        "failed",
        error_message: `3DS mdStatus: ${mdStatus}`,
      })
      .eq("id", intent.id);

    return NextResponse.redirect(`${appUrl}/ogrenci/cuzdan?error=3ds_failed`);
  }

  // iyzico ile ödemeyi tamamla
  try {
    const config = getIyzicoConfig();
    const result = await complete3DSPayment(config, conversationId, paymentId);

    if (result.status !== "success") {
      await supabase
        .from("payment_intents")
        .update({
          status:        "failed",
          error_message: result.errorMessage ?? "3DS auth failed",
        })
        .eq("id", intent.id);

      return NextResponse.redirect(`${appUrl}/ogrenci/cuzdan?error=payment_failed`);
    }

    // Atomik bakiye yükleme
    const { data: depositResult, error: depositErr } = await supabase.rpc(
      "deposit_wallet",
      {
        p_user_id:     intent.user_id,
        p_amount:      intent.amount,
        p_description: `3D Secure ile bakiye yükleme — Ref: ${result.paymentId}`,
      },
    );

    if (depositErr || !depositResult) {
      Sentry.captureException(depositErr ?? new Error("deposit_wallet returned null"), {
        extra: { conversationId, userId: intent.user_id, step: "deposit_wallet_after_3ds" },
      });

      await supabase
        .from("payment_intents")
        .update({
          status:        "failed",
          error_message: "Wallet deposit failed after 3DS success",
        })
        .eq("id", intent.id);

      return NextResponse.redirect(`${appUrl}/ogrenci/cuzdan?error=deposit_failed`);
    }

    const { tx_id } = depositResult as { new_balance: number; tx_id: string };

    await supabase
      .from("payment_intents")
      .update({ status: "completed", tx_id })
      .eq("id", intent.id);

    return NextResponse.redirect(`${appUrl}/ogrenci/cuzdan?success=1`);

  } catch (err) {
    Sentry.captureException(err, {
      extra: { conversationId, step: "complete3DS" },
    });

    await supabase
      .from("payment_intents")
      .update({
        status:        "failed",
        error_message: "Unexpected error during 3DS completion",
      })
      .eq("id", intent.id);

    return NextResponse.redirect(`${appUrl}/ogrenci/cuzdan?error=unexpected`);
  }
}
