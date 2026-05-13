-- Hoca keşif/arama akışı için users_select politikasının genişletilmesi
--
-- Önceki politika öğrencilerin yalnızca:
--   - kendi satırlarını
--   - ortak ders paylaştıkları kullanıcıları
-- görmesine izin veriyordu. Bu, "Öğretmen Bul" ekranında bağlı olmayan
-- hocaların listelenmesini engelliyordu. Bu migration politikaya
-- "role = 'hoca'" branch'i ekleyerek tüm hoca profillerinin authenticated
-- kullanıcılar tarafından keşif amacıyla okunabilmesini sağlar.
--
-- INSERT/UPDATE politikaları değişmedi → hoca, kendi satırından başka
-- bir satırı yine değiştiremez.

drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select to authenticated
  using (
    -- kendi satırım
    id = auth.uid()
    -- ben hocayım, bu satır bir öğrenci (hoca panelindeki dropdown için)
    or (public.is_hoca() and role = 'ogrenci')
    -- KEŞİF: rolü hoca olan tüm satırlar authenticated kullanıcılar tarafından görünür
    or role = 'hoca'
    -- bu satırla aynı dersi paylaşıyoruz (lessons join'leri için)
    or exists (
      select 1 from public.lessons l
      where (l.hoca_id    = auth.uid() and l.ogrenci_id = users.id)
         or (l.ogrenci_id = auth.uid() and l.hoca_id    = users.id)
    )
  );

-------------------------------------------------------------------------------
-- ROLLBACK (acil durum, manuel olarak çalıştır):
--   drop policy if exists users_select on public.users;
--   create policy users_select on public.users
--     for select to authenticated
--     using (
--       id = auth.uid()
--       or (public.is_hoca() and role = 'ogrenci')
--       or exists (
--         select 1 from public.lessons l
--         where (l.hoca_id    = auth.uid() and l.ogrenci_id = users.id)
--            or (l.ogrenci_id = auth.uid() and l.hoca_id    = users.id)
--       )
--     );
-------------------------------------------------------------------------------
