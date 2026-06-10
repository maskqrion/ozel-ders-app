-- Davet kotası sorgularını hızlandırmak için index'ler.
--
-- createInvitation() server action şu iki kota sorgusunu çalıştırır:
--   1. Aktif (is_used=false ve süresi dolmamış) davet sayısı → max 5 eşzamanlı
--   2. Son 24 saatte oluşturulan davet sayısı → max 10/gün
--
-- Gerçek kota mantığı TypeScript server action katmanında (invitations.ts) uygulanır.
-- Bu migration yalnızca o sorguların index'e isabet etmesini sağlar.

-- 1. Aktif davetler (is_used = false) — partial index
create index if not exists invitations_active_per_hoca_idx
  on public.invitations (hoca_id)
  where is_used = false;

-- 2. Zaman bazlı oran sınırı — (hoca_id, created_at) composite index
create index if not exists invitations_hoca_created_idx
  on public.invitations (hoca_id, created_at desc);

-------------------------------------------------------------------------------
-- ROLLBACK:
--   drop index if exists public.invitations_hoca_created_idx;
--   drop index if exists public.invitations_active_per_hoca_idx;
-------------------------------------------------------------------------------
