-- Profil zenginleştirme + gamification + quiz altyapısı
--
-- 1) users tablosuna hoca profili (sehir, ilce, ders_fiyati, hakkinda) ve
--    herkes için level/xp (gamification) alanları eklenir.
-- 2) assignments tablosuna score (puan) alanı eklenir.
-- 3) quizzes + quiz_questions tabloları (hocanın quiz hazırlaması) + RLS.

-------------------------------------------------------------------------------
-- 1. users tablosu — yeni alanlar
-------------------------------------------------------------------------------
alter table public.users
  add column if not exists sehir        text,
  add column if not exists ilce         text,
  add column if not exists ders_fiyati  numeric(10,2),
  add column if not exists hakkinda     text,
  add column if not exists level        int  not null default 1,
  add column if not exists xp           int  not null default 0;

-- Negatif değer engeli (xp ve level her zaman pozitif olmalı)
alter table public.users
  drop constraint if exists users_level_nonneg_chk;
alter table public.users
  add  constraint users_level_nonneg_chk check (level >= 1);

alter table public.users
  drop constraint if exists users_xp_nonneg_chk;
alter table public.users
  add  constraint users_xp_nonneg_chk check (xp >= 0);

-- Fiyat negatif olamaz
alter table public.users
  drop constraint if exists users_ders_fiyati_nonneg_chk;
alter table public.users
  add  constraint users_ders_fiyati_nonneg_chk
  check (ders_fiyati is null or ders_fiyati >= 0);

-------------------------------------------------------------------------------
-- 2. assignments tablosu — score
-------------------------------------------------------------------------------
alter table public.assignments
  add column if not exists score int;

-- Score 0-100 aralığında olmalı (null = henüz değerlendirilmemiş)
alter table public.assignments
  drop constraint if exists assignments_score_range_chk;
alter table public.assignments
  add  constraint assignments_score_range_chk
  check (score is null or (score >= 0 and score <= 100));

-------------------------------------------------------------------------------
-- 3. quizzes tablosu
-------------------------------------------------------------------------------
create table if not exists public.quizzes (
  id          uuid primary key default gen_random_uuid(),
  hoca_id     uuid not null references public.users(id) on delete cascade,
  title       text not null,
  description text,
  created_at  timestamptz not null default now()
);

create index if not exists quizzes_hoca_id_idx on public.quizzes(hoca_id);

alter table public.quizzes enable row level security;

-- SELECT: quiz'i hazırlayan hoca + bu hocanın bağlı öğrencileri
drop policy if exists quizzes_select on public.quizzes;
create policy quizzes_select on public.quizzes
  for select to authenticated
  using (
    hoca_id = auth.uid()
    or exists (
      select 1 from public.teacher_students ts
      where ts.hoca_id    = quizzes.hoca_id
        and ts.ogrenci_id = auth.uid()
    )
  );

-- INSERT: yalnızca hoca, kendi hoca_id'siyle
drop policy if exists quizzes_insert on public.quizzes;
create policy quizzes_insert on public.quizzes
  for insert to authenticated
  with check (hoca_id = auth.uid() and public.is_hoca());

-- UPDATE: yalnızca quiz'i hazırlayan hoca
drop policy if exists quizzes_update on public.quizzes;
create policy quizzes_update on public.quizzes
  for update to authenticated
  using      (hoca_id = auth.uid())
  with check (hoca_id = auth.uid());

-- DELETE: yalnızca quiz'i hazırlayan hoca
drop policy if exists quizzes_delete on public.quizzes;
create policy quizzes_delete on public.quizzes
  for delete to authenticated
  using (hoca_id = auth.uid());

-------------------------------------------------------------------------------
-- 4. quiz_questions tablosu
-- options jsonb: ["A şıkkı", "B şıkkı", ...]
-- correct_index: options dizisindeki doğru cevabın 0-tabanlı indeksi
-- order_index: quiz içinde sıralama
-------------------------------------------------------------------------------
create table if not exists public.quiz_questions (
  id            uuid primary key default gen_random_uuid(),
  quiz_id       uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null,
  options       jsonb not null,
  correct_index int  not null,
  order_index   int  not null default 0,
  created_at    timestamptz not null default now(),
  constraint quiz_questions_options_is_array_chk
    check (jsonb_typeof(options) = 'array'),
  constraint quiz_questions_correct_index_range_chk
    check (correct_index >= 0 and correct_index < jsonb_array_length(options))
);

create index if not exists quiz_questions_quiz_id_idx on public.quiz_questions(quiz_id);

alter table public.quiz_questions enable row level security;

-- SELECT: parent quiz görülebiliyorsa soru da görülebilir
drop policy if exists quiz_questions_select on public.quiz_questions;
create policy quiz_questions_select on public.quiz_questions
  for select to authenticated
  using (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_questions.quiz_id
        and (
          q.hoca_id = auth.uid()
          or exists (
            select 1 from public.teacher_students ts
            where ts.hoca_id = q.hoca_id and ts.ogrenci_id = auth.uid()
          )
        )
    )
  );

-- INSERT: yalnızca parent quiz'in sahibi hoca
drop policy if exists quiz_questions_insert on public.quiz_questions;
create policy quiz_questions_insert on public.quiz_questions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_questions.quiz_id and q.hoca_id = auth.uid()
    )
  );

-- UPDATE: yalnızca parent quiz'in sahibi hoca
drop policy if exists quiz_questions_update on public.quiz_questions;
create policy quiz_questions_update on public.quiz_questions
  for update to authenticated
  using (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_questions.quiz_id and q.hoca_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_questions.quiz_id and q.hoca_id = auth.uid()
    )
  );

-- DELETE: yalnızca parent quiz'in sahibi hoca
drop policy if exists quiz_questions_delete on public.quiz_questions;
create policy quiz_questions_delete on public.quiz_questions
  for delete to authenticated
  using (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_questions.quiz_id and q.hoca_id = auth.uid()
    )
  );

-------------------------------------------------------------------------------
-- ROLLBACK (acil durum, manuel olarak çalıştır):
--   drop table if exists public.quiz_questions;
--   drop table if exists public.quizzes;
--   alter table public.assignments drop column if exists score;
--   alter table public.users
--     drop column if exists xp,
--     drop column if exists level,
--     drop column if exists hakkinda,
--     drop column if exists ders_fiyati,
--     drop column if exists ilce,
--     drop column if exists sehir;
-------------------------------------------------------------------------------
