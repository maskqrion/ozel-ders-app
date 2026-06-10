"use server";

import { randomUUID } from "crypto";
import { createServer, createServiceRoleServer } from "@/lib/supabase/server";

// ── Dönüş tipleri ─────────────────────────────────────────────────────────────

export type ValidateInvitationResult =
  | { ok: true }
  | { ok: false; error: string; authRequired?: true };

export type AcceptInvitationResult =
  | { ok: true }
  | { ok: false; error: string };

// ── validateInvitation ────────────────────────────────────────────────────────
//
// Daveti göstermeden önce sunucu tarafında tüm koşulları doğrular:
//   1. Oturum varlığı
//   2. Kullanıcı rolü (yalnızca öğrenci)
//   3. Token geçerliliği + is_used = false
//   4. expires_at süresi (sunucu saati ile karşılaştırılır — client'a güvenilmez)

export async function validateInvitation(
  token: string,
): Promise<ValidateInvitationResult> {
  if (!token?.trim()) {
    return { ok: false, error: "Geçersiz davet bağlantısı." };
  }

  const supabase = await createServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Devam etmek için giriş yapmanız gerekiyor.", authRequired: true };
  }

  // Rol kontrolü — JWT'den değil DB'den okunur (daha güvenilir)
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { ok: false, error: "Kullanıcı profiliniz bulunamadı." };
  }
  if (profile.role !== "ogrenci") {
    return {
      ok: false,
      error: "Davet linki yalnızca öğrenci hesapları tarafından kabul edilebilir.",
    };
  }

  // Token + kullanım durumu kontrolü
  const { data: invitation } = await supabase
    .from("invitations")
    .select("id, is_used, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!invitation || invitation.is_used) {
    return { ok: false, error: "Geçersiz veya kullanılmış davet linki." };
  }

  // Süre dolumu — sunucu saati ile karşılaştırılır
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return {
      ok: false,
      error: "Davet linkinin süresi dolmuş. Hocanızdan yeni bir link isteyin.",
    };
  }

  return { ok: true };
}

// ── acceptInvitation ──────────────────────────────────────────────────────────
//
// Daveti kabul eder. Client state'e güvenmez; tüm doğrulamayı yeniden yapar.
// Yazma işlemleri service_role ile yapılır — RLS bypass değil, yetki kanıtlama
// sunucu tarafında tamamlandığından izin güvenlidir.

export async function acceptInvitation(
  token: string,
): Promise<AcceptInvitationResult> {
  if (!token?.trim()) {
    return { ok: false, error: "Geçersiz davet bağlantısı." };
  }

  const supabase = await createServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  // Rol — yeniden doğrulanır (client state'e güvenilmez)
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ogrenci") {
    return { ok: false, error: "Yalnızca öğrenciler daveti kabul edebilir." };
  }

  // Token + süre — yeniden doğrulanır
  const { data: invitation } = await supabase
    .from("invitations")
    .select("id, hoca_id, is_used, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!invitation || invitation.is_used) {
    return { ok: false, error: "Geçersiz veya kullanılmış davet linki." };
  }

  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return { ok: false, error: "Davet linkinin süresi dolmuş." };
  }

  // Yazma işlemleri — service_role (sunucu tarafında doğrulama tamamlandı)
  // Sıra: önce daveti kullanıldı olarak işaretle, sonra bağlantıyı oluştur.
  // Bu sayede token tekrar kullanılamaz; bağlantı oluşturma hatası olursa
  // kullanıcı destek ekibiyle iletişime geçebilir (kayıt en azından güvende).
  const serviceSupabase = createServiceRoleServer();

  const { data: markedRows, error: useError } = await serviceSupabase
    .from("invitations")
    .update({ is_used: true })
    .eq("id", invitation.id)
    .eq("is_used", false)
    .select("id");

  if (useError) {
    return { ok: false, error: "Davet işaretlenemedi. Lütfen tekrar deneyin." };
  }
  if (!markedRows || markedRows.length === 0) {
    return { ok: false, error: "Davet linki zaten kullanılmış." };
  }

  const { error: linkError } = await serviceSupabase
    .from("teacher_students")
    .insert({ hoca_id: invitation.hoca_id, ogrenci_id: user.id });

  // 23505 = unique_violation → zaten bağlı, sorun değil
  if (linkError && linkError.code !== "23505") {
    // Bağlantı başarısız: daveti geri al (best-effort)
    await serviceSupabase
      .from("invitations")
      .update({ is_used: false })
      .eq("id", invitation.id);
    return { ok: false, error: "Bağlantı oluşturulamadı. Lütfen tekrar deneyin." };
  }

  return { ok: true };
}

// ── createInvitation ──────────────────────────────────────────────────────────
//
// Kota kuralları (spam/abuse önleme):
//   • Eşzamanlı aktif (kullanılmamış, süresi dolmamış) davet: max 5
//   • Son 24 saat içinde oluşturulan davet: max 10/gün
//
// Davet oluşturma işlemi sunucu tarafında yapılır; istemci asla doğrudan
// invitations tablosuna INSERT yapmamalıdır.

export type CreateInvitationResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

export async function createInvitation(): Promise<CreateInvitationResult> {
  const supabase = await createServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { ok: false, error: "Oturum bulunamadı." };

  // Rol — DB'den okunur (JWT'ye güvenilmez)
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "hoca") {
    return { ok: false, error: "Yalnızca hocalar davet linki oluşturabilir." };
  }

  // ── Kota 1: Max 5 aktif (kullanılmamış + süresi dolmamış) davet ────────
  const now = new Date().toISOString();
  const { count: activeCount, error: activeErr } = await supabase
    .from("invitations")
    .select("id", { count: "exact", head: true })
    .eq("hoca_id", user.id)
    .eq("is_used", false)
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (activeErr) return { ok: false, error: "Davet durumu kontrol edilemedi." };

  if ((activeCount ?? 0) >= 5) {
    return {
      ok: false,
      error:
        "En fazla 5 aktif davet linkiniz olabilir. Eskilerinin süresi dolmasını bekleyin.",
    };
  }

  // ── Kota 2: Son 24 saatte max 10 davet ─────────────────────────────────
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: dailyCount, error: dailyErr } = await supabase
    .from("invitations")
    .select("id", { count: "exact", head: true })
    .eq("hoca_id", user.id)
    .gte("created_at", yesterday);

  if (dailyErr) return { ok: false, error: "Davet geçmişi kontrol edilemedi." };

  if ((dailyCount ?? 0) >= 10) {
    return {
      ok: false,
      error: "Günlük davet limitine ulaştınız (10/gün). Yarın tekrar deneyin.",
    };
  }

  // ── Token üret ve kaydet ───────────────────────────────────────────────
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: insertError } = await supabase
    .from("invitations")
    .insert({ hoca_id: user.id, token, is_used: false, expires_at: expiresAt });

  if (insertError) {
    return { ok: false, error: "Davet oluşturulamadı. Lütfen tekrar deneyin." };
  }

  return { ok: true, token };
}
