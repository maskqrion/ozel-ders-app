-- quiz_attempts tablosuna xp_earned kolonu eklendi.
-- Score kaydedildiğinde kazanılan XP'yi DB'de saklar (analitik + sonuç sayfası).

alter table public.quiz_attempts
  add column if not exists xp_earned integer not null default 0;

-- ROLLBACK:
--   alter table public.quiz_attempts drop column if exists xp_earned;
