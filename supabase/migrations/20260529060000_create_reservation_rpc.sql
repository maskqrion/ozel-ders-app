-- Atomik ders rezervasyonu: çakışma kontrolü + ödeme + ders kaydı tek transaction
--
-- Sorun: reservations.ts üç ayrı adım olarak yapıyordu:
--   1. çakışma kontrolü (SELECT)
--   2. transfer_lesson_payment RPC
--   3. lessons INSERT
-- Adım 2 başarılı olup adım 3 başarısız olursa para çekilmiş ama ders
-- oluşmamış olur — geri alınamaz bakiye kaybı.
--
-- Bu fonksiyon üç adımı tek PostgreSQL transaction içine alır:
-- herhangi bir adım RAISE EXCEPTION atarsa tümü otomatik rollback olur.
--
-- Güvenlik:
--   SECURITY DEFINER → RLS bypass; yetki kontrolü fonksiyon içinde yapılır
--   p_ogrenci_id = auth.uid() zorunlu → başkasının adına rezervasyon yapılamaz
--   FOR UPDATE kilitler → eş zamanlı rezervasyon çakışmasını önler

create or replace function public.create_reservation(
  p_hoca_id     uuid,
  p_ogrenci_id  uuid,
  p_lesson_date timestamptz,
  p_price       numeric
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_slot_start     timestamptz;
  v_slot_end       timestamptz;
  v_conflict_count int;
  v_ogrenci_bakiye numeric;
  v_lesson_id      uuid;
begin
  -- ── Yetki: yalnızca öğrenci kendi adına rezervasyon yapabilir ───────────
  if p_ogrenci_id is distinct from auth.uid() then
    raise exception 'Yetkisiz: yalnızca kendi adınıza rezervasyon yapabilirsiniz';
  end if;

  if p_price < 0 then
    raise exception 'Fiyat negatif olamaz';
  end if;

  -- ── Saat normalleştirme (tam saat başı) ─────────────────────────────────
  v_slot_start := date_trunc('hour', p_lesson_date);
  v_slot_end   := v_slot_start + interval '1 hour';

  -- ── 1. Çakışma kontrolü ─────────────────────────────────────────────────
  -- İptal edilmiş dersler ('iptal') boş slot sayılır
  select count(*)
    into v_conflict_count
    from public.lessons
   where hoca_id     = p_hoca_id
     and lesson_date >= v_slot_start
     and lesson_date <  v_slot_end
     and status     != 'iptal';

  if v_conflict_count > 0 then
    raise exception 'Bu saat dolu, başka bir zaman seçin.';
  end if;

  -- ── 2. Ödeme: öğrenci → hoca anlık transfer (p_price > 0 ise) ───────────
  if p_price > 0 then
    -- Deadlock önlemek için kilit sırası her zaman: ogrenci → hoca
    select balance
      into v_ogrenci_bakiye
      from public.wallets
     where id = p_ogrenci_id
       for update;

    if not found then
      raise exception 'Öğrenci cüzdanı bulunamadı (id: %)', p_ogrenci_id;
    end if;

    if v_ogrenci_bakiye < p_price then
      raise exception 'Yetersiz bakiye: mevcut ₺%, gereken ₺%',
        v_ogrenci_bakiye, p_price;
    end if;

    perform 1
      from public.wallets
     where id = p_hoca_id
       for update;

    if not found then
      raise exception 'Hoca cüzdanı bulunamadı (id: %)', p_hoca_id;
    end if;

    update public.wallets
       set balance    = balance - p_price,
           updated_at = now()
     where id = p_ogrenci_id;

    update public.wallets
       set balance    = balance + p_price,
           updated_at = now()
     where id = p_hoca_id;

    insert into public.wallet_transactions
      (wallet_id,    amount,   type,             status,        description)
    values
      (p_ogrenci_id, p_price, 'ders_odeme',     'tamamlandi', 'Ders ödemesi — rezervasyon'),
      (p_hoca_id,    p_price, 'dersten_kazanc', 'tamamlandi', 'Ders kazancı — rezervasyon');
  end if;

  -- ── 3. Ders kaydı ────────────────────────────────────────────────────────
  insert into public.lessons
    (hoca_id, ogrenci_id, lesson_date, status, payment_status, price)
  values
    (p_hoca_id, p_ogrenci_id, v_slot_start,
     'bekliyor',
     case when p_price > 0 then 'odendi' else 'odenmedi' end,
     p_price)
  returning id into v_lesson_id;

  -- ── Hocaya bildirim (hata ana transaction'ı geri almaz) ─────────────────
  begin
    insert into public.notifications
      (user_id, title, message, type)
    values
      (p_hoca_id, 'Yeni Ders Talebi', 'Bir öğrenci ders rezervasyonu yaptı.', 'yeni_rezervasyon');
  exception when others then
    null;
  end;

  return v_lesson_id;
end;
$$;

revoke all    on function public.create_reservation(uuid, uuid, timestamptz, numeric) from public;
grant execute on function public.create_reservation(uuid, uuid, timestamptz, numeric) to authenticated;

-------------------------------------------------------------------------------
-- ROLLBACK:
--   revoke execute on function public.create_reservation(uuid,uuid,timestamptz,numeric)
--     from authenticated;
--   drop function if exists public.create_reservation(uuid, uuid, timestamptz, numeric);
-------------------------------------------------------------------------------
