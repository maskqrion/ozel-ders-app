# E2E Test Rehberi (Playwright)

Bu doküman, projedeki uçtan uca (E2E) testlerin nasıl çalıştırılacağını ve
kimlik doğrulamalı testler için güvenli ortam kurulumunu açıklar.

## Test katmanları

| Katman | Dosya | Kimlik bilgisi | Varsayılan davranış |
| --- | --- | --- | --- |
| Smoke (oturumsuz) | `tests/e2e/smoke.spec.ts` | Gerekmez | Her zaman çalışır |
| Authenticated | `tests/e2e/authenticated.spec.ts` | `E2E_*` env değişkenleri | Değişkenler yoksa **otomatik atlanır** |

Yardımcı kod: `tests/e2e/helpers/auth.ts` (env algılama + login helper).

## Oturumsuz smoke testleri çalıştırma

Ek kurulum gerekmez; Playwright dev sunucusunu kendisi başlatır
(çalışan bir `npm run dev` varsa onu kullanır):

```bash
# İlk kurulumda bir kez:
npx playwright install chromium

# Tüm testler (authenticated testler env yoksa "skipped" görünür):
npm run test

# Yalnızca smoke:
npx playwright test tests/e2e/smoke.spec.ts
```

## Kimlik doğrulamalı testleri çalıştırma

### Gerekli ortam değişkenleri

| Değişken | Açıklama |
| --- | --- |
| `E2E_STUDENT_EMAIL` | Öğrenci rolündeki **test** hesabının e-postası |
| `E2E_STUDENT_PASSWORD` | Öğrenci test hesabının şifresi |
| `E2E_TEACHER_EMAIL` | Hoca rolündeki **test** hesabının e-postası |
| `E2E_TEACHER_PASSWORD` | Hoca test hesabının şifresi |
| `E2E_BASE_URL` (ops.) | Testlerin koşacağı adres. Ayarlanırsa yerel dev sunucu başlatılmaz (ör. staging) |

Öğrenci değişkenleri eksikse öğrenci testleri, hoca değişkenleri eksikse hoca
testleri atlanır; `npm run test` her durumda geçer.

### Değişkenleri tanımlama

`playwright.config.ts`, Next'in kendi env yükleyicisi (`@next/env`) ile
`.env.local` dosyasını Playwright sürecine de yükler. En pratik yol,
değişkenleri **`.env.local`** dosyasına eklemektir (bu dosya `.gitignore`
kapsamındadır, asla commit edilmez).

Alternatif olarak shell üzerinden:

```powershell
# PowerShell
$env:E2E_STUDENT_EMAIL = "ogrenci-test@ornek.com"
$env:E2E_STUDENT_PASSWORD = "..."
npm run test
```

```bash
# bash
E2E_STUDENT_EMAIL="ogrenci-test@ornek.com" E2E_STUDENT_PASSWORD="..." npm run test
```

Yalnızca authenticated testleri koşmak için:

```bash
npx playwright test tests/e2e/authenticated.spec.ts
```

## Neden production kimlik bilgisi KULLANILMAMALI

- Testler salt okunur tasarlanmış olsa da bir UI regresyonu/yanlış tıklama
  gerçek veriyi etkileyebilir (rezervasyon, cüzdan, mesaj).
- Kimlik bilgileri test koşan makinenin ortamında düz metin bulunur; CI
  loglarına/artefaktlarına sızma riski hiçbir zaman sıfır değildir.
- Gerçek kullanıcı hesabının oturum geçmişi, bildirimleri ve istatistikleri
  test trafiğiyle kirlenir.

**Öneri:** Ayrı bir **staging/test Supabase projesi** kullanın:

1. Supabase'te ayrı bir proje açın (veya Supabase branching kullanın).
2. `.env.local`'da `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` değerlerini test
   projesine yönlendirin (ya da `E2E_BASE_URL` ile test projesine bağlı bir
   staging deployment'a karşı koşun).
3. Test projesinde `ogrenci` ve `hoca` rollerinde birer hesap oluşturun;
   bu hesapların bilgilerini `E2E_*` değişkenlerine yazın.
4. Ödeme testleri gerekirse yalnızca Iyzico **sandbox** ve
   `ENABLE_SIMULATE_DEPOSIT=true` (asla production'da) kullanın — mevcut
   E2E testleri ödeme akışını bilinçli olarak **tetiklemez**.

## Güvenlik ve güvenilirlik notları

- **Trace kapalı:** `authenticated.spec.ts` dosyasında `trace: 'off'`
  ayarlıdır; login isteğinin gövdesi şifre içerdiğinden CI retry
  artefaktlarına dahi sızmaz. Bu dosyaya trace/screenshot/video eklerken
  bu riski yeniden değerlendirin.
- **Rate limit:** Giriş server action'ı IP başına **dakikada 5 deneme** ile
  sınırlıdır. Testler bu yüzden rol başına tek giriş yapar (paylaşılan oturum,
  `serial` mod). Testleri kısa aralıklarla art arda koşturmak limite takılabilir;
  1 dakika bekleyin.
- **Salt okunur garanti:** Authenticated testler rezervasyon onaylamaz, ödeme
  yapmaz, mesaj göndermez, ödev/quiz oluşturmaz, dosya yüklemez ve AI
  endpoint'lerini çağırmaz. Rezervasyon testi modali yalnızca açar ve hiçbir
  slot seçmeden sayfadan ayrılır.
- **Veriye bağlı testler:** Ortamda hiç hoca kaydı yoksa rezervasyon modali
  testi kendini atlar (başarısız olmaz).

## CI notları

- CI'da `E2E_*` değişkenlerini repo secret'ı olarak tanımlayın; log'lara echo
  etmeyin.
- `npx playwright install --with-deps chromium` adımını unutmayın.
- Authenticated testleri CI'da koşacaksanız mutlaka test/staging Supabase
  projesine karşı koşun.
