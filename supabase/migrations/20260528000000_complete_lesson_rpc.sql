-- hoca_complete_lesson(p_lesson_id uuid): ders tamamlama + ödeme transferi + XP
--
-- Neden ayrı bir RPC?
--   Mevcut transfer_lesson_payment() fonksiyonu auth.uid() = p_ogrenci_id
--   kontrolü yapar → yalnızca ÖĞRENCI çağırabilir, hoca değil.
--   Bu SECURITY DEFINER fonksiyon hoca tarafından çağrılır ve tüm adımları
--   tek bir atomik transaction içinde gerçekleştirir (ya hepsi ya hiçbiri).
--
-- Adımlar:
--   1. Ders kaydını oku ve hoca yetkisini doğrula
--   2. lessons.status = 'tamamlandi', payment_status = 'paid_to_teacher'
--   3. price > 0 → öğrenci cüzdanından hoca cüzdanına transfer
--   4. Öğrenciye +50 XP ödülü (hata ana işlemi geri almaz)

create or replace function public.hoca_complete_lesson(p_lesson_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hoca_id    uuid;
  v_ogrenci_id uuid;
  v_price      numeric;
  v_status     text;
  v_bakiye     numeric;
begin
  -- ── 1. Ders bilgilerini çek ───────────────────────────────────────────────
  select hoca_id, ogrenci_id, coalesce(price, 0), status
    into v_hoca_id, v_ogrenci_id, v_price, v_status
    from public.lessons
   where id = p_lesson_id;

  if not found then
    raise exception 'Ders bulunamadı (id: %)', p_lesson_id;
  end if;

  -- ── Yetki: yalnızca dersin hocası tamamlayabilir ──────────────────────────
  if v_hoca_id is distinct from auth.uid() then
    raise exception 'Yetkisiz işlem: yalnızca dersin hocası dersi tamamlayabilir';
  end if;

  -- ── İdempotency: zaten tamamlandıysa sessizce çık ─────────────────────────
  if v_status = 'tamamlandi' then
    raise exception 'Bu ders zaten tamamlandı';
  end if;

  -- ── 2. Ders durumunu güncelle ─────────────────────────────────────────────
  update public.lessons
     set status         = 'tamamlandi',
         payment_status = case when v_price > 0 then 'paid_to_teacher'
                               else payment_status end
   where id = p_lesson_id;

  -- ── 3. Cüzdan transferi (yalnızca ücretli dersler) ───────────────────────
  if v_price > 0 then
    -- Öğrenci cüzdanını kilitli oku (deadlock önlemek için önce öğrenci)
    select balance into v_bakiye
      from public.wallets
     where id = v_ogrenci_id
       for update;

    if not found then
      raise exception 'Öğrenci cüzdanı bulunamadı (id: %)', v_ogrenci_id;
    end if;

    if v_bakiye < v_price then
      raise exception 'Öğrencinin bakiyesi yetersiz (mevcut: ₺%, gereken: ₺%)',
        v_bakiye, v_price;
    end if;

    -- Hoca cüzdanını kilitle
    perform 1 from public.wallets where id = v_hoca_id for update;
    if not found then
      raise exception 'Hoca cüzdanı bulunamadı (id: %)', v_hoca_id;
    end if;

    -- Atomik bakiye değişimi
    update public.wallets
       set balance = balance - v_price, updated_at = now()
     where id = v_ogrenci_id;

    update public.wallets
       set balance = balance + v_price, updated_at = now()
     where id = v_hoca_id;

    -- İşlem kayıtları
    insert into public.wallet_transactions
      (wallet_id,    amount,   type,             status,        description)
    values
      (v_ogrenci_id, v_price, 'ders_odeme',     'tamamlandi', 'Ders ücreti ödendi'),
      (v_hoca_id,    v_price, 'dersten_kazanc', 'tamamlandi', 'Ders kazancı alındı');
  end if;

  -- ── 4. Öğrenciye XP ödülü (+50 XP ders tamamlama) ────────────────────────
  -- BEGIN/EXCEPTION → XP hatası ana transaction'ı geri almaz
  begin
    perform public.award_xp(v_ogrenci_id, 50);
  exception when others then
    null; -- XP başarısız olsa da ders tamamlandı sayılır
  end;

end;
$$;

revoke all    on function public.hoca_complete_lesson(uuid) from public;
grant execute on function public.hoca_complete_lesson(uuid) to authenticated;

-------------------------------------------------------------------------------
-- ROLLBACK (acil durum, manuel çalıştır):
--   drop function if exists public.hoca_complete_lesson(uuid);
-------------------------------------------------------------------------------
