"use server";

import { revalidatePath } from "next/cache";
import { createServer } from "@/lib/supabase/server";

export async function submitReview(
  hocaId: string,
  rating: number,
  comment: string | null,
): Promise<{ error?: string; duplicate?: boolean }> {
  const supabase = await createServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Oturum bulunamadı." };

  const { error } = await supabase.from("reviews").insert([
    { hoca_id: hocaId, ogrenci_id: user.id, rating, comment },
  ]);
  if (error) {
    if (error.code === "23505") return { duplicate: true };
    return { error: error.message };
  }

  revalidatePath("/ogrenci");
  return {};
}
