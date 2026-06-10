/**
 * instrumentation-client.ts — Tarayıcı (client) tarafı Sentry başlatma
 *
 * Next.js App Router, bu dosyayı otomatik olarak çalıştırır.
 * DSN yoksa Sentry başlatılmaz (development ortamı için güvenli).
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,

    // Development'ta %100, production'da %10 trace örneği
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    // Hata olan oturumları %100 kaydet, normal oturumların %10'unu kaydet
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Session Replay — kullanıcı etkileşimlerinin video kaydı
    integrations: [
      Sentry.replayIntegration({
        // KVKK: tüm metin ve input'ları maskele
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: false,
      }),
    ],

    // Ortam etiketi — production/staging/development ayrımı için
    environment: process.env.NODE_ENV,

    // Sentry event'lerine kullanıcı IP'si ve user-agent ekle
    sendDefaultPii: false, // KVKK uyumu için false bırakın

    // Yalnızca production'da debug kapalı
    debug: false,
  });
}

// Router geçişlerini Sentry trace'e ekle (Next.js 15+ gerektirir)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
