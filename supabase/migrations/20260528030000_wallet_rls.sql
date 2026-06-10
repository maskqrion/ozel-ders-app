-- wallets: authenticated kullanıcı kendi satırını UPDATE edebilsin
--
-- Neden gerekli:
--   processPayment() server action'ı anon key + kullanıcı JWT ile çalışır;
--   bu istemci RLS'e tabidir. Iyzico ödemesi onaylandıktan sonra bakiyeyi
--   güncelleyebilmek için UPDATE politikası şarttır.
--
-- Güvenlik notu:
--   Bu politika kötüye kullanım riskini tamamen ortadan kaldırmaz.
--   Daha güçlü koruma için bakiye_yukle() adlı SECURITY DEFINER bir RPC
--   oluşturulup client UPDATE politikası kapatılabilir.

drop policy if exists wallets_update on public.wallets;

create policy wallets_update on public.wallets
  for update
  to authenticated
  using  (id = auth.uid())
  with check (id = auth.uid());
