-- Davet linklerine 7 günlük son kullanma tarihi ekliyoruz.
-- NULL = eski linkler hâlâ geçerli (geriye dönük uyum).
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;
