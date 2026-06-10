"use server";

import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import { z } from "zod";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils/get-ip";

/** IP başına 5 istek / 60 saniye (tüm auth endpointleri için) */
const AUTH_LIMIT = 5;
const AUTH_WINDOW_SECS = 60;

export type AuthActionResult = { ok: true } | { ok: false; error: string };

export async function signInWithGoogle(next?: string | null): Promise<never | { ok: false; error: string }> {
  const ip = await getClientIp();
  const rl = await rateLimit(`auth:google:${ip}`, AUTH_LIMIT, AUTH_WINDOW_SECS);
  if (!rl.success) {
    return { ok: false, error: rl.retryAfterMessage };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const safeNext = next && /^\/[^/]/.test(next) ? next : null;
  const callbackUrl = `${appUrl}/auth/callback${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ""}`;
  const supabase = await createServer();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error || !data.url) {
    return { ok: false, error: "Google girişi başlatılamadı. Lütfen tekrar deneyin." };
  }

  redirect(data.url);
}

/**
 * E-posta + şifre ile giriş — rate limit korumalı server action.
 * Login sayfası direct Supabase yerine bunu kullanır.
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ ok: true; role: string } | { ok: false; error: string }> {
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const ip = await getClientIp();
  const rl = await rateLimit(`auth:login:${ip}`, AUTH_LIMIT, AUTH_WINDOW_SECS);
  if (!rl.success) {
    return { ok: false, error: rl.retryAfterMessage };
  }

  const supabase = await createServer();
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (signInError) {
    return { ok: false, error: "E-posta veya şifre hatalı." };
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (userError || !userData) {
    return { ok: false, error: "Kullanıcı bilgileri alınamadı." };
  }

  return { ok: true, role: userData.role };
}

/**
 * Yeni hesap kaydı — rate limit korumalı server action.
 */
const signUpSchema = loginSchema.extend({
  role: z.enum(["ogrenci", "hoca"], { message: "Geçersiz kullanıcı rolü." }),
});

export async function signUpWithEmail(
  email: string,
  password: string,
  role: "ogrenci" | "hoca",
  fullName: string | null,
): Promise<AuthActionResult> {
  const parsed = signUpSchema.safeParse({ email, password, role });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const ip = await getClientIp();
  const rl = await rateLimit(`auth:register:${ip}`, AUTH_LIMIT, AUTH_WINDOW_SECS);
  if (!rl.success) {
    return { ok: false, error: rl.retryAfterMessage };
  }

  const supabase = await createServer();
  const { error: signUpError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        role,
        full_name: fullName?.trim() || null,
      },
    },
  });

  if (signUpError) {
    return { ok: false, error: "Kayıt oluşturulamadı. Bu e-posta zaten kullanılıyor olabilir." };
  }

  return { ok: true };
}

export async function sendPasswordResetEmail(email: string): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const ip = await getClientIp();
  const rl = await rateLimit(`auth:reset:${ip}`, AUTH_LIMIT, AUTH_WINDOW_SECS);
  if (!rl.success) {
    return { ok: false, error: rl.retryAfterMessage };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = await createServer();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/sifre-yenile`,
  });

  if (error) {
    return { ok: false, error: "E-posta gönderilemedi. Lütfen tekrar deneyin." };
  }

  return { ok: true };
}

export async function resetPassword(
  password: string,
  confirmPassword: string,
): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const ip = await getClientIp();
  const rl = await rateLimit(`auth:pwreset:${ip}`, AUTH_LIMIT, AUTH_WINDOW_SECS);
  if (!rl.success) {
    return { ok: false, error: rl.retryAfterMessage };
  }

  const supabase = await createServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "Oturum bulunamadı. Lütfen şifre sıfırlama bağlantısını tekrar kullanın." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { ok: false, error: "Şifre güncellenemedi. Lütfen tekrar deneyin." };
  }

  return { ok: true };
}
