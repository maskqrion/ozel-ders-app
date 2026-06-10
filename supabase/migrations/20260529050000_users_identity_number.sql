-- Kullanıcı kimlik doğrulama için TC kimlik numarası alanı.
-- Iyzico production ödeme akışı için zorunlu (sandbox'ta "11111111111" fallback kullanılır).
-- 11 haneli sayı; formatı uygulama katmanında (Zod) validate edilir.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS identity_number text;
