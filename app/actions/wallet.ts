"use server";

import * as Sentry from "@sentry/nextjs";
import { createServer, createServiceRoleServer } from "@/lib/supabase/server";

export type WalletDepositResponse =
  | { ok: true; newBalance: number }
  | { ok: false; error: string };

export async function simulateDeposit(amount: number): Promise<WalletDepositResponse> {
  // Yalnızca ENABLE_SIMULATE_DEPOSIT=true ve non-production ortamlarında çalışır.
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_SIMULATE_DEPOSIT !== "true"
  ) {
    return {
      ok: false,
      error: "Simülasyon yükleme bu ortamda kullanılamaz.",
    };
  }

  if (amount <= 0 || amount >= 10000) {
    return { ok: false, error: "Tutar 0 ile 10.000 ₺ arasında olmalıdır." };
  }

  const supabase = await createServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Oturum bulunamadı." };

  // ── Atomik bakiye güncellemesi ───────────────────────────────────────────
  // deposit_wallet: tek UPDATE ile balance = balance + amount → race condition yok.
  const serviceSupabase = createServiceRoleServer();
  const { data: depositResult, error: depositErr } = await serviceSupabase.rpc(
    "deposit_wallet",
    {
      p_user_id:     user.id,
      p_amount:      amount,
      p_description: "Simülasyon bakiye yükleme",
    },
  );

  if (depositErr || !depositResult) {
    Sentry.captureException(depositErr ?? new Error("deposit_wallet returned null"), {
      extra: { action: "simulateDeposit", userId: user.id, step: "deposit_wallet" },
    });
    return { ok: false, error: "Bakiye güncellenemedi." };
  }

  const { new_balance: newBalance } =
    depositResult as { new_balance: number; tx_id: string };

  return { ok: true, newBalance };
}
