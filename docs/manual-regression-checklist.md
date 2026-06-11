# Manuel Regresyon Kontrol Listesi

Sürüm öncesi elle doğrulama listesi. Her madde için: sayfa yükleniyor mu,
konsolda hata var mı, temel etkileşim çalışıyor mu?

**Ortam kuralları:**

- Production verisi üzerinde **yıkıcı işlem yapmayın** (gerçek ödeme, gerçek
  rezervasyon onayı, gerçek mesaj). Bu akışları yalnızca test/staging Supabase
  projesinde uçtan uca tamamlayın.
- Tarayıcı konsolunu (F12) her bölümde açık tutun; kırmızı hata ve
  `4xx/5xx` ağ istekleri not edilmeli.
- Önerilen tarayıcılar: Chrome (birincil), Firefox veya Safari (ikincil).

---

## 1. Açılış sayfası (`/`)

- [ ] Sayfa tam yükleniyor; boş/beyaz ekran yok
- [ ] Hero, eğitmen/öğrenci bölümleri ve CTA butonları görünür
- [ ] "Giriş" / "Kayıt" linkleri `/login`'e gidiyor
- [ ] Alt bilgi linkleri çalışıyor: `/gizlilik`, `/kvkk`, `/kullanim-kosullari`
- [ ] Konsolda hata yok

## 2. Giriş / Kayıt (`/login`)

- [ ] "Giriş Yap" / "Kayıt Ol" sekmeleri arasında geçiş çalışıyor
- [ ] Boş form gönderiminde doğrulama mesajları görünüyor (e-posta formatı, min. şifre)
- [ ] Yanlış şifre ile girişte anlaşılır hata toast'ı çıkıyor (teknik detay sızdırmıyor)
- [ ] Doğru bilgilerle öğrenci girişi → `/ogrenci`
- [ ] Doğru bilgilerle hoca girişi → `/hoca`
- [ ] Kayıtta rol seçimi (Öğrenci/Veli ↔ Eğitmen) çalışıyor; şartlar onaylanmadan buton pasif
- [ ] Google ile giriş butonu OAuth akışını başlatıyor (test ortamında)
- [ ] Oturum açıkken `/login`'e gidilince dashboard'a yönlendiriliyor
- [ ] Art arda 5+ hatalı denemede rate limit mesajı görünüyor

## 3. Şifre sıfırlama (`/sifremi-unuttum`, `/sifre-yenile`)

- [ ] `/sifremi-unuttum` formu e-posta kabul ediyor; başarı mesajı gösteriyor
- [ ] Kayıtlı olmayan e-postada kullanıcı varlığını ele vermeyen yanıt dönüyor
- [ ] E-postadaki bağlantı `/sifre-yenile`'ye götürüyor; yeni şifre kaydediliyor
- [ ] Yeni şifre ile giriş yapılabiliyor

## 4. Öğrenci paneli (`/ogrenci`)

- [ ] Oturumsuz erişim `/login?redirect=/ogrenci`'ye yönlendiriyor
- [ ] Tüm sekmeler açılıyor: Genel Özet, Ödevlerim, Ders Takvimi, Öğretmen Bul,
      Mesajlar, Kaynaklar, Cüzdanım
- [ ] Genel Özet: yaklaşan ders, XP/seviye ve özet kartları doğru veriyle dolu
- [ ] Bildirim zili açılıyor; bildirimler listeleniyor
- [ ] Çıkış yap → `/login`'e dönüyor; geri tuşuyla panel açılmıyor

## 5. Hoca paneli (`/hoca`)

- [ ] Oturumsuz erişim `/login`'e yönlendiriyor
- [ ] Üst menü ve kenar çubuğu görünüyor ("Hoca Paneli")
- [ ] Bölümler açılıyor: Özet, Takvim, Ödevler, Mesajlar, Değerlendirmeler,
      Kaynaklar, Cüzdan, Müsaitlik
- [ ] Öğrenci filtresi/araması çalışıyor (öğrencisi olan hesapta)
- [ ] Müsaitlik ayarları kaydediliyor ve yeniden açınca korunuyor (test ortamında)

## 6. Herkese açık eğitmen profili (`/hoca/[id]`)

- [ ] Oturumsuz kullanıcı login'e yönlendirilmeden görüntüleyebiliyor
- [ ] Geçerli hoca: ad, fiyat, hakkında, değerlendirmeler görünüyor
- [ ] Geçersiz/uydurma id: 404 sayfası (5xx değil)
- [ ] Video/portfolyo bağlantıları varsa çalışıyor

## 7. Rezervasyon akışı — GERÇEK ÖDEME OLMADAN

- [ ] Öğretmen Bul: hoca kartları listeleniyor; filtreler (şehir, bütçe, branş,
      sıralama) sonucu değiştiriyor
- [ ] "Ders Talep Et" → rezervasyon modali açılıyor; müsait saatler görünüyor
- [ ] Modal kapatılınca hiçbir kayıt oluşmuyor (ders listesi değişmemeli)
- [ ] Yetersiz bakiyede slot onayı engelleniyor ve anlaşılır mesaj veriyor
- [ ] (Yalnızca test ortamı) Rezervasyon onayı: ders "bekliyor" durumunda
      oluşuyor, hoca tarafında talep görünüyor, onay/red çalışıyor
- [ ] Fiyatı tanımsız hocada "Rezervasyon yapılamaz" mesajı çıkıyor

## 8. Cüzdan (`/ogrenci/cuzdan`) — GERÇEK ÖDEME OLMADAN

- [ ] Sayfa yükleniyor: mevcut bakiye, işlem geçmişi görünüyor
- [ ] İşlem geçmişi boşken anlamlı boş durum mesajı var
- [ ] "Bakiye Yükle" formu tutar doğrulaması yapıyor (negatif/0/aşırı değer reddediliyor)
- [ ] (Yalnızca Iyzico **sandbox** + test ortamı) 3D Secure akışı tamamlanıyor
      ve bakiye güncelleniyor; başarısız ödeme bakiyeyi DEĞİŞTİRMİYOR
- [ ] Hoca cüzdanı: kazanç kalemleri doğru listeleniyor

## 9. Mesajlaşma

- [ ] Öğrenci ve hoca panellerinde Mesajlar sekmesi açılıyor ("Sohbetler")
- [ ] Sohbet listesi ve arama çalışıyor
- [ ] (Test ortamı) Mesaj gönderimi: karşı tarafta gerçek zamanlı görünüyor
- [ ] Uzun mesaj/emoji düzgün render ediliyor; XSS denemesi (`<script>`) metin
      olarak görünüyor
- [ ] Bağlantısı olmayan kullanıcıda boş durum düzgün

## 10. Ödevler

- [ ] Hoca: ödev oluşturma formu açılıyor (test ortamında kayıt deneyin)
- [ ] Öğrenci: ödev listesi, durum rozetleri (bekliyor/teslim/değerlendirildi) doğru
- [ ] (Test ortamı) Teslim akışı: metin + dosya; hoca tarafında puan/red çalışıyor
- [ ] Reddedilen ödevde gerekçe öğrenciye görünüyor

## 11. Quiz akışı (`/ogrenci/quizler`)

- [ ] Quiz listesi yükleniyor; boş durumda anlamlı mesaj
- [ ] Quiz çözme ekranı: sorular, şıklar, ilerleme çalışıyor
- [ ] Sonuç sayfası (`/ogrenci/quizler/[id]/sonuc`) doğru skor gösteriyor
- [ ] (Test ortamı + ANTHROPIC_API_KEY) Hoca tarafında AI quiz üretimi —
      **maliyetli çağrıdır, yalnızca bilinçli olarak test edin**

## 12. Profil (`/profil`)

- [ ] Mevcut bilgiler formda dolu geliyor
- [ ] Ad, şehir, hakkında vb. güncelleme kaydediliyor ve yeniden açınca korunuyor
- [ ] Avatar yükleme çalışıyor; büyük/geçersiz dosya reddediliyor (test ortamında)
- [ ] Hoca profili: ders fiyatı güncellemesi herkese açık profile yansıyor

## 13. Liderlik tablosu (`/liderlik`)

- [ ] Sayfa yükleniyor; sıralama, XP ve seviye değerleri tutarlı
- [ ] Kendi satırı vurgulanıyor (varsa)
- [ ] Oturumsuz erişim login'e yönlendiriyor

## 14. Mobil / responsive

- [ ] 375px (iPhone SE) ve 768px (tablet) genişlikte: açılış, login, her iki
      panel, cüzdan, mesajlar taşma/kırpılma olmadan kullanılabilir
- [ ] Panel sekmeleri dar ekranda yatay kaydırılabiliyor
- [ ] Rezervasyon modali mobilde açılıp kapanabiliyor
- [ ] Dokunmatik hedefler yeterince büyük; klavye açılınca form alanı görünür kalıyor

## 15. Konsol ve ağ hataları

- [ ] Yukarıdaki her sayfada konsolda kırmızı hata yok
- [ ] Tekrarlayan istek döngüsü yok (ör. sonsuz refetch)
- [ ] 401/403/500 dönen beklenmedik istek yok
- [ ] Hydration uyarısı yok

## 16. Supabase / auth kenar durumları

- [ ] Süresi dolmuş oturum: korumalı sayfada işlem → login'e düzgün yönlendirme,
      sonsuz döngü yok
- [ ] İki sekmede aynı hesap: birinde çıkış yapınca diğeri tutarlı davranıyor
- [ ] Öğrenci hesabıyla `/hoca` URL'ine doğrudan gidiş ve tersi: yetkisiz
      içerik görünmüyor
- [ ] Başka kullanıcıya ait kaynak id'siyle URL denemesi (ödev, quiz, mesaj):
      veri sızmıyor (RLS)
- [ ] `redirect` parametresine harici URL verilince (`/login?redirect=https://...`)
      açık yönlendirme oluşmuyor
- [ ] Ağ kesintisinde (devtools offline) sayfalar çakılmıyor, anlamlı hata veriyor

---

**Kayıt:** Her koşudan sonra tarih, ortam (local/staging), tarayıcı ve bulunan
sorunları kısa notlarla bu dosyanın altına veya issue takibine ekleyin.
