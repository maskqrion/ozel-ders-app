-- Quiz oluşturma RPC'si: quizzes + quiz_questions'ı tek transaction'da atomik yazar.
--
-- Tasarım notu: SECURITY INVOKER → caller'ın RLS izinleri geçerli.
--   - quizzes_insert     policy:  hoca_id = auth.uid() AND is_hoca()
--   - quiz_questions_insert policy: parent quiz hoca_id = auth.uid()
-- Aynı transaction içinde quiz + sorular yazıldığı için EXISTS check geçer.

create or replace function public.create_quiz_with_questions(
  p_title       text,
  p_description text,
  p_questions   jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_quiz_id uuid;
  v_q       jsonb;
  v_i       int := 0;
begin
  if p_title is null or length(btrim(p_title)) = 0 then
    raise exception 'Quiz başlığı zorunludur.';
  end if;
  if p_questions is null
     or jsonb_typeof(p_questions) <> 'array'
     or jsonb_array_length(p_questions) = 0
  then
    raise exception 'En az bir soru eklemelisiniz.';
  end if;

  insert into public.quizzes (hoca_id, title, description)
  values (
    auth.uid(),
    btrim(p_title),
    nullif(btrim(coalesce(p_description, '')), '')
  )
  returning id into v_quiz_id;

  for v_q in select * from jsonb_array_elements(p_questions)
  loop
    insert into public.quiz_questions (
      quiz_id, question_text, options, correct_index, order_index
    )
    values (
      v_quiz_id,
      btrim(v_q->>'question_text'),
      v_q->'options',
      (v_q->>'correct_index')::int,
      coalesce((v_q->>'order_index')::int, v_i)
    );
    v_i := v_i + 1;
  end loop;

  return v_quiz_id;
end;
$$;

revoke all     on function public.create_quiz_with_questions(text, text, jsonb) from public;
grant execute  on function public.create_quiz_with_questions(text, text, jsonb) to authenticated;

-------------------------------------------------------------------------------
-- Trigger: quizzes.INSERT → quiz'i oluşturan hocaya +50 XP
-- (Adım 6 ile aynı tasarım: BEGIN/EXCEPTION ile sarmalı, ana INSERT'i bloklamaz)
-------------------------------------------------------------------------------
create or replace function public.t_quizzes_insert_award_xp()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  begin
    perform public.award_xp(NEW.hoca_id, 50);
  exception when others then
    raise notice 'award_xp quizzes.insert failed: %', sqlerrm;
  end;
  return NEW;
end;
$$;

drop trigger if exists quizzes_award_xp_on_insert on public.quizzes;
create trigger quizzes_award_xp_on_insert
  after insert on public.quizzes
  for each row execute function public.t_quizzes_insert_award_xp();

-------------------------------------------------------------------------------
-- ROLLBACK (acil durum, manuel olarak çalıştır):
--   drop trigger  if exists quizzes_award_xp_on_insert on public.quizzes;
--   drop function if exists public.t_quizzes_insert_award_xp();
--   drop function if exists public.create_quiz_with_questions(text, text, jsonb);
-------------------------------------------------------------------------------
