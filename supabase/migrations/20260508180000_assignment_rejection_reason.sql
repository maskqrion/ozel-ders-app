-- Hoca, teslim edilmiş ödevi reddederken opsiyonel bir sebep yazabilir.
-- Reddedildi banner'ında öğrenciye gösterilir; öğrenci tekrar teslim ettiğinde
-- (status: reddedildi → yapildi) bu alan da NULL'lanır (UI handler'ında).

alter table public.assignments
  add column if not exists rejection_reason text;
