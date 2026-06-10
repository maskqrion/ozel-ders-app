-- refund_lesson_payment: anlık ödeme modelinde iptal iadesi (hoca→öğrenci)
--
-- Anlık ödeme modelinde (payment_status = 'odendi') para rezervasyon
-- anında öğrenciden hocanın cüzdanına geçmiştir.
-- İptal durumunda: hoca → öğrenci atomik transfer.

create or replace function public.refund_lesson_payment(
  p_lesson_id  uuid,
  p_caller_id  uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hoca_id        uuid;
  v_ogrenci_id     uuid;
  v_price          numeric;
  v_status         text;
  v_payment_status text;
  v_hoca_bakiye    numeric;
begin
  select hoca_id, ogrenci_id, coalesce(price, 0), status, payment_status
    into v_hoca_id, v_ogrenci_id, v_price, v_status, v_payment_status
    from public.lessons
   where id = p_lesson_id;

  if not found then
    raise exception 'Ders bulunamadı';
  end if;

  if p_caller_id is distinct from v_hoca_id and p_caller_id is distinct from v_ogrenci_id then
    raise exception 'Yetkisiz';
  end if;

  if v_status in ('iptal', 'tamamlandi') then
    raise exception 'Bu ders zaten % durumunda', v_status;
  end if;

  if v_price <= 0 or v_payment_status != 'odendi' then
    return;
  end if;

  -- Deadlock önleme: küçük UUID'yi önce kilitle
  if v_hoca_id < v_ogrenci_id then
    select balance into v_hoca_bakiye
      from public.wallets where id = v_hoca_id for update;
    perform 1 from public.wallets where id = v_ogrenci_id for update;
  else
    perform 1 from public.wallets where id = v_ogrenci_id for update;
    select balance into v_hoca_bakiye
      from public.wallets where id = v_hoca_id for update;
  end if;

  if v_hoca_bakiye < v_price then
    raise exception 'Hocanın bakiyesi iade için yetersiz (mevcut: %, gereken: %)',
      v_hoca_bakiye, v_price;
  end if;

  update public.wallets
     set balance = balance - v_price, updated_at = now()
   where id = v_hoca_id;

  update public.wallets
     set balance = balance + v_price, updated_at = now()
   where id = v_ogrenci_id;

  insert into public.wallet_transactions
    (wallet_id,     amount,   type,    status,        description)
  values
    (v_hoca_id,     v_price, 'iade', 'tamamlandi', 'Ders iptali — öğrenciye iade'),
    (v_ogrenci_id,  v_price, 'iade', 'tamamlandi', 'Ders iptali iadesi');

end;
$$;

revoke all    on function public.refund_lesson_payment(uuid, uuid) from public;
grant execute on function public.refund_lesson_payment(uuid, uuid) to authenticated;
