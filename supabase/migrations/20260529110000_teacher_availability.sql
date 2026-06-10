-- Hoca müsaitlik sistemi
--
-- Hocalar haftanın her günü için tek bir müsaitlik penceresi tanımlayabilir.
-- Yapılandırılmış müsaitlik yoksa tüm saatler açık sayılır (geriye dönük uyumluluk).
--
-- Tablo: public.teacher_availability
--   day_of_week : 0=Pazar … 6=Cumartesi  (JS Date.getDay() + PostgreSQL DOW ile uyumlu)
--   start_hour  : pencere başlangıcı (dahil), Türkiye saati (Europe/Istanbul)
--   end_hour    : pencere bitişi (hariç), Türkiye saati
--
-- Örnek: Pazartesi 09:00–17:00
--   day_of_week=1, start_hour=9, end_hour=17
--   Rezerve edilebilecek son saat dilimi: 16:00–17:00

create table if not exists public.teacher_availability (
  id          uuid primary key default gen_random_uuid(),
  hoca_id     uuid    not null references public.users(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_hour  smallint not null check (start_hour between 0 and 23),
  end_hour    smallint not null check (end_hour between 1 and 24 and end_hour > start_hour),
  created_at  timestamptz not null default now(),
  -- Hoca başına gün başına tek pencere
  constraint teacher_availability_unique_day unique (hoca_id, day_of_week)
);

create index if not exists teacher_availability_hoca_day_idx
  on public.teacher_availability (hoca_id, day_of_week);

alter table public.teacher_availability enable row level security;

-- SELECT: Herhangi bir authenticated kullanıcı herhangi bir hocanın
-- müsaitliğini görebilir (rezervasyon arayüzü için gerekli; hassas veri değil).
drop policy if exists teacher_availability_select on public.teacher_availability;
create policy teacher_availability_select on public.teacher_availability
  for select to authenticated
  using (true);

-- INSERT: Yalnızca hoca, kendi satırını ekleyebilir.
drop policy if exists teacher_availability_insert on public.teacher_availability;
create policy teacher_availability_insert on public.teacher_availability
  for insert to authenticated
  with check (hoca_id = auth.uid() and public.is_hoca());

-- UPDATE: Yalnızca hoca, kendi satırını güncelleyebilir.
drop policy if exists teacher_availability_update on public.teacher_availability;
create policy teacher_availability_update on public.teacher_availability
  for update to authenticated
  using  (hoca_id = auth.uid())
  with check (hoca_id = auth.uid());

-- DELETE: Yalnızca hoca, kendi satırını kaldırabilir.
drop policy if exists teacher_availability_delete on public.teacher_availability;
create policy teacher_availability_delete on public.teacher_availability
  for delete to authenticated
  using (hoca_id = auth.uid());

-- ── create_reservation RPC — müsaitlik kontrolü ekle ──────────────────────
-- Değişiklik: Çakışma kontrolünden önce hoca müsaitlik penceresi denetlendi.
-- Hoca hiç pencere tanımlamamışsa (v_has_avail = false) bu adım atlanır.
-- Zaman dilimi: Türkiye (Europe/Istanbul).

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
  v_slot_local     timestamp;    -- Türkiye yerel saati (timezone dönüşümü sonrası)
  v_day_of_week    smallint;
  v_slot_hour      smallint;
  v_has_avail      boolean;
  v_is_available   boolean;
  v_conflict_count int;
  v_ogrenci_bakiye numeric;
  v_lesson_id      uuid;
begin
  -- ── Yetki ───────────────────────────────────────────────────────────────
  if p_ogrenci_id is distinct from auth.uid() then
    raise exception 'Yetkisiz: yalnızca kendi adınıza rezervasyon yapabilirsiniz';
  end if;

  if p_price < 0 then
    raise exception 'Fiyat negatif olamaz';
  end if;

  -- ── Saat normalleştirme ─────────────────────────────────────────────────
  v_slot_start := date_trunc('hour', p_lesson_date);
  v_slot_end   := v_slot_start + interval '1 hour';

  -- ── Müsaitlik kontrolü ─────────────────────────────────────────────────
  -- AT TIME ZONE 'Europe/Istanbul': timestamptz → timestamp (yerel saat)
  v_slot_local  := v_slot_start at time zone 'Europe/Istanbul';
  v_day_of_week := extract(dow  from v_slot_local)::smallint;
  v_slot_hour   := extract(hour from v_slot_local)::smallint;

  select exists(
    select 1 from public.teacher_availability where hoca_id = p_hoca_id
  ) into v_has_avail;

  if v_has_avail then
    select exists(
      select 1 from public.teacher_availability
      where hoca_id    = p_hoca_id
        and day_of_week = v_day_of_week
        and start_hour <= v_slot_hour
        and end_hour    > v_slot_hour
    ) into v_is_available;

    if not v_is_available then
      raise exception 'Bu saatte hoca müsait değil.';
    end if;
  end if;

  -- ── 1. Çakışma kontrolü ─────────────────────────────────────────────────
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
    -- Deadlock önleme: kilit sırası her zaman ogrenci → hoca
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

  -- ── Bildirim (hata ana transaction'ı geri almaz) ─────────────────────────
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
--   drop table if exists public.teacher_availability cascade;
--   /* create_reservation önceki sürümünü restore etmek için
--      20260529060000_create_reservation_rpc.sql'i yeniden çalıştır. */
-------------------------------------------------------------------------------
