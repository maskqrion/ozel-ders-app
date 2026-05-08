-- Storage RLS güçlendirme:
-- Mevcut "tüm authenticated kullanıcı her şeye erişebilir" policy'lerini kaldır,
-- yerine path/sahiplik bazlı tighter policy seti koy.

-- 1. Eski geniş policy'leri kaldır
drop policy if exists "kaynaklar_authenticated_read"   on storage.objects;
drop policy if exists "kaynaklar_authenticated_insert" on storage.objects;

-- 2. Resources SELECT
--    Authenticated kullanıcı, sadece public.resources tablosunda kayıtlı bir
--    path için signed URL üretebilir. Sızdırılmış / kayıt dışı path'ler reddedilir.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'kaynaklar_resources_read'
  ) then
    create policy "kaynaklar_resources_read"
      on storage.objects for select to authenticated
      using (
        bucket_id = 'kaynaklar'
        and exists (
          select 1 from public.resources r
          where r.file_path = storage.objects.name
        )
      );
  end if;
end $$;

-- 3. Submission SELECT
--    Bir teslim dosyasını yalnızca o teslimi yapan öğrenci VEYA o ödevi veren
--    hoca okuyabilir (lessons.ogrenci_id / lessons.hoca_id üzerinden).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'kaynaklar_submission_read_owner'
  ) then
    create policy "kaynaklar_submission_read_owner"
      on storage.objects for select to authenticated
      using (
        bucket_id = 'kaynaklar'
        and exists (
          select 1
          from public.assignments a
          join public.lessons l on l.id = a.lesson_id
          where a.submission_file_path = storage.objects.name
            and (l.ogrenci_id = auth.uid() or l.hoca_id = auth.uid())
        )
      );
  end if;
end $$;

-- 4. Resources INSERT
--    Sadece role='hoca' olan kullanıcı, path'in ilk klasörü kendi auth.uid()
--    olacak şekilde kaynak yükleyebilir.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'kaynaklar_resources_insert'
  ) then
    create policy "kaynaklar_resources_insert"
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'kaynaklar'
        and (storage.foldername(name))[1] = auth.uid()::text
        and exists (
          select 1 from public.users u
          where u.id = auth.uid() and u.role = 'hoca'
        )
      );
  end if;
end $$;

-- 5. Submission INSERT
--    Sadece role='ogrenci' olan kullanıcı, path = submissions/<auth.uid()>/...
--    formatında ödev teslim dosyası yükleyebilir.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'kaynaklar_submission_insert'
  ) then
    create policy "kaynaklar_submission_insert"
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'kaynaklar'
        and (storage.foldername(name))[1] = 'submissions'
        and (storage.foldername(name))[2] = auth.uid()::text
        and exists (
          select 1 from public.users u
          where u.id = auth.uid() and u.role = 'ogrenci'
        )
      );
  end if;
end $$;

-- UPDATE / DELETE policy bilerek eklenmedi → default deny.
-- "Tekrar teslim" / "kaynak silme" özellikleri eklendiğinde ayrı migration ile gelecek.
