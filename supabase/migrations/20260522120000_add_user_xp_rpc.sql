-- add_user_xp(amount int): kimliği doğrulanmış kullanıcı kendi XP'sine ekler
-- Güvenlik: SECURITY DEFINER + auth.uid() → yalnızca kendi kaydına dokunabilir
-- Dönüş: {xp int, level int}

create or replace function public.add_user_xp(amount int)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid       uuid;
  v_new_xp    int;
  v_new_level int;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if amount is null or amount <= 0 then
    raise exception 'invalid amount: must be positive';
  end if;

  update public.users
  set
    xp    = greatest(0, xp + amount),
    level = greatest(1, floor(greatest(0, xp + amount) / 100.0)::int + 1)
  where id = v_uid
  returning xp, level into v_new_xp, v_new_level;

  if not found then
    raise exception 'user not found';
  end if;

  return json_build_object('xp', v_new_xp, 'level', v_new_level);
end;
$$;

revoke all    on function public.add_user_xp(int) from public;
grant execute on function public.add_user_xp(int) to authenticated;
