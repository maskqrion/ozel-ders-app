-- Push bildirim altyapısı + otomatik ders hatırlatıcısı
--
-- 1) push_tokens tablosu (cihaz token saklama) + RLS
-- 2) notify_upcoming_lessons() fonksiyonu (1 saat içindeki dersler için
--    sistem mesajı oluşturur)
-- 3) pg_cron ile saatlik schedule

-------------------------------------------------------------------------------
-- 1. push_tokens tablosu
-------------------------------------------------------------------------------
create table if not exists public.push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  token      text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists push_tokens_user_id_idx on public.push_tokens(user_id);

alter table public.push_tokens enable row level security;

-- SELECT: yalnızca kendi token'larını görür
drop policy if exists push_tokens_select on public.push_tokens;
create policy push_tokens_select on public.push_tokens
  for select to authenticated
  using (user_id = auth.uid());

-- INSERT: yalnızca kendi token'ını ekler
drop policy if exists push_tokens_insert on public.push_tokens;
create policy push_tokens_insert on public.push_tokens
  for insert to authenticated
  with check (user_id = auth.uid());

-- UPDATE: yalnızca kendi token'ını günceller (UPSERT senaryosu için)
drop policy if exists push_tokens_update on public.push_tokens;
create policy push_tokens_update on public.push_tokens
  for update to authenticated
  using      (user_id = auth.uid())
  with check (user_id = auth.uid());

-- DELETE policy yok → default deny

-------------------------------------------------------------------------------
-- 2. notify_upcoming_lessons() fonksiyonu
-- 1 saat içinde başlayacak, henüz tamamlanmamış dersleri bulup
-- öğrenciye hoca adına bir sistem mesajı atar.
-- Aynı ders için tekrar mesaj atmamak için son 65 dakikadaki içeriği kontrol eder.
-------------------------------------------------------------------------------
create or replace function public.notify_upcoming_lessons()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  reminder_text constant text :=
    '🔔 Sistem Hatırlatması: Dersimize 1 saatten az bir süre kaldı! Lütfen hazırlıklarınızı tamamlayın.';
  l record;
begin
  for l in
    select id, hoca_id, ogrenci_id, lesson_date
    from public.lessons
    where status = 'bekliyor'
      and lesson_date >  now()
      and lesson_date <= now() + interval '1 hour'
  loop
    -- Aynı çift için yakın geçmişte aynı hatırlatma yollanmamışsa ekle
    if not exists (
      select 1
      from public.messages m
      where m.sender_id   = l.hoca_id
        and m.receiver_id = l.ogrenci_id
        and m.content     = reminder_text
        and m.created_at  > now() - interval '65 minutes'
    ) then
      insert into public.messages (sender_id, receiver_id, content)
      values (l.hoca_id, l.ogrenci_id, reminder_text);
    end if;
  end loop;
end;
$$;

-- Fonksiyonu cron job'undan çağırabilmek için yetki
revoke all on function public.notify_upcoming_lessons() from public;
grant execute on function public.notify_upcoming_lessons() to postgres, service_role;

-------------------------------------------------------------------------------
-- 3. pg_cron schedule (saatlik)
-- Not: pg_cron extension bir kez etkinleştirilmeli (Supabase Dashboard →
-- Database → Extensions → pg_cron). cron schema'sı `cron` adıyla bulunur.
-------------------------------------------------------------------------------
create extension if not exists pg_cron;

-- Aynı job zaten kayıtlıysa önce kaldır, sonra yeniden zamanla
do $$
begin
  if exists (select 1 from cron.job where jobname = 'notify_upcoming_lessons_hourly') then
    perform cron.unschedule('notify_upcoming_lessons_hourly');
  end if;
end
$$;

select cron.schedule(
  'notify_upcoming_lessons_hourly',
  '0 * * * *',                       -- her saat başı
  $$select public.notify_upcoming_lessons();$$
);

-------------------------------------------------------------------------------
-- ROLLBACK (acil durum, manuel olarak çalıştır):
--   select cron.unschedule('notify_upcoming_lessons_hourly');
--   drop function if exists public.notify_upcoming_lessons();
--   drop table    if exists public.push_tokens;
-------------------------------------------------------------------------------
