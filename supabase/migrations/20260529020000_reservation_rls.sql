-- Öğrencilerin ders rezervasyonu yapabilmesi için lessons RLS politikası genişletildi.
-- Mevcut politika yalnızca hocaların insert yapmasına izin veriyordu (hoca_id = auth.uid()).
-- Bu öğrencilerin rezervasyon yapmasını engelliyordu.

-------------------------------------------------------------------------------
-- lessons INSERT politikası: hoca VE öğrenci insert edebilmeli
-------------------------------------------------------------------------------

drop policy if exists lessons_insert         on public.lessons;
drop policy if exists lessons_insert_hoca    on public.lessons;
drop policy if exists lessons_insert_ogrenci on public.lessons;

-- Hoca: kendi dersini oluşturabilir (manuel atama)
create policy lessons_insert_hoca on public.lessons
  for insert to authenticated
  with check (hoca_id = auth.uid() and public.is_hoca());

-- Öğrenci: rezervasyon yapabilir (ogrenci_id kendi kimliği olmalı)
create policy lessons_insert_ogrenci on public.lessons
  for insert to authenticated
  with check (ogrenci_id = auth.uid() and public.is_ogrenci());

-------------------------------------------------------------------------------
-- lessons SELECT: öğrenci yalnızca kendi derslerini görebilmeli (mevcut, doğru)
-- hoca_id = auth.uid() or ogrenci_id = auth.uid()  → zaten bu şekilde tanımlı
-------------------------------------------------------------------------------

-------------------------------------------------------------------------------
-- ROLLBACK:
--   drop policy if exists lessons_insert_hoca    on public.lessons;
--   drop policy if exists lessons_insert_ogrenci on public.lessons;
--   create policy lessons_insert on public.lessons
--     for insert to authenticated
--     with check (hoca_id = auth.uid() and public.is_hoca());
-------------------------------------------------------------------------------
