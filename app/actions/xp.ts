"use server";

import { createServer } from "@/lib/supabase/server";

const XP_AMOUNTS: Record<string, number> = {
  quiz:       50,
  ders:       20,
  odev:       20,
  odev_teslim: 50,
};

export type AwardHocaXpResult =
  | { ok: true; level: number; xp: number }
  | { ok: false; error: string };

export async function awardHocaXp(
  action: "quiz" | "ders" | "odev" | "odev_teslim",
): Promise<AwardHocaXpResult> {
  const amount = XP_AMOUNTS[action];
  if (!amount) return { ok: false, error: "Geçersiz işlem." };

  const supabase = await createServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Oturum bulunamadı." };

  const { data, error } = await supabase.rpc("add_user_xp", { amount });
  if (error) return { ok: false, error: "XP eklenemedi." };

  const xpData = data as { level: number; xp: number };
  return { ok: true, level: xpData.level, xp: xpData.xp };
}
