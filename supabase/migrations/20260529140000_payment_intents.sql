-- 3D Secure ödeme niyeti takibi
-- iyzico 3DS akışında: initialize → bank redirect → callback → complete
-- Bu tablo, banka callback'inde hangi kullanıcının ne kadar yüklediğini hatırlar.

create table if not exists public.payment_intents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  amount          numeric(10,2) not null check (amount > 0),
  conversation_id text not null unique,
  status          text not null default 'pending'
                  check (status in ('pending', 'completed', 'failed', 'expired')),
  error_message   text,
  tx_id           uuid,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default now() + interval '30 minutes'
);

create index if not exists payment_intents_conversation_id_idx
  on public.payment_intents(conversation_id);
create index if not exists payment_intents_user_id_idx
  on public.payment_intents(user_id);

alter table public.payment_intents enable row level security;

drop policy if exists "payment_intents_select_own" on public.payment_intents;
create policy "payment_intents_select_own" on public.payment_intents
  for select to authenticated
  using (user_id = auth.uid());

-- INSERT/UPDATE sadece service_role üzerinden (server action + callback handler)
-- Kullanıcı doğrudan kayıt oluşturamaz.

-- Süresi dolmuş pending intent'leri temizle (saatlik)
create extension if not exists pg_cron;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'cleanup_expired_payment_intents') then
    perform cron.unschedule('cleanup_expired_payment_intents');
  end if;
end
$$;

select cron.schedule(
  'cleanup_expired_payment_intents',
  '15 * * * *',
  $$
  update public.payment_intents
     set status = 'expired'
   where status = 'pending'
     and expires_at < now();
  $$
);
