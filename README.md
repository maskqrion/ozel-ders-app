This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusunu başlatır (http://localhost:3000) |
| `npm run build` | Production build alır (tip kontrolü dahil) |
| `npm run lint` | ESLint ile kod denetimi |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` ile tam tip kontrolü |
| `npm run test` | Playwright smoke testlerini çalıştırır (Chromium) |

## Testler

E2E smoke testleri `tests/e2e/` altındadır ve Playwright ile çalışır. Kapsam:

- Açılış sayfası yükleniyor (`/`)
- Giriş sayfası yükleniyor (`/login`)
- Korumalı dashboard, oturumu olmayan kullanıcıyı `/login`'e yönlendiriyor
- Herkese açık eğitmen profili (`/hoca/[id]`) login'e yönlendirmeden yanıt veriyor

İlk kurulumda tarayıcıyı indirin: `npx playwright install chromium`

Testler gerçek kullanıcı kimlik bilgisi, ödeme veya ücretli AI çağrısı **kullanmaz**;
yalnızca oturumsuz sayfa yüklemeleri yapılır.

**TODO (sonraki fazlar):** Vitest + React Testing Library ile birim/bileşen testleri;
kritik akışlar (rezervasyon, cüzdan, quiz) için mock'lanmış entegrasyon testleri.

## Güvenlik

### Ortam değişkenleri

- Gerçek anahtarlar yalnızca `.env.local` dosyasındadır; bu dosya `.gitignore`'daki
  `.env*` kuralı ile takip dışıdır. **Asla commit etmeyin.**
- Yeni bir gizli değer eklerken `NEXT_PUBLIC_` önekini yalnızca tarayıcıya
  açılması güvenli değerlerde kullanın (ör. Supabase anon key). Service role key,
  Sentry auth token, web-push private key gibi değerler **asla** `NEXT_PUBLIC_` olmamalıdır.

### Mobil yapılandırma dosyaları

`android/app/google-services.json` şu an git'te takiptedir. Firebase istemci
yapılandırması tek başına "gizli anahtar" sayılmasa da repo herkese açılacaksa
takipten çıkarılması önerilir. Dosyayı diskte tutup yalnızca git takibinden
çıkarmak için:

```bash
git rm --cached android/app/google-services.json
git commit -m "chore: google-services.json git takibinden çıkarıldı"
```

`.gitignore` kuralı eklendiği için dosya bir daha yanlışlıkla eklenemez.
İmzalama anahtarları (`*.jks`, `*.keystore`, `keystore.properties`) da aynı
şekilde ignore edilir.

### Sızıntı taraması (secret scanning)

Repo'da otomatik bir tarama kurulu değildir. Commit'lemeden önce hızlı bir
tarama için [gitleaks](https://github.com/gitleaks/gitleaks) önerilir:

```bash
# Kurulum (Windows): winget install gitleaks   |   (macOS): brew install gitleaks
gitleaks git .      # commit geçmişini tarar
gitleaks dir .      # çalışma dizinini tarar
```

CI eklenirse `gitleaks/gitleaks-action` adımı eklemek yeterlidir; ek npm
bağımlılığı gerekmez.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
