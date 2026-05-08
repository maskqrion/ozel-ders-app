-- 1. Bucket'ı private yap
update storage.buckets set public = false where id = 'kaynaklar';

-- 2. DB kolonlarını "path" semantiğine yeniden adlandır
alter table public.resources rename column file_url to file_path;
alter table public.assignments rename column submission_file_url to submission_file_path;

-- 3. Mevcut public URL formatlı kayıtları path'e dönüştür
--    (https://<proj>.supabase.co/storage/v1/object/public/kaynaklar/<path> -> <path>)
update public.resources
  set file_path = regexp_replace(file_path, '^.*?/storage/v1/object/public/kaynaklar/', '')
  where file_path like '%/storage/v1/object/public/kaynaklar/%';

update public.assignments
  set submission_file_path = regexp_replace(submission_file_path, '^.*?/storage/v1/object/public/kaynaklar/', '')
  where submission_file_path like '%/storage/v1/object/public/kaynaklar/%';

-- 4. Storage RLS: authenticated kullanıcılar kaynaklar bucket'ında SELECT/INSERT yapabilir
--    (signed URL üretmek için SELECT izni gerekli; upload için INSERT)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'kaynaklar_authenticated_read'
  ) then
    create policy "kaynaklar_authenticated_read"
      on storage.objects
      for select
      to authenticated
      using (bucket_id = 'kaynaklar');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'kaynaklar_authenticated_insert'
  ) then
    create policy "kaynaklar_authenticated_insert"
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'kaynaklar');
  end if;
end $$;
