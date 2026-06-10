-- FIX: hoca_complete_lesson çifte ödeme hatası
--
-- Sorun: create_reservation zaten anlık transfer yapıyor (odendi).
-- Eski hoca_complete_lesson price > 0 ise her zaman tekrar transfer yapıyordu.
-- Düzeltme: yalnızca payment_status = 'held_in_escrow' ise transfer yap.
-- 'odendi' durumunda para zaten transfer edilmiş; sadece status güncelle.

create or replace function public.hoca_complete_lesson(p_lesson_id uuid)
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
  v_bakiye         numeric;
begin
  select hoca_id, ogrenci_id, coalesce(price, 0), status, payment_status
    into v_hoca_id, v_ogrenci_id, v_price, v_status, v_payment_status
    from public.lessons
   where id = p_lesson_id;

  if not found then
    raise exception 'Ders bulunamadı (id: %)', p_lesson_id;
  end if;

  if v_hoca_id is distinct from auth.uid() then
    raise exception 'Yetkisiz işlem: yalnızca dersin hocası dersi tamamlayabilir';
  end if;

  if v_status = 'tamamlandi' then
    raise exception 'Bu ders zaten tamamlandı';
  end if;

  update public.lessons
     set status         = 'tamamlandi',
         payment_status = case
                            when v_price > 0 then 'paid_to_teacher'
                            else payment_status
                          end
   where id = p_lesson_id;

  -- Transfer YALNIZCA escrow modelinde; anlık ödemede (odendi) para zaten geçti
  if v_price > 0 and v_payment_status = 'held_in_escrow' then
    select balance into v_bakiye
      from public.wallets where id = v_ogrenci_id for update;

    if not found then
      raise exception 'Öğrenci cüzdanı bulunamadı (id: %)', v_ogrenci_id;
    end if;

    if v_bakiye < v_price then
      raise exception 'Öğrencinin bakiyesi yetersiz (mevcut: %, gereken: %)',
        v_bakiye, v_price;
    end if;

    perform 1 from public.wallets where id = v_hoca_id for update;
    if not found then
      raise exception 'Hoca cüzdanı bulunamadı (id: %)', v_hoca_id;
    end if;

    update public.wallets
       set balance = balance - v_price, updated_at = now()
     where id = v_ogrenci_id;

    update public.wallets
       set balance = balance + v_price, updated_at = now()
     where id = v_hoca_id;

    insert into public.wallet_transactions
      (wallet_id,    amount,   type,             status,        description)
    values
      (v_ogrenci_id, v_price, 'ders_odeme',     'tamamlandi', 'Ders ücreti ödendi'),
      (v_hoca_id,    v_price, 'dersten_kazanc', 'tamamlandi', 'Ders kazancı alındı');
  end if;

  begin
    perform public.award_xp(v_ogrenci_id, 50);
  exception when others then
    null;
  end;

end;
$$;

revoke all    on function public.hoca_complete_lesson(uuid) from public;
grant execute on function public.hoca_complete_lesson(uuid) to authenticated;
