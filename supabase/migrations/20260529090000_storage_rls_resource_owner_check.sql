-- Storage kaynaklar bucket: kaynak okuma politikasını sıkılaştır.
--
-- Sorun: mevcut kaynaklar_resources_read herhangi bir authenticated
-- kullanıcının resources tablosundaki HERHANGİ bir dosyayı okumasına
-- izin veriyor. Hoca A'nın öğrencisi, Hoca B'nin kaynaklarına erişememelidir.
--
-- Düzeltme:
--   • Hoca   → yalnızca kendi yüklediği (yukleyen_id = auth.uid()) kaynakları.
--   • Öğrenci → teacher_students üzerinden bağlı olduğu hocanın kaynakları.
--
-- Ek: DELETE policy — Kaynaklar.tsx handleDelete için gerekli.
-- Önceki migration DELETE policy eklememişti; bu migration tamamlar.

-- 1. Eski geniş okuma politikasını kaldır
drop policy if exists "kaynaklar_resources_read" on storage.objects;

-- 2. Sahiplik + hoca-öğrenci ilişkisi bazlı okuma
create policy "kaynaklar_resources_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'kaynaklar'
    and exists (
      select 1 from public.resources r
      where r.file_path = storage.objects.name
        and (
          -- Hoca kendi kaynağını görebilir
          r.yukleyen_id = auth.uid()
          or
          -- Öğrenci, yalnızca teacher_students üzerinden bağlı olduğu
          -- hocanın kaynaklarını görebilir
          exists (
            select 1 from public.teacher_students ts
            where ts.hoca_id    = r.yukleyen_id
              and ts.ogrenci_id = auth.uid()
          )
        )
    )
  );

-- 3. Hoca, kendi yüklediği dosyayı silebilir
drop policy if exists "kaynaklar_resources_delete" on storage.objects;

create policy "kaynaklar_resources_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'kaynaklar'
    and exists (
      select 1 from public.resources r
      where r.file_path = storage.objects.name
        and r.yukleyen_id = auth.uid()
    )
  );

-------------------------------------------------------------------------------
-- ROLLBACK:
--   drop policy if exists "kaynaklar_resources_delete" on storage.objects;
--   drop policy if exists "kaynaklar_resources_read"   on storage.objects;
--   /* Önceki geniş policy'i geri yükle: */
--   create policy "kaynaklar_resources_read" on storage.objects
--     for select to authenticated
--     using (bucket_id = 'kaynaklar' and exists (
--       select 1 from public.resources r where r.file_path = storage.objects.name));
-------------------------------------------------------------------------------
