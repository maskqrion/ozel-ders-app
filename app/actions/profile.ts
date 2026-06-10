"use server";

import { revalidatePath } from "next/cache";
import { createServer } from "@/lib/supabase/server";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/profile";

export async function updateProfile(
  updates: UpdateProfileInput,
): Promise<{ error?: string }> {
  const parsed = updateProfileSchema.safeParse(updates);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Oturum bulunamadı." };

  const { error } = await supabase
    .from("users")
    .update(parsed.data)
    .eq("id", user.id);
  if (error) return { error: "Profil güncellenemedi. Lütfen tekrar deneyin." };

  revalidatePath("/profil");
  revalidatePath("/ogrenci");
  revalidatePath("/hoca");
  return {};
}
