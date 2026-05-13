-- Hoca ↔ Öğrenci izolasyonu ve davet linki sistemi
--
-- Bu migration iki yeni tablo ekler:
--   1) teacher_students  : kabul edilmiş hoca-öğrenci bağı
--   2) invitations       : hoca tarafından üretilen tek-kullanımlık davet token'ları
--
-- RLS politikaları minimum yetki ilkesine göre yazıldı; davet akışı:
--   hoca   → invitations tablosuna kendi hoca_id'siyle INSERT
--   öğrenci → token ile invitations satırını SELECT (yalnızca is_used=false)
--   öğrenci → teacher_students'a kendi ogrenci_id'siyle INSERT
--   öğrenci → invitations.is_used'i false → true olacak şekilde UPDATE

-------------------------------------------------------------------------------
-- 1. teacher_students tablosu
-------------------------------------------------------------------------------
create table if not exists public.teacher_students (
  id         uuid primary key default gen_random_uuid(),
  hoca_id    uuid not null references public.users(id) on delete cascade,
  ogrenci_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint teacher_students_unique_pair unique (hoca_id, ogrenci_id)
);

create index if not exists teacher_students_hoca_id_idx    on public.teacher_students(hoca_id);
create index if not exists teacher_students_ogrenci_id_idx on public.teacher_students(ogrenci_id);

alter table public.teacher_students enable row level security;

-- SELECT: hoca kendi öğrencisini, öğrenci kendi hocasını görebilir
drop policy if exists teacher_students_select on public.teacher_students;
create policy teacher_students_select on public.teacher_students
  for select to authenticated
  using (hoca_id = auth.uid() or ogrenci_id = auth.uid());

-- INSERT: yalnızca öğrenci kendisini bağlayabilir (davet kabul akışı)
drop policy if exists teacher_students_insert on public.teacher_students;
create policy teacher_students_insert on public.teacher_students
  for insert to authenticated
  with check (ogrenci_id = auth.uid() and public.is_ogrenci());

-- UPDATE / DELETE policy yok → default deny

-------------------------------------------------------------------------------
-- 2. invitations tablosu
-------------------------------------------------------------------------------
create table if not exists public.invitations (
  id         uuid primary key default gen_random_uuid(),
  hoca_id    uuid not null references public.users(id) on delete cascade,
  token      text not null unique,
  is_used    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists invitations_hoca_id_idx on public.invitations(hoca_id);
create index if not exists invitations_token_idx   on public.invitations(token);

alter table public.invitations enable row level security;

-- SELECT: davet sahibi hoca + token'ı bilen tüm authenticated kullanıcılar
-- (öğrenci, /davet sayfasında token doğrulaması yapabilsin diye)
drop policy if exists invitations_select on public.invitations;
create policy invitations_select on public.invitations
  for select to authenticated
  using (true);

-- INSERT: yalnızca hoca, kendi hoca_id'siyle davet üretebilir
drop policy if exists invitations_insert on public.invitations;
create policy invitations_insert on public.invitations
  for insert to authenticated
  with check (hoca_id = auth.uid() and public.is_hoca());

-- UPDATE: yalnızca öğrenci, kullanılmamış bir daveti "kullanıldı" olarak işaretleyebilir
drop policy if exists invitations_update on public.invitations;
create policy invitations_update on public.invitations
  for update to authenticated
  using      (public.is_ogrenci() and is_used = false)
  with check (is_used = true);

-- DELETE policy yok → default deny

-------------------------------------------------------------------------------
-- ROLLBACK (acil durum, manuel olarak çalıştır):
--   drop table if exists public.invitations;
--   drop table if exists public.teacher_students;
-------------------------------------------------------------------------------
