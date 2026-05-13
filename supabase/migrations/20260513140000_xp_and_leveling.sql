-- Gamification: XP & Level sistemi
--
-- 1) award_xp(uuid, int) — atomik XP ekleme + level yeniden hesaplama
--    Level formülü: floor(xp / 1000) + 1
--
-- 2) Otomatik ödüller (trigger):
--    lessons.INSERT                → hoca'ya  +20 XP
--    assignments.INSERT            → dersin hocasına +20 XP
--    assignments.UPDATE (yapildi)  → dersin öğrencisine +50 XP
--
-- Tüm trigger'lar BEGIN / EXCEPTION ile sarmalandı → XP işlemi başarısız
-- olsa bile birincil işlem (insert/update) rollback olmaz.

-------------------------------------------------------------------------------
-- 1. award_xp RPC
-------------------------------------------------------------------------------
create or replace function public.award_xp(p_user_id uuid, p_amount int)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null or p_amount is null or p_amount = 0 then
    return;
  end if;

  update public.users
  set
    xp    = greatest(0, xp + p_amount),
    level = greatest(1, floor(greatest(0, xp + p_amount) / 1000.0)::int + 1)
  where id = p_user_id;
end;
$$;

revoke all     on function public.award_xp(uuid, int) from public;
grant execute  on function public.award_xp(uuid, int) to authenticated, postgres, service_role;

-------------------------------------------------------------------------------
-- 2. lessons.INSERT → hoca +20 XP
-------------------------------------------------------------------------------
create or replace function public.t_lessons_insert_award_xp()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  begin
    perform public.award_xp(NEW.hoca_id, 20);
  exception when others then
    raise notice 'award_xp lessons.insert failed: %', sqlerrm;
  end;
  return NEW;
end;
$$;

drop trigger if exists lessons_award_xp_on_insert on public.lessons;
create trigger lessons_award_xp_on_insert
  after insert on public.lessons
  for each row execute function public.t_lessons_insert_award_xp();

-------------------------------------------------------------------------------
-- 3. assignments.INSERT → dersin hocasına +20 XP
-------------------------------------------------------------------------------
create or replace function public.t_assignments_insert_award_xp()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hoca_id uuid;
begin
  begin
    select hoca_id into v_hoca_id from public.lessons where id = NEW.lesson_id;
    if v_hoca_id is not null then
      perform public.award_xp(v_hoca_id, 20);
    end if;
  exception when others then
    raise notice 'award_xp assignments.insert failed: %', sqlerrm;
  end;
  return NEW;
end;
$$;

drop trigger if exists assignments_award_xp_on_insert on public.assignments;
create trigger assignments_award_xp_on_insert
  after insert on public.assignments
  for each row execute function public.t_assignments_insert_award_xp();

-------------------------------------------------------------------------------
-- 4. assignments.UPDATE (status → 'yapildi') → öğrenciye +50 XP
-- Not: her teslim olayında +50 verir. Reddedildikten sonra yeniden teslim de
-- ayrı bir kazanım sayılır (öğrenciyi cesaretlendirmek için).
-------------------------------------------------------------------------------
create or replace function public.t_assignments_update_award_xp()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ogrenci_id uuid;
begin
  if OLD.status is distinct from NEW.status and NEW.status = 'yapildi' then
    begin
      select ogrenci_id into v_ogrenci_id from public.lessons where id = NEW.lesson_id;
      if v_ogrenci_id is not null then
        perform public.award_xp(v_ogrenci_id, 50);
      end if;
    exception when others then
      raise notice 'award_xp assignments.update failed: %', sqlerrm;
    end;
  end if;
  return NEW;
end;
$$;

drop trigger if exists assignments_award_xp_on_status on public.assignments;
create trigger assignments_award_xp_on_status
  after update of status on public.assignments
  for each row execute function public.t_assignments_update_award_xp();

-------------------------------------------------------------------------------
-- ROLLBACK (acil durum, manuel olarak çalıştır):
--   drop trigger  if exists assignments_award_xp_on_status on public.assignments;
--   drop function if exists public.t_assignments_update_award_xp();
--   drop trigger  if exists assignments_award_xp_on_insert on public.assignments;
--   drop function if exists public.t_assignments_insert_award_xp();
--   drop trigger  if exists lessons_award_xp_on_insert on public.lessons;
--   drop function if exists public.t_lessons_insert_award_xp();
--   drop function if exists public.award_xp(uuid, int);
-------------------------------------------------------------------------------
