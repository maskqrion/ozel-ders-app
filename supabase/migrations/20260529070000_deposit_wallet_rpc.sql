-- Atomik bakiye yükleme RPC: race condition'sız balance = balance + amount
--
-- Sorun: payment.ts ve wallet.ts'te "bakiye oku → topla → yaz" üç adımlı
-- pattern aynı anda iki istek geldiğinde bakiyenin çift okunmasına yol açar:
--
--   İstek A: balance oku = 100  →  yaz 150
--   İstek B: balance oku = 100  →  yaz 150  (150 değil 200 olması gerekirdi)
--
-- Çözüm: tek UPDATE ile SET balance = balance + p_amount → PostgreSQL row-lock
-- sayesinde iki işlem sıralı çalışır, bakiye her zaman doğru hesaplanır.
--
-- Dönüş: JSON { new_balance: numeric, tx_id: uuid }
-- Yalnızca service_role üzerinden çağrılır (authenticated grant yok).

create or replace function public.deposit_wallet(
  p_user_id     uuid,
  p_amount      numeric,
  p_description text default 'Bakiye yükleme'
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_new_balance numeric;
  v_tx_id       uuid;
begin
  if p_amount <= 0 then
    raise exception 'Tutar pozitif olmalıdır, alınan: %', p_amount;
  end if;

  -- Atomik bakiye artışı (row-lock: UPDATE önceki UPDATE bitmeden bekler)
  update public.wallets
     set balance    = balance + p_amount,
         updated_at = now()
   where id = p_user_id
  returning balance into v_new_balance;

  if not found then
    raise exception 'Cüzdan bulunamadı (id: %)', p_user_id;
  end if;

  -- İşlem kaydı
  insert into public.wallet_transactions
    (wallet_id, amount, type,              status,        description)
  values
    (p_user_id, p_amount, 'bakiye_yukleme', 'tamamlandi', p_description)
  returning id into v_tx_id;

  return json_build_object(
    'new_balance', v_new_balance,
    'tx_id',       v_tx_id
  );
end;
$$;

-- Authenticated kullanıcılar bu fonksiyonu doğrudan çağıramamalı;
-- yalnızca service_role (server action'lar) üzerinden erişilir.
revoke all    on function public.deposit_wallet(uuid, numeric, text) from public;
revoke all    on function public.deposit_wallet(uuid, numeric, text) from authenticated;
grant  execute on function public.deposit_wallet(uuid, numeric, text) to service_role;

-------------------------------------------------------------------------------
-- ROLLBACK:
--   revoke execute on function public.deposit_wallet(uuid, numeric, text)
--     from service_role;
--   drop function if exists public.deposit_wallet(uuid, numeric, text);
-------------------------------------------------------------------------------
