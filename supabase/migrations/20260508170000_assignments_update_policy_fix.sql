-- assignments UPDATE policy düzeltmesi:
-- 20260508150000_db_rls.sql'de hoca ve öğrenci için iki ayrı UPDATE policy'si
-- vardı (assignments_update_hoca + assignments_update_ogrenci). "Tekrar Aç"
-- akışında (hoca'nın assignments UPDATE'i) WITH CHECK ihlali alındı:
--   "new row violates row-level security policy for table 'assignments'"
--
-- Çözüm: iki permissive policy'yi tek bir policy'de birleştiriyoruz.
-- Semantik aynı: kullanıcı, ilgili dersin hocası VEYA öğrencisi ise UPDATE
-- yapabilir. Tek OR'lu ifade kullanmak çapraz-policy WITH CHECK
-- değerlendirmesindeki belirsizliği gideriyor.
--
-- Not: RLS sütun bazında kısıtlamadığı için (orijinal migration'daki not
-- aynen geçerli) hangi tarafın hangi alanı yazabileceği UI'da kontrol ediliyor.

drop policy if exists assignments_update_hoca    on public.assignments;
drop policy if exists assignments_update_ogrenci on public.assignments;
drop policy if exists assignments_update         on public.assignments;

create policy assignments_update on public.assignments
  for update to authenticated
  using (
    exists (
      select 1 from public.lessons l
      where l.id = assignments.lesson_id
        and (l.hoca_id = auth.uid() or l.ogrenci_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.lessons l
      where l.id = assignments.lesson_id
        and (l.hoca_id = auth.uid() or l.ogrenci_id = auth.uid())
    )
  );
