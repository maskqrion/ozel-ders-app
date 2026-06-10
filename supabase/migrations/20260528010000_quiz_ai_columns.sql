-- Add AI-generation metadata columns to quizzes table.
-- lesson_id: optional foreign key for tying a quiz to a specific lesson.
-- is_ai_generated: flag distinguishing AI-created quizzes from manually created ones.

alter table public.quizzes
  add column if not exists lesson_id       uuid    references public.lessons(id) on delete set null,
  add column if not exists is_ai_generated boolean not null default false;
