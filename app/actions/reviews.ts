"use server";

import { revalidatePath } from "next/cache";
import { createServer } from "@/lib/supabase/server";
import { submitReviewSchema } from "@/lib/validations/reviews";
import { rateLimit } from "@/lib/rate-limit";

export async function submitReview(
  hocaId: string,
  rating: number,
  comment: string | null,
): Promise<{ error?: string; duplicate?: boolean }> {
  const parsed = submitReviewSchema.safeParse({ hocaId, rating, comment });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Oturum bulunamadı." };

  const rl = await rateLimit(`review:${user.id}`, 5, 3600);
  if (!rl.success) return { error: rl.retryAfterMessage };

  // Yalnızca tamamlanmış ders bulunan öğrenci değerlendirme yapabilir
  const { data: completedLesson, error: lessonErr } = await supabase
    .from("lessons")
    .select("id")
    .eq("hoca_id", parsed.data.hocaId)
    .eq("ogrenci_id", user.id)
    .eq("status", "tamamlandi")
    .limit(1)
    .maybeSingle();

  if (lessonErr) return { error: "Değerlendirme yapılamadı. Lütfen tekrar deneyin." };
  if (!completedLesson) {
    return { error: "Yalnızca tamamlanan dersleriniz için değerlendirme yapabilirsiniz." };
  }

  const { error } = await supabase.from("reviews").insert([
    {
      hoca_id: parsed.data.hocaId,
      ogrenci_id: user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  ]);
  if (error) {
    if (error.code === "23505") return { duplicate: true };
    return { error: "Değerlendirme kaydedilemedi. Lütfen tekrar deneyin." };
  }

  revalidatePath("/ogrenci");
  return {};
}
