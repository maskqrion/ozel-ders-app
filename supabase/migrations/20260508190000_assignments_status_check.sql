-- assignments.status için CHECK constraint:
-- Status alanı text olarak duruyor, geçerli değer kümesi DB seviyesinde
-- garanti altına alınmıyordu. 'reddedildi' eklendiği için tüm enum'u açıkça
-- kısıtlıyoruz. Eski (varsa) constraint drop edilip yeniden oluşturuluyor.

alter table public.assignments
  drop constraint if exists assignments_status_check;

alter table public.assignments
  add constraint assignments_status_check
  check (status in ('verildi','yapildi','reddedildi'));
