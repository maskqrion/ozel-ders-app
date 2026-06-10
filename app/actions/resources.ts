"use server";

import { createServer } from "@/lib/supabase/server";

export type CreateResourceResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createResource(
  filePath: string,
  title: string,
): Promise<CreateResourceResult> {
  if (!filePath?.trim() || !title?.trim()) {
    return { ok: false, error: "Dosya yolu ve başlık zorunludur." };
  }

  const supabase = await createServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { ok: false, error: "Oturum bulunamadı." };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "hoca") {
    return { ok: false, error: "Yalnızca hocalar kaynak yükleyebilir." };
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("resources")
    .insert({ yukleyen_id: user.id, title: title.trim(), file_path: filePath })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return { ok: false, error: "Kaynak kaydedilemedi. Lütfen tekrar deneyin." };
  }

  return { ok: true, id: inserted.id };
}
