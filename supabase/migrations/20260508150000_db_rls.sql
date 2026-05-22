-- DB-tarafı Row-Level Security:
-- public.users / lessons / assignments / resources tabloları için tighter RLS.
-- Storage RLS'in koruyucu olabilmesi için bu zorunlu (aksi halde DB üzerinden
-- assignments.submission_file_path manipüle edilerek storage join bypass edilir).

-------------------------------------------------------------------------------
-- 1. Helper functions: rol kontrolü (recursive RLS'i önlemek için SECURITY DEFINER)
-------------------------------------------------------------------------------
-- public.users sorgusu yerine doğrudan JWT'den okunur.
-- public.users'a SELECT yapılsaydı users_select RLS politikası is_hoca()'yı
-- tekrar çağırır → sonsuz özyineleme (stack depth exceeded) oluşurdu.
create or replace function public.is_hoca()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    auth.jwt() -> 'user_metadata' ->> 'role' = 'hoca',
    false
  );
$$;

create or replace function public.is_ogrenci()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    auth.jwt() -> 'user_metadata' ->> 'role' = 'ogrenci',
    false
  );
$$;

-- authenticated rolünün bu fonksiyonları çağırabilmesi için
grant execute on function public.is_hoca()    to authenticated;
grant execute on function public.is_ogrenci() to authenticated;

-------------------------------------------------------------------------------
-- 2. users tablosu
-------------------------------------------------------------------------------
alter table public.users enable row level security;

drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select to authenticated
  using (
    -- kendi satırım
    id = auth.uid()
    -- ben hocayım, bu satır bir öğrenci (hoca panelindeki dropdown için)
    or (public.is_hoca() and role = 'ogrenci')
    -- bu satırla aynı dersi paylaşıyoruz (lessons join'leri için)
    or exists (
      select 1 from public.lessons l
      where (l.hoca_id    = auth.uid() and l.ogrenci_id = users.id)
         or (l.ogrenci_id = auth.uid() and l.hoca_id    = users.id)
    )
  );

drop policy if exists users_insert on public.users;
create policy users_insert on public.users
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists users_update on public.users;
create policy users_update on public.users
  for update to authenticated
  using      (id = auth.uid())
  with check (id = auth.uid());

-- DELETE policy yok → default deny

-------------------------------------------------------------------------------
-- 3. lessons tablosu
-------------------------------------------------------------------------------
alter table public.lessons enable row level security;

drop policy if exists lessons_select on public.lessons;
create policy lessons_select on public.lessons
  for select to authenticated
  using (hoca_id = auth.uid() or ogrenci_id = auth.uid());

drop policy if exists lessons_insert on public.lessons;
create policy lessons_insert on public.lessons
  for insert to authenticated
  with check (hoca_id = auth.uid() and public.is_hoca());

drop policy if exists lessons_update on public.lessons;
create policy lessons_update on public.lessons
  for update to authenticated
  using      (hoca_id = auth.uid())
  with check (hoca_id = auth.uid());

-- DELETE policy yok → default deny

-------------------------------------------------------------------------------
-- 4. assignments tablosu
-------------------------------------------------------------------------------
alter table public.assignments enable row level security;

-- SELECT: dersin hocası VEYA öğrencisi
drop policy if exists assignments_select on public.assignments;
create policy assignments_select on public.assignments
  for select to authenticated
  using (
    exists (
      select 1 from public.lessons l
      where l.id = assignments.lesson_id
        and (l.hoca_id = auth.uid() or l.ogrenci_id = auth.uid())
    )
  );

-- INSERT: dersin hocası
drop policy if exists assignments_insert on public.assignments;
create policy assignments_insert on public.assignments
  for insert to authenticated
  with check (
    exists (
      select 1 from public.lessons l
      where l.id = assignments.lesson_id and l.hoca_id = auth.uid()
    )
  );

-- UPDATE (öğrenci): teslim alanlarını güncellemek için
-- Not: PostgreSQL satır-bazlı RLS sütun kısıtlaması yapmaz. UI sadece teslim
-- alanlarını gönderiyor; daha sıkı kilit gerektiğinde sütun trigger'ı eklenir.
drop policy if exists assignments_update_ogrenci on public.assignments;
create policy assignments_update_ogrenci on public.assignments
  for update to authenticated
  using (
    exists (
      select 1 from public.lessons l
      where l.id = assignments.lesson_id and l.ogrenci_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.lessons l
      where l.id = assignments.lesson_id and l.ogrenci_id = auth.uid()
    )
  );

-- UPDATE (hoca): kendi dersinin ödevini düzenleyebilir
drop policy if exists assignments_update_hoca on public.assignments;
create policy assignments_update_hoca on public.assignments
  for update to authenticated
  using (
    exists (
      select 1 from public.lessons l
      where l.id = assignments.lesson_id and l.hoca_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.lessons l
      where l.id = assignments.lesson_id and l.hoca_id = auth.uid()
    )
  );

-- DELETE policy yok → default deny

-------------------------------------------------------------------------------
-- 5. resources tablosu
-------------------------------------------------------------------------------
alter table public.resources enable row level security;

-- SELECT: tüm authenticated (mevcut UX: kaynaklar herkese açık)
drop policy if exists resources_select on public.resources;
create policy resources_select on public.resources
  for select to authenticated
  using (true);

-- INSERT: sadece hoca, kendi yukleyen_id'siyle
drop policy if exists resources_insert on public.resources;
create policy resources_insert on public.resources
  for insert to authenticated
  with check (yukleyen_id = auth.uid() and public.is_hoca());

-- UPDATE / DELETE policy yok → default deny

-------------------------------------------------------------------------------
-- ROLLBACK (acil durum, manuel olarak çalıştır):
--   alter table public.users       disable row level security;
--   alter table public.lessons     disable row level security;
--   alter table public.assignments disable row level security;
--   alter table public.resources   disable row level security;
-------------------------------------------------------------------------------
