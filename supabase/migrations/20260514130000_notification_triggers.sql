-- Faz 2 / Adım 3: Otomatik bildirim trigger'ları
--
-- 1) assignments.INSERT → dersin öğrencisine "Yeni Ödev" bildirimi
-- 2) quizzes.INSERT     → hocanın bağlı tüm öğrencilerine "Yeni Quiz" bildirimi
--
-- Tasarım notları:
--   - SECURITY DEFINER → notifications RLS'ini (user_id = auth.uid()) bypass etmek
--     gerekiyor; trigger'lar farklı kullanıcıların bildirim satırlarını yazar.
--     Fonksiyon owner = postgres → tablo owner = postgres → RLS bypass.
--   - Her trigger gövdesi BEGIN/EXCEPTION ile sarmalı; bildirim üretimi başarısız
--     olsa bile birincil INSERT'i (assignment/quiz) rollback etmez.
--   - Mesajlar için ayrı trigger YOK: mesaj bildirimleri (toast + sayaç) zaten
--     /Mesajlar bileşeni içinde realtime üzerinden frontend'de işleniyor; aynı
--     olaya iki kanaldan bildirim atmak gürültü yaratırdı.

-------------------------------------------------------------------------------
-- 1. assignments.AFTER INSERT → öğrenciye "Yeni Ödev" bildirimi
-------------------------------------------------------------------------------
create or replace function public.t_assignments_notify_student()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ogrenci_id uuid;
begin
  begin
    select ogrenci_id into v_ogrenci_id
    from public.lessons
    where id = NEW.lesson_id;

    if v_ogrenci_id is not null then
      insert into public.notifications (user_id, title, message, type)
      values (
        v_ogrenci_id,
        'Yeni Ödev',
        'Hocanız size yeni bir ödev verdi: ' || coalesce(NEW.title, ''),
        'assignment'
      );
    end if;
  exception when others then
    raise notice 'notify_student (assignments.insert) failed: %', sqlerrm;
  end;
  return NEW;
end;
$$;

drop trigger if exists assignments_notify_student_on_insert on public.assignments;
create trigger assignments_notify_student_on_insert
  after insert on public.assignments
  for each row execute function public.t_assignments_notify_student();

-------------------------------------------------------------------------------
-- 2. quizzes.AFTER INSERT → hocanın bağlı tüm öğrencilerine "Yeni Quiz"
-------------------------------------------------------------------------------
create or replace function public.t_quizzes_notify_students()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  begin
    insert into public.notifications (user_id, title, message, type)
    select
      ts.ogrenci_id,
      'Yeni Quiz',
      'Hocanızdan yeni bir quiz: ' || coalesce(NEW.title, ''),
      'quiz'
    from public.teacher_students ts
    where ts.hoca_id = NEW.hoca_id;
  exception when others then
    raise notice 'notify_students (quizzes.insert) failed: %', sqlerrm;
  end;
  return NEW;
end;
$$;

drop trigger if exists quizzes_notify_students_on_insert on public.quizzes;
create trigger quizzes_notify_students_on_insert
  after insert on public.quizzes
  for each row execute function public.t_quizzes_notify_students();

-------------------------------------------------------------------------------
-- ROLLBACK (acil durum, manuel olarak çalıştır):
--   drop trigger  if exists quizzes_notify_students_on_insert     on public.quizzes;
--   drop function if exists public.t_quizzes_notify_students();
--   drop trigger  if exists assignments_notify_student_on_insert  on public.assignments;
--   drop function if exists public.t_assignments_notify_student();
-------------------------------------------------------------------------------
