"use server";

import { revalidatePath } from "next/cache";
import { createServer } from "@/lib/supabase/server";

type ProfileUpdates = {
  full_name?: string | null;
  sehir?: string | null;
  ilce?: string | null;
  hakkinda?: string | null;
  ders_fiyati?: number | null;
  video_url?: string | null;
  portfolio_url?: string | null;
};

export async function updateProfile(
  updates: ProfileUpdates,
): Promise<{ error?: string }> {
  const supabase = await createServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Oturum bulunamadı." };

  const { error } = await supabase.from("users").update(updates).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profil");
  return {};
}
