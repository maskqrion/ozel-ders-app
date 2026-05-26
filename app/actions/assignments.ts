"use server";

import { revalidatePath } from "next/cache";
import { createServer } from "@/lib/supabase/server";

export async function submitAssignment(
  assignmentId: string,
  submissionText: string | null,
  filePath: string | null,
): Promise<{ error?: string }> {
  const supabase = await createServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Oturum bulunamadı." };

  const { error } = await supabase
    .from("assignments")
    .update({
      submission_text: submissionText,
      submission_file_path: filePath,
      submitted_at: new Date().toISOString(),
      status: "yapildi",
      rejection_reason: null,
    })
    .eq("id", assignmentId);
  if (error) return { error: error.message };

  revalidatePath("/ogrenci");
  return {};
}
