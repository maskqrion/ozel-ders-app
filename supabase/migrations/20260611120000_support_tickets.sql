-- Destek talepleri (Yardım Merkezi — /destek)
-- Kullanıcılar kendi destek taleplerini oluşturur ve yalnızca kendilerininkini
-- görüntüler. Durum güncelleme/yanıtlama (admin) erişimi Faz 5'te eklenecek;
-- bu fazda update/delete politikası bilinçli olarak YOK (default deny).

create table if not exists public.support_tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  category    text not null,
  priority    text not null default 'normal',
  subject     text not null,
  message     text not null,
  status      text not null default 'open',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Beyaz liste kontrolleri (UI etiketleri Türkçe, değerler sabit İngilizce)
  constraint support_tickets_category_check check (
    category in ('account','reservation','payment','assignment','quiz','messaging','technical','other')
  ),
  constraint support_tickets_priority_check check (
    priority in ('low','normal','high','urgent')
  ),
  constraint support_tickets_status_check check (
    status in ('open','in_progress','resolved','closed')
  ),
  -- Uzunluk korumaları (Zod şeması ile birebir aynı: lib/validations/support.ts)
  constraint support_tickets_subject_length check (char_length(subject) between 5 and 120),
  constraint support_tickets_message_length check (char_length(message) between 20 and 2000)
);

-- Kullanıcının kendi taleplerini tarihe göre listelemesi için
create index if not exists support_tickets_user_created_idx
  on public.support_tickets(user_id, created_at desc);

-- RLS: default deny — yalnızca aşağıdaki politikalar geçerli
alter table public.support_tickets enable row level security;

drop policy if exists "support_tickets_select_own" on public.support_tickets;
create policy "support_tickets_select_own" on public.support_tickets
  for select to authenticated
  using (user_id = auth.uid());

-- Insert yalnızca kendi adına ve yalnızca 'open' durumunda yapılabilir
drop policy if exists "support_tickets_insert_own" on public.support_tickets;
create policy "support_tickets_insert_own" on public.support_tickets
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'open');

-- Not: update/delete politikası YOK — kullanıcılar (kendi taleplerinde bile)
-- durum değiştiremez/silemez. Moderasyon Faz 5'te ayrıca tasarlanacak.

-- updated_at otomasyonu (set_updated_at: 20260529130000_web_push_subscriptions.sql)
drop trigger if exists support_tickets_updated_at on public.support_tickets;
create trigger support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

-------------------------------------------------------------------------------
-- ROLLBACK:
--   drop table if exists public.support_tickets;
-------------------------------------------------------------------------------
