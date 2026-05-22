-- Açık Öğretmen Profili: Herkese Açık (anon) Okuma Politikaları
--
-- Amaç: /hoca/[id] sayfası SEO için login gerektirmeden,
--       tarayıcı (crawler) ve ziyaretçiler tarafından okunabilmeli.
--
-- Kapsam:
--   1) users tablosu — rol='hoca' olan satırlar anon tarafından okunabilir
--      (SELECT * değil; bunu ayrıca view/column güvenliği ile daraltmak mümkün)
--   2) reviews tablosu — herkese açık yorumlar (comment + rating + created_at)
--
-- Mevcut 'to authenticated' politikalar korunuyor; bu politikalar ek
-- olarak 'anon' rolüne izin verir.

-------------------------------------------------------------------------------
-- 1. users tablosu — hoca profilleri herkese açık
-------------------------------------------------------------------------------
drop policy if exists users_public_hoca_select on public.users;
create policy users_public_hoca_select on public.users
  for select to anon
  using (role = 'hoca');

-------------------------------------------------------------------------------
-- 2. reviews tablosu — hoca değerlendirmeleri herkese açık
-------------------------------------------------------------------------------
drop policy if exists reviews_public_select on public.reviews;
create policy reviews_public_select on public.reviews
  for select to anon
  using (true);

-------------------------------------------------------------------------------
-- ROLLBACK (acil durum, manuel olarak çalıştır):
--   drop policy if exists reviews_public_select   on public.reviews;
--   drop policy if exists users_public_hoca_select on public.users;
-------------------------------------------------------------------------------
