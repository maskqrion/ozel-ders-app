-- Video görüşme odası: her ders için benzersiz Jitsi room kimliği
-- Rezervasyon anında otomatik oluşturulur, her iki taraf da aynı URL'ye girer.

alter table public.lessons
  add column if not exists meeting_room_id text;

-- Mevcut kayıtlara geriye dönük room ID ata (isteğe bağlı, eski dersler için)
update public.lessons
   set meeting_room_id = 'ders-' || replace(id::text, '-', '')
 where meeting_room_id is null;

-- RLS: mevcut lessons politikaları meeting_room_id'yi de kapsar (satır tabanlı, ekstra gerekmez)

-- create_reservation RPC'sini güncelle: ders oluşturulurken room ID'yi set et
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
  v_slot_start      timestamptz;
  v_slot_end        timestamptz;
  v_conflict_count  int;
  v_ogrenci_bakiye  numeric;
  v_lesson_id       uuid;
  v_room_id         text;
  -- availability check
  v_has_avail       boolean;
  v_is_available    boolean;
  v_slot_local      timestamp;
  v_day_of_week     smallint;
  v_hour_of_day     smallint;
begin
  -- ── Yetki ────────────────────────────────────────────────────────────────
  if p_ogrenci_id is distinct from auth.uid() then
    raise exception 'Yetkisiz: yalnızca kendi adınıza rezervasyon yapabilirsiniz';
  end if;

  if p_price < 0 then
    raise exception 'Fiyat negatif olamaz';
  end if;

  -- ── Saat normalleştirme ───────────────────────────────────────────────────
  v_slot_start := date_trunc('hour', p_lesson_date);
  v_slot_end   := v_slot_start + interval '1 hour';

  -- ── 1. Çakışma kontrolü ──────────────────────────────────────────────────
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

  -- ── 2. Müsaitlik kontrolü ─────────────────────────────────────────────────
  select exists(
    select 1 from public.teacher_availability where hoca_id = p_hoca_id
  ) into v_has_avail;

  if v_has_avail then
    v_slot_local  := v_slot_start at time zone 'Europe/Istanbul';
    v_day_of_week := extract(dow  from v_slot_local)::smallint;
    v_hour_of_day := extract(hour from v_slot_local)::smallint;

    select exists(
      select 1
        from public.teacher_availability
       where hoca_id      = p_hoca_id
         and day_of_week  = v_day_of_week
         and start_hour  <= v_hour_of_day
         and end_hour    >  v_hour_of_day
    ) into v_is_available;

    if not v_is_available then
      raise exception 'Bu saatte hoca müsait değil.';
    end if;
  end if;

  -- ── 3. Ödeme ─────────────────────────────────────────────────────────────
  if p_price > 0 then
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

  -- ── 4. Benzersiz Jitsi room ID ────────────────────────────────────────────
  v_room_id := 'ders-' || replace(gen_random_uuid()::text, '-', '');

  -- ── 5. Ders kaydı ────────────────────────────────────────────────────────
  insert into public.lessons
    (hoca_id, ogrenci_id, lesson_date, status, payment_status, price, meeting_room_id)
  values
    (p_hoca_id, p_ogrenci_id, v_slot_start,
     'bekliyor',
     case when p_price > 0 then 'odendi' else 'odenmedi' end,
     p_price,
     v_room_id)
  returning id into v_lesson_id;

  -- ── Hocaya bildirim ───────────────────────────────────────────────────────
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
