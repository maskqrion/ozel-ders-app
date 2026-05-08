-- Storage RLS: hoca, kendi dersinin teslim dosyasını silebilsin.
-- "Ödevi tekrar aç" akışında, eski submission dosyasını storage'dan da temizliyoruz.
-- Policy assignments.submission_file_path üzerinden sahipliği doğruluyor; bu yüzden
-- silme her zaman DB row'u henüz NULL'lanmadan ÖNCE yapılmalı (row null'lanırsa
-- exists() artık eşleşmez ve delete reddedilir).

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'kaynaklar_submission_delete_hoca'
  ) then
    create policy "kaynaklar_submission_delete_hoca"
      on storage.objects for delete to authenticated
      using (
        bucket_id = 'kaynaklar'
        and exists (
          select 1
          from public.assignments a
          join public.lessons l on l.id = a.lesson_id
          where a.submission_file_path = storage.objects.name
            and l.hoca_id = auth.uid()
        )
      );
  end if;
end $$;
