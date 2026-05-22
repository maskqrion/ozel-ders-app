-- Cüzdan ve Escrow Ödeme Sistemi
--
-- 1. wallets tablosu         — her kullanıcıya ait bakiye
-- 2. transactions tablosu    — tüm para hareketleri (deposit/withdrawal/escrow)
-- 3. lessons tablosu ALTER   — price ve payment_status sütunları
-- 4. RLS politikaları        — sadece kendi cüzdanı/işlemleri görülebilir
-- 5. Trigger                 — yeni auth.users kaydında otomatik boş cüzdan

-------------------------------------------------------------------------------
-- 1. wallets tablosu
-------------------------------------------------------------------------------
create table if not exists public.wallets (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  balance     numeric     not null default 0 check (balance >= 0),
  updated_at  timestamptz not null default now(),
  unique (user_id)
);

-------------------------------------------------------------------------------
-- 2. transactions tablosu
-------------------------------------------------------------------------------
create table if not exists public.transactions (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade,
  amount              numeric     not null,
  type                text        not null
    check (type in ('deposit', 'withdrawal', 'escrow_hold', 'escrow_release')),
  status              text        not null default 'pending'
    check (status in ('pending', 'completed', 'failed')),
  reference_lesson_id uuid        references public.lessons(id) on delete set null,
  created_at          timestamptz not null default now()
);

-------------------------------------------------------------------------------
-- 3. lessons tablosuna ödeme sütunları
-------------------------------------------------------------------------------
alter table public.lessons
  add column if not exists price          numeric not null default 0,
  add column if not exists payment_status text    not null default 'pending'
    check (payment_status in ('pending', 'held_in_escrow', 'paid_to_teacher', 'refunded'));

-------------------------------------------------------------------------------
-- 4a. RLS: wallets — kullanıcı yalnızca kendi cüzdanını görebilir/güncelleyebilir
-------------------------------------------------------------------------------
alter table public.wallets enable row level security;

drop policy if exists wallets_select on public.wallets;
create policy wallets_select on public.wallets
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists wallets_insert on public.wallets;
create policy wallets_insert on public.wallets
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists wallets_update on public.wallets;
create policy wallets_update on public.wallets
  for update to authenticated
  using      (user_id = auth.uid())
  with check (user_id = auth.uid());

-- DELETE policy yok → default deny

-------------------------------------------------------------------------------
-- 4b. RLS: transactions — kullanıcı yalnızca kendi işlemlerini görebilir
--     (status güncellemesi servis rolü / backend üzerinden yapılır; client update yok)
-------------------------------------------------------------------------------
alter table public.transactions enable row level security;

drop policy if exists transactions_select on public.transactions;
create policy transactions_select on public.transactions
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists transactions_insert on public.transactions;
create policy transactions_insert on public.transactions
  for insert to authenticated
  with check (user_id = auth.uid());

-- UPDATE / DELETE policy yok → işlem geçmişi değiştirilemez

-------------------------------------------------------------------------------
-- 5. Trigger: yeni kullanıcıya otomatik boş cüzdan oluştur
--
--    SECURITY DEFINER → auth.users üzerinde çalışan trigger'ın wallets tablosuna
--    yazabilmesi için gerekli; fonksiyon sahibi (postgres) tablo sahibiyle aynı.
--    BEGIN/EXCEPTION → cüzdan oluşturma başarısız olsa bile kayıt akışını bloklamaz.
-------------------------------------------------------------------------------
create or replace function public.t_create_wallet_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  begin
    insert into public.wallets (user_id, balance)
    values (new.id, 0)
    on conflict (user_id) do nothing;
  exception when others then
    null; -- sessiz hata; kullanıcı kaydını engelleme
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_wallet on auth.users;
create trigger on_auth_user_created_wallet
  after insert on auth.users
  for each row
  execute function public.t_create_wallet_for_new_user();

-------------------------------------------------------------------------------
-- ROLLBACK (acil durum, manuel olarak çalıştır):
--   drop trigger  if exists on_auth_user_created_wallet on auth.users;
--   drop function if exists public.t_create_wallet_for_new_user();
--   alter table public.lessons
--     drop column if exists price,
--     drop column if exists payment_status;
--   drop table if exists public.transactions;
--   drop table if exists public.wallets;
-------------------------------------------------------------------------------
