-- lessons.status için tek standart: 'bekliyor' | 'tamamlandi' | 'iptal'
--
-- Sorun:
--   lib/types.ts → 'bekliyor' | 'tamamlandi'  (eksik: 'iptal')
--   lessons.ts cancelLessonAction → status = 'iptal_edildi'  (yazım farklı)
--   reservations.ts çakışma kontrolü → .neq("status", "iptal")  (farklı değer)
--
--   Bu tutarsızlık iptal edilmiş derslerin çakışma sorgusunda görünmemesine,
--   iptal butonunun "zaten iptal edildi" kontrolünü atlamasına ve TypeScript
--   tip sisteminin devre dışı kalmasına yol açıyordu.
--
-- Bu migration:
--   1. Varsa 'iptal_edildi' satırlarını 'iptal' olarak normalleştirir
--   2. DB seviyesinde check constraint ekler

-------------------------------------------------------------------------------
-- 1. Tutarsız değerleri normalleştir
-------------------------------------------------------------------------------
update public.lessons
   set status = 'iptal'
 where status = 'iptal_edildi';

-------------------------------------------------------------------------------
-- 2. Check constraint
-------------------------------------------------------------------------------
alter table public.lessons
  drop constraint if exists lessons_status_check;

alter table public.lessons
  add constraint lessons_status_check
  check (status in ('bekliyor', 'tamamlandi', 'iptal'));

-------------------------------------------------------------------------------
-- ROLLBACK:
--   alter table public.lessons drop constraint if exists lessons_status_check;
-------------------------------------------------------------------------------
