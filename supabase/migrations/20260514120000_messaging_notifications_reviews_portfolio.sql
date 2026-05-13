-- Faz 2 / Adım 1: Mesajlaşma, bildirim merkezi, hoca değerlendirme ve
-- hoca portfolyo alanları
--
-- Yapılanlar:
--   1) messages         — gerçek zamanlı chat (idempotent: önceki migration'larda
--                         tablo başka bir yolla oluşturulmuş olabilir; is_read
--                         sütunu defensif olarak eklenir)
--   2) notifications    — kullanıcı bildirim merkezi
--   3) reviews          — hoca değerlendirme sistemi
--   4) users            — video_url + portfolio_url alanları
--
-- Tüm yeni tablolarda RLS açık ve minimum yetki ilkesine göre yazıldı.

-------------------------------------------------------------------------------
-- 1. messages tablosu
-------------------------------------------------------------------------------
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

-- is_read önceki tasarımda yoktu → varsa korunur, yoksa eklenir
alter table public.messages
  add column if not exists is_read boolean not null default false;

create index if not exists messages_sender_id_idx   on public.messages(sender_id);
create index if not exists messages_receiver_id_idx on public.messages(receiver_id);
create index if not exists messages_created_at_idx  on public.messages(created_at desc);
-- Alıcının okunmamış mesajları için hızlı sayım/filtre
create index if not exists messages_receiver_unread_idx
  on public.messages(receiver_id) where is_read = false;

alter table public.messages enable row level security;

-- SELECT: yalnızca gönderen veya alıcı
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- INSERT: yalnızca kendi adına gönderim
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid());

-- UPDATE: alıcı, kendisine gelen mesajı (örn. is_read=true) güncelleyebilir
drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages
  for update to authenticated
  using      (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());

-- DELETE policy yok → default deny

-------------------------------------------------------------------------------
-- 2. notifications tablosu
-- type alanı ileriye dönük genişleyebilir; uzunluk denetimi varchar(40) ile.
-------------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  title      varchar(160) not null,
  message    text         not null,
  type       varchar(40)  not null default 'system',
  is_read    boolean      not null default false,
  created_at timestamptz  not null default now()
);

create index if not exists notifications_user_id_idx       on public.notifications(user_id);
create index if not exists notifications_created_at_idx    on public.notifications(created_at desc);
-- Okunmamış bildirim rozetleri için kısmi indeks (hızlı sayım)
create index if not exists notifications_user_unread_idx
  on public.notifications(user_id) where is_read = false;

alter table public.notifications enable row level security;

-- SELECT: yalnızca kendi bildirimleri
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

-- INSERT: kullanıcı kendi adına bildirim ekleyebilir
-- (Otomatik sistem bildirimleri ileride trigger / service_role üzerinden
-- üretilecek; bu policy client tarafından test/manuel insert'i ayakta tutar.)
drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications
  for insert to authenticated
  with check (user_id = auth.uid());

-- UPDATE: kullanıcı kendi bildirimini güncelleyebilir (okundu işaretleme vs.)
drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update to authenticated
  using      (user_id = auth.uid())
  with check (user_id = auth.uid());

-- DELETE policy yok → default deny

-------------------------------------------------------------------------------
-- 3. reviews tablosu — hoca değerlendirme
-- Bir öğrenci aynı hocaya tek bir yorum yazabilir (unique pair).
-------------------------------------------------------------------------------
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  hoca_id    uuid not null references public.users(id) on delete cascade,
  ogrenci_id uuid not null references public.users(id) on delete cascade,
  rating     int  not null,
  comment    text,
  created_at timestamptz not null default now(),
  constraint reviews_rating_range_chk check (rating between 1 and 5),
  constraint reviews_unique_pair      unique (hoca_id, ogrenci_id),
  constraint reviews_no_self_review_chk check (hoca_id <> ogrenci_id)
);

create index if not exists reviews_hoca_id_idx    on public.reviews(hoca_id);
create index if not exists reviews_ogrenci_id_idx on public.reviews(ogrenci_id);
create index if not exists reviews_created_at_idx on public.reviews(created_at desc);

alter table public.reviews enable row level security;

-- SELECT: tüm authenticated kullanıcılar (yorumlar hoca kartlarında görünür)
drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews
  for select to authenticated
  using (true);

-- INSERT: yalnızca öğrenci, kendi ogrenci_id'siyle yazabilir
drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews
  for insert to authenticated
  with check (ogrenci_id = auth.uid() and public.is_ogrenci());

-- UPDATE: yalnızca yorum sahibi öğrenci kendi yorumunu düzenleyebilir
drop policy if exists reviews_update on public.reviews;
create policy reviews_update on public.reviews
  for update to authenticated
  using      (ogrenci_id = auth.uid())
  with check (ogrenci_id = auth.uid());

-- DELETE: yalnızca yorum sahibi öğrenci kendi yorumunu silebilir
drop policy if exists reviews_delete on public.reviews;
create policy reviews_delete on public.reviews
  for delete to authenticated
  using (ogrenci_id = auth.uid());

-------------------------------------------------------------------------------
-- 4. users tablosuna hoca portfolyo alanları
-------------------------------------------------------------------------------
alter table public.users
  add column if not exists video_url     text,
  add column if not exists portfolio_url text;

-------------------------------------------------------------------------------
-- ROLLBACK (acil durum, manuel olarak çalıştır):
--   alter table public.users
--     drop column if exists portfolio_url,
--     drop column if exists video_url;
--   drop table if exists public.reviews;
--   drop table if exists public.notifications;
--   alter table public.messages drop column if exists is_read;
--   -- Not: messages tablosu önceki migration'larda da kullanılıyor;
--   -- full drop için manuel onay gerekir.
-------------------------------------------------------------------------------
