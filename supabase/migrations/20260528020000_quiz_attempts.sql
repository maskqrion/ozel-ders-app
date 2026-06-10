-- quiz_attempts: öğrencinin quiz denemelerini saklar
create table if not exists public.quiz_attempts (
  id          uuid        default gen_random_uuid() primary key,
  quiz_id     uuid        not null references public.quizzes(id) on delete cascade,
  student_id  uuid        not null references public.users(id)   on delete cascade,
  score       integer     not null default 0,
  total       integer     not null default 0,
  answers_json jsonb      not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

-- İndeksler
create index if not exists quiz_attempts_student_idx on public.quiz_attempts(student_id);
create index if not exists quiz_attempts_quiz_idx    on public.quiz_attempts(quiz_id);

-- RLS
alter table public.quiz_attempts enable row level security;

-- Öğrenci kendi denemelerini okuyabilir
drop policy if exists "ogrenci_kendi_denemelerini_okur" on public.quiz_attempts;
create policy "ogrenci_kendi_denemelerini_okur"
  on public.quiz_attempts for select
  using (student_id = auth.uid());

-- Öğrenci kendi denemesini ekleyebilir
drop policy if exists "ogrenci_kendi_denemesini_ekler" on public.quiz_attempts;
create policy "ogrenci_kendi_denemesini_ekler"
  on public.quiz_attempts for insert
  with check (student_id = auth.uid());

-- Hoca kendi quizine ait denemeleri okuyabilir
drop policy if exists "hoca_quiz_denemelerini_okur" on public.quiz_attempts;
create policy "hoca_quiz_denemelerini_okur"
  on public.quiz_attempts for select
  using (
    exists (
      select 1 from public.quizzes q
       where q.id = quiz_id
         and q.hoca_id = auth.uid()
    )
  );

-------------------------------------------------------------------------------
-- ROLLBACK:
--   drop table if exists public.quiz_attempts;
-------------------------------------------------------------------------------
