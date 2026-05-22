-- auth.users'a yeni kayıt eklendiğinde public.users'a (id, email, role) kopyalar.
-- role, raw_user_meta_data->>'role' içinden alınır; yoksa varsayılan 'ogrenci'.
-- Trigger auth şemasında tanımlandığından migration service_role ile çalışmalı.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.users (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'ogrenci')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
