-- Güvenli ve Transactional Cüzdan Mimarisi (ACID)
--
-- 20260515100000_wallet_and_payments.sql'deki eski şemayı supersede eder:
--   * wallets.id artık public.users.id'yi doğrudan referans alır (1:1)
--   * wallet_transactions tablosu Türkçe tip/durum kısıtlarıyla oluşturulur
--   * Client-side yazma tamamen engellenir → Default Deny
--   * transfer_lesson_payment: ACID-uyumlu, FOR UPDATE kilitli RPC

-------------------------------------------------------------------------------
-- Eski şemayı temizle
-------------------------------------------------------------------------------
drop trigger  if exists on_auth_user_created_wallet on auth.users;
drop function if exists public.t_create_wallet_for_new_user();
drop table    if exists public.wallet_transactions cascade;
drop table    if exists public.transactions         cascade;
drop table    if exists public.wallets              cascade;

-------------------------------------------------------------------------------
-- 1. wallets: kullanıcıyla 1:1, id = public.users.id
-------------------------------------------------------------------------------
create table public.wallets (
  id         uuid        primary key references public.users(id) on delete cascade,
  balance    numeric     not null default 0 check (balance >= 0),
  currency   varchar(3)  not null default 'TRY',
  updated_at timestamptz not null default now()
);

-------------------------------------------------------------------------------
-- 2. wallet_transactions: Türkçe tip ve durum kısıtları
-------------------------------------------------------------------------------
create table public.wallet_transactions (
  id          uuid        primary key default gen_random_uuid(),
  wallet_id   uuid        not null references public.wallets(id) on delete cascade,
  amount      numeric     not null,
  type        text        not null
    check (type in ('bakiye_yukleme', 'dersten_kazanc', 'ders_odeme', 'iade')),
  status      text        not null default 'beklemede'
    check (status in ('beklemede', 'tamamlandi', 'basarisiz')),
  description text,
  created_at  timestamptz not null default now()
);

-------------------------------------------------------------------------------
-- 3. RLS: wallets — yalnızca SELECT, yazma tamamen kapalı (Default Deny)
--    Bakiyeler yalnızca service_role veya SECURITY DEFINER RPC ile değişir.
-------------------------------------------------------------------------------
alter table public.wallets enable row level security;

drop policy if exists wallets_select on public.wallets;
create policy wallets_select on public.wallets
  for select to authenticated
  using (id = auth.uid());

-- INSERT / UPDATE / DELETE politikası yok → implicit deny

-------------------------------------------------------------------------------
-- 4. RLS: wallet_transactions — yalnızca SELECT
--    wallet_id = wallets.id = users.id = auth.uid() olduğundan doğrudan karşılaştırma güvenli.
-------------------------------------------------------------------------------
alter table public.wallet_transactions enable row level security;

drop policy if exists wallet_transactions_select on public.wallet_transactions;
create policy wallet_transactions_select on public.wallet_transactions
  for select to authenticated
  using (wallet_id = auth.uid());

-- INSERT / UPDATE / DELETE politikası yok → implicit deny

-------------------------------------------------------------------------------
-- 5. Trigger: public.users INSERT → otomatik boş cüzdan
--    Auth zinciri: auth.users → public.users (on_auth_user_created) → public.wallets (bu trigger)
-------------------------------------------------------------------------------
create or replace function public.t_create_wallet_for_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.wallets (id, balance)
  values (new.id, 0)
  on conflict (id) do nothing;
  return new;
exception when others then
  return new; -- cüzdan hatası kullanıcı kaydını bloklamasın
end;
$$;

drop trigger  if exists on_public_user_wallet_create on public.users;
create trigger on_public_user_wallet_create
  after insert on public.users
  for each row
  execute function public.t_create_wallet_for_user();

-------------------------------------------------------------------------------
-- 6. ACID Transfer RPC: transfer_lesson_payment
--
--    Güvenlik modeli:
--      * SECURITY DEFINER → RLS bypass; yetki kontrolü fonksiyon içinde yapılır
--      * p_ogrenci_id = auth.uid() zorunlu → başkasının cüzdanından para çekilemez
--      * FOR UPDATE kilitler → eş zamanlı işlemlerde tutarlılık
--      * Kilit sırası her zaman ogrenci→hoca; aynı yönlü tek-taraflı transfer
--        olduğundan deadlock senaryosu oluşamaz
--      * RAISE EXCEPTION → herhangi bir hata tüm işlemi otomatik rollback eder (ACID)
-------------------------------------------------------------------------------
create or replace function public.transfer_lesson_payment(
  p_ogrenci_id uuid,
  p_hoca_id    uuid,
  p_tutar      numeric
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ogrenci_bakiye numeric;
begin
  -- Yalnızca oturum açmış öğrenci kendi adına ödeme başlatabilir
  if p_ogrenci_id <> auth.uid() then
    raise exception 'Yetkisiz işlem: yalnızca kendi ödemenizi başlatabilirsiniz';
  end if;

  if p_tutar <= 0 then
    raise exception 'Tutar pozitif olmalıdır, alınan: %', p_tutar;
  end if;

  -- Öğrenci cüzdanını kilitli oku (okuma + kilit atomik)
  select balance
    into v_ogrenci_bakiye
    from public.wallets
   where id = p_ogrenci_id
     for update;

  if not found then
    raise exception 'Öğrenci cüzdanı bulunamadı (id: %)', p_ogrenci_id;
  end if;

  if v_ogrenci_bakiye < p_tutar then
    raise exception 'Yetersiz bakiye: mevcut %, istenen %',
      v_ogrenci_bakiye, p_tutar;
  end if;

  -- Hoca cüzdanını kilitle (bakiye okumaya gerek yok)
  perform 1
    from public.wallets
   where id = p_hoca_id
     for update;

  if not found then
    raise exception 'Hoca cüzdanı bulunamadı (id: %)', p_hoca_id;
  end if;

  -- Atomik bakiye güncellemesi
  update public.wallets
     set balance    = balance - p_tutar,
         updated_at = now()
   where id = p_ogrenci_id;

  update public.wallets
     set balance    = balance + p_tutar,
         updated_at = now()
   where id = p_hoca_id;

  -- İşlem kayıtları (tek INSERT, atomik)
  insert into public.wallet_transactions
    (wallet_id,    amount,   type,             status,        description)
  values
    (p_ogrenci_id, p_tutar, 'ders_odeme',     'tamamlandi', 'Ders ödemesi gönderildi'),
    (p_hoca_id,    p_tutar, 'dersten_kazanc', 'tamamlandi', 'Ders kazancı alındı');
end;
$$;

grant execute on function public.transfer_lesson_payment(uuid, uuid, numeric)
  to authenticated;

-------------------------------------------------------------------------------
-- ROLLBACK (acil durum, manuel çalıştır):
--   drop trigger  if exists on_public_user_wallet_create on public.users;
--   drop function if exists public.t_create_wallet_for_user();
--   revoke execute on function public.transfer_lesson_payment(uuid,uuid,numeric)
--     from authenticated;
--   drop function if exists public.transfer_lesson_payment(uuid, uuid, numeric);
--   drop table    if exists public.wallet_transactions cascade;
--   drop table    if exists public.wallets             cascade;
-------------------------------------------------------------------------------
