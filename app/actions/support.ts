"use server";

import { createServer } from "@/lib/supabase/server";
import {
  createSupportTicketSchema,
  type CreateSupportTicketInput,
} from "@/lib/validations/support";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Destek talebi oluşturur — RLS korumalı, rate limit'li server action.
 * Insert anon key + kullanıcı oturumu ile yapılır; RLS yalnızca kendi adına
 * 'open' durumunda kayıt eklemeye izin verir (service role KULLANILMAZ).
 */
export async function createSupportTicket(
  input: CreateSupportTicketInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = createSupportTicketSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "Oturum bulunamadı. Lütfen tekrar giriş yapın." };
  }

  // Spam koruması: kullanıcı başına saatte 5 talep
  const rl = await rateLimit(`support:create:${user.id}`, 5, 3600);
  if (!rl.success) return { ok: false, error: rl.retryAfterMessage };

  const { error } = await supabase.from("support_tickets").insert({
    user_id: user.id,
    category: parsed.data.category,
    priority: parsed.data.priority,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });
  if (error) {
    // Ham veritabanı hatası kullanıcıya sızdırılmaz
    return { ok: false, error: "Destek talebi oluşturulamadı. Lütfen tekrar deneyin." };
  }

  return { ok: true };
}
