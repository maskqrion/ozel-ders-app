-- Serverless-safe sliding window rate limiter
-- Her serverless instance aynı DB'yi gördüğünden cross-instance çalışır.

create table if not exists public.rate_limit_requests (
  id         bigserial    primary key,
  identifier text         not null,
  created_at timestamptz  not null default now()
);

create index if not exists idx_rate_limit_requests_identifier_ts
  on public.rate_limit_requests (identifier, created_at desc);

alter table public.rate_limit_requests enable row level security;

create or replace function public.check_rate_limit(
  p_identifier text,
  p_limit      int,
  p_window_ms  bigint
)
returns table(allowed boolean, remaining int, retry_after_ms bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window_start timestamptz;
  v_count        int;
  v_oldest_ts    timestamptz;
  v_retry_ms     bigint := 0;
begin
  v_window_start := now() - (p_window_ms || ' milliseconds')::interval;

  delete from public.rate_limit_requests
   where identifier = p_identifier
     and created_at < v_window_start;

  select count(*) into v_count
    from public.rate_limit_requests
   where identifier = p_identifier
     and created_at >= v_window_start
     for update;

  if v_count >= p_limit then
    select created_at into v_oldest_ts
      from public.rate_limit_requests
     where identifier = p_identifier
       and created_at >= v_window_start
     order by created_at asc
     limit 1;

    v_retry_ms := greatest(0,
      extract(epoch from (v_oldest_ts + (p_window_ms || ' milliseconds')::interval - now()))::bigint * 1000
    );

    return query select false, 0, v_retry_ms;
  else
    insert into public.rate_limit_requests (identifier) values (p_identifier);
    return query select true, (p_limit - v_count - 1)::int, 0::bigint;
  end if;
end;
$$;

revoke all    on function public.check_rate_limit(text, int, bigint) from public;
grant execute on function public.check_rate_limit(text, int, bigint) to service_role;
